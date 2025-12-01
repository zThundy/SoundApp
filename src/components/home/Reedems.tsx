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
              <Tooltip title="Work in progress" placement="top" arrow>
                <Button variant="contained" color="primary">
                  {t("redeems.addNewReward")}
                </Button>
              </Tooltip>
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