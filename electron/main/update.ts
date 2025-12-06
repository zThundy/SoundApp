import { app, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater');

export function update(win: Electron.BrowserWindow) {
  console.debug("[update] Initializing updater...");

  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  // start check
  autoUpdater.on('checking-for-update', function () { 
    win.webContents.send('updater:checking')
    console.debug("[update] Checking for update...");
  })
  // update available
  autoUpdater.on('update-available', (arg: UpdateInfo) => {
    const updateInfo = {
      releaseNotes: arg?.releaseNotes,
      releaseDate: arg?.releaseDate,
      files: arg?.files,
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version
    }
    console.debug("[update] Update info:", updateInfo);
    win.webContents.send('update-can-available', updateInfo)
    win.webContents.send('updater:available', { version: arg?.version })
    // Auto-download if update is available during preload
    autoUpdater.downloadUpdate()
    console.debug(`[update] Update available: ${arg?.version}`);
  })
  // update not available
  autoUpdater.on('update-not-available', (arg: UpdateInfo) => {
    const updateInfo = {
      releaseNotes: arg?.releaseNotes,
      releaseDate: arg?.releaseDate,
      files: arg?.files,
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version
    }
    win.webContents.send('update-can-available', updateInfo)
    win.webContents.send('updater:not-available')
    console.debug("[update] No update available.");
  })

  // Download progress
  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    win.webContents.send('updater:download-progress', progressInfo)
    console.debug(`[update] Download progress: ${progressInfo.percent.toFixed(2)}%`)
    win.setProgressBar(progressInfo.percent / 100);
  })

  // Update downloaded
  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    win.webContents.send('updater:downloaded');
    console.debug("[update] Update downloaded and ready to install.");
  })

  // Error handling
  autoUpdater.on('error', (error: Error) => {
    win.webContents.send('updater:error', { message: error.message })
  })

  // Checking for updates
  ipcMain.handle('check-update', async () => {
    console.debug("[update] Checking for updates...");
    if (!app.isPackaged) {
      const error = new Error('The update feature is only available after the package.')
      return { message: error.message, error }
    }

    try {
      return await autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      return { message: 'Network error', error }
    }
  })

  // Start downloading and feedback on progress
  ipcMain.handle('start-download', (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send('update-error', { message: error.message, error })
        } else {
          // feedback update progress message
          event.sender.send('download-progress', progressInfo)
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send('update-downloaded')
      }
    )
  })

  // Install now
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Install from preload updater
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

// Function to check for updates on startup (before window is shown)
export async function checkForUpdatesOnStartup(win: Electron.BrowserWindow): Promise<boolean> {
  if (!app.isPackaged) {
    return false // Skip update check in development
  }

  try {
    const result = await autoUpdater.checkForUpdates()
    return result !== null && result.updateInfo.version !== app.getVersion()
  } catch (error) {
    console.error('Error checking for updates on startup:', error)
    return false
  }
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  autoUpdater.on('download-progress', (info: ProgressInfo) => callback(null, info))
  autoUpdater.on('error', (error: Error) => callback(error, null))
  autoUpdater.on('update-downloaded', complete)
  autoUpdater.downloadUpdate()
}
