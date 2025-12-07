
import { useContext, useEffect, useState } from 'react';

import { Box, Grid, Stack } from '@mui/material';

import { TranslationContext } from '@/i18n/TranslationProvider';

import { styled } from '@mui/material/styles';

import ChangeTemplateModal from './ChangeTemplateModal';

import DefaultTemplate, { ChatBoxTemplate } from "@/components/chatBox/templates/default";
import GreenTemplate from "@/components/chatBox/templates/green";
import RedTemplate from "@/components/chatBox/templates/red";
import YellowTemplate from "@/components/chatBox/templates/yellow";

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
  saveChatCustomization: (css?: string, html?: string, js?: string) => Promise<void>;
}) => {
  const { t } = useContext(TranslationContext);
  const [templates, setTemplates] = useState<ChatBoxTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChatBoxTemplate | null>(null);

  useEffect(() => {
    setTemplates((prev) => [...prev, DefaultTemplate]);
    setTemplates((prev) => [...prev, GreenTemplate]);
    setTemplates((prev) => [...prev, RedTemplate]);
    setTemplates((prev) => [...prev, YellowTemplate]);
  }, []);

  const handleSelectTemplate = (template: ChatBoxTemplate) => {
    setShowModal(true);
    setSelectedTemplate(template);
  }

  const handleChangeToTemplate = (template: ChatBoxTemplate) => {
    saveChatCustomization(template.css, template.html, template.js);
    setShowModal(false);
  }

  return (
    <Grid container spacing={2}>
      <ChangeTemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => handleChangeToTemplate(selectedTemplate!)}
        templateName={selectedTemplate ? selectedTemplate.name : "Unknown Template"}
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
                    body { width: 100%; height: 100%; overflow: hidden; }
                    ${template.css}
                  </style>
                </head>
                <body>
                  ${template.html}
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