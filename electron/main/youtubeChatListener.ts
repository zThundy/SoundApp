import { BrowserWindow } from 'electron'
import fileManager from './fileManager'
import SafeStorageWrapper from './safeStorageWrapper'
import { ChatMessage } from './types/chatMessage'
import {
  getMyActiveLiveBroadcast,
  getVideoLiveStreamingDetails,
  getYouTubeLiveChatMessages,
  refreshYouTubeAccessToken
} from './youtubeWorker'

class YouTubeChatListener {
  private mainWindow: BrowserWindow | null = null
  private safeStore: SafeStorageWrapper | null = null
  private running = false
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private clientId: string | null = null
  private expiresAt = 0
  private liveChatId: string | null = null
  private nextPageToken: string | null = null
  private loopPromise: Promise<void> | null = null
  private readonly DISCOVERY_DELAY_MS = 60_000
  private readonly MAX_CACHE_SIZE = 50_000
  private readonly MESSAGES_CACHE = 'youtube-messages.json'
  private readonly CACHE_CONTEXT = 'youtube'
  private readonly seenMessageIds = new Set<string>()
  private chatMessages: ChatMessage[] = []

  constructor(safeStore: SafeStorageWrapper | null, mainWindow: BrowserWindow | null) {
    this.safeStore = safeStore
    this.mainWindow = mainWindow
    void this.loadCache()
  }

  private async loadCache() {
    try {
      const exists = await fileManager.fileExists(this.CACHE_CONTEXT, { relativePath: this.MESSAGES_CACHE })
      if (!exists) return

      const { buffer } = fileManager.readFile(this.CACHE_CONTEXT, { relativePath: this.MESSAGES_CACHE })
      const data = await buffer
      const parsed = JSON.parse(data.toString()) as ChatMessage[]
      this.chatMessages = parsed.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
        platform: 'youtube'
      }))
    } catch (error) {
      console.error('[YouTubeChatListener] Failed to load cache:', error)
    }
  }

  private async saveCache() {
    try {
      await fileManager.writeFile(this.CACHE_CONTEXT, { relativePath: this.MESSAGES_CACHE }, JSON.stringify(this.chatMessages, null, 2))
    } catch (error) {
      console.error('[YouTubeChatListener] Failed to save cache:', error)
    }
  }

  private async ensureValidToken() {
    if (!this.clientId || !this.refreshToken) {
      throw new Error('YouTube is not configured')
    }

    if (this.accessToken && Date.now() < this.expiresAt - 60_000) {
      return this.accessToken
    }

    const tokenResponse = await refreshYouTubeAccessToken(this.clientId, this.refreshToken)
    this.accessToken = tokenResponse.access_token
    this.expiresAt = Date.now() + ((tokenResponse.expires_in ?? 3600) * 1000)
    this.safeStore?.set('youtubeAccessToken', this.accessToken)
    this.safeStore?.set('youtubeTokenExpiresAt', String(this.expiresAt))
    return this.accessToken
  }

  private async discoverLiveChatId() {
    const accessToken = await this.ensureValidToken()
    const broadcasts = await getMyActiveLiveBroadcast(accessToken)
    const activeBroadcast = broadcasts?.items?.[0]

    if (!activeBroadcast) {
      this.liveChatId = null
      this.nextPageToken = null
      return null
    }

    const snippetLiveChatId = activeBroadcast?.snippet?.liveChatId
    if (snippetLiveChatId) {
      this.liveChatId = snippetLiveChatId
      this.nextPageToken = null
      return this.liveChatId
    }

    const videoId = activeBroadcast?.id
    if (!videoId) {
      this.liveChatId = null
      return null
    }

    const videoDetails = await getVideoLiveStreamingDetails(accessToken, videoId)
    const activeLiveChatId = videoDetails?.items?.[0]?.liveStreamingDetails?.activeLiveChatId ?? null
    this.liveChatId = activeLiveChatId
    this.nextPageToken = null
    return this.liveChatId
  }

  private async pollOnce() {
    if (!this.liveChatId) {
      const discovered = await this.discoverLiveChatId()
      if (!discovered) {
        await this.delay(this.DISCOVERY_DELAY_MS)
        return
      }
    }

    const accessToken = await this.ensureValidToken()
    const response = await getYouTubeLiveChatMessages(accessToken, this.liveChatId!, this.nextPageToken)
    this.nextPageToken = response?.nextPageToken ?? null

    const items = Array.isArray(response?.items) ? response.items : []
    for (const item of items) {
      const messageId = item?.id
      if (!messageId || this.seenMessageIds.has(messageId)) continue
      this.seenMessageIds.add(messageId)

      const chatMessage = this.mapLiveChatMessage(item)
      if (!chatMessage) continue
      this.pushMessage(chatMessage)
    }

    const pollingInterval = Number(response?.pollingIntervalMillis) || 5_000
    await this.delay(pollingInterval)
  }

  private mapLiveChatMessage(item: any): ChatMessage | null {
    const snippet = item?.snippet
    const author = item?.authorDetails
    const messageType = snippet?.type
    const displayMessage = snippet?.displayMessage

    if (!displayMessage && messageType !== 'textMessageEvent') {
      return null
    }

    const text = displayMessage || ''

    return {
      userId: author?.channelId ?? item?.authorDetails?.channelId ?? item?.id,
      username: author?.displayName ?? 'YouTube User',
      displayName: author?.displayName ?? 'YouTube User',
      message: text,
      timestamp: new Date(snippet?.publishedAt ?? Date.now()),
      color: '#ff0000',
      badges: [],
      platform: 'youtube',
      avatarUrl: author?.profileImageUrl,
      messageFragment: [
        {
          type: 'text',
          text,
          emote: {
            id: '',
            emote_set_id: '',
            owner_id: '',
            format: []
          }
        }
      ]
    }
  }

  private pushMessage(chatMessage: ChatMessage) {
    this.chatMessages.push(chatMessage)
    if (this.chatMessages.length > this.MAX_CACHE_SIZE) {
      this.chatMessages.shift()
    }

    void this.saveCache()

    if (this.mainWindow) {
      this.mainWindow.webContents.send('youtube:chat-message', chatMessage)
    }

    const alertBroadcast = (globalThis as any).alertBroadcast
    if (alertBroadcast) {
      alertBroadcast({
        type: 'youtube-chat',
        platform: 'youtube',
        username: chatMessage.displayName || chatMessage.username,
        message: chatMessage.message,
        color: chatMessage.color || '#ff0000',
        badges: chatMessage.badges,
        timestamp: chatMessage.timestamp,
        fragments: chatMessage.messageFragment
      })
    }
  }

  private async runLoop() {
    while (this.running) {
      try {
        await this.pollOnce()
      } catch (error: any) {
        console.error('[YouTubeChatListener] Polling error:', error)
        if (String(error?.message || '').includes('401')) {
          this.accessToken = null
        }
        this.liveChatId = null
        await this.delay(10_000)
      }
    }
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  async connect(config: { clientId: string; accessToken: string; refreshToken: string; expiresAt?: number }) {
    this.clientId = config.clientId
    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
    this.expiresAt = config.expiresAt ?? 0

    if (this.running) {
      return
    }

    this.running = true
    this.loopPromise = this.runLoop()
    await this.ensureValidToken()
  }

  disconnect() {
    this.running = false
    this.liveChatId = null
    this.nextPageToken = null
  }

  isConnected() {
    return this.running && Boolean(this.liveChatId)
  }

  getCachedMessages() {
    return [...this.chatMessages]
  }
}

export { YouTubeChatListener }