import { ipcMain, BrowserWindow } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'
import { getBroadcasterId, getTwitchRedemptions, getCustomRewards } from '../twitchWorker'

export function registerTwitchHandlers(safeStore: SafeStorageWrapper | null) {
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
        "chat:read",
        "chat:edit"
      ].join(' ')

      const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2'
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
          resolve()
        }
      })

      authWindow.on('closed', () => {
        reject(new Error('User closed the OAuth window'))
      })
    })
  })

  ipcMain.handle("oauth:logout-twitch", async () => {
    safeStore?.remove('twitchAccessToken')
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
}
