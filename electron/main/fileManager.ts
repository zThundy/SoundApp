import { app } from 'electron';
import * as fs from 'node:fs';

let originalAppPath = app.getPath('userData');
if (!originalAppPath) originalAppPath = app.getAppPath();

class FileManager {
  constructor() {
    console.log("[FileManager] Initialized at path:", originalAppPath);
  }

  private initFileContext(context: string): string {
    let appPath = `${originalAppPath}/${context}`;
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }
    console.log("[FileManager] Initialized context at path:", appPath);
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

  readFile(context: string, relativePath: string): Promise<Buffer> {
    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${relativePath}`;
    this.createFolderAndSubfolders(fullPath);
    return fs.promises.readFile(fullPath);
  }

  writeFile(context: string, relativePath: string, data: Buffer | string): Promise<void> {
    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${relativePath}`;
    this.createFolderAndSubfolders(fullPath);
    return fs.promises.writeFile(fullPath, data);
  }

  deleteFile(context: string, relativePath: string): Promise<void> {
    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${relativePath}`;
    this.createFolderAndSubfolders(fullPath);
    return fs.promises.unlink(fullPath);
  }

  fileExists(context: string, relativePath: string): Promise<boolean> {
    let appPath = this.initFileContext(context);
    const fullPath = `${appPath}/${relativePath}`;
    this.createFolderAndSubfolders(fullPath);
    return fs.promises.access(fullPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }
};

export const fileManager = new FileManager();
export default fileManager;