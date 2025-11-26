import React from "react";
import { Box, Button, Stack, Typography, Slider, IconButton, Tooltip, Grid, Fade } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from "@mui/icons-material";

import styled from "@emotion/styled";

type Props = {
  value?: string | null; // file URL
  onChange?: (fileUrl: string | null, file?: File | null) => void;
};

const StyledControlsContainer = styled(Box)(({ theme }: any) => ({
  display: "flex",
  alignItems: "center",
  width: "calc(100% - 32px)",
  backgroundColor: theme.palette.background["750"],
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
}));

const StyledTimeTypography = styled(Typography)(({ theme }: any) => ({
  minWidth: 64,
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background["700"],
  borderRadius: theme.shape.borderRadius,
}));

const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function AudioSelector({ value, onChange }: Props) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = React.useState<string | null>(value ?? null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [volumeLabel, setVolumeLabel] = React.useState("100");
  const [muted, setMuted] = React.useState(false);
  const [hoverVol, setHoverVol] = React.useState(false);

  // Use a fixed media query: convert slider when viewport < 1200px
  const isBelow1200 = useMediaQuery("(max-width:1200px)");

  // Optional: react to viewport change
  React.useEffect(() => {
    // console.log("viewport <1200px:", isBelow1200);
  }, [isBelow1200]);

  React.useEffect(() => {
    setSrc(value ?? null);
  }, [value]);

  const handleFilePick = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] ?? null;
    if (!file) return;
    // accept only audio mime types
    if (!file.type.startsWith("audio/")) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setIsPlaying(false);
    setCurrentTime(0);
    if (onChange) onChange(url, file);
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        await el.play();
        setIsPlaying(true);
      } catch (e) {
        // autoplay or play error
      }
    }
  };

  const onLoadedMetadata = () => {
    const el = audioRef.current;
    if (!el) return;
    setDuration(el.duration || 0);
  };

  const onTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime || 0);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (_: Event, val: number | number[]) => {
    const el = audioRef.current;
    if (!el) return;
    const t = Array.isArray(val) ? val[0] : val;
    el.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (_: Event, val: number | number[]) => {
    const el = audioRef.current;
    const v = (Array.isArray(val) ? val[0] : val) / 100;
    setVolume(v);
    setVolumeLabel(Math.round((Array.isArray(val) ? val[0] : val)).toString());
    if (el) el.volume = v;
  };

  const toggleMute = () => {
    const el = audioRef.current;
    const next = !muted;
    setMuted(next);
    if (el) el.muted = next;
  };

  const clearAudio = () => {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (onChange) onChange(null, null);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      width={"100%"}
    // style={{ backgroundColor: "white" }}
    >
      <StyledControlsContainer>
        <Stack direction="row" width="100%">
          <audio
            ref={audioRef}
            src={src ?? undefined}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
          />

          <Grid container direction="row" alignItems="center" justifyContent={"space-around"} spacing={2} sx={{ width: "100%" }}>
            <Grid size={{ lg: 1, md: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                <Tooltip title={isPlaying ? "Pausa" : "Riproduci"}>
                  <IconButton color="primary" onClick={togglePlay} disabled={!src}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>

            <Grid size={{ lg: 8, md: 10 }}>
              <Stack direction="row" alignItems="center" spacing={{ lg: 3, md: 2 }} width={{ lg: "100%", md: "90%" }}>
                <StyledTimeTypography variant="body">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </StyledTimeTypography>

                <Slider
                  sx={{ width: "100%", flex: 1 }}
                  value={Math.min(currentTime, duration)}
                  min={0}
                  max={Math.max(duration, 0.01)}
                  step={0.01}
                  onChange={handleSeek as any}
                />
              </Stack>
            </Grid>

            <Grid size={{ lg: 3, md: 1 }} pr={{ lg: 2, md: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                <Box
                  position="relative"
                  onMouseEnter={() => isBelow1200 && setHoverVol(true)}
                  onMouseLeave={() => isBelow1200 && setHoverVol(false)}
                >
                  <Tooltip title={muted ? "Riattiva audio" : "Silenzia"} placement="top">
                    <IconButton onClick={toggleMute}>
                      {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                  </Tooltip>

                  {isBelow1200 && hoverVol && (
                    <Fade in={hoverVol} timeout={200} unmountOnExit>
                      <Box
                        position="absolute"
                        bottom={-8}
                        left={"60%"}
                        sx={{
                          transform: "translateX(-50%) translateY(90%)",
                          padding: "2rem 1rem 1rem 1rem",
                          border: "1px solid",
                          borderColor: "background.850",
                        }}
                        zIndex={10}
                        bgcolor={"background.750"}
                        borderRadius={1}
                        boxShadow={3}

                      >
                        <Slider
                          orientation="vertical"
                          value={muted ? 0 : volumeLabel ? parseInt(volumeLabel) : Math.round(volume * 100)}
                          min={0}
                          max={100}
                          step={1}
                          onChange={handleVolume as any}
                          sx={{ height: 120 }}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </Fade>
                  )}
                </Box>

                {!isBelow1200 && (
                  <Slider
                    value={muted ? 0 : volumeLabel ? parseInt(volumeLabel) : Math.round(volume * 100)}
                    min={0}
                    max={100}
                    step={1}
                    onChange={handleVolume as any}
                    sx={{ width: 120 }}
                    valueLabelDisplay="auto"
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </StyledControlsContainer>

      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Button variant="contained" component="label" fullWidth>
          Seleziona audio
          <input hidden type="file" accept="audio/*" onChange={handleFilePick} />
        </Button>
        {src && (
          <Button variant="outlined" color="secondary" onClick={clearAudio} fullWidth>
            Rimuovi
          </Button>
        )}
      </Stack>
    </Box >
  );
}
