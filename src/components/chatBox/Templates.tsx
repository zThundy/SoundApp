
import { useContext, useEffect, useState } from 'react';

import { Box, Grid, Stack } from '@mui/material';

import { TranslationContext } from '@/i18n/TranslationProvider';

import { styled } from '@mui/material/styles';

import ChangeTemplateModal from './ChangeTemplateModal';

import DefaultTemplate, { ChatBoxTemplate } from "@/components/chatBox/templates/default";

// Automatically import all templates except default
const templateModules = import.meta.glob<{ default: ChatBoxTemplate }>('@/components/chatBox/templates/*.ts', {
  eager: true,
});

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
  transition: "background-color .2s ease-in-out",
  userSelect: "none",
  cursor: "pointer",

  ":hover": {
    backgroundColor: (theme.palette as any).background["800"],
  }
}));

const Templates = ({
  saveChatCustomization
}: {
  saveChatCustomization: (html: string, css: string, js: string) => Promise<void>;
}) => {
  const { t } = useContext(TranslationContext);
  const [templates, setTemplates] = useState<ChatBoxTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChatBoxTemplate | null>(null);

  useEffect(() => {
    // Add default template first
    const allTemplates: ChatBoxTemplate[] = [DefaultTemplate];
    
    // Add all other templates automatically
    Object.entries(templateModules).forEach(([path, module]) => {
      // Skip the default template since we're importing it manually
      if (!path.includes('default.ts')) {
        allTemplates.push(module.default);
      }
    });
    
    setTemplates(allTemplates);
  }, []);

  const handleSelectTemplate = (template: ChatBoxTemplate) => {
    setShowModal(true);
    setSelectedTemplate(template);
  }

  const handleChangeToTemplate = (template: ChatBoxTemplate) => {
    saveChatCustomization(template.html, template.css, template.js);
    setShowModal(false);
  }

  return (
    <Grid container spacing={2}>
      <ChangeTemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => handleChangeToTemplate(selectedTemplate!)}
        templateName={selectedTemplate ? selectedTemplate.name : "Unknown Template"}
        templateHtml={selectedTemplate ? selectedTemplate.html : ''}
        templateCss={selectedTemplate ? selectedTemplate.css : ''}
      />

      {templates.map((template, index) => (
        <Grid size={{ lg: 4, md: 6 }} key={index} onClick={() => handleSelectTemplate(template)}>
          <StyledBox>
            <Stack style={{ pointerEvents: 'none' }}>
            <iframe
              title={t("chatBox.previewIframeTitle")}
              onClick={() => handleSelectTemplate(template)}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; position: relative; }
                    body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('./logo.png'); background-repeat: repeat; background-size: 60px 60px; opacity: 0.2; pointer-events: none; z-index: -1; }
                    ${template.css}
                  </style>
                </head>
                <body>
                  ${template.html}
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
                        'Hello everyone, just dropping in to test how this chat overlay handles longer sentences with natural punctuation and spacing.',
                        'This overlay looks super clean so far, and now I am checking whether long messages wrap nicely without breaking usernames or layout.',
                        'Testing, testing: one, two, three. Can this preview handle a full-length message that keeps flowing across multiple lines smoothly?',
                        'Nice stream today. I really like how readable the chat is even when the message content gets more detailed and descriptive.',
                        'Love this template already. I am sending a longer message to verify padding, alignment, line-height, and overall visual balance.',
                        'Quick stress test message with mixed content: numbers 1234567890, symbols !@#$%^&*(), and enough words to force line wrapping.'
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

                        while (messagesRoot.children.length > 6) {
                          messagesRoot.removeChild(messagesRoot.firstChild);
                        }
                      };

                      addMessage();
                      setInterval(addMessage, 1800 + Math.floor(Math.random() * 1200));
                    })();
                  </script>
                </body>
                </html>
              `}
              style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none', borderRadius: 'var(--mui-shape-borderRadius)' }}
              />
            </Stack>
          </StyledBox>
        </Grid>
      ))}
    </Grid>
  )
}

export default Templates;