import { ipcMain, BrowserWindow, shell } from 'electron'
import { randomBytes } from 'node:crypto'
import SafeStorageWrapper from '../safeStorageWrapper'
import {
  getBroadcasterId,
  getTwitchRedemptions,
  getCustomRewards,
  updateCustomReward,
  createCustomReward,
  deleteCustomReward,
  getOnlyManageableRewards
} from '../twitchWorker'
import { TwitchEventListener } from '../twitchEventListener'
import { RewardSettings } from '../twitchWorker'

let twitchEventListener: TwitchEventListener | null = null
const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2'
const TWITCH_AUTH_TIMEOUT_MS = 60 * 1000

type PendingTwitchAuth = {
  state: string
  safeStore: SafeStorageWrapper | null
  mainWindow: BrowserWindow | null
  resolve: () => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

let pendingTwitchAuth: PendingTwitchAuth | null = null

function clearPendingTwitchAuth() {
  if (!pendingTwitchAuth) return
  clearTimeout(pendingTwitchAuth.timeout)
  pendingTwitchAuth = null
}

async function completeTwitchOAuth(payload: { accessToken?: string | null, state?: string | null, error?: string | null }) {
  const activeAuth = pendingTwitchAuth
  if (!activeAuth) {
    return { ok: false, error: 'No pending Twitch OAuth request' }
  }

  if (payload.error) {
    clearPendingTwitchAuth()
    activeAuth.reject(new Error(payload.error))
    return { ok: false, error: payload.error }
  }

  if (!payload.accessToken || payload.state !== activeAuth.state) {
    return { ok: false, error: 'Invalid Twitch OAuth callback payload' }
  }

  try {
    activeAuth.safeStore?.set('twitchAccessToken', payload.accessToken)
    await connectEventSubIfPossible(activeAuth.safeStore, activeAuth.mainWindow)
    clearPendingTwitchAuth()
    activeAuth.resolve()
    return { ok: true }
  } catch (error: any) {
    clearPendingTwitchAuth()
    activeAuth.reject(error instanceof Error ? error : new Error(String(error)))
    return { ok: false, error: error?.message ?? 'Failed to complete Twitch OAuth' }
  }
}

(globalThis as any).completeTwitchOAuth = completeTwitchOAuth

export const getTwitchEventListener = () => twitchEventListener

export const connectEventSubIfPossible = async (safeStore: SafeStorageWrapper | null, mainWindow: BrowserWindow | null) => {
  console.debug("[TwitchHandlers] Attempting to connect to EventSub if possible...")
  if (!mainWindow || twitchEventListener?.isConnected()) return console.debug("[TwitchHandlers] Already connected or no main window.")

  try {
    const accessToken = await safeStore?.get('twitchAccessToken')
    let broadcasterId = await safeStore?.get('broadcasterId')

    if (!accessToken) return

    if (!broadcasterId) {
      broadcasterId = await getBroadcasterId(accessToken)
      safeStore?.set('broadcasterId', broadcasterId)
    }

    if (!twitchEventListener) {
      twitchEventListener = new TwitchEventListener(safeStore, mainWindow)
    }

    await twitchEventListener.connect(accessToken, broadcasterId, clientId)
    console.debug('[TwitchHandlers] Twitch EventSub connected')
  } catch (error) {
    console.error('[TwitchHandlers] Failed to connect to Twitch EventSub:', error)
  }
}

export function registerTwitchHandlers(safeStore: SafeStorageWrapper | null, mainWindow: BrowserWindow | null) {
  connectEventSubIfPossible(safeStore, mainWindow)
  ipcMain.handle('oauth:start-twitch', async (_evt) => {
    if (pendingTwitchAuth) {
      throw new Error('A Twitch login is already in progress')
    }

    return new Promise<void>(async (resolve, reject) => {
      const stateString = randomBytes(24).toString('hex')
      const alertServerPort = Number(safeStore?.get('alertServerPort') ?? '4823') || 4823
      const scopes = [
        "channel:read:redemptions",
        "channel:manage:redemptions",
        "channel:read:subscriptions",
        "bits:read",
        "user:read:chat",
        "moderator:read:chatters",
        "moderator:read:followers",
        "chat:read",
        "chat:edit",
        "user:read:follows",
        "user:read:subscriptions",
      ].join(' ')

      const forceVerify = false
      const redirectUri = `http://localhost:${alertServerPort}/twitch-auth/callback`
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

      pendingTwitchAuth = {
        state: stateString,
        safeStore,
        mainWindow,
        resolve,
        reject,
        timeout: setTimeout(() => {
          const activeAuth = pendingTwitchAuth
          if (!activeAuth) return

          void (async () => {
            try {
              const storedToken = activeAuth.safeStore?.get('twitchAccessToken')
              if (storedToken) {
                await connectEventSubIfPossible(activeAuth.safeStore, activeAuth.mainWindow)
                clearPendingTwitchAuth()
                activeAuth.resolve()
                return
              }

              clearPendingTwitchAuth()
              activeAuth.reject(new Error('Twitch login timed out'))
            } catch (error: any) {
              clearPendingTwitchAuth()
              activeAuth.reject(new Error(error?.message ?? 'Twitch login timed out'))
            }
          })()
        }, TWITCH_AUTH_TIMEOUT_MS),
      }

      try {
        await shell.openExternal(authUrl.toString())
      } catch (error: any) {
        clearPendingTwitchAuth()
        reject(new Error(error?.message ?? 'Failed to open browser for Twitch login'))
      }
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
    // console.log("Fetched custom rewards:", customRewards)
    return customRewards
  })

  ipcMain.handle("twitch:update-reward", async (_evt, rewardId: string, settings: RewardSettings) => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    // console.log("Access Token:", accessToken)
    // console.log("Broadcaster ID:", broadcasterId)
    // console.log("Reward ID:", rewardId)
    // console.log("Settings:", settings)
    const updatedReward = await updateCustomReward(accessToken as string, broadcasterId, rewardId, settings)
    return updatedReward
  })

  ipcMain.handle("twitch:create-reward", async (_evt, settings: RewardSettings) => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    const newReward = await createCustomReward(accessToken as string, broadcasterId, settings)
    return newReward
  })

  ipcMain.handle("twitch:delete-reward", async (_evt, rewardId: string) => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    await deleteCustomReward(accessToken as string, broadcasterId, rewardId)
    return
  })

  ipcMain.handle("twitch:get-manageable-rewards", async () => {
    const accessToken = await safeStore?.get('twitchAccessToken')
    const broadcasterId = await getBroadcasterId(accessToken as string)
    const managableRewards = await getOnlyManageableRewards(accessToken as string, broadcasterId)
    return managableRewards.data.map((reward: any) => reward.id)
  })
}
