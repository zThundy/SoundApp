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

const testMessages = [
  { username: 'CoolGamer123', message: 'Hey everyone! How is the stream going?', color: '#FF6B6B' },
  { username: 'ProPlayer99', message: 'This game looks amazing!', color: '#4ECDC4' },
  { username: 'StreamFan', message: 'Can you try that move again?', color: '#95E1D3' },
  { username: 'NightOwl', message: 'Finally caught the stream live!', color: '#F38181' },
  { username: 'GamerGirl', message: 'Your setup is incredible!', color: '#AA96DA' },
  { username: 'ChatMaster', message: 'What are your keybinds?', color: '#FCBAD3' },
  { username: 'TechWizard', message: 'That was insane!', color: '#A8D8EA' },
  { username: 'PixelHunter', message: 'GG well played', color: '#FFCCCC' },
  { username: 'SpeedRunner', message: 'How long have you been playing?', color: '#B4E7CE' },
  { username: 'CodeNinja', message: 'Nice combo!', color: '#FFD93D' },
  { username: 'RetroGamer', message: 'This brings back memories', color: '#6BCB77' },
  { username: 'EpicViewer', message: 'Best stream today!', color: '#FF6B9D' },
];

export default function ChatBoxEditor() {
  const { t } = useContext(TranslationContext);
  const { success, error } = useContext(NotificationContext);

  const [chatServerUrl, setChatServerUrl] = useState('http://localhost:4824/chat');
  const [tab, setTab] = useState(0);

  // Raw HTML/CSS/JS tab
  const [rawHtml, setRawHtml] = useState(`<div id="container">
  <div id="header">Twitch Chat</div>
  <div id="messages"></div>
</div>`);
  const [rawCss, setRawCss] = useState(`html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #000;
  font-family: system-ui, Arial, sans-serif;
}

#container {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(145, 70, 255, 0.5);
  border-radius: 8px;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

#header {
  padding: 10px 15px;
  background: linear-gradient(135deg, rgba(145, 70, 255, 0.6), rgba(75, 0, 130, 0.6));
  border-bottom: 1px solid rgba(145, 70, 255, 0.3);
  font-weight: bold;
  color: #fff;
  font-size: 2rem;
}

#messages {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.message {
  animation: slideIn 0.3s ease-out;
  font-size: 1.5rem;
  line-height: 1.3;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.username {
  font-weight: 600;
  margin-right: 5px;
  display: inline;
}

.message-text {
  color: #e0e0e0;
  word-wrap: break-word;
  display: inline;
}`);
  const [rawJs, setRawJs] = useState(`onChatMessage = function(data) {
  // add any custom logic here
}`);

  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Send test messages to preview iframe
  useEffect(() => {
    const interval = setInterval(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const randomMsg = testMessages[Math.floor(Math.random() * testMessages.length)];
        
        try {
          iframeRef.current.contentWindow.postMessage({
            type: 'test-message',
            username: randomMsg.username,
            message: randomMsg.message,
            color: randomMsg.color
          }, '*');
        } catch (err) {
          console.error('[ChatBox] Failed to send test message to iframe:', err);
        }
      }
    }, 3000); // Send a message every 3 seconds

    return () => clearInterval(interval);
  }, []);

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

  async function saveChatCustomization() {
    try {
      const res = await window.chat?.saveHtml(rawHtml, rawCss, rawJs);
      if (res?.ok) {
        success(t("common.saved"));
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
                rawHtml={rawHtml}
                setRawHtml={setRawHtml}
                rawCss={rawCss}
                setRawCss={setRawCss}
                rawJs={rawJs}
                setRawJs={setRawJs}
                saveChatCustomization={saveChatCustomization}
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
                saveChatCustomization={saveChatCustomization}
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
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { width: 100%; height: 100%; overflow: hidden; }
                        ${rawCss}
                      </style>
                    </head>
                    <body>
                      ${rawHtml}
                      <script>
                        // Listen for test messages from parent
                        window.addEventListener('message', function(event) {
                          if (event.data && event.data.type === 'test-message') {
                            const messagesContainer = document.getElementById('messages');
                            if (messagesContainer && typeof addMessage === 'function') {
                              addMessage(event.data.username, event.data.message, event.data.color);
                            } else if (messagesContainer) {
                              // Fallback if addMessage doesn't exist
                              const messageEl = document.createElement('div');
                              messageEl.className = 'message';
                              
                              const usernameEl = document.createElement('span');
                              usernameEl.className = 'username';
                              usernameEl.textContent = event.data.username + ':';
                              usernameEl.style.color = event.data.color;
                              
                              const textEl = document.createElement('span');
                              textEl.className = 'message-text';
                              textEl.textContent = ' ' + event.data.message;
                              
                              messageEl.appendChild(usernameEl);
                              messageEl.appendChild(textEl);
                              messagesContainer.appendChild(messageEl);
                              
                              messagesContainer.scrollTop = messagesContainer.scrollHeight;
                              
                              const MAX_MESSAGES = 50;
                              while (messagesContainer.children.length > MAX_MESSAGES) {
                                messagesContainer.removeChild(messagesContainer.firstChild);
                              }
                            }

                            if (onChatMessage && typeof onChatMessage === 'function') onChatMessage(event.data);
                          }
                        });
                        
                        ${rawJs}
                      </script>
                    </body>
                    </html>
                  `}
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
