import { useEffect, useState } from 'react'
import style from './titleBar.module.css'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Query initial maximize state
    ; (async () => {
      try {
        const res = await window.ipcRenderer.invoke('window:is-maximized')
        setIsMaximized(Boolean(res))
      } catch (e) {
        // ignore if ipc not available (e.g., storybook / test)
      }
    })()
  }, [])

  const minimize = () => window.ipcRenderer?.invoke?.('window:minimize')

  const toggleMaximize = async () => {
    try {
      const nowMax = await window.ipcRenderer.invoke('window:toggle-maximize')
      setIsMaximized(Boolean(nowMax))
    } catch (e) {
      // ignore
    }
  }

  const closeWindow = () => window.ipcRenderer?.invoke?.('window:close')

  return (
    <div className={style.titleBar}>
      <div className={style.titleLeft}>
        <div className={style.logo} />
        <div className={style.title}>
          Sound App
        </div>
      </div>

      <div className={style.windowControls}>
        <button aria-label="Minimize" className={style.btn} onClick={minimize}>—</button>
        <button aria-label="Maximize" className={style.btn} onClick={toggleMaximize}>{isMaximized ? '🗗' : '🗖'}</button>
        <button aria-label="Close" className={`${style.btn} ${style.close}`} onClick={closeWindow}>✕</button>
      </div>
    </div>
  )
}