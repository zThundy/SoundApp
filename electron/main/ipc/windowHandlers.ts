import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(getMainWindow: () => BrowserWindow | null) {
  // Window control handlers for the custom title bar
  ipcMain.handle('window:minimize', () => {
    const win = getMainWindow()
    win?.minimize()
  })

  ipcMain.handle('window:close', () => {
    const win = getMainWindow()
    win?.close()
  })

  ipcMain.handle('window:is-maximized', () => {
    const win = getMainWindow()
    return win?.isMaximized() ?? false
  })

  ipcMain.handle('window:toggle-maximize', () => {
    const win = getMainWindow()
    if (!win) return false
    if (win.isMaximized()) {
      win.unmaximize()
      return false
    } else {
      win.maximize()
      return true
    }
  })
}
