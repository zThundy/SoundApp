
import React, { useEffect, useState, useMemo } from "react"

import style from "./home.module.css"

import { styled, Paper } from "@mui/material"

import { Grid, Box } from "@mui/material"
import { QuestionMark } from "@mui/icons-material";
import EmptyList from "./EmptyList";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "rgba(0,0,0,0)",
  boxShadow: "0 0 0 0 rgba(0,0,0,0)",
  textAlign: "left",
  backgroundImage: "none",
  padding: theme.spacing(1),
}));

const calculateImage = (reward: any) => {
  if (reward.image && reward.image.url_4x) {
    return reward.image.url_4x
  } else if (reward.image && reward.image.url_2x) {
    return reward.image.url_2x
  } else if (reward.image && reward.image.url_1x) {
    return reward.image.url_1x
  } else if (reward.default_image && reward.default_image.url_4x) {
    return reward.default_image.url_4x
  } else if (reward.default_image && reward.default_image.url_2x) {
    return reward.default_image.url_2x
  } else if (reward.default_image && reward.default_image.url_1x) {
    return reward.default_image.url_1x
  }
  return ""
}

// Memoized component to avoid rerenders when parent updates
const CustomRewardsList = React.memo(function CustomRewardsList({ selectReward }: { selectReward: (reward: any) => void }) {
  const [customRewards, setCustomRewards] = useState<Array<any>>([])

  useEffect(() => {
    window.ipcRenderer
      ?.invoke("twitch:get-all-rewards")
      .then((result) => {
        // store raw data; sorting/memoization handled by useMemo below
        console.log(result.data);
        setCustomRewards(() => result?.data || [])
      })
      .catch((error) => {
        console.error('Error fetching custom rewards:', error)
      })
  }, [])

  // Memoize the sorted rewards so the list rendering only updates when
  // the rewards array actually changes.
  const sortedRewards = useMemo(() => {
    if (!customRewards || customRewards.length === 0) return []
    return [...customRewards].sort((a: any, b: any) => a.cost - b.cost)
  }, [customRewards])

  if (!sortedRewards || sortedRewards.length === 0) {
    return <EmptyList text="No custom rewards defined on twitch." />
  }

  return (
    <Grid container spacing={1} justifyContent={"flex-start"} alignItems={"flex-start"}>
      {sortedRewards.map((reward) => (
        <Grid size={{ xs: 12 }} key={reward.id} className={style.listItem} onClick={() => selectReward(reward)}>
          <Grid container>
            <Grid size={{ xs: 9 }}>
              <Item>{reward.title}</Item>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Item>{reward.cost}</Item>
                </Grid>
                <Grid size={{ xs: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={calculateImage(reward)} alt="Reward" style={{ width: '32px', height: '32px' }} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  )
});

export default CustomRewardsList;