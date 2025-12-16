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
    loadTemplate(templateId: string): Promise<{ ok: boolean; template?: { id: string; imageDataUrl?: string; text: string; duration: number } | null; error?: string }>;
    saveTemplate(template: { id: string; imageDataUrl?: string; text: string; duration: number }): Promise<{ ok: boolean; error?: string }>;
  }

  fileManager: {
    save(context: string, relativePath: string, content: string | Buffer, userReadable?: boolean): Promise<{ ok: boolean; error?: string }>;
    read(context: string, options: { relativePath?: string, uuid?: string }, asText: boolean): Promise<{ ok: boolean; data?: string | Buffer; error?: string }>
    delete(context: string, options: { relativePath?: string, uuid?: string }): Promise<{ ok: boolean; error?: string }>;
    exists(context: string, options: { relativePath?: string, uuid?: string }): Promise<{ ok: boolean; exists?: boolean; error?: string }>
    getAll(): Promise<{ ok: boolean; error?: string, data?: Map<string, FileMapping> }>;
  }

  languageManager: {
    getLanguage(): Promise<string>
    setLanguage(language: string): Promise<boolean>
  }

  twitchEvents: {
    connect(accessToken: string, broadcasterId: string, clientId: string): Promise<{ success: boolean; error?: string }>
    disconnect(): Promise<{ success: boolean; error?: string }>
    isConnected(): Promise<{ connected: boolean }>
    getCachedMessages(): Promise<{ messages: ChatMessage[] }>
    getCachedRedemptions(): Promise<{ redemptions: RewardRedemption[] }>
    onChatMessage(callback: (message: ChatMessage) => void): void
    onRewardRedeemed(callback: (redemption: RewardRedemption) => void): void
    removeChatMessageListener(): void
    removeRewardRedeemedListener(): void
  }

  windowManager: {
    isMaximaized(): Promise<boolean>;
    onWindowMaximize(callback: (isMaximized: boolean) => void): void;
    minimize(): Promise<void>;
    toggleMaximize(): Promise<boolean>;
    close(): Promise<void>;
    isTrayEnabled(): Promise<boolean>;
    setTrayEnabled(enabled: boolean): Promise<void>;
  }
}

interface ChatMessage {
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: Date
  color?: string
  badges?: string[]
}

interface RewardRedemption {
  id: string
  userId: string
  username: string
  userDisplayName: string
  rewardId: string
  rewardTitle: string
  rewardCost: number
  userInput?: string
  timestamp: Date
  status: 'unfulfilled' | 'fulfilled' | 'canceled'
}
