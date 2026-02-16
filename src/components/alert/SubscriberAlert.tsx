
import { useContext, useState, useEffect, MutableRefObject } from "react";

import { Stack, Typography, TextField, Tooltip, Button, Box } from "@mui/material"

import { Info, AttachFile, Send, Save } from '@mui/icons-material';

import { styled } from '@mui/material/styles';

import AudioSelector from "@/components/AudioSelector";
import { TranslationContext } from '@/i18n/TranslationProvider';
import { NotificationContext } from '@/context/NotificationProvider';

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

export default function SubscriberAlert({
  iframeRef
}: {
  iframeRef: MutableRefObject<HTMLIFrameElement | null>
}) {
  const { t } = useContext(TranslationContext);
  const { success, error } = useContext(NotificationContext);

  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined | null>(undefined);
  const [audioFile, setAudioFile] = useState<File | undefined | null>(undefined);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [imageText, setImageText] = useState('${username} has subscribed to the channel!');
  const [imageDuration, setImageDuration] = useState(6000);

  useEffect(() => {
    loadDefaultTemplate();
  }, []);

  async function loadDefaultTemplate() {
    try {
      const res = await window.alerts?.loadTemplate('default-subscriberAlert');
      if (res?.ok && res?.template) {
        const template = res.template;
        setImageText(template.text);
        setImageDuration(template.duration);
        if (template.imageDataUrl) setImageFile(dataURLtoFile((template.imageDataUrl as string), "uploaded_logo"));
        if (template.audio && template.audio.base64) setAudioFile(dataURLtoFile((template.audio.base64 as string), "uploaded_audio"));
        if (template.audio && template.audio.base64) setAudioUrl(template.audio.base64);
        if (template.audio && template.audio.audioMuted) setAudioMuted(template.audio.audioMuted);
        if (template.audio && template.audio.volume) setAudioVolume(template.audio.volume);
        console.log('[Alert] Loaded default template');
      }
    } catch (err) {
      console.error('[Alert] Failed to load default template:', err);
    }
  }

  function dataURLtoFile(dataurl: string, filename: string): File {
    let arr = dataurl.split(',')
    let mimeArr = arr[0].match(/:(.*?);/)
    let mime: string | undefined = undefined;
    if (mimeArr && mimeArr[1]) mime = mimeArr[1];
    let extension = '';
    if (mime) {
      const mimeSubtype = mime.split('/')[1];
      if (mimeSubtype) {
        extension = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
      }
    }
    let finalFilename = filename;
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(filename);
    if (extension && !hasExtension) {
      finalFilename = `${filename}.${extension}`;
    }
    let bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], finalFilename, { type: mime });
  }

  function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function sendImageTemplate() {
    setSending(true);
    try {
      let imageDataUrl: string | undefined = undefined;
      let audioDataUrl: string | undefined = undefined;
      if (imageFile) {
        imageDataUrl = await toDataUrl(imageFile);
      } else {
        imageDataUrl = await toDataUrl(new File([await (await fetch('logo.png')).blob()], 'logo.png', { type: 'image/png' }));
      }
      if (audioFile) {
        audioDataUrl = await toDataUrl(audioFile);
      }
      const payload = {
        type: 'imageTemplate',
        imageDataUrl,
        audio: {
          base64: audioDataUrl,
          volume: audioMuted ? 0 : audioVolume,
          audioMuted
        },
        text: imageText,
        duration: imageDuration,
      };
      const res = await window.alerts?.broadcast(payload);
      if (res?.ok) {
        success(t("common.sent"));
      } else {
        error(t("common.error"), res?.error);
      }
    } catch (e: any) { error(t("common.error"), e.message); }
    finally {
      setTimeout(() => {
        setSending(false)
      }, 2000)
    }
  }

  async function saveDefaultTemplate() {
    try {
      let imageDataUrl: string | undefined = undefined;
      let audioDataUrl: string | undefined = undefined;
      if (imageFile) {
        imageDataUrl = await toDataUrl(imageFile);
      } else {
        imageDataUrl = await toDataUrl(new File([await (await fetch('logo.png')).blob()], 'logo.png', { type: 'image/png' }));
      }
      if (audioFile) {
        audioDataUrl = await toDataUrl(audioFile);
      }
      const template = {
        id: 'default-subscriberAlert',
        imageDataUrl,
        audio: {
          base64: audioDataUrl,
          volume: audioMuted ? 0 : audioVolume,
          audioMuted
        },
        text: imageText,
        duration: imageDuration,
      };
      const res = await window.alerts?.saveTemplate(template);
      if (res?.ok) {
        success(t("common.saved"))
      } else {
        error(t("common.error"), res?.error);
      }
      console.log('[Alert] Saved default template');
    } catch (err) {
      console.error('[Alert] Failed to save default template:', err);
    }
  }

  return (
    <Stack spacing={2}>
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
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${username} ')} style={{ cursor: "pointer" }}>
            <strong>${'{username}'}</strong>
            <Tooltip title={t("alert.variableUsername")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${user_display_name} ')} style={{ cursor: "pointer" }}>
            <strong>${'{user_display_name}'}</strong>
            <Tooltip title={t("alert.variableUserDisplayName")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${tier} ')} style={{ cursor: "pointer" }}>
            <strong>${'{tier}'}</strong>
            <Tooltip title={t("alert.variableTier")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
        </Stack>
      </StyledBox>
      
      <StyledBox>
        <AudioSelector
          inline={true}
          value={audioUrl}
          volume={audioVolume}
          muted={audioMuted}
          onChange={async (fileUrl, file) => {
            setAudioUrl(fileUrl);
            setAudioFile(file ?? null);
          }}
          onVolumeChange={(v) => setAudioVolume(v)}
          onMutedChange={(m) => setAudioMuted(m)}
        />
      </StyledBox>

      <StyledBox>
        <Stack direction="row" spacing={2} width={"100%"}>
          <Button
            variant="contained"
            color="success"
            disabled={sending}
            onClick={() => saveDefaultTemplate()}
            style={{
              width: "100%",
            }}
          >
            <Save fontSize="small" sx={{ paddingRight: 1 }} />
            {t("alert.saveTemplate")}
          </Button>
          <Button
            variant="contained"
            disabled={sending}
            onClick={() => sendImageTemplate()}
            style={{
              width: "100%",
            }}
          >
            <Send fontSize="small" sx={{ paddingRight: 1 }} />
            {t("alert.testTemplate")}
          </Button>
          <Button
            component="label"
            variant="outlined"
            color="secondary"
            style={{
              width: "100%",
            }}
          >
            <AttachFile fontSize="small" sx={{ paddingRight: 1 }} />
            {t("alert.selectImage")}
            <input hidden type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </Button>
        </Stack>
      </StyledBox>
    </Stack>
  )
}