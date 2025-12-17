

import { Grid, Tooltip, Typography } from '@mui/material'
import { useContext, useState } from 'react'

import style from './sidebar.module.css'

import { Settings, LogoutOutlined, Tv, VideoLibrary, Forum, CloudUpload, BrowserUpdated } from '@mui/icons-material'
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

  const elements = [
    {
      icon: <VideoLibrary />,
      text: t('sidebar.redeems'),
      onSelect: "redeems"
    },
    {
      icon: <Settings />,
      text: t('sidebar.settings'),
      onSelect: "settings"
    },
    {
      icon: <Tv />,
      text: t('sidebar.alert'),
      onSelect: "alert"
    },
    {
      icon: <Forum />,
      text: t('sidebar.chatbox'),
      onSelect: "chatbox"
    },
    {
      icon: <BrowserUpdated />,
      text: t('sidebar.twitchEvents'),
      onSelect: "twitchEvents"
    },
    {
      icon: <CloudUpload />,
      text: t('sidebar.fileManager'),
      onSelect: "filemanager"
    },
    {
      icon: <LogoutOutlined />,
      text: t('sidebar.logout'),
      onSelect: "logout"
    }
  ]

  const handleNavigation = (page: string) => {
    if (page === "logout") return logout();
    setCurrentView(page)
    setSelectedPage?.(page)
  }

  return (
    <div className={style.container}>
      <Grid container direction="column" spacing={2} flexGrow={0} className={style.gridStyle}>
        {elements.map((element, index) => (
          <Grid
            key={index}
            size={{ xs: 12 }}
            flexDirection={"row"}
            display={"flex"}
            justifyContent={"flex-start"}
            className={style.iconContainer + ' ' + (currentView === element.onSelect ? style.current : "")}
            onClick={() => handleNavigation(element.onSelect)}
          >
            {element.icon}
            <Typography>
              <span>{element.text}</span>
            </Typography>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}