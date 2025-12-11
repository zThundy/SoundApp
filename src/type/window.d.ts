export {}

declare global {
  interface Window {
    alerts: {
      broadcast(payload: any): Promise<{ ok: boolean; error?: string }>;
      getPort(): Promise<{ port: number }>;
      setPort(port: number): Promise<{ ok: boolean; port?: number; requiresRestart?: boolean; error?: string }>;
      restart(): Promise<{ ok: boolean; port?: number; error?: string }>;
      saveTemplate(template: { id: string; imageDataUrl?: string; text: string; duration: number }): Promise<{ ok: boolean; error?: string }>;
      loadTemplate(templateId: string): Promise<{ ok: boolean; template?: { id: string; imageDataUrl?: string; text: string; duration: number } | null; error?: string }>;
    }

    chat: {
      saveHtml(html: string, css: string, js: string): Promise<{ ok: boolean; error?: string }>;
      loadHtml(): Promise<{ ok: boolean; html?: string; css?: string; js?: string; error?: string }>;
    }

    uploadManager: {
      uploadFile(fileBuffer: ArrayBuffer, originalFileName: string): Promise<{ ok: boolean; uuid?: string; error?: string }>;
      getFile(uuid: string): Promise<{ ok: boolean; data?: Buffer; error?: string }>;
      getMetadata(uuid: string): Promise<{ ok: boolean; metadata?: { uuid: string; originalName: string; storagePath: string; uploadedAt: number }; error?: string }>;
      deleteFile(uuid: string): Promise<{ ok: boolean; message?: string; error?: string }>;
      getAll(): Promise<{ ok: boolean; files?: Array<{ uuid: string; originalName: string; storagePath: string; uploadedAt: number }>; error?: string }>;
      getPath(uuid: string): Promise<{ ok: boolean; path?: string; error?: string }>;
    }

    version: string;
    appVersion: string;
    ipcRenderer: {
      invoke(channel: string, ...args: any[]): Promise<any>;
      on(channel: string, listener: (event: any, ...args: any[]) => void): void;
      off(channel: string, listener: (event: any, ...args: any[]) => void): void;
    }
  }
}

