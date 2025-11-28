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
    };
  }
}
