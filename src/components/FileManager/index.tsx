import React, { useState, useEffect, useRef, useContext } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  
} from '@mui/material'
import { Delete as DeleteIcon, CopyAll as CopyIcon, Add as AddIcon, OpenInNew as OpenIcon } from '@mui/icons-material'
import DeleteModal from '@/components/redeems/DeleteModal'
import { useUploadManager } from '../../hooks/useUploadManager'
import { TranslationContext } from '@/i18n/TranslationProvider'

interface FileMetadata {
  uuid: string
  originalName: string
  storagePath: string
  uploadedAt: number
}

export function FileManager() {
  const { t } = useContext(TranslationContext)
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [pendingDelete, setPendingDelete] = useState<{ uuid: string; name: string } | null>(null)
  const { uploadFile, deleteFile, getAll } = useUploadManager()

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await getAll()
      const asArray: FileMetadata[] = Array.isArray(all)
        ? all as FileMetadata[]
        : Array.from((all as Map<string, FileMetadata>).values())
      console.log('Fetched files:', asArray)
      setFiles(asArray)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[FileManager] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const uuid = await uploadFile(file)
      if (uuid) {
        await fetchFiles()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    setLoading(true)
    setError(null)
    try {
      const success = await deleteFile(pendingDelete.uuid)
      if (success) {
        await fetchFiles()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
      setDeleteModalOpen(false)
      setPendingDelete(null)
    }
  }

  const openDeleteModal = (uuid: string, name: string) => {
    setPendingDelete({ uuid, name })
    setDeleteModalOpen(true)
  }

  const handleCopyUuid = (uuid: string) => {
    navigator.clipboard.writeText(`{${uuid}}`)
    setCopiedUuid(uuid)
    setTimeout(() => setCopiedUuid(null), 2000)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Box sx={{ p: 3 }}>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        rewardTitle={pendingDelete?.name || ''}
        modalTitle={t('fileManager.deleteFileTitle')}
        modalDescription={t('fileManager.deleteFileConfirmation', { fileName: pendingDelete?.name || '' })}
      />
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('fileManager.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {t('fileManager.uploadFile')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileUpload}
        />
      </Box>

      {error && (
        <Card sx={{ mb: 2, backgroundColor: '#ffebee' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card>
        <CardContent>
          {files.length === 0 ? (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
              {t('fileManager.noFiles')}
            </Typography>
          ) : (
            <List>
              {files.map(file => (
                <ListItem
                  key={file.uuid}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: '1px solid #eee',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={file.originalName}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {t('fileManager.uuid')}: {file.uuid.substring(0, 8)}...
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="textSecondary">
                          {t('fileManager.uploaded')}: {formatDate(file.uploadedAt)}
                        </Typography>
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={copiedUuid === file.uuid ? t('fileManager.copied') : t('fileManager.copyUuid')} placement='top' arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyUuid(file.uuid)}
                        color={copiedUuid === file.uuid ? 'success' : 'default'}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('fileManager.delete')} placement='top' arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteModal(file.uuid, file.originalName)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default FileManager
