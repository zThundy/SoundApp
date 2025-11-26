import { useEffect, useState } from 'react'
import { Box, Button, Grid, TextField, Typography } from '@mui/material'

export default function Settings() {
  const [port, setPort] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

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
    return () => { mounted = false }
  }, [])

  const savePort = async () => {
    setLoading(true)
    setMessage('')
    try {
      const pNum = Number(port)
      if (!Number.isFinite(pNum) || pNum <= 0 || pNum >= 65536) {
        throw new Error('Porta non valida. Usa 1-65535')
      }
      const res = await (window.alerts as any).setPort(pNum)
      if (res?.ok) {
        setMessage(`Porta salvata: ${pNum}`)
      } else {
        throw new Error(res?.error || 'Salvataggio fallito')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const restartServer = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await (window.alerts as any).restart()
      if (res?.ok) {
        setMessage(`Server riavviato sulla porta ${res.port}`)
      } else {
        throw new Error(res?.error || 'Riavvio fallito')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Impostazioni</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Porta Alert Server"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            type="number"
            inputProps={{ min: 1, max: 65535 }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} display="flex" alignItems="center" gap={2}>
          <Button variant="contained" color="primary" onClick={savePort} disabled={loading}>Salva porta</Button>
          <Button variant="outlined" color="secondary" onClick={restartServer} disabled={loading}>Riavvia server</Button>
        </Grid>
        {message && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2">{message}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
