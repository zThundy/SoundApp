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

const StyledVariable = styled(Typography)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["700"],
  padding: theme.spacing(1),
  margin: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  display: "flex",
  gap: 10,
}));

export default function AlertEditor() {
  const { t } = useContext(TranslationContext);
  const [serverUrl, setServerUrl] = useState('http://localhost:4823');
  const [tab, setTab] = useState(0);
  // Raw editor state
  const [rawHtml, setRawHtml] = useState('<div style="font-size:4rem;font-weight:700;">Hello!</div>');
  const [rawCss, setRawCss] = useState('');
  const [rawJs, setRawJs] = useState('');
  const [rawDuration, setRawDuration] = useState(10000);

  // Image template state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageText, setImageText] = useState('${username} has redeemed ${reward_title}!');
  const [imageDuration, setImageDuration] = useState(6000);

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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
    // Fetch the server port from the main process
    (window.alerts as any).getPort().then((res: any) => {
      if (!res?.port) return;
      setServerUrl(`http://localhost:${res?.port}`);
      checkServerHealth(`http://localhost:${res?.port}`);
    });

    // Load default template
    loadDefaultTemplate();
  }, []);

  async function loadDefaultTemplate() {
    try {
      const res = await window.alerts?.loadTemplate('default');
      if (res?.ok && res?.template) {
        const template = res.template;
        setImageText(template.text);
        setImageDuration(template.duration);
        // If template has imageDataUrl, we could restore it but File object can't be reconstructed easily
        // For now we just restore text and duration
        console.log('[Alert] Loaded default template');
      }
    } catch (err) {
      console.error('[Alert] Failed to load default template:', err);
    }
  }

  async function saveDefaultTemplate() {
    try {
      let imageDataUrl: string | undefined = undefined;
      if (imageFile) {
        imageDataUrl = await toDataUrl(imageFile);
      } else {
        // add logo.png as default image
        imageDataUrl = await toDataUrl(new File([await (await fetch('logo.png')).blob()], 'logo.png', { type: 'image/png' }));
      }
      const template = {
        id: 'default',
        imageDataUrl,
        text: imageText,
        duration: imageDuration,
      };
      await window.alerts?.saveTemplate(template);
      console.log('[Alert] Saved default template');
    } catch (err) {
      console.error('[Alert] Failed to save default template:', err);
    }
  }

  // Health check: fetch the root page; if network fails or status !200 => error
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

  function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function sendRaw() {
    setSending(true);
    setStatus(null);
    try {
      const payload = { type: 'raw', html: rawHtml, css: rawCss, js: rawJs, duration: rawDuration };
      const res = await window.alerts?.broadcast(payload);
      setStatus(res?.ok ? t("common.sent") : t("common.error") + " " + res?.error);
    } catch (e: any) { setStatus(t("common.error") + " " + e.message); }
    finally { setSending(false); }
  }

  async function sendImageTemplate() {
    setSending(true);
    setStatus(null);
    try {
      let image = null;
      if (imageFile) {
        image = await toDataUrl(imageFile);
      } else {
        // add logo.png as default image
        image = await toDataUrl(new File([await (await fetch('logo.png')).blob()], 'logo.png', { type: 'image/png' }));
      }
      const payload = { type: 'imageTemplate', imageDataUrl: image, text: imageText, duration: imageDuration };
      const res = await window.alerts?.broadcast(payload);
      setStatus(res?.ok ? t("common.sent") : t("common.error") + " " + res?.error);

      // Save as default template after successful send
      if (res?.ok) {
        await saveDefaultTemplate();
      }
    } catch (e: any) { setStatus(t("common.error") + " " + e.message); }
    finally {
      setTimeout(() => {
        setSending(false)
      }, 2000)
    }
  }

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>{t('alert.alert')}</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={t('alert.imageTemplate')} />

        <Tooltip title={t('alert.comingSoon')} placement="top" arrow>
          <Tab label={t('alert.customHtmlCssJs')} disabled />
        </Tooltip>
      </Tabs>

      <Grid container spacing={{ lg: 2, md: 6 }} height="100%">
        <Grid size={{ lg: 8, md: 12 }} height="100%">
          <Box mt={2} p={2} className={style.container}>

            {tab === 0 && (
              <Stack spacing={2}>
                {imageFile && <Typography fontSize={12}>File: {imageFile.name}</Typography>}
                <StyledBox>
                  <TextField
                    label={t("alert.textFieldLabel")}
                    value={imageText}
                    onChange={e => setImageText(e.target.value)}
                    fullWidth
                  />
                </StyledBox>

                <StyledBox>
                  <TextField
                    label={t("alert.durationMs")}
                    type="number"
                    value={imageDuration}
                    onChange={e => setImageDuration(parseInt(e.target.value) || 6000)}
                    fullWidth
                  />
                </StyledBox>

                <StyledBox>
                  <Stack direction="row" flexWrap="wrap" justifyContent={"flex-start"}>
                    <StyledVariable variant="body2" onClick={() => setImageText(prev => prev + '${username} ')} style={{ cursor: "pointer" }}>
                      <strong>${'{username}'}</strong>
                      <Tooltip title={t("alert.variableUsername")} placement="top" arrow style={{ cursor: "pointer" }}>
                        <Info />
                      </Tooltip>
                    </StyledVariable>
                    <StyledVariable variant="body2" onClick={() => setImageText(prev => prev + '${user_display_name} ')} style={{ cursor: "pointer" }}>
                      <strong>${'{user_display_name}'}</strong>
                      <Tooltip title={t("alert.variableUserDisplayName")} placement="top" arrow style={{ cursor: "pointer" }}>
                        <Info />
                      </Tooltip>
                    </StyledVariable>
                    <StyledVariable variant="body2" onClick={() => setImageText(prev => prev + '${reward_title} ')} style={{ cursor: "pointer" }}>
                      <strong>${'{reward_title}'}</strong>
                      <Tooltip title={t("alert.variableRewardTitle")} placement="top" arrow style={{ cursor: "pointer" }}>
                        <Info />
                      </Tooltip>
                    </StyledVariable>
                    <StyledVariable variant="body2" onClick={() => setImageText(prev => prev + '${reward_cost} ')} style={{ cursor: "pointer" }}>
                      <strong>${'{reward_cost}'}</strong>
                      <Tooltip title={t("alert.variableRewardCost")} placement="top" arrow style={{ cursor: "pointer" }}>
                        <Info />
                      </Tooltip>
                    </StyledVariable>
                    <StyledVariable variant="body2" onClick={() => setImageText(prev => prev + '${user_input} ')} style={{ cursor: "pointer" }}>
                      <strong>${'{user_input}'}</strong>
                      <Tooltip title={t("alert.variableUserInput")} placement="top" arrow style={{ cursor: "pointer" }}>
                        <Info />
                      </Tooltip>
                    </StyledVariable>
                  </Stack>
                </StyledBox>

                <Stack direction="row" spacing={2} width={"100%"}>
                  <Button
                    variant="contained"
                    disabled={sending}
                    onClick={sendImageTemplate}
                    style={{
                      width: "100%",
                    }}
                  >
                    {t("alert.sendTemplate")}
                  </Button>
                  <Button
                    component="label"
                    variant="outlined"
                    color="secondary"
                    style={{
                      width: "100%",
                    }}
                  >
                    {t("alert.selectImage")}
                    <input hidden type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </Button>
                </Stack>

                <Collapse in={sending}>
                  <Alert severity={status?.startsWith('Errore') ? 'error' : 'success'} style={{ width: "calc(100% - 20px)", padding: 10 }}>
                    {status}
                  </Alert>
                </Collapse>
              </Stack>
            )}
            {tab === 1 && (
              <Stack spacing={2}>
                <Typography variant="body2" color="warning.main">
                  Attenzione: l'HTML verrà iniettato nella pagina OBS. Evita codice non fidato. I tag &lt;script&gt; vengono rimossi, ma il JS nel campo dedicato viene eseguito.
                </Typography>
                <TextField label="HTML" multiline minRows={4} value={rawHtml} onChange={e => setRawHtml(e.target.value)} />
                <TextField label="CSS" multiline minRows={2} value={rawCss} onChange={e => setRawCss(e.target.value)} />
                <TextField label="JavaScript" multiline minRows={2} value={rawJs} onChange={e => setRawJs(e.target.value)} />
                <TextField label="Durata (ms)" type="number" value={rawDuration} onChange={e => setRawDuration(parseInt(e.target.value) || 10000)} />
                <Button variant="contained" disabled={sending} onClick={sendRaw}>Invia Alert Custom</Button>
              </Stack>
            )}
          </Box>
        </Grid>

        <Grid size={{ lg: 4, md: 12 }} height="100%">
          <Stack
            spacing={2}
            className={style.container}
            p={2}
            mt={2}
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
                        // Simple re-check without touching iframe src (keeps current view)
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
