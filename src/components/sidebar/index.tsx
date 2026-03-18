import { Grid, Typography } from '@mui/material'
import { useContext } from 'react'

import style from './sidebar.module.css'

import { Settings, LogoutOutlined, Tv, VideoLibrary, Forum, CloudUpload, BrowserUpdated, InsertEmoticon } from '@mui/icons-material'

import { TranslationContext } from '@/i18n/TranslationProvider'
import { NotificationContext } from '@/context/NotificationProvider'

interface SidebarProps {
  isLoggedIn: boolean
  onLogout: () => Promise<void>
  selectedPage?: string
  setSelectedPage?: (page: string) => void
}

export default function Sidebar({ isLoggedIn, onLogout, selectedPage, setSelectedPage }: SidebarProps) {
  const { t } = useContext(TranslationContext)
  const { error } = useContext(NotificationContext)

  const logout = () => {
    onLogout()
      .catch((err) => {
        error(t('sidebar.logoutFailed'), err.message);
        console.error('Error during logout:', err)
      })
  }

  const elements = [
    {
      icon: <Settings />,
      text: t('sidebar.settings'),
      onSelect: "settings",
      disabled: false
    },
    {
      icon: <VideoLibrary />,
      text: t('sidebar.redeems'),
      onSelect: "redeems",
      disabled: !isLoggedIn
    },
    {
      icon: <Tv />,
      text: t('sidebar.alert'),
      onSelect: "alert",
      disabled: !isLoggedIn
    },
    {
      icon: <Forum />,
      text: t('sidebar.chatbox'),
      onSelect: "chatbox",
      disabled: !isLoggedIn
    },
    {
      icon: <InsertEmoticon />,
      text: t('sidebar.emoteWall'),
      onSelect: "emoteWall",
      disabled: !isLoggedIn
    },
    {
      icon: <BrowserUpdated />,
      text: t('sidebar.twitchEvents'),
      onSelect: "twitchEvents",
      disabled: !isLoggedIn
    },
    {
      icon: <CloudUpload />,
      text: t('sidebar.fileManager'),
      onSelect: "filemanager",
      disabled: !isLoggedIn
    },
    {
      icon: <LogoutOutlined />,
      text: t('sidebar.logout'),
      onSelect: "logout",
      disabled: !isLoggedIn
    }
  ]

  const currentView = selectedPage ?? 'settings'

  const handleNavigation = (page: string, disabled?: boolean) => {
    if (disabled) return
    if (page === "logout") return logout();
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
            className={[
              style.iconContainer,
              currentView === element.onSelect ? style.current : '',
              element.disabled ? style.disabled : ''
            ].filter(Boolean).join(' ')}
            onClick={() => handleNavigation(element.onSelect, element.disabled)}
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