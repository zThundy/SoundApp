import { useEffect, useState } from "react"

import style from "./home.module.css"

import { Grid } from "@mui/material"

import Sidebar from "@/components/sidebar"
import Reedems from "@/components/home/Reedems"
import AlertEditor from "@/components/alert"
import Settings from "@/components/settings"
import TwitchChat from "@/components/twitchChat"

export default function Home() {
  const [selectedPageState, setSelectedPageState] = useState<string | undefined>("redeems");

  useEffect(() => {
    console.log("Selected page changed to in Home component:", selectedPageState);
  }, [selectedPageState])

  return (
    <Grid container className={style.mainContainer}>
      <Grid size={{ lg: 1, md: 1.5 }} className={style.sidebarContainer}>
        <Sidebar setSelectedPage={setSelectedPageState} />
      </Grid>

      <Grid size={{ lg: 11, md: 10.5 }}>
        {selectedPageState === "redeems" && <Reedems />}
        {selectedPageState === "alert" && <AlertEditor />}
        {selectedPageState === "settings" && <Settings />}
        {selectedPageState === "chat" && <TwitchChat />}
      </Grid>
    </Grid>
  )
}