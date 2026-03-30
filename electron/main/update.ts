import { app, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater');

export function update(win: Electron.BrowserWindow) {
  console.debug("[Updater] Initializing updater...");

  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false
  console.debug('[Updater] Updater config applied', {
    autoDownload: autoUpdater.autoDownload,
    disableWebInstaller: autoUpdater.disableWebInstaller,
    allowDowngrade: autoUpdater.allowDowngrade,
    isPackaged: app.isPackaged,
    currentVersion: app.getVersion(),
  })

  // start check
  autoUpdater.on('checking-for-update', function () { 
    console.debug('[Updater] Emitting renderer event: updater:checking')
    win.webContents.send('updater:checking')
    console.debug("[Updater] Checking for update...");
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
    console.debug("[Updater] Update info:", updateInfo);
    console.debug('[Updater] Emitting renderer event: update-can-available', updateInfo)
    win.webContents.send('update-can-available', updateInfo)
    console.debug('[Updater] Emitting renderer event: updater:available', { version: arg?.version })
    win.webContents.send('updater:available', { version: arg?.version })
    // Auto-download if update is available during preload
    console.debug('[Updater] Triggering auto download after update-available')
    autoUpdater.downloadUpdate()
    console.debug(`[Updater] Update available: ${arg?.version}`);
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
    console.debug('[Updater] Emitting renderer event: update-can-available', updateInfo)
    win.webContents.send('update-can-available', updateInfo)
    console.debug('[Updater] Emitting renderer event: updater:not-available')
    win.webContents.send('updater:not-available')
    console.debug("[Updater] No update available.");
  })

  // Download progress
  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    console.debug('[Updater] Emitting renderer event: updater:download-progress')
    win.webContents.send('updater:download-progress', progressInfo)
    console.debug(`[Updater] Download progress: ${progressInfo.percent.toFixed(2)}%`)
    win.setProgressBar(progressInfo.percent / 100);
    console.debug(`[Updater] Window progress bar set to ${(progressInfo.percent / 100).toFixed(4)}`)
  })

  // Update downloaded
  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    console.debug('[Updater] Emitting renderer event: updater:downloaded')
    win.webContents.send('updater:downloaded');
    console.debug("[Updater] Update downloaded and ready to install.");
  })

  // Error handling
  autoUpdater.on('error', (error: Error) => {
    console.error('[Updater] AutoUpdater error:', error)
    console.debug('[Updater] Emitting renderer event: updater:error', { message: error.message })
    win.webContents.send('updater:error', { message: error.message })
  })

  // Checking for updates
  ipcMain.handle('check-update', async () => {
    console.debug("[Updater] Checking for updates...");
    if (!app.isPackaged) {
      const error = new Error('The update feature is only available after the package.')
      console.warn('[Updater] check-update aborted: app is not packaged')
      return { message: error.message, error }
    }

    try {
      const result = await autoUpdater.checkForUpdatesAndNotify()
      console.debug('[Updater] check-update completed successfully', {
        hasResult: Boolean(result),
      })
      return result
    } catch (error) {
      console.error('[Updater] check-update failed with network error', error)
      return { message: 'Network error', error }
    }
  })

  // Start downloading and feedback on progress
  ipcMain.handle('start-download', (event: Electron.IpcMainInvokeEvent) => {
    console.debug('[Updater] IPC request received: start-download')
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          console.error('[Updater] start-download callback error', error)
          console.debug('[Updater] Emitting renderer event: update-error', { message: error.message })
          event.sender.send('update-error', { message: error.message, error })
        } else {
          // feedback update progress message
          console.debug('[Updater] Emitting renderer event: download-progress', {
            percent: progressInfo?.percent ?? 0,
          })
          event.sender.send('download-progress', progressInfo)
        }
      },
      () => {
        // feedback update downloaded message
        console.debug('[Updater] Emitting renderer event: update-downloaded')
        event.sender.send('update-downloaded')
      }
    )
    console.debug('[Updater] start-download handler execution completed')
  })

  // Install now
  ipcMain.handle('quit-and-install', () => {
    console.debug('[Updater] IPC request received: quit-and-install')
    autoUpdater.quitAndInstall(false, true)
    console.debug('[Updater] quit-and-install invoked')
  })

  // Install from preload updater
  ipcMain.handle('updater:install', () => {
    console.debug('[Updater] IPC request received: updater:install')
    autoUpdater.quitAndInstall(false, true)
    console.debug('[Updater] updater:install invoked')
  })

  console.debug('[Updater] Updater listeners and IPC handlers registered')
}

// Function to check for updates on startup (before window is shown)
export async function checkForUpdatesOnStartup(win: Electron.BrowserWindow): Promise<boolean> {
  console.debug('[Updater] Startup check initiated', {
    isPackaged: app.isPackaged,
    currentVersion: app.getVersion(),
  })
  if (!app.isPackaged) {
    console.debug('[Updater] Startup check skipped: app is not packaged')
    return false // Skip update check in development
  }

  try {
    const result = await autoUpdater.checkForUpdates()
    const hasUpdate = result !== null && result.updateInfo.version !== app.getVersion()
    console.debug('[Updater] Startup check completed', {
      hasUpdate,
      latestVersion: result?.updateInfo?.version,
      currentVersion: app.getVersion(),
    })
    return hasUpdate
  } catch (error) {
    console.error('[Updater] Error checking for updates on startup:', error)
    return false
  }
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  console.debug('[Updater] startDownload called: registering temporary listeners')
  autoUpdater.on('download-progress', (info: ProgressInfo) => {
    console.debug('[Updater] startDownload listener: download-progress', {
      percent: info.percent,
      transferred: info.transferred,
      total: info.total,
    })
    callback(null, info)
  })
  autoUpdater.on('error', (error: Error) => {
    console.error('[Updater] startDownload listener: error', error)
    callback(error, null)
  })
  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    console.debug('[Updater] startDownload listener: update-downloaded')
    complete(event)
  })
  console.debug('[Updater] startDownload: invoking autoUpdater.downloadUpdate()')
  autoUpdater.downloadUpdate()
}
