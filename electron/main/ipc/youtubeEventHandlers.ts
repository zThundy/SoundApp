import { ipcMain } from 'electron'
import { YouTubeChatListener } from '../youtubeChatListener'

export const registerYouTubeEventHandlers = (getEventListener: () => YouTubeChatListener | null) => {
  ipcMain.handle('youtube-events:is-connected', async () => {
    const eventListener = getEventListener()
    return {
      connected: eventListener ? eventListener.isConnected() : false
    }
  })

  ipcMain.handle('youtube-events:get-cached-messages', async () => {
    const eventListener = getEventListener()
    return {
      messages: eventListener ? eventListener.getCachedMessages() : []
    }
  })
}