
import React from "react"

import { Grid, styled, TextField, Checkbox, FormControlLabel, Button, Stack, Box, Avatar, Tooltip } from "@mui/material"
import { ColorPicker } from '@/components/ColorPicker';
import { Info } from "@mui/icons-material";

import EmptyList from "@/components/home/EmptyList";
import AudioSelector from "@/components/AudioSelector";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["850"],
  padding: theme.spacing(2.2),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "space-between",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  width: "100%",
  transition: "background-color .2s ease-in-out",

  ":hover": {
    backgroundColor: (theme.palette as any).background["800"],
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
      global_cooldown_enabled: !!(reward.global_cooldown_setting?.is_enabled),
      global_cooldown: reward.global_cooldown_setting?.global_cooldown_seconds ?? reward.global_cooldown_seconds ?? '',
      cost: reward.cost ?? 0,
      background_color: reward.background_color ?? '#000000',
    })

    setBackgroundColor(reward.background_color ?? '#000000');
  }, [reward])

  if (!form) {
    return <EmptyList text="No custom reward selected." />
  }

  const handleCheckbox = (key: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s: any) => ({ ...s, [key]: ev.target.checked }))
  }

  const handleChange = (key: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      } catch (err) {
        console.error('Failed to update reward via IPC', err)
      }
    }
  }

  const handleCancel = () => {
    // reset form to last saved state
    if (reward) {
      lastRewardId.current = null // force resync
      setForm(null)
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
          <Grid size={{ lg: 12, md: 12 }}>
            {/* Audio selector inside the empty styled box */}
            <AudioSelector />
          </Grid>
        </StyledBox>

        <StyledBox justifyContent={"space-between"} flex={1} gap={2}>
          <Grid size={{ xs: 6, md: 6 }}>
            <TextField label="Cost" type="number" fullWidth value={form.cost as any} onChange={handleChange('cost')} />
          </Grid>

          <Grid size={{ xs: 6, md: 6 }}>
            <ColorPicker value={backgroundColor} previousValue={backgroundChanged ? backgroundColor : form.background_color} onClick={(color) => {
              setBackgroundColor(color);
              setBackgroundChanged(true);
            }} />
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="column" spacing={2} flexWrap="wrap">

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.is_in_stock}
                      onChange={handleCheckbox('is_in_stock')}
                      disabled
                    />}
                  label="In Stock" />
                <Tooltip title="Indicates whether the reward is in stock." placement="right">
                  <Info fontSize={"inherit"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.is_enabled}
                      onChange={handleCheckbox('is_enabled')}
                    />}
                  label="Enabled" />
                <Tooltip title="This indicates whether the reward is enabled. Viewers see only enabled rewards." placement="right">
                  <Info fontSize={"inherit"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.is_paused}
                      onChange={handleCheckbox('is_paused')}
                    />}
                  label="Paused" />
                <Tooltip title="This determines whether to pause the reward. Viewers can't redeem paused rewards." placement="right">
                  <Info fontSize={"inherit"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.is_user_input_required}
                      onChange={handleCheckbox('is_user_input_required')}
                    />}
                  label="Is user input required?" />
                <Tooltip title="This determines whether users must enter information to redeem the reward. Change the prompt field to customize the user input requirements." placement="right">
                  <Info fontSize={"inherit"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.should_redemptions_skip_request_queue}
                      onChange={handleCheckbox('should_redemptions_skip_request_queue')}
                    />}
                  label="Should redemptions be skipped?" />
                <Tooltip title="This determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If unchecked, status is set to UNFULFILLED and follows the normal request queue process." placement="right">
                  <Info fontSize={"inherit"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>

            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <Stack direction="row" spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent={"space-between"}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={"space-evenly"}>
                <TextField label="Max per stream" type="number" fullWidth value={form.max_per_stream_value as any} onChange={handleChange('max_per_stream_value')} />
                <FormControlLabel control={<Checkbox checked={!!form.max_per_stream_enabled} onChange={handleCheckbox('max_per_stream_enabled')} />} label="Enabled" />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title="The maximum number of redemptions allowed per live stream. The minimum value is 1." placement="right">
                  <Info fontSize={"medium"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <Stack direction="row" spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent={"space-between"}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={"space-evenly"}>
                <TextField label="Max per user per stream" type="number" fullWidth value={form.max_per_user_value as any} onChange={handleChange('max_per_user_value')} />
                <FormControlLabel control={<Checkbox checked={!!form.max_per_user_enabled} onChange={handleCheckbox('max_per_user_enabled')} />} label="Enabled" />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title="The maximum number of redemptions allowed per user per stream. The minimum value is 1." placement="right">
                  <Info fontSize={"medium"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12, md: 12 }}>
            <Stack direction="row" spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent={"space-between"}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={"space-evenly"}>
                <TextField label="Global Cooldown" type="number" fullWidth value={form.global_cooldown as any} onChange={handleChange('global_cooldown')} />
                <FormControlLabel control={<Checkbox checked={!!form.global_cooldown_enabled} onChange={handleCheckbox('global_cooldown_enabled')} />} label="Enabled" />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title="The global cooldown period for all redemptions. The minimum value is 1." placement="right">
                  <Info fontSize={"medium"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={handleSave} fullWidth>Save</Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel} fullWidth>Cancel</Button>
            </Stack>
          </Grid>
        </StyledBox>
      </Grid>
    </Box>
  )
});

export default CustomRewardDetails;