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
    updater: {
      onUpdateCheckStart(callback: () => void): void;
      onUpdateAvailable(callback: (info: { version: string }) => void): void;
      onUpdateNotAvailable(callback: () => void): void;
      onDownloadProgress(callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): void;
      onUpdateDownloaded(callback: () => void): void;
      onUpdateError(callback: (error: { message: string }) => void): void;
      installUpdate(): Promise<void>;
    };
  }
}
