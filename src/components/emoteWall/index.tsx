import { useContext, useEffect, useRef, useState } from 'react'
import { Box, Stack, Typography, IconButton, Tooltip, Zoom, Paper, InputBase } from '@mui/material'
import { CopyAll as Clipboard, OpenInNew } from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import style from './emoteWall.module.css'
import { TranslationContext } from '@/i18n/TranslationProvider'

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background['850'],
  padding: theme.spacing(2.2),
  borderRadius: theme.shape.borderRadius,
  justifyContent: 'space-between',
  alignContent: 'center',
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  maxHeight: 'fit-content',
  width: 'calc(100% - )' + theme.spacing(4),
  height: '100%',
  transition: 'background-color .2s ease-in-out',
  ':hover': {
    backgroundColor: (theme.palette as any).background['800'],
  }
}))

export default function EmoteWall() {
  const { t } = useContext(TranslationContext)
  const [serverUrl, setServerUrl] = useState('http://localhost:4823/emote-wall')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  useEffect(() => {
    ;(window.alerts as any).getPort().then((res: any) => {
      if (!res?.port) return
      setServerUrl(`http://localhost:${res?.port}/emote-wall`)
    })
  }, [])

  return (
    <Stack className={style.container} spacing={2}>
      <Typography variant="h5">{t('emoteWall.title')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('emoteWall.subtitle')}
      </Typography>

      <StyledBox>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0)',
            border: (theme) => `1px solid ${(theme.palette as any).background['700']}`
          }}
        >
          <Tooltip
            title={copied ? t('common.copied') : t('common.copyToClipboard')}
            placement="top"
            slots={{ transition: Zoom }}
            arrow
          >
            <IconButton
              sx={{ p: '10px' }}
              aria-label="copy-overlay-url"
              onClick={() => {
                navigator.clipboard.writeText(serverUrl)
                setCopied(true)
              }}
            >
              <Clipboard />
            </IconButton>
          </Tooltip>
          <InputBase sx={{ ml: 1, flex: 1 }} value={serverUrl} readOnly />
        </Paper>
      </StyledBox>

      <StyledBox sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Tooltip title={t('emoteWall.openInBrowser')} placement="top" arrow>
            <IconButton
              aria-label="open-overlay-in-browser"
              onClick={() => window.ipcRenderer?.invoke('open-external', serverUrl)}
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
            title={t('emoteWall.previewIframeTitle')}
            src={serverUrl}
            style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none', background: 'transparent' }}
          />
        </Box>
      </StyledBox>
    </Stack>
  )
}
