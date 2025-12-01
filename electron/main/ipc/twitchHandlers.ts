import { ipcMain, BrowserWindow } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'
import {
  getBroadcasterId,
  getTwitchRedemptions,
  getCustomRewards,
} from '../twitchWorker'
import { TwitchEventListener } from '../twitchEventListener'

let twitchEventListener: TwitchEventListener | null = null
const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2'

export const getTwitchEventListener = () => twitchEventListener

export const connectEventSubIfPossible = async (safeStore: SafeStorageWrapper | null, mainWindow: BrowserWindow | null) => {
  console.log("[Twitch] Attempting to connect to EventSub if possible...")
  if (!mainWindow || twitchEventListener?.isConnected()) return console.log("[Twitch] Already connected or no main window.")

  try {
    const accessToken = await safeStore?.get('twitchAccessToken')
    let broadcasterId = await safeStore?.get('broadcasterId')

    if (!accessToken) return

    if (!broadcasterId) {
      broadcasterId = await getBroadcasterId(accessToken)
      safeStore?.set('broadcasterId', broadcasterId)
    }

    if (!twitchEventListener) {
      twitchEventListener = new TwitchEventListener(mainWindow)
    }

    await twitchEventListener.connect(accessToken, broadcasterId, clientId)
    console.log('Twitch EventSub connected')
  } catch (error) {
    console.error('Failed to connect to Twitch EventSub:', error)
  }
}

export function registerTwitchHandlers(safeStore: SafeStorageWrapper | null, mainWindow: BrowserWindow | null) {
  connectEventSubIfPossible(safeStore, mainWindow)
  ipcMain.handle('oauth:start-twitch', (_evt) => {
    return new Promise<void>((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
          contextIsolation: true,
        },
      })

      const stateString = Math.random().toString(36).substring(2, 15)
      const scopes = [
        "channel:read:redemptions",
        "channel:manage:redemptions",
        "user:read:chat",
        "moderator:read:chatters",
        "chat:read",
        "chat:edit"
      ].join(' ')

      const forceVerify = false
      const redirectUri = 'http://localhost/'
      const responseType = 'token'

      const authUrl = new URL('https://id.twitch.tv/oauth2/authorize')
      if (forceVerify) {
        authUrl.searchParams.set('force_verify', 'true')
      }
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', responseType)
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('state', stateString)

      authWindow.loadURL(authUrl.toString())

      const { session: { webRequest } } = authWindow.webContents
      const filter = { urls: ['http://localhost/*'] }

      webRequest.onBeforeRequest(filter, async ({ url }) => {
        const urlObj = new URL(url)
        const hashParams = new URLSearchParams(urlObj.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const returnedState = hashParams.get('state')
        if (accessToken && returnedState === stateString) {
          safeStore?.set('twitchAccessToken', accessToken)
          authWindow.close()
          
          connectEventSubIfPossible(safeStore, mainWindow)
          resolve()
        }
      })

      authWindow.on('closed', () => {
        reject(new Error('User closed the OAuth window'))
      })
    })
  })

  ipcMain.handle("oauth:logout-twitch", async () => {
    if (twitchEventListener) {
      twitchEventListener.disconnect()
      twitchEventListener = null
    }
    
    safeStore?.remove('twitchAccessToken')
    safeStore?.remove('broadcasterId')
  })

  ipcMain.handle('twitch-events:connect', async () => {
    try {
      await connectEventSubIfPossible(safeStore, mainWindow)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('twitch-events:disconnect', async () => {
    try {
      if (twitchEventListener) {
        twitchEventListener.disconnect()
        twitchEventListener = null
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("twitch:get-all-redemptions", async () => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    const redemptions = await getTwitchRedemptions(accessToken as string, broadcasterId)
    return redemptions
  })

  ipcMain.handle("twitch:get-all-rewards", async () => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    const customRewards = await getCustomRewards(accessToken as string, broadcasterId)
    return customRewards
  })

  ipcMain.handle("twitch:update-reward", async (_evt, rewardId: string, settings: any) => {
    // const accessToken = await safeStore?.get('twitchAccessToken')
    // const broadcasterId = await getBroadcasterId(accessToken as string)
    // const updatedReward = await updateCustomReward(accessToken as string, broadcasterId, rewardId, settings)
    // return updatedReward
    return false
  })
}
