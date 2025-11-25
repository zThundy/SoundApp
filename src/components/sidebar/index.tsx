

import { Grid, Tooltip } from '@mui/material'
import { useState } from 'react'

import style from './sidebar.module.css'

import { Home, Settings, LogoutOutlined, Tv, VideoLibrary } from '@mui/icons-material'
import { useNavigate } from 'react-router'

export default function Sidebar({ setSelectedPage }: { setSelectedPage?: (page: string) => void }) {
  const [currentView, setCurrentView] = useState<string>('redeems')
  const navigate = useNavigate()

  const logout = () => {
    window.ipcRenderer.invoke('oauth:logout-twitch')
      .then(() => {
        navigate('/')
      })
      .catch((err) => {
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
          
          <Tooltip title="Redeems" placement="right">
            <VideoLibrary />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "settings" ? style.current : "")}
          onClick={() => handleNavigation("settings")}
        >

          <Tooltip title="Settings" placement="right">
            <Settings />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "alert" ? style.current : "")}
          onClick={() => handleNavigation("alert")}
        >

          <Tooltip title="Alert" placement="right">
            <Tv />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "logout" ? style.current : "")}
          onClick={logout}
        >

          <Tooltip title="Log out" placement="right">
            <LogoutOutlined />
          </Tooltip>

        </Grid>
      </Grid>
    </div>
  )
}