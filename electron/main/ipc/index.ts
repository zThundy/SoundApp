import { BrowserWindow } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'
import { registerWindowHandlers } from './windowHandlers'
import { registerSafeStoreHandlers } from './safeStoreHandlers'
import { registerTwitchHandlers } from './twitchHandlers'
import { registerAlertHandlers } from './alertHandlers'
import { registerFileHandlers } from './fileHandlers'
import { registerMiscHandlers } from './miscHandlers'

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
}

export interface IPCContext {
  getMainWindow: () => BrowserWindow | null
  safeStore: SafeStorageWrapper | null
  getAlertServer: () => AlertServer | null
  setAlertServer: (server: AlertServer | null) => void
  startAlertServer: (port: number) => Promise<AlertServer>
  INTERNAL_SERVER_PORT: number
  VITE_DEV_SERVER_URL: string | undefined
  indexHtml: string
  preload: string
}

export function registerAllIPCHandlers(context: IPCContext) {
  registerWindowHandlers(context.getMainWindow)
  registerSafeStoreHandlers(context.safeStore)
  registerTwitchHandlers(context.safeStore)
  registerAlertHandlers(
    context.safeStore,
    context.getAlertServer,
    context.setAlertServer,
    context.startAlertServer,
    context.INTERNAL_SERVER_PORT
  )
  registerFileHandlers()
  registerMiscHandlers(
    context.getMainWindow,
    context.VITE_DEV_SERVER_URL,
    context.indexHtml,
    context.preload
  )
}
