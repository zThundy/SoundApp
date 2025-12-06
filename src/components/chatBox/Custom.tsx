
import { useState, useContext } from 'react';

import {
  Button,
  Stack,
  Typography,
  Box
} from '@mui/material';

import style from './chatbox.module.css';

import { styled } from '@mui/material/styles';

import { TranslationContext } from '@/i18n/TranslationProvider';

import CodeEditor from '@uiw/react-textarea-code-editor';

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

const Custom = ({
  rawHtml,
  setRawHtml,
  rawCss,
  setRawCss,
  rawJs,
  setRawJs,
  saveChatCustomization
}: {
  rawHtml: string;
  setRawHtml: (value: string) => void;
  rawCss: string;
  setRawCss: (value: string) => void;
  rawJs: string;
  setRawJs: (value: string) => void;
  saveChatCustomization: () => Promise<void>;
}) => {
  const { t } = useContext(TranslationContext);

  return (
    <Stack spacing={2}>
      <StyledBox sx={{ justifyContent: "space-between", alignItems: "flex-start", flexDirection: "column" }}>
        <Typography variant="h5">{t("chatBox.html")}</Typography>
        <CodeEditor
          value={rawHtml}
          language="html"
          placeholder={t("chatBox.enterHtml")}
          onChange={e => setRawHtml(e.target.value)}
          className={style.codeEditor}
          padding={15}
        />
      </StyledBox>

      <StyledBox sx={{ justifyContent: "space-between", alignItems: "flex-start", flexDirection: "column" }}>
        <Typography variant="h5">{t("chatBox.css")}</Typography>
        <CodeEditor
          value={rawCss}
          language="css"
          placeholder={t("chatBox.enterCss")}
          onChange={e => setRawCss(e.target.value)}
          className={style.codeEditor}
          padding={15}
        />
      </StyledBox>

      <StyledBox sx={{ justifyContent: "space-between", alignItems: "flex-start", flexDirection: "column" }}>
        <Typography variant="h5">{t("chatBox.js")}</Typography>
        <CodeEditor
          value={rawJs}
          language="javascript"
          placeholder={t("chatBox.enterJs")}
          onChange={e => setRawJs(e.target.value)}
          className={style.codeEditor}
          padding={15}
        />
      </StyledBox>

      <StyledBox>
        <Button
          variant="contained"
          onClick={saveChatCustomization}
          fullWidth
        >
          {t("common.save")}
        </Button>
      </StyledBox>
    </Stack>
  )
}

export default Custom;