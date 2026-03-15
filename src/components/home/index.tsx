import { useCallback, useEffect, useState } from "react"

import style from "./home.module.css"

import { Grid } from "@mui/material"

import Sidebar from "@/components/sidebar"
import Reedems from "@/components/redeems"
import AlertEditor from "@/components/alert"
import Settings from "@/components/settings"
import TwitchEvents from "@/components/twitchEvents"
import ChatBoxEditor from "@/components/chatBox"
import FileManager from "@/components/FileManager"

type HomePage = "redeems" | "alert" | "settings" | "twitchEvents" | "chatbox" | "filemanager"

const SETTINGS_PAGE: HomePage = "settings"
const DEFAULT_PAGE: HomePage = "redeems"

export default function Home() {
  const [selectedPageState, setSelectedPageState] = useState<HomePage>(SETTINGS_PAGE)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginCheckCompleted, setLoginCheckCompleted] = useState(false)

  const refreshLoginStatus = useCallback(async (options?: { preferredPage?: HomePage; forcePage?: boolean }) => {
    try {
      const hasStoredToken = await window.ipcRenderer?.invoke('safe-store:has', 'twitchAccessToken')
      const loggedIn = Boolean(hasStoredToken)

      setIsLoggedIn(loggedIn)
      setSelectedPageState((currentPage) => {
        if (!loggedIn) {
          return SETTINGS_PAGE
        }

        if (options?.forcePage && options.preferredPage) {
          return options.preferredPage
        }

        if (!currentPage) {
          return options?.preferredPage ?? DEFAULT_PAGE
        }

        return currentPage
      })

      return loggedIn
    } catch (error) {
      setIsLoggedIn(false)
      setSelectedPageState(SETTINGS_PAGE)
      return false
    } finally {
      setLoginCheckCompleted(true)
    }
  }, [])

  useEffect(() => {
    void refreshLoginStatus({ preferredPage: DEFAULT_PAGE })
  }, [refreshLoginStatus])

  const handleSelectedPage = useCallback((page: string) => {
    if (!isLoggedIn && page !== SETTINGS_PAGE) {
      setSelectedPageState(SETTINGS_PAGE)
      return
    }

    setSelectedPageState(page as HomePage)
  }, [isLoggedIn])

  const handleLogout = useCallback(async () => {
    await window.ipcRenderer.invoke('oauth:logout-twitch')
    await refreshLoginStatus({ preferredPage: SETTINGS_PAGE, forcePage: true })
  }, [refreshLoginStatus])

  const activePage = isLoggedIn ? selectedPageState : SETTINGS_PAGE

  if (!loginCheckCompleted) {
    return null
  }

  return (
    <Grid container className={style.mainContainer}>
      <Grid size={{ lg: 1.5, md: 2 }} className={style.sidebarContainer}>
        <Sidebar
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          selectedPage={activePage}
          setSelectedPage={handleSelectedPage}
        />
      </Grid>

      <Grid size={{ lg: 10.5, md: 10 }}>
        {activePage === "redeems" && <Reedems />}
        {activePage === "alert" && <AlertEditor />}
        {activePage === "settings" && (
          <Settings
            isLoggedIn={isLoggedIn}
            onLoginSuccess={() => refreshLoginStatus({ preferredPage: SETTINGS_PAGE, forcePage: true })}
            onLogout={handleLogout}
          />
        )}
        {activePage === "twitchEvents" && <TwitchEvents />}
        {activePage === "chatbox" && <ChatBoxEditor />}
        {activePage === "filemanager" && <FileManager />}
      </Grid>
    </Grid>
  )
}