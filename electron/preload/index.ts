import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld("windowManager", {
  isMaximaized: () => ipcRenderer.invoke('window:is-maximized'),
  onWindowMaximize: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.send('window:register-maximize-listener');
    ipcRenderer.on('window:is-maximized', (_event, isMaximized: boolean) => {
      callback(isMaximized);
    });
  },
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close'),
});

// Expose a small safeStore API that calls the main-process SafeStorageService
contextBridge.exposeInMainWorld('safeStore', {
  setItem(key: string, value: string) {
    return ipcRenderer.invoke('safe-store:set', key, value)
  },
  getItem(key: string) {
    return ipcRenderer.invoke('safe-store:get', key)
  },
  removeItem(key: string) {
    return ipcRenderer.invoke('safe-store:remove', key)
  },
  hasItem(key: string) {
    return ipcRenderer.invoke('safe-store:has', key)
  },
  clear() {
    return ipcRenderer.invoke('safe-store:clear')
  },
})

// Alerts API for broadcasting custom alerts to OBS page
contextBridge.exposeInMainWorld('alerts', {
  broadcast(payload: any) {
    return ipcRenderer.invoke('alerts:broadcast', payload)
  },
  getPort() {
    return ipcRenderer.invoke('alerts:get-port')
  },
  setPort(port: number) {
    return ipcRenderer.invoke('alerts:set-port', port)
  },
  restart() {
    return ipcRenderer.invoke('alerts:restart')
  },
  saveTemplate(template: { id: string; imageDataUrl?: string; text: string; duration: number }) {
    return ipcRenderer.invoke('alerts:save-template', template)
  },
  loadTemplate(templateId: string) {
    return ipcRenderer.invoke('alerts:load-template', templateId)
  }
})

contextBridge.exposeInMainWorld('chat', {
  saveHtml(html: string, css: string, js: string) {
    return ipcRenderer.invoke('chat:save-html', html, css, js)
  },
  loadHtml() {
    return ipcRenderer.invoke('chat:load-html')
  }
})

// File management API for saving/reading files in userData
contextBridge.exposeInMainWorld('fileManager', {
  save(context: string, relativePath: string, content: string | Buffer) {
    return ipcRenderer.invoke('file:save', context, relativePath, content)
  },
  read(context: string, relativePath: string, asText: boolean = true) {
    return ipcRenderer.invoke('file:read', context, relativePath, asText)
  },
  delete(context: string, relativePath: string) {
    return ipcRenderer.invoke('file:delete', context, relativePath)
  },
  exists(context: string, relativePath: string) {
    return ipcRenderer.invoke('file:exists', context, relativePath)
  }
})

// Language management API
contextBridge.exposeInMainWorld('languageManager', {
  getLanguage() {
    return ipcRenderer.invoke('language:get')
  },
  setLanguage(language: string) {
    return ipcRenderer.invoke('language:set', language)
  }
})

// Twitch Events API for real-time chat and redemptions
contextBridge.exposeInMainWorld('twitchEvents', {
  connect(accessToken: string, broadcasterId: string, clientId: string) {
    return ipcRenderer.invoke('twitch-events:connect', { accessToken, broadcasterId, clientId })
  },
  disconnect() {
    return ipcRenderer.invoke('twitch-events:disconnect')
  },
  isConnected() {
    return ipcRenderer.invoke('twitch-events:is-connected')
  },
  getCachedMessages() {
    return ipcRenderer.invoke('twitch-events:get-cached-messages')
  },
  getCachedRedemptions() {
    return ipcRenderer.invoke('twitch-events:get-cached-redemptions')
  },
  onChatMessage(callback: (message: any) => void) {
    ipcRenderer.on('twitch:chat-message', (_event, message) => callback(message))
  },
  onRewardRedeemed(callback: (redemption: any) => void) {
    ipcRenderer.on('twitch:reward-redeemed', (_event, redemption) => callback(redemption))
  },
  removeChatMessageListener() {
    ipcRenderer.removeAllListeners('twitch:chat-message')
  },
  removeRewardRedeemedListener() {
    ipcRenderer.removeAllListeners('twitch:reward-redeemed')
  }
})

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% {
    transform: perspective(100px) rotateX(180deg) rotateY(0);
  }
  50% {
    transform: perspective(100px) rotateX(180deg) rotateY(180deg);
  }
  75% {
    transform: perspective(100px) rotateX(0) rotateY(180deg);
  }
  100% {
    transform: perspective(100px) rotateX(0) rotateY(0);
  }
}
@keyframes logo-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.8);
  }
}
.${className} > div {
  animation-fill-mode: both;
  width: 8rem;
  height: 8rem;
  animation: logo-bounce 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(225, 40%, 10%); // --mui-palette-background-900
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `
<div class="${className}">
  <div>
    <img src="logo.png" alt="Loading" style="width:100%;height:100%;object-fit:contain;" />
  </div>
</div>
  `

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 60 * 1000) // Fallback: remove loading after 60s