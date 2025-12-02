import { useState, useContext } from "react"

import style from "./home.module.css"

import CustomRewardDetails from "@/components/home/CustomRewardDetails"
import CustomRewardsList from "@/components/home/CustomRewardsList"

import { Grid, Stack, Button, Tooltip, Typography } from "@mui/material"

import { TranslationContext } from "@/i18n/TranslationProvider"
import { NotificationContext } from "@/context/NotificationProvider"
import { Refresh } from "@mui/icons-material"

export default function Reedems() {
  const { t } = useContext(TranslationContext);
  const { info } = useContext(NotificationContext);
  const [selectedReward, setSelectedReward] = useState<any>(null)

  const _selectReward = (reward: any) => {
    setSelectedReward(reward)
  }

  const createNewReward = () => {
    setSelectedReward({
      title: "",
      prompt: "",
      cost: 100,
      background_color: "#00FF00",
      is_enabled: true,
      is_user_input_required: false,
      is_max_per_stream_enabled: false,
      max_per_stream: 0,
      is_max_per_user_enabled: false,
      max_per_user_per_stream: 0,
      is_global_cooldown_enabled: false,
      global_cooldown_seconds: 0,
      is_paused: false,
      should_redemptions_skip_request_queue: false,
      is_new: true
    })

    info(t("redeems.startingNewReward"))
  }

  return (
    <Grid container spacing={2} padding={2} className={style.gridContainer}>
      <Grid size={{ lg: 6, md: 6 }}>

        <Grid container spacing={1} flexDirection={"column"}>
          <Grid size={{ lg: 12, md: 12 }} className={style.listTitle}>
            <Grid
              container
              spacing={2}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Grid size={{ lg: 6, md: 4 }} textAlign={"left"}>
                <Typography variant="h5" fontWeight={"bold"} fontSize={{
                  lg: "2rem",
                  md: "1rem"
                }}>{t("redeems.list")}</Typography>
              </Grid>
              <Grid size={{ lg: 6, md: 8 }} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={createNewReward}
                >
                  {t("redeems.addNewReward")}
                </Button>
                <Tooltip
                  title="Work in progress: Refresh the rewards list from Twitch"
                  placement="top"
                  arrow
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    style={{ marginLeft: 8 }}
                  >
                    <Refresh />
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ lg: 12, md: 12 }} className={style.listContainer}>
            <CustomRewardsList selectReward={_selectReward} />
          </Grid>
        </Grid>

      </Grid>

      <Grid size={{ lg: 6, md: 6 }}>
        <Grid container spacing={1} flexDirection={"column"}>
          <Grid size={{ lg: 12, md: 12 }} className={style.listTitle} textAlign={"right"} p={{
            lg: 0,
            md: 1.1
          }}>
            <Typography variant="h5" fontWeight={"bold"} fontSize={{
              lg: "2rem",
              md: "1rem"
            }}>{t("redeems.selected")}</Typography>
          </Grid>
          <Grid size={{ lg: 12, md: 12 }} className={style.listContainer}>
            <CustomRewardDetails reward={selectedReward} clearReward={() => setSelectedReward(null)} />
          </Grid>
        </Grid>

      </Grid>
    </Grid>
  )
}