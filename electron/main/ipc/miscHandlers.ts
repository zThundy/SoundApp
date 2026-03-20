import { ipcMain, BrowserWindow, shell, app } from 'electron'
import path from 'node:path'
import { getLogger } from '../logger'
import { getDebugLoggingEnabled, setDebugLoggingEnabled } from '../logger'

export async function openExternalLink(url: string) {
  try {
    if (typeof url !== 'string') throw new Error('Invalid URL')
    await shell.openExternal(url)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Failed to open external link' }
  }
}

export function registerMiscHandlers(
  getMainWindow: () => BrowserWindow | null,
  VITE_DEV_SERVER_URL: string | undefined,
  indexHtml: string,
  preload: string
) {
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
    return openExternalLink(url)
  })

  // Get log file paths
  ipcMain.handle('logger:get-paths', () => {
    const logger = getLogger()
    if (!logger) {
      return { ok: false, error: 'Logger not initialized' }
    }
    return {
      ok: true,
      logPath: logger.getLogFilePath(),
      errorLogPath: logger.getErrorLogFilePath()
    }
  })

  // Open log file in default editor
  ipcMain.handle('logger:open-log', async () => {
    const logger = getLogger()
    if (!logger) {
      return { ok: false, error: 'Logger not initialized' }
    }
    try {
      await shell.openPath(logger.getLogFilePath())
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Failed to open log file' }
    }
  })

  // Open error log file in default editor
  ipcMain.handle('logger:open-error-log', async () => {
    const logger = getLogger()
    if (!logger) {
      return { ok: false, error: 'Logger not initialized' }
    }
    try {
      await shell.openPath(logger.getErrorLogFilePath())
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Failed to open error log file' }
    }
  })

  // Get app version
  ipcMain.handle('app:get-version', () => {
    return { ok: true, version: app.getVersion() }
  })

  // Debug log switch used by renderer settings
  ipcMain.handle('app:get-debug-logs-enabled', () => {
    return { ok: true, enabled: getDebugLoggingEnabled() }
  })

  ipcMain.handle('app:set-debug-logs-enabled', (_evt, enabled: boolean) => {
    if (typeof enabled !== 'boolean') {
      return { ok: false, error: 'Invalid debug log value' }
    }

    const activeValue = setDebugLoggingEnabled(enabled)

    return { ok: true, enabled: activeValue }
  })

  // Open the folder where the app executable is installed.
  ipcMain.handle('app:open-install-folder', async () => {
    try {
      const installFolder = app.isPackaged
        ? path.dirname(app.getPath('exe'))
        : app.getAppPath()

      const openResult = await shell.openPath(installFolder)
      if (openResult) {
        return { ok: false, error: openResult }
      }

      return { ok: true, folder: installFolder }
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Failed to open app install folder' }
    }
  })
}
