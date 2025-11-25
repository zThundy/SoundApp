import { useState } from 'react';
import { Box, Tabs, Tab, TextField, Button, Typography, Stack } from '@mui/material';

declare global {
  interface Window {
    alerts?: { broadcast: (payload: any) => Promise<any> };
  }
}

export default function AlertEditor() {
  const [tab, setTab] = useState(0);
  // Raw editor state
  const [rawHtml, setRawHtml] = useState('<div style="font-size:4rem;font-weight:700;">Hello!</div>');
  const [rawCss, setRawCss] = useState('');
  const [rawJs, setRawJs] = useState('');
  const [rawDuration, setRawDuration] = useState(10000);

  // Image template state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageText, setImageText] = useState('Nuovo redeem!');
  const [imageDuration, setImageDuration] = useState(6000);

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
    } catch (e:any) { setStatus('Errore invio: ' + e.message); }
    finally { setSending(false); }
  }

  async function sendImageTemplate() {
    if (!imageFile) { setStatus('Seleziona un\'immagine'); return; }
    setSending(true); setStatus(null);
    try {
      const dataUrl = await toDataUrl(imageFile);
      const payload = { type: 'imageTemplate', imageDataUrl: dataUrl, text: imageText, duration: imageDuration };
      const res = await window.alerts?.broadcast(payload);
      setStatus(res?.ok ? 'Inviato!' : 'Errore: ' + res?.error);
    } catch (e:any) { setStatus('Errore invio: ' + e.message); }
    finally { setSending(false); }
  }

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Editor Alert OBS</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Custom HTML/CSS/JS" />
        <Tab label="Template Immagine" />
      </Tabs>
      <Box mt={2}>
        {tab === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="warning.main">
              Attenzione: l'HTML verrà iniettato nella pagina OBS. Evita codice non fidato. I tag &lt;script&gt; vengono rimossi, ma il JS nel campo dedicato viene eseguito.
            </Typography>
            <TextField label="HTML" multiline minRows={4} value={rawHtml} onChange={e => setRawHtml(e.target.value)} />
            <TextField label="CSS" multiline minRows={2} value={rawCss} onChange={e => setRawCss(e.target.value)} />
            <TextField label="JavaScript" multiline minRows={2} value={rawJs} onChange={e => setRawJs(e.target.value)} />
            <TextField label="Durata (ms)" type="number" value={rawDuration} onChange={e => setRawDuration(parseInt(e.target.value)||10000)} />
            <Button variant="contained" disabled={sending} onClick={sendRaw}>Invia Alert Custom</Button>
          </Stack>
        )}
        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2">Mostra un\'immagine con fade e testo sotto.</Typography>
            <Button component="label" variant="outlined">Seleziona Immagine
              <input hidden type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </Button>
            {imageFile && <Typography fontSize={12}>File: {imageFile.name}</Typography>}
            <TextField label="Testo" value={imageText} onChange={e => setImageText(e.target.value)} />
            <TextField label="Durata (ms)" type="number" value={imageDuration} onChange={e => setImageDuration(parseInt(e.target.value)||6000)} />
            <Button variant="contained" disabled={sending} onClick={sendImageTemplate}>Invia Template Immagine</Button>
          </Stack>
        )}
      </Box>
      {status && <Typography mt={2} color={status.startsWith('Errore') ? 'error.main':'success.main'}>{status}</Typography>}
    </Box>
  );
}
