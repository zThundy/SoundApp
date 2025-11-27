import { ipcMain } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
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
      console.log('[AlertServer] restarting...')
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
      console.log(`[AlertServer] restarted on http://localhost:${newServer.port}`)
      return { ok: true, port: newServer.port }
    } catch (err: any) {
      console.error('Failed to restart AlertServer', err)
      return { ok: false, error: err?.message ?? 'Restart failed' }
    }
  })
}
