

import { Grid, Tooltip } from '@mui/material'
import { useContext, useState } from 'react'

import style from './sidebar.module.css'

import { Settings, LogoutOutlined, Tv, VideoLibrary, ChatBubble } from '@mui/icons-material'
import { useNavigate } from 'react-router'

import { TranslationContext } from '@/i18n/TranslationProvider'
import { NotificationContext } from '@/context/NotificationProvider'

export default function Sidebar({ setSelectedPage }: { setSelectedPage?: (page: string) => void }) {
  const { t } = useContext(TranslationContext)
  const { error } = useContext(NotificationContext)
  const [currentView, setCurrentView] = useState<string>('redeems')
  const navigate = useNavigate()

  const logout = () => {
    window.ipcRenderer.invoke('oauth:logout-twitch')
      .then(() => {
        navigate('/')
      })
      .catch((err) => {
        error(t('sidebar.logoutFailed'), err.message);
        console.error('Error during logout:', err)
      })
  }

  const handleNavigation = (page: string) => {
    setCurrentView(page)
    setSelectedPage?.(page)
  }

  return (
    <div className={style.container}>
      <Grid container direction="column" spacing={2} flexGrow={0} className={style.gridStyle}>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "redeems" ? style.current : "")}
          onClick={() => handleNavigation("redeems")}
        >

          <Tooltip title={t('sidebar.redeems')} placement="right">
            <VideoLibrary />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "settings" ? style.current : "")}
          onClick={() => handleNavigation("settings")}
        >

          <Tooltip title={t('sidebar.settings')} placement="right">
            <Settings />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "alert" ? style.current : "")}
          onClick={() => handleNavigation("alert")}
        >

          <Tooltip title={t('sidebar.alert')} placement="right">
            <Tv />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "chat" ? style.current : "")}
          onClick={() => handleNavigation("chat")}
        >

          <Tooltip title={t('sidebar.chat')} placement="right">
            <ChatBubble />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "logout" ? style.current : "")}
          onClick={logout}
        >

          <Tooltip title={t('sidebar.logout')} placement="right">
            <LogoutOutlined />
          </Tooltip>

        </Grid>
      </Grid>
    </div>
  )
}