import { app, BrowserWindow, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

import { initializeLogger, closeLogger } from './logger'
import { update } from './update'
import { startAlertServer } from './alertServer'
import SafeStorageWrapper from './safeStorageWrapper'
import { registerAllIPCHandlers } from './ipc'
import windowStateManager from './windowStateManager'
import { connectEventSubIfPossible } from './ipc/twitchHandlers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '../..')

// Initialize logger as early as possible
initializeLogger()

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
  const savedState = await windowStateManager.loadState();

  win = new BrowserWindow({
    title: 'Window',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    minWidth: 900,
    minHeight: 550,
    // hide titlebar
    frame: false,
    show: false, // Don't show window until update check is complete
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  windowStateManager.applyState(win);
  windowStateManager.track(win);

  // Setup auto-updater before loading the window
  update(win)

  if (VITE_DEV_SERVER_URL) { // #298
    console.log('VITE_DEV_SERVER_URL detected, opening devtools...')
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged in a new window
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(indexHtml)
  }

  // Wait for the page to load, then check for updates
  win.webContents.on('did-finish-load', async () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    
    // Check for updates on startup (only in production)
    if (app.isPackaged) {
      try {
        await win?.webContents.executeJavaScript('void 0'); // Ensure webContents is ready
        const { checkForUpdatesOnStartup } = await import('./update')
        console.log("[update] Checking for updates on startup...");
        await checkForUpdatesOnStartup(win!)
      } catch (error) {
        console.error('Error during startup update check:', error)
      }
    } else {
      console.log('[update] Skipping update check on startup in development mode.');
    }
    
    // Try to connect Twitch EventSub on window load
    connectEventSubIfPossible(safeStore, win)
  })

  // Show window after a small delay to ensure preload screen is visible
  setTimeout(() => {
    win?.show()
  }, 500)

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
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

    // Register all IPC handlers
    registerAllIPCHandlers({
      getMainWindow: () => win,
      safeStore,
      getAlertServer: () => alertServerRef,
      setAlertServer: (server) => { alertServerRef = server },
      startAlertServer,
      INTERNAL_SERVER_PORT,
      VITE_DEV_SERVER_URL,
      indexHtml,
      preload
    })
  }).catch(err => {
    console.error('Failed to start AlertServer', err)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    closeLogger()
    app.quit()
  }
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

app.on('before-quit', () => {
  console.log('App is quitting...')
  closeLogger()
})