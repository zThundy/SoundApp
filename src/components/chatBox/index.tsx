import { useEffect, useState, useRef, useContext } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Typography,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Zoom,
  Paper,
  InputBase,
} from '@mui/material';

import {
  CopyAll as Clipboard,
  OpenInNew,
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';

import style from "./chatBox.module.css"

import { TranslationContext } from '@/i18n/TranslationProvider';
import { NotificationContext } from '@/context/NotificationProvider';

import Custom from '@/components/chatBox/Custom';
import Templates from '@/components/chatBox/Templates';

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

export default function ChatBoxEditor() {
  const { t } = useContext(TranslationContext);
  const { success, error } = useContext(NotificationContext);

  const [chatServerUrl, setChatServerUrl] = useState('http://localhost:4824/chat');
  const [tab, setTab] = useState(0);

  // Raw HTML/CSS/JS tab
  const [rawHtml, setRawHtml] = useState(``);
  const [rawCss, setRawCss] = useState(``);
  const [rawJs, setRawJs] = useState(``);

  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    (window.alerts as any).getPort().then((res: any) => {
      if (!res?.port) return;
      setChatServerUrl(`http://localhost:${res?.port}/chat`);
    });

    loadChatCustomization();
  }, []);

  async function loadChatCustomization() {
    try {
      const res = await window.chat?.loadHtml();
      if (res?.ok) {
        if (res.html) setRawHtml(res.html);
        if (res.css) setRawCss(res.css);
        if (res.js) setRawJs(res.js);
        console.log('[ChatBox] Loaded custom HTML/CSS/JS');
      }
    } catch (err) {
      console.error('[ChatBox] Failed to load custom HTML/CSS/JS:', err);
    }
  }

  async function saveChatCustomization(html: string, css: string, js: string) {
    try {
      console.log('[ChatBox] Saving custom HTML/CSS/JS...');
      console.log(html);
      console.log(css);
      console.log(js);
      const res = await window.chat?.saveHtml(html, css, js);
      if (res?.ok) {
        success(t("common.saved"));
        setRawHtml(html);
        setRawCss(css);
        setRawJs(js);
        if (iframeRef && iframeRef?.current) {
          iframeRef.current.src = chatServerUrl;
        }
      } else {
        error(t("common.error"), res?.error);
      }
    } catch (e: any) {
      console.error('[ChatBox] Failed to save custom HTML/CSS/JS:', e);
      error(t("common.error"), e.message);
    } finally {
    }
  }

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>{t("chatBox.title")}</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={t("chatBox.templates")} />
        <Tab label={t("chatBox.customHtmlCssJs")} />
      </Tabs>

      <Grid container spacing={{ lg: 2, md: 6 }} height="100%">
        <Grid size={{ lg: 8, md: 12 }} height="100%">
          <Box p={2} className={style.container}>
            {tab === 0 && (
              <Templates
                saveChatCustomization={(html: string, css: string, js: string) => saveChatCustomization(html, css, js)}
              />
            )}
            {tab === 1 && (
              <Custom
                rawHtml={rawHtml}
                setRawHtml={setRawHtml}
                rawCss={rawCss}
                setRawCss={setRawCss}
                rawJs={rawJs}
                setRawJs={setRawJs}
                saveChatCustomization={() => saveChatCustomization(rawHtml, rawCss, rawJs)}
              />
            )}
          </Box>
        </Grid>

        <Grid
          size={{ lg: 4, md: 12 }}
          height="100%"
          sx={{
            position: { lg: 'sticky', md: 'relative' },
            top: { lg: 16, md: 0 },
            alignSelf: { lg: 'flex-start', md: 'auto' }
          }}
        >
          <Stack
            spacing={2}
            className={style.container}
            p={2}
            justifyContent={"space-between"}
            height="100%"
          >
            <StyledBox>
              <Typography variant="h6">{t("chatBox.preview")}</Typography>
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
                      navigator.clipboard.writeText(chatServerUrl);
                      setCopied(true);
                    }}
                  >
                    <Clipboard />
                  </IconButton>
                </Tooltip>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  value={chatServerUrl}
                  readOnly
                />
              </Paper>
            </StyledBox>

            <StyledBox sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Tooltip title={t("chatBox.openInBrowser")} placement="top" arrow>
                  <IconButton
                    aria-label="open-external"
                    onClick={() => window.ipcRenderer?.invoke('open-external', chatServerUrl)}
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
                  title={t("chatBox.previewIframeTitle")}
                  src={chatServerUrl}
                  style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none' }}
                />
              </Box>
            </StyledBox>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
