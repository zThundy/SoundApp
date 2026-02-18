import React, { useContext } from 'react';
import { TranslationContext } from '@/i18n/TranslationProvider';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, styled, Box } from '@mui/material';

interface ChangeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string | undefined;
  templateHtml?: string;
  templateCss?: string;
}

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["800"],
  padding: theme.spacing(.5),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "space-between",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  width: "calc(100% - 8px)",
  transition: "background-color .2s ease-in-out",
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',

  '& .MuiPaper-root': {
    width: "80vw",
    maxWidth: "1000px",
    padding: theme.spacing(2),
    backgroundColor: (theme.palette as any).background["850"],
    color: (theme.palette as any).text.primary,
    backgroundImage: 'none',
  },
  
  // dialog title
  '& .MuiDialogTitle-root': {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
}));

const ChangeTemplateModal: React.FC<ChangeTemplateModalProps> = ({ isOpen, onClose, onConfirm, templateName, templateHtml, templateCss }) => {
  const { t } = useContext(TranslationContext);

  return (
    <StyledDialog
      open={isOpen}
      onClose={onClose}
    >
      <StyledBox>
        <DialogTitle>{t('chatBox.changeTemplateTitle')}</DialogTitle>
      </StyledBox>
      <DialogContent>
        <Typography>
          {t('chatBox.changeTemplateConfirmation', { templateName })}
        </Typography>
        <Box mt={2} width="100%">
          <iframe
            title={t("chatBox.previewIframeTitle")}
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; position: relative; }
                  body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('./logo.png'); background-repeat: repeat; background-size: 60px 60px; opacity: 0.2; pointer-events: none; z-index: -1; }
                  ${templateCss || ''}
                </style>
              </head>
              <body>
                ${templateHtml || ''}
                <script>
                  (function () {
                    const messagesRoot = document.getElementById('messages');
                    if (!messagesRoot) return;

                    const users = [
                      { name: 'chattycat' },
                      { name: 'pixelpirate' },
                      { name: 'soundwave' },
                      { name: 'nightowl' },
                      { name: 'sparkbyte' }
                    ];

                    const texts = [
                      'Hello everyone!',
                      'This overlay is clean.',
                      'Testing, testing.',
                      'Nice stream!',
                      'Love this template.'
                    ];

                    const randomColor = () => {
                      const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
                      return '#' + hex;
                    };

                    const addMessage = () => {
                      const user = users[Math.floor(Math.random() * users.length)];
                      const text = texts[Math.floor(Math.random() * texts.length)];

                      const messageEl = document.createElement('div');
                      messageEl.className = 'message';

                      const usernameEl = document.createElement('span');
                      usernameEl.className = 'username';
                      usernameEl.textContent = user.name + ':';
                      usernameEl.style.color = randomColor();
                      messageEl.appendChild(usernameEl);

                      const textEl = document.createElement('span');
                      textEl.className = 'message-text';
                      textEl.textContent = text;
                      messageEl.appendChild(textEl);

                      messagesRoot.appendChild(messageEl);

                      while (messagesRoot.children.length > 8) {
                        messagesRoot.removeChild(messagesRoot.firstChild);
                      }
                      
                      setTimeout(() => {
                        messagesRoot.scrollTop = messagesRoot.scrollHeight;
                      }, 0);
                    };

                    addMessage();
                    setInterval(addMessage, 1600 + Math.floor(Math.random() * 1200));
                  })();
                </script>
              </body>
              </html>
            `}
            style={{ width: '100%', height: '360px', border: 'none', borderRadius: 'var(--mui-shape-borderRadius)' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          variant='outlined'
          fullWidth
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant='contained'
          color="primary"
          fullWidth
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default ChangeTemplateModal;
