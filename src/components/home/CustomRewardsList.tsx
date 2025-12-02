
import React, { useEffect, useState, useMemo, useContext } from "react"

import style from "./home.module.css"

import { styled, Paper, Grid, Tooltip } from "@mui/material"
import { Warning, CheckBoxRounded } from "@mui/icons-material"

import EmptyList from "@/components/home/EmptyList";
import { TranslationContext } from "@/i18n/TranslationProvider"
import { NotificationContext } from "@/context/NotificationProvider";

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

const CustomRewardsList = React.memo(function CustomRewardsList({ selectReward }: { selectReward: (reward: any) => void }) {
  const { t } = useContext(TranslationContext)
  const { error } = useContext(NotificationContext);
  const [customRewards, setCustomRewards] = useState<Array<any>>([])
  const [manageableRewards, setManageableRewards] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.ipcRenderer?.invoke("twitch:get-all-rewards")
      .then((result) => {
        setCustomRewards(() => result?.data || [])
      })
      .catch((error) => {
        console.error('Error fetching custom rewards:', error)
        error(t('redeems.fetchCustomRewardsFailed'), error.message);
      })
    
    window.ipcRenderer?.invoke("twitch:get-manageable-rewards")
      .then((result) => {
        setManageableRewards(new Set(result || []))
      })
      .catch((error) => {
        console.error('Error fetching manageable rewards:', error)
        error(t('redeems.fetchCustomRewardsFailed'), error.message);
      })
  }, [])

  const sortedRewards = useMemo(() => {
    if (!customRewards || customRewards.length === 0) return []
    return [...customRewards].sort((a: any, b: any) => a.cost - b.cost)
  }, [customRewards])

  if (!sortedRewards || sortedRewards.length === 0) {
    return <EmptyList text="No custom rewards defined on twitch." />
  }

  return (
    <Grid container spacing={1} justifyContent={"flex-start"} alignItems={"flex-start"}>
      {sortedRewards.map((reward) => {
        const isManageable = manageableRewards.has(reward.id)
        
        return (
          <Grid size={{ xs: 12 }} key={reward.id} className={style.listItem} onClick={() => selectReward(reward)}>
            <Grid container spacing={2} justifyContent={"space-around"} alignItems={"center"} width={"100%"}>
              <Grid size={{ lg: 9, md: 6 }}>
                <Item>{reward.title}</Item>
              </Grid>

              <Grid size={{ lg: 3, md: 6 }}>
                <Grid container spacing={1} justifyContent={"flex-end"}>
                  <Grid size={{ lg: 4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Item>{reward.cost}</Item>
                  </Grid>
                  <Grid size={{ lg: 4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <img src={calculateImage(reward)} alt="Reward" style={{ width: '32px', height: '32px' }} />
                  </Grid>
                  <Grid size={{ lg: 4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isManageable && (
                      <Tooltip title={t("redeems.notEditableWarning")} placement="left" arrow>
                        <Warning style={{ color: '#ff9800' }} />
                      </Tooltip>
                    )}
                    {isManageable && (
                      <Tooltip title={t("redeems.editableWarning")} placement="left" arrow>
                        <CheckBoxRounded style={{ color: '#4caf50' }} />
                      </Tooltip>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )
      })}
    </Grid>
  )
});

export default CustomRewardsList;