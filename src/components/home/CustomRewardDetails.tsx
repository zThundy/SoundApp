
import React, { useEffect, useState } from "react"

import { Grid, styled, TextField, Checkbox, FormControlLabel, Button, Stack, Box, Avatar } from "@mui/material"
import { ColorPicker } from '@/components/ColorPicker';

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["850"],
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "space-between",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  width: "100%",
  transition: "background-color .2s ease-in-out",

  ":hover": {
    backgroundColor: (theme.palette as any).background["900"],
  }
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

const CustomRewardDetails = React.memo(function CustomRewardDetails({ reward }: { reward: any }) {
  const [form, setForm] = React.useState<any>(null)
  const lastRewardId = React.useRef<string | null>(null)
  const [backgroundColor, setBackgroundColor] = React.useState<string>('#000000');
  const [backgroundChanged, setBackgroundChanged] = React.useState<boolean>(false);

  // sync local form state only when a different reward is selected (by id)
  React.useEffect(() => {
    if (!reward) {
      setForm(null)
      lastRewardId.current = null
      return
    }

    // avoid resyncing if the same reward id is passed again (prevents
    // external updates like color change echoing back from main from
    // overwriting in-progress edits). Only resync when the reward id
    // actually changes.
    if (lastRewardId.current === reward.id) {
      return
    }

    lastRewardId.current = reward.id

    setForm({
      title: reward.title ?? '',
      prompt: reward.prompt ?? reward.description ?? '',
      image: calculateImage(reward) ?? '',
      is_enabled: !!reward.is_enabled,
      is_in_stock: !!reward.is_in_stock,
      is_paused: !!reward.is_paused,
      is_user_input_required: !!reward.is_user_input_required,
      should_redemptions_skip_request_queue: !!reward.should_redemptions_skip_request_queue,
      // Flatten nested settings into explicit fields used by the form
      max_per_stream_enabled: !!(reward.max_per_stream_setting?.is_enabled),
      max_per_stream_value: reward.max_per_stream_setting?.max_per_stream ?? reward.max_per_stream ?? '',
      max_per_user_enabled: !!(reward.max_per_user_per_stream_setting?.is_enabled),
      max_per_user_value: reward.max_per_user_per_stream_setting?.max_per_user_per_stream ?? reward.max_per_user_per_stream ?? '',
      cost: reward.cost ?? 0,
      background_color: reward.background_color ?? '#000000',
    })

    setBackgroundColor(reward.background_color ?? '#000000');
  }, [reward])

  if (!form) {
    return <div>Select a reward to see details.</div>
  }

  const handleCheckbox = (key: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleCheckbox", key, ev.target.checked)
    setForm((s: any) => ({ ...s, [key]: ev.target.checked }))
  }

  const handleChange = (key: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log("handleChange", key, ev.target.value)
    const val = ev.target.value
    setForm((s: any) => ({ ...s, [key]: val }))
  }

  const handleSave = async () => {
    // compose nested settings back into the Twitch shape
    const updated = {
      ...reward,
      ...form,
      max_per_stream_setting: {
        is_enabled: !!form.max_per_stream_enabled,
        max_per_stream: Number(form.max_per_stream_value) || 0,
      },
      max_per_user_per_stream_setting: {
        is_enabled: !!form.max_per_user_enabled,
        max_per_user_per_stream: Number(form.max_per_user_value) || 0,
      },
      cost: Number(form.cost) || 0,
      background_color: backgroundColor,
    }
    // try to persist via ipc if available
    if (window.ipcRenderer?.invoke) {
      try {
        await window.ipcRenderer.invoke('twitch:update-reward', updated)
        console.log('Updated reward sent to main process')
      } catch (err) {
        console.error('Failed to update reward via IPC', err)
      }
    } else {
      console.log('Updated reward (local only):', updated)
    }
  }

  return (
    <Box>
      <Grid container spacing={1} justifyContent={"space-between"} >

        <StyledBox>
          <Grid size={{ lg: 1, md: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                variant="square"
                src={form.image}
                sx={{ width: 48, height: 48 }}
              >
              </Avatar>

              {/* <img src={form.image} alt="Reward" style={{ height: 64, objectFit: 'contain' }} width={{ lg: 64, md: 64, sm: 64 }} /> */}
              {/* <TextField label="Image URL" fullWidth value={form.image} onChange={handleChange('image')} /> */}
            </Box>
          </Grid>

          <Grid size={{ lg: 5, md: 5 }}>
            <TextField label="Title" fullWidth value={form.title} onChange={handleChange('title')} />
          </Grid>

          <Grid size={{ lg: 5, md: 4 }}>
            <TextField label="Prompt" fullWidth value={form.prompt} onChange={handleChange('prompt')} />
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField label="Cost" type="number" fullWidth value={form.cost as any} onChange={handleChange('cost')} />
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControlLabel control={<Checkbox checked={!!form.is_enabled} onChange={handleCheckbox('is_enabled')} />} label="is_enabled" />
              <FormControlLabel control={<Checkbox checked={!!form.is_in_stock} onChange={handleCheckbox('is_in_stock')} />} label="is_in_stock" />
              <FormControlLabel control={<Checkbox checked={!!form.is_paused} onChange={handleCheckbox('is_paused')} />} label="is_paused" />
              <FormControlLabel control={<Checkbox checked={!!form.is_user_input_required} onChange={handleCheckbox('is_user_input_required')} />} label="is_user_input_required" />
              <FormControlLabel control={<Checkbox checked={!!form.should_redemptions_skip_request_queue} onChange={handleCheckbox('should_redemptions_skip_request_queue')} />} label="should_redemptions_skip_request_queue" />
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <Stack direction="row" spacing={10} alignItems="center" justifyContent={"space-around"}>
              <TextField label="Max per stream" type="number" fullWidth value={form.max_per_stream_value as any} onChange={handleChange('max_per_stream_value')} />
              <FormControlLabel control={<Checkbox checked={!!form.max_per_stream_enabled} onChange={handleCheckbox('max_per_stream_enabled')} />} label="Enabled" />
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <Stack direction="row" spacing={10} alignItems="center" justifyContent={"space-around"}>
              <TextField label="Max per user per stream" type="number" fullWidth value={form.max_per_user_value as any} onChange={handleChange('max_per_user_value')} />
              <FormControlLabel control={<Checkbox checked={!!form.max_per_user_enabled} onChange={handleCheckbox('max_per_user_enabled')} />} label="Enabled" />
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <ColorPicker value={backgroundColor} previousValue={backgroundChanged ? backgroundColor : form.background_color} onClick={(color) => {
              setBackgroundColor(color);
              setBackgroundChanged(true);
            }} />
          </Grid>
        </StyledBox>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
});

export default CustomRewardDetails;