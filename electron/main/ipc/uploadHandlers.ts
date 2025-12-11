import { ipcMain } from 'electron'
import uploadManager from '../uploadManager'

export function registerUploadHandlers() {
  ipcMain.handle('upload:file', async (_evt, fileBuffer: Buffer | ArrayBuffer, originalFileName: string) => {
    try {
      console.log('[UploadHandler] Received upload request for file:', originalFileName)
      const buf = (fileBuffer instanceof ArrayBuffer)
        ? Buffer.from(new Uint8Array(fileBuffer))
        : fileBuffer
      const uuid = await uploadManager.uploadFile(buf as Buffer, originalFileName)
      return { ok: true, uuid }
    } catch (err: any) {
      console.error('[UploadHandler] Upload error:', err)
      return { ok: false, error: err?.message ?? 'Failed to upload file' }
    }
  })

  ipcMain.handle('upload:getFile', async (_evt, uuid: string) => {
    try {
      const buffer = await uploadManager.getFile(uuid)
      if (!buffer) {
        return { ok: false, error: 'File not found' }
      }
      return { ok: true, data: buffer }
    } catch (err: any) {
      console.error('[UploadHandler] Get file error:', err)
      return { ok: false, error: err?.message ?? 'Failed to retrieve file' }
    }
  })

  ipcMain.handle('upload:getMetadata', async (_evt, uuid: string) => {
    try {
      const metadata = uploadManager.getFileMetadata(uuid)
      if (!metadata) {
        return { ok: false, error: 'File not found' }
      }
      return { ok: true, metadata }
    } catch (err: any) {
      console.error('[UploadHandler] Get metadata error:', err)
      return { ok: false, error: err?.message ?? 'Failed to retrieve metadata' }
    }
  })

  ipcMain.handle('upload:deleteFile', async (_evt, uuid: string) => {
    try {
      const success = await uploadManager.deleteFile(uuid)
      return { ok: success, message: success ? 'File deleted' : 'File not found' }
    } catch (err: any) {
      console.error('[UploadHandler] Delete error:', err)
      return { ok: false, error: err?.message ?? 'Failed to delete file' }
    }
  })

  ipcMain.handle('upload:getAll', async (_evt) => {
    try {
      const files = uploadManager.getAllFiles()
      console.debug('[UploadHandler] Retrieved all files:', files)
      return { ok: true, files }
    } catch (err: any) {
      console.error('[UploadHandler] Get all error:', err)
      return { ok: false, error: err?.message ?? 'Failed to retrieve files' }
    }
  })

  ipcMain.handle('upload:getPath', async (_evt, uuid: string) => {
    try {
      const filePath = uploadManager.getFilePath(uuid)
      if (!filePath) {
        return { ok: false, error: 'File not found' }
      }
      return { ok: true, path: filePath }
    } catch (err: any) {
      console.error('[UploadHandler] Get path error:', err)
      return { ok: false, error: err?.message ?? 'Failed to retrieve path' }
    }
  })
}
