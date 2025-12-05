import { useEffect, useState, useContext } from 'react'
import { Box, Button, Grid, TextField, Typography, Select, MenuItem, Stack } from '@mui/material'
import { GitHub, LinkedIn } from '@mui/icons-material'

import { TranslationContext } from '@/i18n/TranslationProvider'
import { NotificationContext } from '@/context/NotificationProvider'

import style from './settings.module.css'
import { styled } from '@mui/system'

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
  width: "100%",
  height: "100%",
  transition: "background-color .2s ease-in-out",

  ":hover": {
    backgroundColor: (theme.palette as any).background["800"],
  }
}));

export default function Settings() {
  const { t, language, setLanguage, availableLanguages } = useContext(TranslationContext)
  const { success, error } = useContext(NotificationContext)
  const [port, setPort] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    let mounted = true;
    (window.alerts as any).getPort().then((res: any) => {
      if (!mounted) return
      const p = res?.port ?? 4823
      setPort(String(p))
    }).catch(() => {
      if (!mounted) return
      setPort('4823')
    })

    // Get app version
    window.ipcRenderer.invoke('app:get-version').then((res: any) => {
      if (!mounted) return
      if (res?.ok && res?.version) {
        setVersion(res.version)
      }
    }).catch(() => {
      // ignore
    })

    return () => {
      mounted = false
    }
  }, [])

  const savePort = async () => {
    setLoading(true)
    try {
      const pNum = Number(port)
      if (!Number.isFinite(pNum) || pNum <= 0 || pNum >= 65536) {
        error(t('settings.invalidPort'))
        throw new Error(t('settings.invalidPort'))
      }
      const res = await (window.alerts as any).setPort(pNum)
      if (res?.ok) {
        success(t('settings.portSaved', { port: pNum }))
      } else {
        error(t('settings.saveFailed'), res?.error || '')
        throw new Error(t('settings.saveFailed'))
      }
    } catch (e: any) {
      error(t('settings.error'), e.message || '')
    } finally {
      setLoading(false)
    }
  }

  const restartServer = async () => {
    setLoading(true)
    try {
      const res = await (window.alerts as any).restart()
      if (res?.ok) {
        success(t('settings.serverRestarted', { port: res.port }))
      } else {
        error(t('settings.restartFailed'), res?.error || '')
        throw new Error(t('settings.restartFailed'))
      }
    } catch (e: any) {
      error(t('settings.error'), e.message || '')
    } finally {
      setLoading(false)
    }
  }

  const openLink = (url: string) => {
    window.ipcRenderer?.invoke('open-external', url)
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>{t('settings.title')}</Typography>
      <Grid container spacing={2} className={style.container} p={2}>
        <StyledBox>
          <Grid size={{ lg: 12, md: 12 }}>
            <TextField
              label={t('settings.portLabel')}
              value={port}
              onChange={(e) => setPort(e.target.value)}
              type="number"
              inputProps={{ min: 1, max: 65535 }}
              fullWidth
            />

            <Stack direction="row" spacing={2} mt={2}>
              <Button
                variant="contained"
                color="primary" onClick={savePort}
                disabled={loading}
                style={{
                  width: "100%",
                }}
              >
                {t('settings.savePort')}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={restartServer}
                disabled={loading}
                style={{
                  width: "100%",
                }}
              >
                {t('settings.restartServer')}
              </Button>
            </Stack>
          </Grid>
        </StyledBox>

        <Grid size={{ lg: 12, md: 12 }} display="flex" alignItems="center" gap={2}>
          <StyledBox>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>{t('settings.language') || 'Language'}</Typography>
            <Select
              value={language}
              onChange={(e) => {
                setLanguage(String(e.target.value))
                success(t('settings.languageChanged'))
              }}
              size="small"
              sx={{ minWidth: 160 }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Stack direction="row" alignItems="center">
                    <img src={`flags/${lang.code}.png`} alt={lang.label} style={{ width: 24, height: 24, marginRight: 8 }} />
                    {lang.label}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </StyledBox>
        </Grid>

        <Grid size={{ lg: 12, md: 12 }} display="flex" alignItems="center" gap={2} justifyContent={"space-between"}>
          <StyledBox>
            <Typography variant="subtitle1">{t('settings.version')}</Typography>
            <Typography variant="body1">{version || t("settings.loading")}</Typography>
          </StyledBox>
        </Grid>

        <Grid size={{ lg: 12, md: 12 }} display="flex" alignItems="center" gap={2} justifyContent={"space-between"}>
          <StyledBox>
            <Typography variant="subtitle1">{t('settings.aboutTitle')}</Typography>
            <Stack direction="row" spacing={1}>
              <Box className={style.icon}>
                <GitHub onClick={() => openLink('https://github.com/zThundy')} fontSize={"large"} />
              </Box>
              <Box className={style.icon}>
                <LinkedIn onClick={() => openLink('https://www.linkedin.com/in/antonio-a-5803a0136/')} fontSize={"large"} />
              </Box>
            </Stack>
          </StyledBox>
        </Grid>
      </Grid>
    </Box>
  )
}
