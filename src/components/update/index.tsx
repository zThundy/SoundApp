import type { ProgressInfo } from 'electron-updater'

import { useCallback, useEffect, useState, useContext } from 'react'
import { TranslationContext } from '@/i18n/TranslationProvider'

import {
  Button,
  Grid,
  Typography,
  LinearProgress,
  Stack,
  Box
} from '@mui/material'

import style from "./update.module.css"
import { styled } from '@mui/system'

import { useNavigate } from 'react-router'

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

// A full-page route to show updater status and progress
const UpdateRoutePage = () => {
  const navigate = useNavigate()

  const { t } = useContext(TranslationContext)
  const [checking, setChecking] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>()
  const [updateError, setUpdateError] = useState<ErrorType>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>({ percent: 0 })
  const [downloaded, setDownloaded] = useState(false)

  const onUpdateCanAvailable = useCallback((_event: Electron.IpcRendererEvent, info: VersionInfo) => {
    setVersionInfo(info)
    setUpdateError(undefined)
    if (info.update) {
      setUpdateAvailable(true)
    } else {
      setUpdateAvailable(false)
    }
  }, [])

  const onUpdaterAvailable = useCallback((_event: Electron.IpcRendererEvent, info: any) => {
    // If main emits the simplified updater channel
    setUpdateAvailable(true)
  }, [])

  const onUpdateError = useCallback((_event: Electron.IpcRendererEvent, arg1: ErrorType) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
    setChecking(false)
  }, [])

  const onDownloadProgress = useCallback((_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
    setProgressInfo(arg1)
    setChecking(false)
  }, [])

  const onUpdaterProgress = useCallback((_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
    setProgressInfo(arg1)
    setChecking(false)
  }, [])

  const onUpdateDownloaded = useCallback((_event: Electron.IpcRendererEvent) => {
    setProgressInfo({ percent: 100 })
    setDownloaded(true)
    setChecking(false)
  }, [])

  const onUpdaterDownloaded = useCallback((_event: Electron.IpcRendererEvent) => {
    setProgressInfo({ percent: 100 })
    setDownloaded(true)
    setChecking(false)
  }, [])

  useEffect(() => {
    // if (true) {
    //   const baseTime = 5000
    //   setChecking(true)

    //   setTimeout(() => {
    //     setChecking(false)
    //     setUpdateError(undefined)
    //     setUpdateAvailable(true)
    //     setVersionInfo({
    //       update: true,
    //       version: "0.1.2",
    //       newVersion: "0.1.3"
    //     })
    //   }, baseTime - 2000)

    //   setTimeout(() => {
    //     setProgressInfo({ percent: 15 })
    //   }, 2000 + baseTime)

    //   setTimeout(() => {
    //     setProgressInfo({ percent: 45 })
    //   }, 3000 + baseTime)

    //   setTimeout(() => {
    //     setProgressInfo({ percent: 75 })
    //   }, 5000 + baseTime)

    //   setTimeout(() => {
    //     setProgressInfo({ percent: 99 })
    //     setDownloaded(true)
    //   }, 6000 + baseTime)

    //   setTimeout(() => {
    //     setProgressInfo({ percent: 100 })
    //   }, 6500 + baseTime)

    //   setTimeout(() => {
    //     setChecking(false)
    //     setUpdateError(undefined)
    //     setUpdateAvailable(false)
    //   }, (30 * 1000) + baseTime)
    // }
  }, [])

  useEffect(() => {
    // Register listeners
    window.ipcRenderer.on('update-can-available', onUpdateCanAvailable);
    window.ipcRenderer.on('update-error', onUpdateError);
    window.ipcRenderer.on('download-progress', onDownloadProgress);
    window.ipcRenderer.on('update-downloaded', onUpdateDownloaded);
    window.ipcRenderer.on('updater:download-progress', onUpdaterProgress);
    window.ipcRenderer.on('updater:downloaded', onUpdaterDownloaded);
    window.ipcRenderer.on('updater:available', onUpdaterAvailable);

    // Trigger a check on mount
    (async () => {
      try {
        await window.ipcRenderer.invoke('check-update')
      } catch (err) {
        // ignore
      }
    })()

    return () => {
      window.ipcRenderer.off('update-can-available', onUpdateCanAvailable);
      window.ipcRenderer.off('update-error', onUpdateError);
      window.ipcRenderer.off('download-progress', onDownloadProgress);
      window.ipcRenderer.off('update-downloaded', onUpdateDownloaded);
      window.ipcRenderer.off('updater:download-progress', onUpdaterProgress);
      window.ipcRenderer.off('updater:downloaded', onUpdaterDownloaded);
      window.ipcRenderer.off('updater:available', onUpdaterAvailable);
    }
  }, [])

  const installNow = async () => {
    try {
      await window.ipcRenderer.invoke('quit-and-install')
    } catch {
      // ignore
    }
  }

  const startManualDownload = async () => {
    try {
      await window.ipcRenderer.invoke('start-download')
    } catch {
      // ignore
    }
  }

  return (
    <div className={style.container}>
      <div className={style.updateCard}>
        <Grid container spacing={2} alignItems="center" style={{ marginBottom: 16 }}>
          <Grid size={{ lg: 12, md: 12 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{t('update.title')}</h2>
          </Grid>

          {checking || updateError ? (
            <StyledBox>
              <Grid size={{ lg: 12, md: 12 }} width={"100%"}>
                {checking && (
                  <div>{t('update.checking')}</div>
                )}

                {updateError && (
                  <>
                    <p>{t('update.errorDownloading', { message: updateError.message })}</p>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{updateError.message}</pre>
                  </>
                )}
              </Grid>
            </StyledBox>
          ) : null}

          {!updateError && updateAvailable && !checking && (
            <StyledBox>
              <Grid size={{ lg: 12, md: 12 }} width={"100%"}>
                <Stack spacing={2} alignItems={"flex-start"}>
                  <Typography variant="body1" style={{ opacity: 0.8 }}>
                    {t('update.newVersionAvailable', { version: versionInfo?.newVersion || '' })}
                  </Typography>

                  {downloaded && (
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ width: '100%' }}
                      onClick={installNow}
                    >
                      {t('update.installNow')}
                    </Button>
                  )}

                  <LinearProgress
                    style={{ width: '100%' }}
                    variant={progressInfo.percent !== 100 ? "determinate" : "indeterminate"}
                    value={progressInfo.percent ?? 0}
                  />
                </Stack>
              </Grid>
            </StyledBox>
          )}

          {!updateError && !updateAvailable && !checking && (
            <StyledBox>
              <Grid size={{ lg: 12, md: 12 }} width={"100%"}>
                <Stack spacing={2} alignItems={"flex-start"}>
                  <Typography variant="body1" style={{ opacity: 0.8 }}>
                    {t('update.noUpdate')}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      navigate('/')
                    }}
                  >
                    {t("update.goBack")}
                  </Button>
                </Stack>
              </Grid>
            </StyledBox>
          )}
        </Grid>
      </div>
    </div>
  )
}

export default UpdateRoutePage
