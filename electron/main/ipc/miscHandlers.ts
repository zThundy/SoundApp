import { ipcMain, BrowserWindow, shell } from 'electron'

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
    try {
      if (typeof url !== 'string') throw new Error('Invalid URL')
      await shell.openExternal(url)
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Failed to open external link' }
    }
  })
}
