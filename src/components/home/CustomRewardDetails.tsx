
import React, { useContext } from "react"

import { Grid, styled, TextField, Checkbox, FormControlLabel, Button, Stack, Box, Avatar, Tooltip } from "@mui/material"
import { Delete, Info } from "@mui/icons-material";

import EmptyList from "@/components/home/EmptyList";
import AudioSelector from "@/components/AudioSelector";
import DeleteModal from "@/components/home/DeleteModal";
import { ColorPicker } from '@/components/ColorPicker';

import { TranslationContext } from "@/i18n/TranslationProvider"
import { NotificationContext } from "@/context/NotificationProvider"

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

const CustomRewardDetails = React.memo(function CustomRewardDetails({ reward, clearReward, onRefreshRewards }: { reward: any, clearReward: () => void, onRefreshRewards?: () => void }) {
  const { t } = useContext(TranslationContext);
  const { success, error, info, warning } = useContext(NotificationContext);
  
  const [form, setForm] = React.useState<any>(null)
  const lastRewardId = React.useRef<string | null>(null)
  const [backgroundColor, setBackgroundColor] = React.useState<string>('#000000');
  const [backgroundChanged, setBackgroundChanged] = React.useState<boolean>(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [audioVolume, setAudioVolume] = React.useState<number>(1); // 0..1
  const [audioMuted, setAudioMuted] = React.useState<boolean>(false);
  const [audioResetKey, setAudioResetKey] = React.useState<number>(0);
  const [audioRelPath, setAudioRelPath] = React.useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!reward) {
      setForm(null)
      lastRewardId.current = null
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
      setAudioFile(null)
      setAudioVolume(1)
      setAudioMuted(false)
      setAudioResetKey(k => k + 1)
      return
    }

    if (lastRewardId.current === reward.id) {
      return
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioFile(null)
    setAudioVolume(1)
    setAudioMuted(false)
    setAudioResetKey(k => k + 1)
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
    (async () => {
      try {
        const rewardId = reward.id;
        const settingsPath = `settings/${rewardId}.json`;
        const res = await window.fileManager?.read?.('alerts', settingsPath, true);
        if (res?.ok && res.data) {
          const settings = JSON.parse(res.data as string);
          if (settings.background_color) setBackgroundColor(settings.background_color);
          if (typeof settings.volume === 'number') setAudioVolume(settings.volume);
          if (typeof settings.muted === 'boolean') setAudioMuted(settings.muted);
          setAudioRelPath(settings.audioPath ?? null);
          if (settings.audioPath) {
            const exists = await window.fileManager?.exists?.('alerts', settings.audioPath);
            if (exists?.ok && exists.exists) {
              const fileRead = await window.fileManager?.read?.('alerts', settings.audioPath, false);
              if (fileRead?.ok && fileRead.data) {
                const buf = fileRead.data as any as ArrayBuffer;
                const blob = new Blob([buf]);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
              }
            }
          }
        } else {
          setAudioUrl(null);
          setAudioFile(null);
          setAudioVolume(1);
          setAudioMuted(false);
          setAudioResetKey(k => k + 1)
          setAudioRelPath(null);
        }
      } catch {
        // ignore
      }
    })();
  }, [reward])

  if (!form) {
    return <EmptyList text={t("redeems.noRewardsSelected")} />
  }

  const handleCheckbox = (key: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s: any) => ({ ...s, [key]: ev.target.checked }))
  }

  const handleChange = (key: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = ev.target.value
    setForm((s: any) => ({ ...s, [key]: val }))
  }

  const handleSave = async () => {
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
      global_cooldown_setting: {
        is_enabled: !!form.global_cooldown_enabled,
        global_cooldown_seconds: Number(form.global_cooldown) || 0,
      },
      cost: Number(form.cost) || 0,
      background_color: backgroundColor,
    }
    if (window.ipcRenderer?.invoke) {
      try {
        if (reward.is_new) {
          if (!updated.title || updated.title.trim().length === 0) {
            warning(t('redeems.titleRequired'));
            return;
          }
          if (!updated.cost || isNaN(Number(updated.cost)) || Number(updated.cost) <= 0) {
            warning(t('redeems.costRequired'));
            return;
          }

          const newReward = await window.ipcRenderer.invoke('twitch:create-reward', {
            title: updated.title,
            prompt: updated.prompt,
            cost: updated.cost,
            background_color: updated.background_color,
            is_enabled: updated.is_enabled,
            is_user_input_required: updated.is_user_input_required,
            is_max_per_stream_enabled: updated.max_per_stream_setting.is_enabled,
            max_per_stream: updated.max_per_stream_setting.max_per_stream,
            is_max_per_user_enabled: updated.max_per_user_per_stream_setting.is_enabled,
            max_per_user_per_stream: updated.max_per_user_per_stream_setting.max_per_user_per_stream,
            is_global_cooldown_enabled: updated.global_cooldown_setting.is_enabled,
            global_cooldown_seconds: updated.global_cooldown_setting.global_cooldown_seconds,
            is_paused: updated.is_paused,
            should_redemptions_skip_request_queue: updated.should_redemptions_skip_request_queue,
          })
          success(t('redeems.rewardCreated'));
          reward.id = newReward?.data?.[0]?.id;
        } else {
          await window.ipcRenderer.invoke('twitch:update-reward', reward.id, {
            title: updated.title,
            prompt: updated.prompt,
            cost: updated.cost,
            background_color: updated.background_color,
            is_enabled: updated.is_enabled,
            is_user_input_required: updated.is_user_input_required,
            is_max_per_stream_enabled: updated.max_per_stream_setting.is_enabled,
            max_per_stream: updated.max_per_stream_setting.max_per_stream,
            is_max_per_user_enabled: updated.max_per_user_per_stream_setting.is_enabled,
            max_per_user: updated.max_per_user_per_stream_setting.max_per_user_per_stream,
            is_global_cooldown_enabled: updated.global_cooldown_setting.is_enabled,
            global_cooldown_seconds: updated.global_cooldown_setting.global_cooldown_seconds,
            is_paused: updated.is_paused,
            should_redemptions_skip_request_queue: updated.should_redemptions_skip_request_queue,
          })
          success(t('redeems.rewardUpdated'));
        }
      } catch (err) {
        error(t('redeems.saveFailed'), (err as Error).message);
      }
    }

    try {
      const rewardId = reward.id as string;
      let storedAudioRelPath: string | null = audioRelPath;
      if (audioFile) {
        const ext = (audioFile.name.split('.').pop() || 'dat').toLowerCase();
        const relPath = `audio/${rewardId}.${ext}`;
        const buf = await audioFile.arrayBuffer();
        await window.fileManager?.save?.('alerts', relPath, new Uint8Array(buf) as any);
        storedAudioRelPath = relPath;
        setAudioRelPath(relPath);
      }
      const settings = {
        rewardId,
        background_color: backgroundColor,
        volume: audioVolume,
        muted: audioMuted,
        audioPath: storedAudioRelPath,
        updatedAt: Date.now(),
      };
      await window.fileManager?.save?.('alerts', `settings/${rewardId}.json`, JSON.stringify(settings, null, 2));
      success(t('redeems.settingsSaved'));
    } catch (err) {
      error(t('redeems.settingsSaveFailed'), (err as Error).message);
    }

    // refresh and clear shit
    if (reward.is_new) clearReward();
    onRefreshRewards?.();
  }

  const handleCancel = () => {
    if (reward) {
      lastRewardId.current = null
      setForm(null)
      setBackgroundChanged(false);
      clearReward();
    }
  }

  const handleDeleteConfirm = async () => {
    if (reward && !reward.is_new) {
      try {
        await window.ipcRenderer?.invoke('twitch:delete-reward', reward.id);
        success(t('redeems.rewardDeleted'));
        setDeleteModalOpen(false);
        handleCancel();
        onRefreshRewards?.();
      } catch (err) {
        error(t('redeems.deleteFailed'), (err as Error).message);
      }
    }
  }

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  }

  return (
    <Box>
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        rewardTitle={form.title}
      />

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
            <TextField label={t("common.title")} fullWidth value={form.title} onChange={handleChange('title')} />
          </Grid>

          <Grid size={{ lg: 5, md: 4 }}>
            <TextField label={t("common.prompt")} fullWidth value={form.prompt} onChange={handleChange('prompt')} />
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ lg: 12, md: 12 }}>
            <AudioSelector
              key={audioResetKey + ':' + (reward?.id || 'none')}
              value={audioUrl}
              volume={audioVolume}
              muted={audioMuted}
              onChange={async (fileUrl, file) => {
                setAudioUrl(fileUrl);
                setAudioFile(file ?? null);
                if (!fileUrl && !file) setAudioRelPath(null);
              }}
              onVolumeChange={(v) => setAudioVolume(v)}
              onMutedChange={(m) => setAudioMuted(m)}
            />
          </Grid>
        </StyledBox>

        <StyledBox justifyContent={"space-between"} flex={1} gap={2}>
          <Grid size={{ xs: 6, md: 6 }}>
            <TextField label={t("common.cost")} type="number" fullWidth value={form.cost as any} onChange={handleChange('cost')} />
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
                    label={t("redeems.inStock")} />
                <Tooltip title={t("redeems.inStockInfo")} placement="right">
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
                  label={t("redeems.enabled")} />
                <Tooltip title={t("redeems.enabledInfo")} placement="right">
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
                  label={t("redeems.paused")} />
                <Tooltip title={t("redeems.pausedInfo")} placement="right">
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
                  label={t("redeems.isUserInputRequired")} />
                <Tooltip title={t("redeems.isUserInputRequiredInfo")} placement="right">
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
                  label={t("redeems.shouldRedemptionsBeSkipped")} />
                <Tooltip title={t("redeems.shouldRedemptionsBeSkippedInfo")} placement="right">
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
                <TextField label={t("redeems.maxPerStream")} type="number" fullWidth value={form.max_per_stream_value as any} onChange={handleChange('max_per_stream_value')} />
                <FormControlLabel control={<Checkbox checked={!!form.max_per_stream_enabled} onChange={handleCheckbox('max_per_stream_enabled')} />} label={t("common.enabled")} />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title={t("redeems.maxPerStreamInfo")} placement="right">
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
                <TextField label={t("redeems.maxPerUserPerStream")} type="number" fullWidth value={form.max_per_user_value as any} onChange={handleChange('max_per_user_value')} />
                <FormControlLabel control={<Checkbox checked={!!form.max_per_user_enabled} onChange={handleCheckbox('max_per_user_enabled')} />} label={t("common.enabled")} />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title={t("redeems.maxPerUserPerStreamInfo")} placement="right">
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
                <TextField label={t("redeems.globalCooldown")} type="number" fullWidth value={form.global_cooldown as any} onChange={handleChange('global_cooldown')} />
                <FormControlLabel control={<Checkbox checked={!!form.global_cooldown_enabled} onChange={handleCheckbox('global_cooldown_enabled')} />} label={t("common.enabled")} />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" padding={2}>
                <Tooltip title={t("redeems.globalCooldownInfo")} placement="right">
                  <Info fontSize={"medium"} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>
        </StyledBox>

        <StyledBox>
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={handleSave} fullWidth>{t("common.save")}</Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel} fullWidth>{t("common.cancel")}</Button>
              <Button variant="contained" color="error" onClick={handleDeleteClick} disabled={reward?.is_new || false}><Delete /></Button>
            </Stack>
          </Grid>
        </StyledBox>
      </Grid>
    </Box>
  )
});

export default CustomRewardDetails;