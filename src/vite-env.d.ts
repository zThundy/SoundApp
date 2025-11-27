/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  
  safeStore: {
    setItem(key: string, value: string): Promise<boolean>
    getItem(key: string): Promise<string | null>
    removeItem(key: string): Promise<boolean>
    hasItem(key: string): Promise<boolean>
    clear(): Promise<boolean>
  }

  alerts: {
    broadcast(payload: any): Promise<{ ok: boolean; error?: string }>
    getPort(): Promise<{ port: number }>
    setPort(port: number): Promise<{ ok: boolean; port?: number; requiresRestart?: boolean; error?: string }>
    restart(): Promise<{ ok: boolean; port?: number; error?: string }>
  }

  fileManager: {
    save(context: string, relativePath: string, content: string | Buffer): Promise<{ ok: boolean; error?: string }>
    read(context: string, relativePath: string, asText?: boolean): Promise<{ ok: boolean; data?: string | Buffer; error?: string }>
    delete(context: string, relativePath: string): Promise<{ ok: boolean; error?: string }>
    exists(context: string, relativePath: string): Promise<{ ok: boolean; exists?: boolean; error?: string }>
  }
}
