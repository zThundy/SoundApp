import { useState, useCallback } from 'react'

interface FileMetadata {
  uuid: string
  originalName: string
  storagePath: string
  uploadedAt: number
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
        const result = await window.fileManager.save("files", fileName, new Uint8Array(buffer) as any, true)

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

  const getFile = useCallback(async (uuid: string): Promise<Buffer | null | string> => {
    setLoading(true)
    setError(null)

    try {
      const result = await window.fileManager.read("files", { uuid })

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
      const result = await window.fileManager.read("files", { uuid })

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
      const result = await window.fileManager.delete("files", { uuid })

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

  const getAll = useCallback(async (): Promise<Map<string, FileMetadata> | []> => {
    setLoading(true)
    setError(null)

    try {
      const result = await window.fileManager.getAll()

      if (!result.ok) {
        setError(result.error || 'Failed to retrieve files')
        return new Map()
      }

      return result.data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return []
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
    loading,
    error,
  }
}

export default useUploadManager
