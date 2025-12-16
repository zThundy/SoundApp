import { ipcMain } from 'electron'
import fileManager from '../fileManager'

export function registerFileHandlers() {
  ipcMain.handle('file:save', async (_evt, context: string, relativePath: string, content: string | Buffer, userReadable) => {
    try {
      await fileManager.writeFile(context, { relativePath }, content, userReadable)
      return { ok: true }
    } catch (err: any) {
      console.error('[FileManager] Save error:', err)
      return { ok: false, error: err?.message ?? 'Failed to save file' }
    }
  })

  ipcMain.handle('file:read', async (_evt, context: string, options: { relativePath?: string, uuid?: string }, asText: boolean = true) => {
    try {
      const buffer = await fileManager.readFile(context, options)
      const data = asText ? buffer.toString('utf-8') : buffer
      return { ok: true, data }
    } catch (err: any) {
      console.error('[FileManager] Read error:', err)
      return { ok: false, error: err?.message ?? 'Failed to read file' }
    }
  })

  ipcMain.handle('file:delete', async (_evt, context: string, options: { relativePath?: string, uuid?: string }) => {
    try {
      await fileManager.deleteFile(context, options)
      return { ok: true }
    } catch (err: any) {
      console.error('[FileManager] Delete error:', err)
      return { ok: false, error: err?.message ?? 'Failed to delete file' }
    }
  })

  ipcMain.handle('file:exists', async (_evt, context: string, options: { relativePath?: string, uuid?: string }) => {
    try {
      const exists = await fileManager.fileExists(context, options)
      return { ok: true, exists }
    } catch (err: any) {
      console.error('[FileManager] Exists check error:', err)
      return { ok: false, error: err?.message ?? 'Failed to check file existence' }
    }
  })

  ipcMain.handle("file:getAll", async () => {
    try {
      return { ok: true, data: fileManager.getAllUserReadableFilesMetadata() }
    } catch (err: any) {
      console.error("[FileManager] Unable to get all user readable files", err)
      return { ok: false, error: err?.message ?? "Unable to get all user readable files" }
    }
  })
}
