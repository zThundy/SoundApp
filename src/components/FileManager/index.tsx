import React, { useState, useEffect, useRef, useContext } from 'react'

import {
  Box,
  Button,
  Stack,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  
} from '@mui/material'

import style from "./fileManager.module.css"

import { styled } from '@mui/material/styles';

import { Delete, CopyAll, Add } from '@mui/icons-material'

import { useUploadManager } from '@/hooks/useUploadManager'
import { TranslationContext } from '@/i18n/TranslationProvider'
import { NotificationContext } from '@/context/NotificationProvider'

import DeleteModal from '@/components/redeems/DeleteModal'

interface FileMetadata {
  uuid: string
  originalName: string
  storagePath: string
  uploadedAt: number
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
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

export function FileManager() {
  const { t } = useContext(TranslationContext)
  const [files, setFiles] = useState<FileMetadata[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [pendingDelete, setPendingDelete] = useState<{ uuid: string; name: string } | null>(null)
  const { uploadFile, deleteFile, getAll } = useUploadManager()
  const { error } = useContext(NotificationContext)

  const fetchFiles = async () => {
    try {
      const all = await getAll()
      const asArray: FileMetadata[] = Array.isArray(all)
        ? all as FileMetadata[]
        : Array.from((all as Map<string, FileMetadata>).values())
      setFiles(asArray)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error(t("common.error"), message)
      console.error('[FileManager] Fetch error:', err)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const uuid = await uploadFile(file)
      if (uuid) {
        await fetchFiles()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error(t("common.error"), message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    try {
      const success = await deleteFile(pendingDelete.uuid)
      if (success) {
        await fetchFiles()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error(t("common.error"), message)
    } finally {
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
          startIcon={<Add />}
          onClick={() => fileInputRef.current?.click()}
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

      <Box p={2} className={style.container}>
        <Stack>
          {files.length === 0 ? (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
              {t('fileManager.noFiles')}
            </Typography>
          ) : (
            <List>
              {files.map(file => (
                <StyledListItem
                  key={file.uuid}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    m: 1
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
                        <CopyAll />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t('fileManager.delete')} placement='top' arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteModal(file.uuid, file.originalName)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </StyledListItem>
              ))}
            </List>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

export default FileManager
