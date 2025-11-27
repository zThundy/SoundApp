import { ipcMain } from 'electron'
import SafeStorageWrapper from '../safeStorageWrapper'

export function registerSafeStoreHandlers(safeStore: SafeStorageWrapper | null) {
  ipcMain.handle('safe-store:set', async (_evt, key: string, value: string) => {
    if (!safeStore) return false
    return safeStore.set(key, value)
  })

  ipcMain.handle('safe-store:get', async (_evt, key: string) => {
    console.log('IPC safe-store:get for key:', key)
    if (!safeStore) return null
    const value = safeStore.get(key)
    console.log('Retrieved value:', value)
    return value
  })

  ipcMain.handle('safe-store:remove', (_evt, key: string) => {
    if (!safeStore) return false
    return safeStore.remove(key)
  })

  ipcMain.handle('safe-store:has', (_evt, key: string) => {
    if (!safeStore) return false
    return safeStore.has(key)
  })

  ipcMain.handle('safe-store:clear', (_evt) => {
    if (!safeStore) return false
    return safeStore.clear()
  })
}
