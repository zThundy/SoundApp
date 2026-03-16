import { useEffect, useState, useRef, useContext } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Stack,
  Grid,
  IconButton,
  Paper,
  InputBase,
  Tooltip,
  Zoom,
  Alert,
  Collapse,
  Select,
  MenuItem,
  ListSubheader,
  FormControl
} from '@mui/material';

import {
  CopyAll as Clipboard,
  Close,
  OpenInNew,
  ErrorOutline,
  Info,
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';

import style from "./alert.module.css"

import { TranslationContext } from '@/i18n/TranslationProvider';
import SoundAlert from "@/components/alert/SoundAlert";
import FollowAlert from "@/components/alert/FollowAlert";
import SubscriberAlert from "@/components/alert/SubscriberAlert";
import SubscriberGiftAlert from "@/components/alert/SubscriberGiftAlert";
import SubscriberMessageAlert from "@/components/alert/SubscriberMessageAlert";
import BitsAlert from "@/components/alert/BitsAlert";
import RaidAlert from "@/components/alert/RaidAlert";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["850"],
  padding: theme.spacing(2.2),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "space-between",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  maxHeight: "fit-content",
  width: "calc(100% - )" + theme.spacing(4),
  height: "100%",
  transition: "background-color .2s ease-in-out",

  ":hover": {
    backgroundColor: (theme.palette as any).background["800"],
  }
}));

export default function AlertEditor() {
  const { t } = useContext(TranslationContext);

  const [serverUrl, setServerUrl] = useState('http://localhost:4823/alerts');
  const [tab, setTab] = useState(0);

  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    (window.alerts as any).getPort().then((res: any) => {
      if (!res?.port) return;
      setServerUrl(`http://localhost:${res?.port}/alerts`);
      checkServerHealth(`http://localhost:${res?.port}`);
    });
  }, []);

  async function checkServerHealth(currentUrl: string) {
    setChecking(true);
    setIframeError(false);
    try {
      const resp = await fetch(currentUrl + "/health", { method: 'GET', cache: 'no-store' });
      if (!resp.ok) {
        setIframeError(true);
      } else {
        setIframeError(false);
      }
    } catch {
      setIframeError(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <Box p={2}>
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        pl={3}
        pr={3}
        pt={1}
        pb={1}
      >
        <Typography variant="h5" mb={2}>{t('alert.alert')}</Typography>
        <FormControl sx={{ m: 1, minWidth: 240 }} size="small">
          <Select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            >
            <ListSubheader>{t('alert.soundAlertsCategory')}</ListSubheader>
            <MenuItem value={0}>{t('alert.soundAlerts')}</MenuItem>
            <ListSubheader>{t('alert.alertfollowCategory')}</ListSubheader>
            <MenuItem value={1}>{t('alert.followAlerts')}</MenuItem>
            <ListSubheader>{t('alert.subscriptionCategory')}</ListSubheader>
            <MenuItem value={2}>{t('alert.subAlerts')}</MenuItem>
            <MenuItem value={3}>{t('alert.giftSubAlerts')}</MenuItem>
            <MenuItem value={4}>{t('alert.messageSubAlerts')}</MenuItem>
            <ListSubheader>{t('alert.bitsCategory')}</ListSubheader>
            <MenuItem value={5}>{t('alert.bitsAlerts')}</MenuItem>
            <ListSubheader>{t('alert.raidCategory')}</ListSubheader>
            <MenuItem value={6}>{t('alert.raidAlerts')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={{ lg: 2, md: 6 }} height="100%">
        <Grid size={{ lg: 8, md: 12 }} height="100%">
          <Box p={2} className={style.container}>
            {tab === 0 && (
              <SoundAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 1 && (
              <FollowAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 2 && (
              <SubscriberAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 3 && (
              <SubscriberGiftAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 4 && (
              <SubscriberMessageAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 5 && (
              <BitsAlert
                iframeRef={iframeRef}
              />
            )}
            {tab === 6 && (
              <RaidAlert
                iframeRef={iframeRef}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ lg: 4, md: 12 }} height="100%">
          <Stack
            spacing={2}
            className={style.container}
            p={2}
            justifyContent={"space-between"}
            height="100%"
          >
            <StyledBox>
              <Typography variant="h6">{t("alert.preview")}</Typography>
            </StyledBox>

            <StyledBox>
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  width: "100%",
                  backgroundColor: "rgba(0,0,0,0)",
                  border: (theme) => `1px solid ${(theme.palette as any).background["700"]}`
                }}
              >
                <Tooltip
                  title={copied ? t("common.copied") : t("common.copyToClipboard")}
                  placement={"top"}
                  slots={{
                    transition: Zoom
                  }}
                  arrow
                >
                  <IconButton
                    sx={{ p: '10px' }}
                    aria-label="menu"
                    onClick={() => {
                      navigator.clipboard.writeText(serverUrl);
                      setCopied(true);
                    }}
                  >
                    <Clipboard />
                  </IconButton>
                </Tooltip>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  value={serverUrl}
                />
              </Paper>
            </StyledBox>

            <StyledBox sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Tooltip title={t("alert.openInBrowser")} placement="top" arrow>
                  <IconButton
                    aria-label="open-external"
                    onClick={() => window.ipcRenderer?.invoke('open-external', serverUrl)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                    }}
                    size="small"
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                <iframe
                  ref={iframeRef}
                  title={t("alert.previewIframeTitle")}
                  src={serverUrl}
                  style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none' }}
                />
                {iframeError && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      width: '100%',
                      height: '100%',
                      color: 'text.primary',
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }}
                  >
                    <ErrorOutline sx={{ fontSize: 48 }} />
                    <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>{t("alert.errorContactingServer")}<br />{t("alert.tryRestartingServer")}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ p: "8px 16px", fontSize: 15 }}
                      onClick={() => {
                        checkServerHealth(serverUrl);
                      }}
                    >{checking ? t("update.checking") : t("common.ok")}</Button>
                  </Box>
                )}
              </Box>
            </StyledBox>

          </Stack>
        </Grid >
      </Grid >
    </Box >
  );
}
