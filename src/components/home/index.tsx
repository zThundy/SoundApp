import { useEffect, useState } from "react"

import style from "./home.module.css"

import { Grid } from "@mui/material"

import Sidebar from "../sidebar"
import CustomRewardDetails from "./CustomRewardDetails"
import CustomRewardsList from "./CustomRewardsList"

export default function Home() {
  const [selectedReward, setSelectedReward] = useState<any>(null)

  const _selectReward = (reward: any) => {
    console.log('Selected reward:', reward)
    setSelectedReward(reward)
  }

  useEffect(() => {
    // placeholder for future fetches
  }, [])

  return (
    <Grid container className={style.mainContainer}>
      <Grid size={{ xs: 1 }} className={style.sidebarContainer}>
        <Sidebar />
      </Grid>

      <Grid size={{ xs: 11 }}>

        <Grid container spacing={2} padding={2} className={style.gridContainer}>
          <Grid size={{ xs: 6 }}>

            <Grid container spacing={1} flexDirection={"column"}>
              <Grid size={{ xs: 12 }} className={style.listTitle}>
                <h2>Custom Rewards</h2>
              </Grid>
              <Grid size={{ xs: 12 }} className={style.listContainer}>
                <CustomRewardsList selectReward={_selectReward} />
              </Grid>
            </Grid>

          </Grid>

          <Grid size={{ xs: 6 }}>
            
            <Grid container spacing={1} flexDirection={"column"}>
              <Grid size={{ xs: 12 }} className={style.listTitle}>
                <h2>Custom Rewards</h2>
              </Grid>
              <Grid size={{ xs: 12 }} className={style.listContainer}>
                <CustomRewardDetails reward={selectedReward} />
              </Grid>
            </Grid>

          </Grid>
        </Grid>

      </Grid>
    </Grid>
  )
}