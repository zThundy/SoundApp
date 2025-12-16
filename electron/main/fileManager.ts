import { app } from 'electron';
import * as fs from 'node:fs';

interface FileMapping {
  uuid: string
  originalName: string
  storagePath: string
  context: string
  uploadedAt: number
  userReadable: boolean
}

let originalAppPath = app.getPath('userData');
if (!originalAppPath) originalAppPath = app.getAppPath();

class FileManager {
  private filesContext: string = 'files';
  private fileRegistry: Map<string, FileMapping> = new Map()
  private readonly registryFile = 'registry.json'

  constructor() {
    this.loadRegistry()
    console.debug("[FileManager] Initialized at path:", originalAppPath);
  }

  private loadRegistry(): void {
    try {
      console.debug(`[FileManager] Attempting reading fileRegistry from path ${originalAppPath}/${this.filesContext}/${this.registryFile}`)
      const data = fs.readFileSync(`${originalAppPath}/${this.filesContext}/${this.registryFile}`, "utf-8")
      console.debug(`[FileManager] Read fileRegistry. Full data dump: ${data}`)
      if (data && data.trim().length > 0) {
        const registry = JSON.parse(data) as Record<string, FileMapping>
        this.fileRegistry = new Map(Object.entries(registry))
      } else {
        this.fileRegistry = new Map()
      }
      console.debug('[FileManager] Registry loaded with', this.fileRegistry.size, 'entries')
    } catch (err) {
      console.warn('[FileManager] Failed to load registry:', err)
      this.fileRegistry = new Map()
    }
  }

  private saveRegistry(): void {
    try {
      const registry = Object.fromEntries(this.fileRegistry)
      const data = JSON.stringify(registry, null, 2)
      fs.writeFileSync(`${originalAppPath}/${this.filesContext}/${this.registryFile}`, data)
      console.debug(`[FileManager] Registry saved successfully on path ${originalAppPath}/${this.filesContext}/${this.registryFile}. Data: ${data.length}`)
    } catch (err) {
      console.error('[FileManager] Failed to save registry:', err)
    }
  }

  private uuid4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private initFileContext(context: string): string {
    let appPath = `${originalAppPath}/${context}`;
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }
    console.debug("[FileManager] Initialized context at path:", appPath);
    return appPath;
  }

  private doesFolderAndSubfoldersExist(path: string): boolean {
    try {
      fs.accessSync(path, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private createFolderAndSubfolders(path: string): void {
    if (!this.doesFolderAndSubfoldersExist(path)) {
      // remove filename from path
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private doesFileExist(path: string): boolean {
    try {
      fs.accessSync(path, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private createFileIfNotExists(path: string): void {
    if (!this.doesFileExist(path)) {
      fs.writeFileSync(path, '');
    }
  }

  readFileMetadata(options: { uuid?: string, relativePath?: string }): FileMapping | undefined {
    console.debug("[FileManager] readFileMetadata: checking file metadata existence with provided options", JSON.stringify(options))
    if (options.uuid) {
      console.debug("[FileManager] readFileMetadata: returning file metadata from uuid");
      return this.fileRegistry.get(options.uuid)
    }

    for (let k of this.fileRegistry.keys()) {
      const file = this.fileRegistry.get(k);
      console.debug("[FileManager] readFileMetadata: got file data from key", k, JSON.stringify(file))
      if (file?.storagePath === options.relativePath) {
        console.debug("[FileManager] readFileMetadata: returning file metadata from relativePath")
        return file;
      }
    }

    console.debug("[FileManager] readFileMetadata: returning undefined.")
    return undefined;
  }

  async writeFile(context: string, options: { relativePath: string, uuid?: string }, data: Buffer | string, userReadable: boolean = false): Promise<{ uuid: string, promise: Promise<void> }> {
    console.debug("[FileManager] Writing file with options", JSON.stringify(options), "user readable", userReadable)
    let fileMetadata: FileMapping | undefined = this.readFileMetadata(options);
    const fileName = options.relativePath.substring(options.relativePath.lastIndexOf('/') + 1);

    // handle registry save if file is not in registry
    if (!fileMetadata || fileMetadata === undefined) {
      options.uuid = this.uuid4();
      fileMetadata = { context, uuid: options.uuid, originalName: fileName, storagePath: options.relativePath, uploadedAt: Date.now(), userReadable }
      this.fileRegistry.set(options.uuid, fileMetadata);
      this.saveRegistry();
    } else {
      options.uuid = fileMetadata.uuid;
    }

    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${fileMetadata.storagePath}`;
    this.createFolderAndSubfolders(fullPath);
    this.createFileIfNotExists(fullPath);
    return { uuid: options.uuid!, promise: fs.promises.writeFile(fullPath, data) };
  }

  readFile(context: string, options: { relativePath?: string, uuid?: string }): { meta: FileMapping | undefined, buffer: Promise<Buffer> } {
    let appPath = this.initFileContext(context);

    let fileMetadata: FileMapping | undefined = this.readFileMetadata(options);
    if (!fileMetadata || fileMetadata === undefined) throw new Error("[FileManager] Unable to read file, no metadata found. Options: " + JSON.stringify(options));

    const fullPath = `${appPath}/${fileMetadata.storagePath}`;
    this.createFolderAndSubfolders(fullPath);
    this.createFileIfNotExists(fullPath);
    return { meta: fileMetadata, buffer: fs.promises.readFile(fullPath) };
  }

  async deleteFile(context: string, options: { relativePath?: string, uuid?: string }): Promise<void> {
    let appPath = this.initFileContext(context);

    let fileMetadata: FileMapping | undefined = this.readFileMetadata(options);
    if (!fileMetadata || fileMetadata === undefined) throw new Error("[FileManager] Unable to delete file, no metadata found. Options: " + JSON.stringify(options));

    const fullPath = `${appPath}/${fileMetadata.storagePath}`;
    this.createFolderAndSubfolders(fullPath);
    // idk why, but i'm putting this here to avoid annoying errors
    this.createFileIfNotExists(fullPath);

    const uuid = fileMetadata.uuid;
    this.fileRegistry.delete(uuid);
    this.saveRegistry();
    return fs.promises.unlink(fullPath);
  }

  async fileExists(context: string, options: { relativePath?: string, uuid?: string }): Promise<boolean> {
    console.debug(`[FileManager] Checking if file with options ${JSON.stringify(options)} exists`);
    let appPath = this.initFileContext(context);

    let fileMetadata: FileMapping | undefined = this.readFileMetadata(options);
    if (!fileMetadata || fileMetadata === undefined) {
      console.warn("[FileManager] Unable to check if the file exists from metadata (Maybe file does not exists?). Options: " + JSON.stringify(options));
      return Promise.resolve(false);
    }

    const fullPath = `${appPath}/${fileMetadata.storagePath}`;
    this.createFolderAndSubfolders(fullPath);
    return fs.promises.access(fullPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  doesContextExist(context: string): boolean {
    let appPath = this.initFileContext(context);
    return this.doesFolderAndSubfoldersExist(appPath);
  }

  folderExists(context: string, relativePath: string): boolean {
    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${relativePath}`;
    return this.doesFolderAndSubfoldersExist(fullPath);
  }

  getAllUserReadableFilesMetadata(): Map<string, FileMapping> {
    let toReturn = new Map<string, FileMapping>()

    for (var i in this.fileRegistry) {
      const file = this.fileRegistry.get(i);
      if (file?.userReadable) {
        toReturn.set(file.uuid, file);
      }
    }

    return toReturn
  }
};

export const fileManager = new FileManager();
export default fileManager;