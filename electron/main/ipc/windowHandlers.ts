import { ipcMain, BrowserWindow, app } from 'electron'
import fileManager from '../fileManager'

const SETTINGS_CONTEXT = 'state'
const SETTINGS_FILE = 'settings.json'

export async function registerWindowHandlers(getMainWindow: () => BrowserWindow | null) {
  const exists = await fileManager.fileExists(SETTINGS_CONTEXT, { relativePath: SETTINGS_FILE });
  let settings: any = {}
  if (exists) {
    try {
      const { buffer } = fileManager.readFile(SETTINGS_CONTEXT, { relativePath: SETTINGS_FILE });
      const data = await buffer;
      settings = JSON.parse(data.toString());
    } catch (e) {
      console.error('[WindowHandlers] Errore nel caricamento delle impostazioni:', e);
    }
  }

  ipcMain.handle("window:is-startupopen-enabled", () => {
    const appLoginSettings = app.getLoginItemSettings()
    console.log(appLoginSettings)
    return appLoginSettings.openAtLogin || false;
  })

  ipcMain.handle("window:set-startupopen-enabled", (_event, enabled: boolean) => {
    console.log(`[WindowHandlers] Setting setLoginItemSettings: openAtLogin ${enabled}`)
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath("exe")
    });
  })

  ipcMain.handle("window:is-tray-enabled", () => {
    let enabled = true;
    if (!settings.hasOwnProperty("trayEnabled")) {
      settings.trayEnabled = enabled;
    }
    if (typeof settings.trayEnabled === 'boolean') {
      enabled = settings.trayEnabled;
    }
    return enabled;
  })

  ipcMain.handle("window:set-tray-enabled", async (_event, enabled: boolean) => {
    settings.trayEnabled = enabled
    await fileManager.writeFile(SETTINGS_CONTEXT, { relativePath: SETTINGS_FILE }, JSON.stringify(settings, null, 2))
  })

  ipcMain.handle('window:minimize', () => {
    const win = getMainWindow()
    win?.minimize()
  })

  ipcMain.handle('window:close', () => {
    const win = getMainWindow()
    if (win) {
      if (settings.trayEnabled) {
        win.hide()
      } else {
        win.close()
        app.quit()
      }
    }
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
