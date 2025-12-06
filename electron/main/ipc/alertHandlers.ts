import { ipcMain } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'
import fileManager from '../fileManager'

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
}

interface AlertTemplate {
  id: string
  imageDataUrl?: string
  text: string
  duration: number
}

export function registerAlertHandlers(
  safeStore: SafeStorageWrapper | null,
  getAlertServer: () => AlertServer | null,
  setAlertServer: (server: AlertServer | null) => void,
  startAlertServer: (port: number) => Promise<AlertServer>,
  INTERNAL_SERVER_PORT: number
) {
  ipcMain.handle('alerts:broadcast', (_evt, payload) => {
    try {
      if (!payload || typeof payload !== 'object' || !('type' in payload)) {
        throw new Error('Invalid alert payload')
      }
      const alertServer = getAlertServer()
      const broadcaster = alertServer?.broadcast ?? (globalThis as any).alertBroadcast
      if (typeof broadcaster !== 'function') {
        throw new Error('Alert server not available')
      }
      broadcaster(payload)
      return { ok: true }
    } catch (err: any) {
      console.error('Failed to broadcast alert', err)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('alerts:get-port', () => {
    const alertServer = getAlertServer()
    const stored = safeStore?.get('alertServerPort') ?? null
    const portNum = stored ? Number(stored) : (alertServer?.port ?? INTERNAL_SERVER_PORT)
    return { port: portNum }
  })

  ipcMain.handle('alerts:set-port', async (_evt, port: number | string) => {
    try {
      const p = typeof port === 'string' ? Number(port) : port
      if (!Number.isFinite(p) || p <= 0 || p >= 65536) {
        throw new Error('Invalid port number')
      }
      await safeStore?.set('alertServerPort', String(p))
      return { ok: true, port: p, requiresRestart: true }
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Failed to set port' }
    }
  })

  ipcMain.handle('alerts:restart', async () => {
    try {
      console.debug('[AlertServer] restarting...')
      const configuredPortStr = safeStore?.get('alertServerPort') ?? null
      const configuredPort = configuredPortStr ? Number(configuredPortStr) : null
      const alertPort = configuredPort && configuredPort > 0 ? configuredPort : INTERNAL_SERVER_PORT

      const alertServer = getAlertServer()
      if (alertServer) {
        await alertServer.stop()
        setAlertServer(null)
      }
      const newServer = await startAlertServer(alertPort)
      setAlertServer(newServer)
      ;(globalThis as any).alertBroadcast = newServer.broadcast
      console.debug(`[AlertServer] restarted on http://localhost:${newServer.port}`)
      return { ok: true, port: newServer.port }
    } catch (err: any) {
      console.error('Failed to restart AlertServer', err)
      return { ok: false, error: err?.message ?? 'Restart failed' }
    }
  })

  ipcMain.handle('alerts:save-template', async (_evt, template: AlertTemplate) => {
    try {
      if (!template || !template.id) {
        throw new Error('Invalid template: missing id')
      }
      const templatePath = `templates/${template.id}.json`
      await fileManager.writeFile('alerts', templatePath, JSON.stringify(template, null, 2))
      console.debug('[AlertHandlers] Template saved:', template.id)
      return { ok: true }
    } catch (err: any) {
      console.error('[AlertHandlers] Failed to save template:', err)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('alerts:load-template', async (_evt, templateId: string) => {
    try {
      if (!templateId) {
        throw new Error('Template ID is required')
      }
      const templatePath = `templates/${templateId}.json`
      const exists = await fileManager.fileExists('alerts', templatePath)
      if (!exists) {
        console.debug('[AlertHandlers] Template not found:', templateId)
        return { ok: true, template: null }
      }
      const buf = await fileManager.readFile('alerts', templatePath)
      const template = JSON.parse(buf.toString()) as AlertTemplate
      console.debug('[AlertHandlers] Template loaded:', templateId)
      return { ok: true, template }
    } catch (err: any) {
      console.error('[AlertHandlers] Failed to load template:', err)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('chat:save-html', async (_evt, html: string, css: string, js: string) => {
    try {
      await fileManager.writeFile('chat', 'custom.html', html)
      await fileManager.writeFile('chat', 'custom.css', css)
      await fileManager.writeFile('chat', 'custom.js', js)
      console.debug('[ChatHandlers] Chat HTML/CSS/JS saved')
      return { ok: true }
    } catch (err: any) {
      console.error('[ChatHandlers] Failed to save chat HTML/CSS/JS:', err)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('chat:load-html', async () => {
    try {
      const htmlExists = await fileManager.fileExists('chat', 'custom.html')
      const cssExists = await fileManager.fileExists('chat', 'custom.css')
      const jsExists = await fileManager.fileExists('chat', 'custom.js')
      
      let html = '', css = '', js = ''
      
      if (htmlExists) {
        const buf = await fileManager.readFile('chat', 'custom.html')
        html = buf.toString()
      }
      if (cssExists) {
        const buf = await fileManager.readFile('chat', 'custom.css')
        css = buf.toString()
      }
      if (jsExists) {
        const buf = await fileManager.readFile('chat', 'custom.js')
        js = buf.toString()
      }
      
      console.debug('[ChatHandlers] Chat HTML/CSS/JS loaded')
      return { ok: true, html, css, js }
    } catch (err: any) {
      console.error('[ChatHandlers] Failed to load chat HTML/CSS/JS:', err)
      return { ok: false, error: err.message }
    }
  })
}
