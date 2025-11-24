import React, { useEffect, useMemo, useState } from "react"

import { Grid } from "@mui/material"

// Memoized component to avoid rerenders when parent updates
const CustomRewardsList = React.memo(function CustomRewardsList() {
  const [customRewards, setCustomRewards] = useState<Array<any>>([])

  useEffect(() => {
    window.ipcRenderer
      ?.invoke("twitch:get-all-rewards")
      .then((result) => {
        // store raw data; sorting/memoization handled by useMemo below
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
    return <div>No custom rewards found.</div>
  }

  return (
    <div>
      <h1>Twitch Custom Rewards</h1>
      <ul>
        {sortedRewards.map((reward) => (
          <li key={reward.id}>
            {reward.title} - Cost: {reward.cost}
          </li>
        ))}
      </ul>
    </div>
  )
})

export default function Home() {
  const [redemptions, setRedemptions] = useState<any[]>([])

  useEffect(() => {
    // placeholder for future fetches
  }, [])

  return (
    <Grid container spacing={2} padding={2}>
      <Grid size={{ xs: 12 }}>
        <CustomRewardsList />
      </Grid>
    </Grid>
  )
}