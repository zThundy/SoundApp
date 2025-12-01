import { ipcMain, BrowserWindow } from 'electron';
import { TwitchEventListener } from '../twitchEventListener';

export const registerTwitchEventHandlers = (getEventListener: () => TwitchEventListener | null) => {
  ipcMain.handle('twitch-events:is-connected', async () => {
    const eventListener = getEventListener();
    return {
      connected: eventListener ? eventListener.isConnected() : false
    };
  });

  ipcMain.handle('twitch-events:get-cached-messages', async () => {
    const eventListener = getEventListener();
    if (!eventListener) {
      return { messages: [] };
    }
    return { messages: eventListener.getCachedMessages() };
  });

  ipcMain.handle('twitch-events:get-cached-redemptions', async () => {
    const eventListener = getEventListener();
    if (!eventListener) {
      return { redemptions: [] };
    }
    return { redemptions: eventListener.getCachedRedemptions() };
  });
};
