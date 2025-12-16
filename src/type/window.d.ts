export { }

interface FileMapping {
  uuid: string
  originalName: string
  storagePath: string
  context: string
  uploadedAt: number
  userReadable: boolean
}

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

    version: string;
    appVersion: string;
    ipcRenderer: {
      invoke(channel: string, ...args: any[]): Promise<any>;
      on(channel: string, listener: (event: any, ...args: any[]) => void): void;
      off(channel: string, listener: (event: any, ...args: any[]) => void): void;
    }
  }
}

