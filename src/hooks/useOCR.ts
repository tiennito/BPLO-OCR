'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { extractText, cancelOCR, terminateOCR } from '@/src/services/ocr'
import type {
  OCRResult,
  OCRServiceResponse,
  OCRStatus,
  OCRProgress,
  OCRServiceOptions,
  OCRProcessingError,
} from '@/src/types/ocr.types'

interface UseOCROptions {
  onProgress?: (progress: OCRProgress) => void
  onComplete?: (result: OCRResult) => void
  onError?: (error: OCRProcessingError) => void
}

export function useOCR(options: UseOCROptions = {}) {
  const [status, setStatus] = useState<OCRStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<OCRProcessingError | null>(null)
  const processingRef = useRef(false)

  // ────────────────────────────────────────────────────────────────────────
  // PROCESS FILE
  // ────────────────────────────────────────────────────────────────────────

  const process = useCallback(
    async (file: File, serviceOptions: OCRServiceOptions = {}) => {
      if (processingRef.current) return

      processingRef.current = true
      setStatus('preparing')
      setProgress(0)
      setError(null)
      setResult(null)

      try {
        const response: OCRServiceResponse = await extractText(file, {
          ...serviceOptions,
          onProgress: (prog: OCRProgress) => {
            setStatus(prog.status)
            setProgress(prog.progress)
            options.onProgress?.(prog)
          },
        })

        if (response.success && response.data) {
          setStatus('completed')
          setProgress(100)
          setResult(response.data)
          options.onComplete?.(response.data)
        } else {
          setStatus('failed')
          setError(response.error!)
          options.onError?.(response.error!)
        }
      } catch (err) {
        const errorObj: OCRProcessingError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error occurred',
          timestamp: new Date().toISOString(),
        }
        setStatus('failed')
        setError(errorObj)
        options.onError?.(errorObj)
      } finally {
        processingRef.current = false
      }
    },
    [options]
  )

  // ────────────────────────────────────────────────────────────────────────
  // CANCEL PROCESSING
  // ────────────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    if (processingRef.current) {
      cancelOCR()
      setStatus('idle')
      setProgress(0)
      processingRef.current = false
    }
  }, [])

  // ────────────────────────────────────────────────────────────────────────
  // RESET STATE
  // ────────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError(null)
    processingRef.current = false
  }, [])

  // ────────────────────────────────────────────────────────────────────────
  // CLEANUP ON UNMOUNT
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (processingRef.current) {
        cancelOCR()
      }
    }
  }, [])

  return {
    // State
    status,
    progress,
    result,
    error,
    isProcessing: status === 'processing' || status === 'preparing',

    // Actions
    process,
    cancel,
    reset,
  }
}
