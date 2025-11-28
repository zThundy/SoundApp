import { ipcMain, BrowserWindow } from 'electron';
import { TwitchEventListener } from '../twitchEventListener';

// Questo listener è condiviso con twitchHandlers.ts
// Non creare una nuova istanza qui
export const registerTwitchEventHandlers = (getEventListener: () => TwitchEventListener | null) => {
  // Controlla lo stato della connessione
  ipcMain.handle('twitch-events:is-connected', async () => {
    const eventListener = getEventListener();
    return {
      connected: eventListener ? eventListener.isConnected() : false
    };
  });

  // Ottieni i messaggi dalla cache
  ipcMain.handle('twitch-events:get-cached-messages', async () => {
    const eventListener = getEventListener();
    if (!eventListener) {
      return { messages: [] };
    }
    return { messages: eventListener.getCachedMessages() };
  });

  // Ottieni i redeem dalla cache
  ipcMain.handle('twitch-events:get-cached-redemptions', async () => {
    const eventListener = getEventListener();
    if (!eventListener) {
      return { redemptions: [] };
    }
    return { redemptions: eventListener.getCachedRedemptions() };
  });

  // Gli handler connect e disconnect non servono più
  // perché la connessione avviene automaticamente al login in twitchHandlers.ts
};
