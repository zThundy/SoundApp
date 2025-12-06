
import { Box, Stack } from "@mui/material"
import { QuestionMark } from "@mui/icons-material";
import styled from "@emotion/styled";

const StyledStack = styled(Stack)(({ theme }) => ({
  height: '50vh',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  fontSize: 24,
  color: (theme as any).palette.text.secondary,
}));

export default function EmptyList({ text }: { text?: string }) {
  return (
    <StyledStack spacing={2}>
      <QuestionMark style={{ fontSize: 128 }} />
      <Box>{text || "No custom rewards selected."}</Box>
    </StyledStack>
  )
}