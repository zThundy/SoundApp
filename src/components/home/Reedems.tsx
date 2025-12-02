import { useState, useContext } from "react"

import style from "./home.module.css"

import CustomRewardDetails from "@/components/home/CustomRewardDetails"
import CustomRewardsList from "@/components/home/CustomRewardsList"

import { Grid, Stack, Button, Tooltip } from "@mui/material"

import { TranslationContext } from "@/i18n/TranslationProvider"

export default function Reedems() {
  const { t } = useContext(TranslationContext);
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
  }

  return (
    <Grid container spacing={2} padding={2} className={style.gridContainer}>
      <Grid size={{ xs: 6 }}>

        <Grid container spacing={1} flexDirection={"column"}>
          <Grid size={{ xs: 12 }} className={style.listTitle}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <h2>{t("redeems.list")}</h2>
              <Button
                variant="contained"
                color="primary"
                onClick={createNewReward}
              >
                {t("redeems.addNewReward")}
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12 }} className={style.listContainer}>
            <CustomRewardsList selectReward={_selectReward} />
          </Grid>
        </Grid>

      </Grid>

      <Grid size={{ xs: 6 }}>
        <Grid container spacing={1} flexDirection={"column"}>
          <Grid size={{ xs: 12 }} className={style.listTitle} textAlign={"right"}>
            <h2>{t("redeems.selected")}</h2>
          </Grid>
          <Grid size={{ xs: 12 }} className={style.listContainer}>
            <CustomRewardDetails reward={selectedReward} clearReward={() => setSelectedReward(null)} />
          </Grid>
        </Grid>

      </Grid>
    </Grid>
  )
}