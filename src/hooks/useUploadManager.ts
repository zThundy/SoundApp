import { useState, useCallback } from 'react'

interface FileMetadata {
  uuid: string
  originalName: string
  storagePath: string
  uploadedAt: number
}

interface UploadResponse {
  ok: boolean
  uuid?: string
  error?: string
}

interface FileResponse {
  ok: boolean
  data?: Buffer
  error?: string
}

interface MetadataResponse {
  ok: boolean
  metadata?: FileMetadata
  error?: string
}

interface DeleteResponse {
  ok: boolean
  message?: string
  error?: string
}

interface FilesResponse {
  ok: boolean
  files?: FileMetadata[]
  error?: string
}

interface PathResponse {
  ok: boolean
  path?: string
  error?: string
}

export function useUploadManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (file: File | Blob): Promise<string | null> => {
      console.log('Uploading file:', file)
      setLoading(true)
      setError(null)

      try {
        const fileName = file instanceof File ? file.name : `file_${Date.now()}`
        const buffer = await file.arrayBuffer()

        const result = (await window.fileManager.save(
          buffer,
          fileName
        )) as UploadResponse

        if (!result.ok) {
          setError(result.error || 'Upload failed')
          return null
        }

        return result.uuid || null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getFile = useCallback(async (uuid: string): Promise<Buffer | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = (await window.uploadManager.getFile(uuid)) as FileResponse

      if (!result.ok) {
        setError(result.error || 'Failed to retrieve file')
        return null
      }

      return result.data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getMetadata = useCallback(async (uuid: string): Promise<FileMetadata | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = (await window.uploadManager.getMetadata(uuid)) as MetadataResponse

      if (!result.ok) {
        setError(result.error || 'Failed to retrieve metadata')
        return null
      }

      return result.metadata || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFile = useCallback(async (uuid: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const result = (await window.uploadManager.deleteFile(uuid)) as DeleteResponse

      if (!result.ok) {
        setError(result.error || 'Failed to delete file')
        return false
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getAll = useCallback(async (): Promise<FileMetadata[]> => {
    setLoading(true)
    setError(null)

    try {
      const result = (await window.uploadManager.getAll()) as FilesResponse

      if (!result.ok) {
        setError(result.error || 'Failed to retrieve files')
        return []
      }

      return result.files || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getPath = useCallback(async (uuid: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = (await window.uploadManager.getPath(uuid)) as PathResponse

      if (!result.ok) {
        setError(result.error || 'Failed to retrieve path')
        return null
      }

      return result.path || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    uploadFile,
    getFile,
    getMetadata,
    deleteFile,
    getAll,
    getPath,
    loading,
    error,
  }
}

export default useUploadManager
