import { useState, useCallback } from 'react'
import { ocrService } from '../services/ocrService'
import type { OCRResult, OCRStatus } from '../types/upload.types'

export function useOCRProcessing(processedBy: string) {
  const [ocrStatus, setOcrStatus] = useState<OCRStatus>('ready')
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const process = useCallback(
    async (documentId: string, filePath: string, mimeType: string) => {
      setOcrStatus('processing')
      setOcrError(null)

      const { data, error } = await ocrService.processDocument(
        { documentId, filePath, mimeType },
        processedBy
      )

      if (error || !data) {
        setOcrStatus('failed')
        setOcrError(error ?? 'OCR processing failed')
        return
      }

      setOcrResult(data)
      setOcrStatus('completed')
    },
    [processedBy]
  )

  const retry = useCallback(
    (documentId: string, filePath: string, mimeType: string) => {
      setOcrStatus('retry')
      setOcrResult(null)
      process(documentId, filePath, mimeType)
    },
    [process]
  )

  return { ocrStatus, ocrResult, ocrError, process, retry }
}
