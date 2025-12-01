
import { useEffect } from "react"
import style from "./login.module.css"

import { Button } from "@mui/material"
import { useContext } from 'react'
import { TranslationContext } from '@/i18n/TranslationProvider'
import { useLocation, useNavigate } from "react-router"

export default function Login() {
  const { t } = useContext(TranslationContext)
  const navigate = useNavigate();

  useEffect(() => {
    window.ipcRenderer?.invoke('safe-store:has', "twitchAccessToken")
      .then((has) => {
        if (has) {
          navigate('/home');
        }
      })
  }, [])

  const clicked = () => {
    window.ipcRenderer?.invoke('oauth:start-twitch')
      .then(() => {
        navigate('/home');
      })
      .catch((err) => {
        console.error('Error during Twitch OAuth:', err);
      })
  }

  return (
    <div className={style.container}>
      <div className={style.loginContainer}>
        <Button
          variant="contained"
          color="primary"
          sx={{ width: '100%', fontSize: 18, padding: '10px 0' }}
          startIcon={
            <img src="twitch.png" alt={t('login.twitchLogoAlt')} style={{
              width: 25,
              height: 25,
              paddingRight: 10,
              filter: "brightness(0) invert(1)"
            }} />
          }
          onClick={clicked}
        >
          {t('login.withTwitch')}
        </Button>
      </div>
    </div>
  )
}