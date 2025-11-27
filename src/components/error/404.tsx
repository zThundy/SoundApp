
import React, { useEffect } from "react";
import { useLocation } from "react-router";
import { Box, Grid, Stack, Typography, Button, styled } from "@mui/material";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

// StyledBox copied to match style from other components
const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["850"],
  padding: theme.spacing(2.2),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "center",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  transition: "background-color .2s ease-in-out",

  ":hover": {
    backgroundColor: (theme.palette as any).background["800"],
  }
}));

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.log('Current location:', location.pathname);
  }, [location]);

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" px={2}>
      <Grid container maxWidth={600}>
        <Grid size={{ xs: 12 }}>
          <StyledBox>
            <Stack direction="column" spacing={2} alignItems="center" justifyContent="center">
              <SentimentDissatisfiedIcon sx={{ fontSize: 64 }} />
              <Typography variant="h5">Pagina non trovata</Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                La pagina che stai cercando non esiste o è stata spostata.
              </Typography>
              <Button href="/" variant="contained" color="primary">Torna alla home</Button>
            </Stack>
          </StyledBox>
        </Grid>
      </Grid>
    </Box>
  )
}