import { useState, useCallback, useEffect, useRef } from 'react'
import { validationService } from '../services/validationService'
import { uploadService } from '../services/uploadService'
import type { UploadedFileLocal, UploadState } from '../types/upload.types'

interface UseFileUploadOptions {
  documentType: string
  uploadedBy: string
  applicationId?: string
  onSuccess?: (file: UploadedFileLocal) => void
  onError?: (error: string) => void
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { documentType, uploadedBy, applicationId, onSuccess, onError } = options
  const [file, setFile] = useState<UploadedFileLocal | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const previewUrlRef = useRef<string | null>(null)

  const processFile = useCallback(
    async (raw: File) => {
      const validation = validationService.validate(raw)
      if (!validation.isValid) {
        setUploadState('failed')
        onError?.(validation.error!)
        return
      }

      // Build local preview
      let preview: string | undefined
      if (validationService.isImage(raw.type)) {
        preview = URL.createObjectURL(raw)
        previewUrlRef.current = preview
      }

      const localFile: UploadedFileLocal = {
        id: crypto.randomUUID(),
        file: raw,
        preview,
        uploadState: 'uploading',
        uploadProgress: 0,
      }

      setFile(localFile)
      setUploadState('uploading')

      const { data, error } = await uploadService.upload({
        file: raw,
        applicationId,
        documentType,
        uploadedBy,
      })

      if (error || !data) {
        setFile((prev) => prev ? { ...prev, uploadState: 'failed', validationError: error ?? 'Upload failed' } : null)
        setUploadState('failed')
        onError?.(error ?? 'Upload failed')
        return
      }

      const uploaded: UploadedFileLocal = { ...localFile, uploadState: 'uploaded', uploadProgress: 100, dbRecord: data }
      setFile(uploaded)
      setUploadState('uploaded')
      onSuccess?.(uploaded)
    },
    [applicationId, documentType, uploadedBy, onSuccess, onError]
  )

  const replace = useCallback(
    async (raw: File) => {
      if (!file?.dbRecord?.id) return processFile(raw)

      const validation = validationService.validate(raw)
      if (!validation.isValid) { onError?.(validation.error!); return }

      setUploadState('uploading')
      const { data, error } = await uploadService.replace(file.dbRecord.id, raw, uploadedBy)

      if (error || !data) {
        setUploadState('failed')
        onError?.(error ?? 'Replace failed')
        return
      }

      // Revoke old preview
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const preview = validationService.isImage(raw.type) ? URL.createObjectURL(raw) : undefined
      if (preview) previewUrlRef.current = preview

      const replaced: UploadedFileLocal = { id: file.id, file: raw, preview, uploadState: 'uploaded', uploadProgress: 100, dbRecord: data }
      setFile(replaced)
      setUploadState('uploaded')
      onSuccess?.(replaced)
    },
    [file, uploadedBy, processFile, onSuccess, onError]
  )

  const remove = useCallback(async () => {
    if (file?.dbRecord?.id) await uploadService.softDelete(file.dbRecord.id, uploadedBy)
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
    setFile(null)
    setUploadState('idle')
  }, [file, uploadedBy])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }
  }, [])

  return { file, uploadState, processFile, replace, remove }
}
