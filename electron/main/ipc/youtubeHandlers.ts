import http from 'node:http'
import { randomBytes } from 'node:crypto'
import { ipcMain, shell } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'
import { YouTubeChatListener } from '../youtubeChatListener'
import {
  buildYouTubeAuthUrl,
  createPkcePair,
  exchangeYouTubeCodeForTokens,
  revokeYouTubeToken,
  YOUTUBE_CLIENT_ID
} from '../youtubeWorker'

let youtubeChatListener: YouTubeChatListener | null = null

export const getYouTubeChatListener = () => youtubeChatListener

const resolveYouTubeClientId = (safeStore: SafeStorageWrapper | null) => {
  const storedClientId = safeStore?.get('youtubeClientId') || ''
  const runtimeClientId = YOUTUBE_CLIENT_ID || ''
  return (runtimeClientId || storedClientId).trim()
}

export const connectYouTubeIfPossible = async (safeStore: SafeStorageWrapper | null, mainWindow: Electron.BrowserWindow | null) => {
  if (!safeStore || !mainWindow) return

  const clientId = resolveYouTubeClientId(safeStore)
  const accessToken = safeStore.get('youtubeAccessToken')
  const refreshToken = safeStore.get('youtubeRefreshToken')
  const expiresAt = Number(safeStore.get('youtubeTokenExpiresAt') || '0')

  if (!clientId || !refreshToken || !accessToken) {
    return
  }

  if (!youtubeChatListener) {
    youtubeChatListener = new YouTubeChatListener(safeStore, mainWindow)
  }

  try {
    await youtubeChatListener.connect({ clientId, accessToken, refreshToken, expiresAt })
  } catch (error) {
    console.error('[YouTubeHandlers] Failed to connect YouTube chat listener:', error)
  }
}

function createCallbackServer() {
  return new Promise<{ server: http.Server; redirectUri: string }>((resolve, reject) => {
    const server = http.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start YouTube OAuth callback server'))
        return
      }

      resolve({
        server,
        redirectUri: `http://127.0.0.1:${address.port}/oauth2callback`
      })
    })
  })
}

export function registerYouTubeHandlers(safeStore: SafeStorageWrapper | null, mainWindow: Electron.BrowserWindow | null) {
  void connectYouTubeIfPossible(safeStore, mainWindow)

  ipcMain.handle('oauth:start-youtube', async () => {
    const clientId = resolveYouTubeClientId(safeStore)
    if (!clientId) {
      throw new Error('YouTube OAuth client ID missing. Set YOUTUBE_OAUTH_CLIENT_ID for the app build/runtime.')
    }

    const { codeVerifier, codeChallenge } = createPkcePair()
    const state = randomBytes(24).toString('hex')
    const { server, redirectUri } = await createCallbackServer()

    try {
      const authUrl = buildYouTubeAuthUrl(clientId, redirectUri, state, codeChallenge)

      const code = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('YouTube OAuth timed out'))
          try { server.close() } catch {}
        }, 5 * 60 * 1000)

        server.on('request', (req, res) => {
          const requestUrl = new URL(req.url || '/', redirectUri)
          if (requestUrl.pathname !== '/oauth2callback') {
            res.writeHead(404)
            res.end('Not found')
            return
          }

          const returnedState = requestUrl.searchParams.get('state')
          const authCode = requestUrl.searchParams.get('code')
          const error = requestUrl.searchParams.get('error')

          if (error) {
            clearTimeout(timeout)
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end('<h2>YouTube authorization failed. You can close this window.</h2>')
            reject(new Error(error))
            try { server.close() } catch {}
            return
          }

          if (!authCode || returnedState !== state) {
            clearTimeout(timeout)
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end('<h2>Invalid YouTube authorization response. You can close this window.</h2>')
            reject(new Error('Invalid YouTube OAuth response'))
            try { server.close() } catch {}
            return
          }

          clearTimeout(timeout)
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h2>YouTube connected successfully. You can close this window and return to the app.</h2>')
          resolve(authCode)
          try { server.close() } catch {}
        })

        void shell.openExternal(authUrl)
      })

      const tokenResponse = await exchangeYouTubeCodeForTokens(clientId, code, codeVerifier, redirectUri)
      const expiresAt = Date.now() + ((tokenResponse.expires_in ?? 3600) * 1000)

      safeStore?.set('youtubeAccessToken', tokenResponse.access_token)
      safeStore?.set('youtubeTokenExpiresAt', String(expiresAt))
      if (tokenResponse.refresh_token) {
        safeStore?.set('youtubeRefreshToken', tokenResponse.refresh_token)
      }

      await connectYouTubeIfPossible(safeStore, mainWindow)
      return { success: true }
    } finally {
      try { server.close() } catch {}
    }
  })

  ipcMain.handle('oauth:logout-youtube', async () => {
    const accessToken = safeStore?.get('youtubeAccessToken')
    const refreshToken = safeStore?.get('youtubeRefreshToken')

    youtubeChatListener?.disconnect()
    youtubeChatListener = null

    try {
      if (refreshToken) {
        await revokeYouTubeToken(refreshToken)
      } else if (accessToken) {
        await revokeYouTubeToken(accessToken)
      }
    } catch (error) {
      console.warn('[YouTubeHandlers] Failed to revoke YouTube token:', error)
    }

    safeStore?.remove('youtubeAccessToken')
    safeStore?.remove('youtubeRefreshToken')
    safeStore?.remove('youtubeTokenExpiresAt')
  })

  ipcMain.handle('youtube-events:connect', async () => {
    try {
      await connectYouTubeIfPossible(safeStore, mainWindow)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('youtube-events:disconnect', async () => {
    try {
      youtubeChatListener?.disconnect()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}