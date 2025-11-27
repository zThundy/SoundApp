import { useEffect, useState, useRef } from 'react';
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
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';

import style from "./alert.module.css"

declare global {
  interface Window {
    alerts: {
      broadcast(payload: any): Promise<{ ok: boolean; error?: string }>;
      getPort(): Promise<{ port: number }>;
      setPort(port: number): Promise<{ ok: boolean; port?: number; requiresRestart?: boolean; error?: string }>;
      restart(): Promise<{ ok: boolean; port?: number; error?: string }>;
    };
  }
}

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
  }, []);

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
    setSending(true); setStatus(null);
    try {
      const payload = { type: 'raw', html: rawHtml, css: rawCss, js: rawJs, duration: rawDuration };
      const res = await window.alerts?.broadcast(payload);
      setStatus(res?.ok ? 'Inviato!' : 'Errore: ' + res?.error);
    } catch (e: any) { setStatus('Errore invio: ' + e.message); }
    finally { setSending(false); }
  }

  async function sendImageTemplate() {
    // if (!imageFile) { setStatus('Seleziona un\'immagine'); return; }
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
      setStatus(res?.ok ? 'Inviato!' : 'Errore: ' + res?.error);
    } catch (e: any) { setStatus('Errore invio: ' + e.message); }
    finally {
      setTimeout(() => {
        setSending(false)
      }, 2000)
    }
  }

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Alert Editor</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Template Immagine" />

        <Tooltip title="Coming soon..." placement="top" arrow>
          <Tab label="Custom HTML/CSS/JS" disabled />
        </Tooltip>
      </Tabs>

      <Grid container spacing={{ lg: 2, md: 6 }} >
        <Grid size={{ lg: 8, md: 12 }}>
          <Box mt={2} p={2} className={style.container}>

            {tab === 0 && (
              <Stack spacing={2}>
                <Typography variant="body2">Mostra un\'immagine con fade e testo sotto.</Typography>
                {imageFile && <Typography fontSize={12}>File: {imageFile.name}</Typography>}
                <StyledBox>
                  <TextField
                    label="Testo"
                    value={imageText}
                    onChange={e => setImageText(e.target.value)}
                    fullWidth
                  />
                </StyledBox>
                <StyledBox>
                  <TextField
                    label="Durata (ms)"
                    type="number"
                    value={imageDuration}
                    onChange={e => setImageDuration(parseInt(e.target.value) || 6000)}
                    fullWidth
                  />
                </StyledBox>
                <Stack direction="row" spacing={2} width={"100%"}>
                  <Button variant="contained" disabled={sending} onClick={sendImageTemplate}>Invia Template Immagine</Button>
                  <Button component="label" variant="outlined" color="secondary">Seleziona Immagine
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

        <Grid size={{ lg: 4, md: 12 }}>
          <Stack
            spacing={2}
            className={style.container}
            p={2}
            mt={2}
            justifyContent={"space-between"}
          >
            <Typography variant="h6">Anteprima Alert</Typography>

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
                  title={copied ? "Copiato!" : "Copia negli appunti"}
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

            <StyledBox>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <Tooltip title="Apri nel browser" placement="top" arrow>
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
                  title="Alert Preview"
                  src={serverUrl}
                  style={{ width: '100%', height: '25rem', border: 'none' }}
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
                      height: '25rem',
                      color: 'text.primary',
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }}
                  >
                    <ErrorOutline sx={{ fontSize: 48 }} />
                    <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>Errore nel contattare il server<br />Prova a riavviare il server e riprova.</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ p: "8px 16px", fontSize: 15 }}
                      onClick={() => {
                        // Simple re-check without touching iframe src (keeps current view)
                        checkServerHealth(serverUrl);
                      }}
                    >{checking ? 'Verifico...' : 'Riprova'}</Button>
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
