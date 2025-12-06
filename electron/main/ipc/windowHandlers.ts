import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('window:minimize', () => {
    const win = getMainWindow()
    win?.minimize()
  })

  ipcMain.handle('window:close', () => {
    const win = getMainWindow()
    // win?.close()
    win?.hide()
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

  ipcMain.on('window:register-maximize-listener', () => {
    const win = getMainWindow()
    if (!win) return
    win.on('maximize', () => {
      win.webContents.send('window:is-maximized', true)
    })
    win.on('unmaximize', () => {
      win.webContents.send('window:is-maximized', false)
    })
  })
}
