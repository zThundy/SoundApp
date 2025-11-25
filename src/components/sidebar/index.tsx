

import { Grid, Tooltip } from '@mui/material'
import { useState } from 'react'

import style from './sidebar.module.css'

import { Home, Settings, LogoutOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router'

export default function Sidebar() {
  const [currentView, setCurrentView] = useState<string>('home')
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

  return (
    <div className={style.container}>
      <Grid container direction="column" spacing={2} flexGrow={0} className={style.gridStyle}>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "home" ? style.current : "")}
          onClick={() => setCurrentView("home")}
        >
          
          <Tooltip title="Home" placement="right">
            <Home />
          </Tooltip>

        </Grid>
        <Grid
          size={{ xs: 12 }}
          className={style.iconContainer + ' ' + (currentView === "settings" ? style.current : "")}
          onClick={() => setCurrentView("settings")}
        >

          <Tooltip title="Settings" placement="right">
            <Settings />
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