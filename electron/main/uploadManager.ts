import { app } from 'electron'
import * as path from 'node:path'
import fileManager from './fileManager'

interface FileMapping {
  uuid: string
  originalName: string
  storagePath: string
  uploadedAt: number
}

class UploadManager {
  private fileRegistry: Map<string, FileMapping> = new Map()
  private readonly context = 'uploads'
  private readonly registryFile = 'registry.json'

  constructor() {
    let appPath = app.getPath('userData')
    if (!appPath) appPath = app.getAppPath()

    this.loadRegistry().catch(err => console.warn('[UploadManager] Async registry load failed:', err))
    console.debug('[UploadManager] Initialized with context:', this.context)
  }

  private uuid4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private async loadRegistry(): Promise<void> {
    try {
      const buffer = await fileManager.readFile(this.context, this.registryFile)
      const data = buffer.toString('utf-8')
      if (data && data.trim().length > 0) {
        const registry = JSON.parse(data) as Record<string, FileMapping>
        this.fileRegistry = new Map(Object.entries(registry))
      } else {
        this.fileRegistry = new Map()
      }
      console.debug('[UploadManager] Registry loaded with', this.fileRegistry.size, 'entries')
    } catch (err) {
      console.warn('[UploadManager] Failed to load registry:', err)
      this.fileRegistry = new Map()
    }
  }

  private async saveRegistry(): Promise<void> {
    try {
      const registry = Object.fromEntries(this.fileRegistry)
      const data = JSON.stringify(registry, null, 2)
      await fileManager.writeFile(this.context, this.registryFile, data)
    } catch (err) {
      console.error('[UploadManager] Failed to save registry:', err)
    }
  }

  async uploadFile(fileBuffer: Buffer, originalFileName: string): Promise<string> {
    const uuid = this.uuid4()
    const ext = path.extname(originalFileName)
    const storagePath = `${uuid}${ext}`

    await fileManager.writeFile(this.context, storagePath, fileBuffer)

    const mapping: FileMapping = {
      uuid,
      originalName: originalFileName,
      storagePath,
      uploadedAt: Date.now(),
    }

    this.fileRegistry.set(uuid, mapping)
    await this.saveRegistry()

    console.debug('[UploadManager] File uploaded with UUID:', uuid)
    return uuid
  }

  async getFile(uuid: string): Promise<Buffer | null> {
    const mapping = this.fileRegistry.get(uuid)
    if (!mapping) {
      console.warn('[UploadManager] File not found for UUID:', uuid)
      return null
    }

    try {
      const buffer = await fileManager.readFile(this.context, mapping.storagePath)
      return buffer
    } catch (err) {
      console.error('[UploadManager] Failed to read file:', err)
      return null
    }
  }

  getFilePath(uuid: string): string | null {
    const mapping = this.fileRegistry.get(uuid)
    if (!mapping) {
      return null
    }
    return mapping.storagePath
  }

  getFileMetadata(uuid: string): FileMapping | null {
    return this.fileRegistry.get(uuid) || null
  }

  async deleteFile(uuid: string): Promise<boolean> {
    const mapping = this.fileRegistry.get(uuid)
    if (!mapping) {
      return false
    }

    try {
      await fileManager.deleteFile(this.context, mapping.storagePath)
      this.fileRegistry.delete(uuid)
      this.saveRegistry()
      console.debug('[UploadManager] File deleted for UUID:', uuid)
      return true
    } catch (err) {
      console.error('[UploadManager] Failed to delete file:', err)
      return false
    }
  }

  getAllFiles(): FileMapping[] {
    console.log(this.fileRegistry)
    const array = Array.from(this.fileRegistry.values())
    console.debug('[UploadManager] getAllFiles returning', array.length, 'files')
    return array
  }
}

export const uploadManager = new UploadManager()
export default uploadManager
