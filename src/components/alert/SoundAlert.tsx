
import { useContext } from "react";

import { Stack, Typography, TextField, Tooltip, Button, Box } from "@mui/material"

import { Info } from '@mui/icons-material';

import { styled } from '@mui/material/styles';

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

export default function SoundAlert({
  imageFile,
  setImageFile,
  imageText,
  setImageText,
  imageDuration,
  setImageDuration,
  sending,
  sendImageTemplate
}: {
  imageFile: File | null,
  setImageFile: Function,
  imageText: string,
  setImageText: Function,
  imageDuration: number,
  setImageDuration: Function,
  sending: boolean,
  sendImageTemplate: Function
}) {
  const { t } = useContext(TranslationContext);

  return (
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
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${reward_title} ')} style={{ cursor: "pointer" }}>
            <strong>${'{reward_title}'}</strong>
            <Tooltip title={t("alert.variableRewardTitle")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${reward_cost} ')} style={{ cursor: "pointer" }}>
            <strong>${'{reward_cost}'}</strong>
            <Tooltip title={t("alert.variableRewardCost")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
          <StyledVariable variant="body2" onClick={() => setImageText((prev: any) => prev + '${user_input} ')} style={{ cursor: "pointer" }}>
            <strong>${'{user_input}'}</strong>
            <Tooltip title={t("alert.variableUserInput")} placement="top" arrow style={{ cursor: "pointer" }}>
              <Info />
            </Tooltip>
          </StyledVariable>
        </Stack>
      </StyledBox>

      <StyledBox>
        <Stack direction="row" spacing={2} width={"100%"}>
          <Button
            variant="contained"
            disabled={sending}
            onClick={() => sendImageTemplate()}
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
      </StyledBox>
    </Stack>
  )
}