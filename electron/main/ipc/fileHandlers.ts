import { ipcMain } from 'electron'
import fileManager from '../fileManager'

export function registerFileHandlers() {
  ipcMain.handle('file:save', async (_evt, context: string, relativePath: string, content: string | Buffer) => {
    try {
      await fileManager.writeFile(context, relativePath, content)
      return { ok: true }
    } catch (err: any) {
      console.error('[FileManager] Save error:', err)
      return { ok: false, error: err?.message ?? 'Failed to save file' }
    }
  })

  ipcMain.handle('file:read', async (_evt, context: string, relativePath: string, asText: boolean = true) => {
    try {
      const buffer = await fileManager.readFile(context, relativePath)
      const data = asText ? buffer.toString('utf-8') : buffer
      return { ok: true, data }
    } catch (err: any) {
      console.error('[FileManager] Read error:', err)
      return { ok: false, error: err?.message ?? 'Failed to read file' }
    }
  })

  ipcMain.handle('file:delete', async (_evt, context: string, relativePath: string) => {
    try {
      await fileManager.deleteFile(context, relativePath)
      return { ok: true }
    } catch (err: any) {
      console.error('[FileManager] Delete error:', err)
      return { ok: false, error: err?.message ?? 'Failed to delete file' }
    }
  })

  ipcMain.handle('file:exists', async (_evt, context: string, relativePath: string) => {
    try {
      const exists = await fileManager.fileExists(context, relativePath)
      return { ok: true, exists }
    } catch (err: any) {
      console.error('[FileManager] Exists check error:', err)
      return { ok: false, error: err?.message ?? 'Failed to check file existence' }
    }
  })
}
