
import { useEffect } from "react"
import style from "./login.module.css"

import { Button } from "@mui/material"
import { useLocation, useNavigate } from "react-router"

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.ipcRenderer?.invoke('safe-store:has', "twitchAccessToken")
      .then((has) => {
        console.log('Twitch access token exists:', has);
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
            <img src="/twitch.png" alt="Twitch Logo" style={{
              width: 25,
              height: 25,
              paddingRight: 10,
              filter: "brightness(0) invert(1)"
            }} />
          }
          onClick={clicked}
        >
          Login with Twitch
        </Button>
      </div>
    </div>
  )
}