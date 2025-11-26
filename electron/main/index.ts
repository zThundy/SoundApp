import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import { startAlertServer } from './alertServer'
import SafeStorageWrapper from './safeStorageWrapper'
import { getBroadcasterId, getTwitchRedemptions, getCustomRewards } from './twitchWorker'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '../..')

export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

const INTERNAL_SERVER_PORT = 4823

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let safeStore: SafeStorageWrapper | null = null
let alertServerRef: { stop: () => Promise<void>; port: number; broadcast: (p: any) => void } | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Window',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    width: 1600,
    height: 900,
    minWidth: 900,
    minHeight: 550,
    // hide titlebar
    frame: false,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged in a new window
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(() => {
  // instantiate the safe storage helper after app ready (uses app.getPath)
  try {
    safeStore = new SafeStorageWrapper()
  } catch (err) {
    console.error('Failed to initialize SafeStorageWrapper', err)
    safeStore = null
  }

  // Resolve alert server port: prefer SafeStorage value, else default
  const configuredPortStr = safeStore?.get('alertServerPort') ?? null
  const configuredPort = configuredPortStr ? Number(configuredPortStr) : null
  const alertPort = configuredPort && configuredPort > 0 ? configuredPort : INTERNAL_SERVER_PORT

  startAlertServer(alertPort).then(server => {
    console.log(`[AlertServer] running on http://localhost:${server.port}`);
    (globalThis as any).alertBroadcast = server.broadcast;
    alertServerRef = server as any;

    ipcMain.handle('alerts:broadcast', (_evt, payload) => {
      try {
        if (!payload || typeof payload !== 'object' || !('type' in payload)) {
          throw new Error('Invalid alert payload');
        }
        const broadcaster = alertServerRef?.broadcast ?? (globalThis as any).alertBroadcast
        if (typeof broadcaster !== 'function') {
          throw new Error('Alert server not available')
        }
        broadcaster(payload);
        return { ok: true };
      } catch (err: any) {
        console.error('Failed to broadcast alert', err);
        return { ok: false, error: err.message };
      }
    })

    // IPC: get current alert server port (prefers stored value, falls back to actual server port)
    ipcMain.handle('alerts:get-port', () => {
      const stored = safeStore?.get('alertServerPort') ?? null
      const portNum = stored ? Number(stored) : (alertServerRef?.port ?? server.port)
      return { port: portNum }
    })

    // IPC: set alert server port and persist to SafeStorage
    ipcMain.handle('alerts:set-port', async (_evt, port: number | string) => {
      try {
        const p = typeof port === 'string' ? Number(port) : port
        if (!Number.isFinite(p) || p <= 0 || p >= 65536) {
          throw new Error('Invalid port number')
        }
        // persist
        await safeStore?.set('alertServerPort', String(p))
        // Note: changing port requires restarting the alert server; caller should prompt app restart
        return { ok: true, port: p, requiresRestart: true }
      } catch (err: any) {
        return { ok: false, error: err?.message ?? 'Failed to set port' }
      }
    })

    // IPC: restart alert server using configured (or default) port
    ipcMain.handle('alerts:restart', async () => {
      try {
        console.log('[AlertServer] restarting...');
        const configuredPortStr = safeStore?.get('alertServerPort') ?? null
        const configuredPort = configuredPortStr ? Number(configuredPortStr) : null
        const alertPort = configuredPort && configuredPort > 0 ? configuredPort : INTERNAL_SERVER_PORT

        if (alertServerRef) {
          await alertServerRef.stop()
          alertServerRef = null
        }
        const newServer = await startAlertServer(alertPort)
        alertServerRef = newServer as any
        ;(globalThis as any).alertBroadcast = newServer.broadcast
        console.log(`[AlertServer] restarted on http://localhost:${newServer.port}`)
        return { ok: true, port: newServer.port }
      } catch (err: any) {
        console.error('Failed to restart AlertServer', err)
        return { ok: false, error: err?.message ?? 'Restart failed' }
      }
    })
  }).catch(err => {
    console.error('Failed to start AlertServer', err)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// Open a URL in the system default browser
ipcMain.handle('open-external', async (_evt, url: string) => {
  try {
    // Basic validation to avoid executing arbitrary protocols
    if (typeof url !== 'string') throw new Error('Invalid URL')
    await shell.openExternal(url)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Failed to open external link' }
  }
})

// Window control handlers for the custom title bar
ipcMain.handle('window:minimize', () => {
  win?.minimize()
})

ipcMain.handle('window:close', () => {
  win?.close()
})

ipcMain.handle('window:is-maximized', () => {
  return win?.isMaximized() ?? false
})

ipcMain.handle('window:toggle-maximize', () => {
  if (!win) return false
  if (win.isMaximized()) {
    win.unmaximize()
    return false
  } else {
    win.maximize()
    return true
  }
})

ipcMain.handle('safe-store:set', async (_evt, key: string, value: string) => {
  if (!safeStore) return false
  return safeStore.set(key, value)
})

ipcMain.handle('safe-store:get', async (_evt, key: string) => {
  console.log('IPC safe-store:get for key:', key);
  if (!safeStore) return null
  const value = safeStore.get(key);
  console.log('Retrieved value:', value);
  return value;
})

ipcMain.handle('safe-store:remove', (_evt, key: string) => {
  if (!safeStore) return false
  return safeStore.remove(key)
})

ipcMain.handle('safe-store:has', (_evt, key: string) => {
  if (!safeStore) return false
  return safeStore.has(key)
})

ipcMain.handle('safe-store:clear', (_evt) => {
  if (!safeStore) return false
  return safeStore.clear()
})

ipcMain.handle('oauth:start-twitch', (_evt) => {
  return new Promise<void>((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: true,
      // hide file, edit, view menu
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
      },
    });

    const stateString = Math.random().toString(36).substring(2, 15);
    const scopes = [
      "channel:read:redemptions",
      "channel:manage:redemptions",
      "user:read:chat",
      "chat:read",
      "chat:edit"
    ].join(' ');

    // implicit grant flow
    const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2';
    const forceVerify = false;
    const redirectUri = 'http://localhost/';
    const responseType = 'token';

    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    if (forceVerify) {
      authUrl.searchParams.set('force_verify', 'true');
    }
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', responseType);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', stateString);

    authWindow.loadURL(authUrl.toString());

    const { session: { webRequest } } = authWindow.webContents;
    const filter = { urls: ['http://localhost/*'] };

    webRequest.onBeforeRequest(filter, async ({ url }) => {
      const urlObj = new URL(url);
      const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // Remove the '#' character
      const accessToken = hashParams.get('access_token');
      const returnedState = hashParams.get('state');
      if (accessToken && returnedState === stateString) {
        safeStore?.set('twitchAccessToken', accessToken);
        // You can now use the access token as needed
        authWindow.close();
        resolve();
      }
    });

    authWindow.on('closed', () => {
      reject(new Error('User closed the OAuth window'));
    });
  });
});

ipcMain.handle("oauth:logout-twitch", async () => {
  safeStore?.remove('twitchAccessToken');
});

ipcMain.handle("twitch:get-all-redemptions", async () => {
  const accessToken = await safeStore?.get('twitchAccessToken');
  const broadcasterId = await getBroadcasterId(accessToken as string);
  const customRewards = await getCustomRewards(accessToken as string, broadcasterId);
  const redemptions = await getTwitchRedemptions(accessToken as string, broadcasterId);

  return redemptions;
});

ipcMain.handle("twitch:get-all-rewards", async () => {
  const accessToken = await safeStore?.get('twitchAccessToken');
  const broadcasterId = await getBroadcasterId(accessToken as string);
  const customRewards = await getCustomRewards(accessToken as string, broadcasterId);
  return customRewards;
});