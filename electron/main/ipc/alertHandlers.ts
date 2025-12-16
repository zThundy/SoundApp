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

  const UUID_PATTERN = /\{([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\}/g

  function extnameFromPath(p?: string | null): string {
    if (!p) return ''
    const idx = p.lastIndexOf('.')
    return idx >= 0 ? p.slice(idx).toLowerCase() : ''
  }

  function isTextExt(ext: string): boolean {
    return ['.txt', '.html', '.htm', '.css', '.js', '.json', '.svg', '.md'].includes(ext)
  }

  function mimeFromExt(ext: string): string {
    switch (ext) {
      case '.png': return 'image/png'
      case '.jpg':
      case '.jpeg': return 'image/jpeg'
      case '.gif': return 'image/gif'
      case '.webp': return 'image/webp'
      case '.svg': return 'image/svg+xml'
      case '.mp3': return 'audio/mpeg'
      case '.wav': return 'audio/wav'
      case '.ogg': return 'audio/ogg'
      case '.mp4': return 'video/mp4'
      case '.webm': return 'video/webm'
      case '.txt': return 'text/plain; charset=utf-8'
      case '.css': return 'text/css; charset=utf-8'
      case '.js': return 'text/javascript; charset=utf-8'
      case '.json': return 'application/json; charset=utf-8'
      case '.html':
      case '.htm': return 'text/html; charset=utf-8'
      default: return 'application/octet-stream'
    }
  }

  async function replaceUuidPlaceholders(input: string): Promise<string> {
    if (!input || typeof input !== 'string') return input
    const uuids = new Set<string>()
    input.replace(UUID_PATTERN, (_m, g1) => { uuids.add(String(g1).toLowerCase()); return '' })
    if (uuids.size === 0) return input

    let output = input
    for (const uuid of uuids) {
      try {
        const meta = fileManager.readFileMetadata({ uuid })
        if (!meta) throw new Error("[AlertHandlers] Unable to get file meta");
        const ext = extnameFromPath(meta?.storagePath || meta?.originalName || '')
        const buf = await fileManager.readFile(meta.context, { uuid })
        if (!buf) continue

        if (isTextExt(ext)) {
          const text = buf.toString('utf-8')
          const re = new RegExp(`\\{${uuid}\\}`, 'gi')
          output = output.replace(re, () => text)
        } else {
          const mime = mimeFromExt(ext)
          const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
          const re = new RegExp(`\\{${uuid}\\}`, 'gi')
          output = output.replace(re, () => dataUrl)
        }
      } catch (e) {
        console.warn('[AlertHandlers] Failed to replace UUID', uuid, e)
      }
    }
    return output
  }
  ipcMain.handle('alerts:broadcast', async (_evt, payload) => {
    try {
      if (!payload || typeof payload !== 'object' || !('type' in payload)) {
        throw new Error('Invalid alert payload')
      }
      const alertServer = getAlertServer()
      const broadcaster = alertServer?.broadcast ?? (globalThis as any).alertBroadcast
      if (typeof broadcaster !== 'function') {
        throw new Error('Alert server not available')
      }
      // If it's a raw payload, resolve UUID placeholders in its fields
      if (payload.type === 'raw') {
        if (typeof payload.html === 'string') payload.html = await replaceUuidPlaceholders(payload.html)
        if (typeof payload.css === 'string') payload.css = await replaceUuidPlaceholders(payload.css)
        if (typeof payload.js === 'string') payload.js = await replaceUuidPlaceholders(payload.js)
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
      console.debug('[AlertHandlers] restarting...')
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
        ; (globalThis as any).alertBroadcast = newServer.broadcast
      console.debug(`[AlertHandlers] restarted on http://localhost:${newServer.port}`)
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
      await fileManager.writeFile('alerts', { relativePath: templatePath }, JSON.stringify(template, null, 2))
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
      const exists = await fileManager.fileExists('alerts', { relativePath: templatePath })
      if (!exists) {
        console.debug('[AlertHandlers] Template not found:', templateId)
        return { ok: true, template: null }
      }
      const buf = await fileManager.readFile('alerts', { relativePath: templatePath })
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
      // Save as-is with UUID placeholders intact; replacement happens during rendering
      await fileManager.writeFile('chat', { relativePath: 'custom.html' }, html)
      await fileManager.writeFile('chat', { relativePath: 'custom.css' }, css)
      await fileManager.writeFile('chat', { relativePath: 'custom.js' }, js)
      console.debug('[ChatHandlers] Chat HTML/CSS/JS saved (with UUID placeholders preserved)')
      return { ok: true }
    } catch (err: any) {
      console.error('[ChatHandlers] Failed to save chat HTML/CSS/JS:', err)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('chat:load-html', async () => {
    try {
      const htmlExists = await fileManager.fileExists('chat', { relativePath: 'custom.html' })
      const cssExists = await fileManager.fileExists('chat', { relativePath: 'custom.css' })
      const jsExists = await fileManager.fileExists('chat', { relativePath: 'custom.js' })

      let html = '', css = '', js = ''

      if (htmlExists) {
        const buf = await fileManager.readFile('chat', { relativePath: 'custom.html' })
        html = buf.toString()
      }
      if (cssExists) {
        const buf = await fileManager.readFile('chat', { relativePath: 'custom.css' })
        css = buf.toString()
      }
      if (jsExists) {
        const buf = await fileManager.readFile('chat', { relativePath: 'custom.js' })
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
