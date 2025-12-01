import { useEffect, useState } from 'react'
import style from './titleBar.module.css'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await window.windowManager.isMaximaized()
        setIsMaximized(Boolean(res))
        window.windowManager.onWindowMaximize((isMaximized: boolean): void => {
          setIsMaximized(Boolean(isMaximized));
        });
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  const minimize = () => window.windowManager.minimize()

  const toggleMaximize = async () => {
    try {
      const nowMax = await window.windowManager.toggleMaximize()
      setIsMaximized(Boolean(nowMax))
    } catch (e) {
      // ignore
    }
  }

  const closeWindow = () => window.windowManager.close()

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