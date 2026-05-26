'use client'

import Tesseract from 'tesseract.js'
import type {
  OCRResult,
  OCRServiceResponse,
  OCRStatus,
  OCRProgress,
  OCRLanguage,
  OCRServiceOptions,
} from '../types/ocr.types'
import { ocrValidation, createError } from './ocr.validation'

// ============================================================================
// OCR SERVICE SINGLETON
// ============================================================================

class OCRService {
  private worker: Tesseract.Worker | null = null
  private isInitialized = false
  private currentStatus: OCRStatus = 'idle'
  private abortController: AbortController | null = null

  /**
   * Initialize OCR worker (lazy initialization)
   */
  async initialize(language: OCRLanguage = 'eng'): Promise<void> {
    if (this.isInitialized && this.worker) return

    try {
      this.currentStatus = 'preparing'
      this.worker = await Tesseract.createWorker(language as any)
      this.isInitialized = true
    } catch (err) {
      this.isInitialized = false
      throw createError(
        'INITIALIZATION_FAILED',
        `Failed to initialize OCR worker: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Process file and extract text
   */
  async processFile(
    file: File,
    options: OCRServiceOptions = {}
  ): Promise<OCRServiceResponse> {
    const startTime = performance.now()
    const language = options.language ?? 'eng'

    // Validate file
    const validation = ocrValidation.validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        data: null,
        error: validation.error!,
        status: 'failed',
      }
    }

    try {
      // Initialize worker if needed
      if (!this.isInitialized) {
        await this.initialize(language)
      }

      if (!this.worker) {
        throw new Error('Worker not initialized')
      }

      this.currentStatus = 'processing'
      this.abortController = new AbortController()

      // Set timeout
      const timeoutMs = options.timeout ?? 120000 // 2 minutes default
      const timeoutId = setTimeout(() => {
        this.abortController?.abort()
      }, timeoutMs)

      // Create blob URL for Tesseract
      const blobUrl = URL.createObjectURL(file)

      try {
        // Recognize text
        const result = await this.worker.recognize(blobUrl)

        clearTimeout(timeoutId)

        if (!result.data.text || result.data.text.trim().length === 0) {
          return {
            success: false,
            data: null,
            error: createError('EMPTY_RESULT', 'No text could be extracted from the image'),
            status: 'failed',
          }
        }

        const processingTime = performance.now() - startTime

        const ocrResult: OCRResult = {
          text: result.data.text,
          confidence: result.data.confidence ?? 0,
          processingTime,
          language,
          metadata: {
            imageWidth: (result.data as unknown as any).imageWidth,
            imageHeight: (result.data as unknown as any).imageHeight,
          },
        }

        this.currentStatus = 'completed'
        options.onProgress?.({
          status: 'completed',
          progress: 100,
          stage: 'complete',
          message: 'OCR processing completed',
        })

        return {
          success: true,
          data: ocrResult,
          error: null,
          status: 'completed',
        }
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    } catch (err) {
      clearTimeout(0)
      this.currentStatus = 'failed'

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('abort')) {
        return {
          success: false,
          data: null,
          error: createError('OCR_TIMEOUT', 'OCR processing timed out'),
          status: 'failed',
        }
      }

      if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
        return {
          success: false,
          data: null,
          error: createError('CORRUPTED_IMAGE', 'Image appears to be corrupted or invalid'),
          status: 'failed',
        }
      }

      return {
        success: false,
        data: null,
        error: createError('WORKER_FAILED', `OCR processing failed: ${errorMessage}`),
        status: 'failed',
      }
    }
  }

  /**
   * Cancel ongoing OCR processing
   */
  cancel(): void {
    this.abortController?.abort()
    this.currentStatus = 'idle'
  }

  /**
   * Terminate worker and cleanup
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate()
      } catch (err) {
        console.error('Error terminating OCR worker:', err)
      }
    }
    this.worker = null
    this.isInitialized = false
    this.currentStatus = 'idle'
  }

  /**
   * Get current status
   */
  getStatus(): OCRStatus {
    return this.currentStatus
  }

  /**
   * Handle worker log events
   */
  private handleWorkerLog(message: any): void {
    const { status, progress } = message

    if (status === 'recognizing text') {
      console.debug(`[OCR] Recognizing text: ${Math.round(progress * 100)}%`)
    } else if (status === 'loading language traineddata') {
      console.debug(`[OCR] Loading language: ${Math.round(progress * 100)}%`)
    } else if (status === 'initializing api') {
      console.debug(`[OCR] Initializing: ${Math.round(progress * 100)}%`)
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let ocrServiceInstance: OCRService | null = null

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService()
  }
  return ocrServiceInstance
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Extract text from file using OCR
 */
export async function extractText(
  file: File,
  options: OCRServiceOptions = {}
): Promise<OCRServiceResponse> {
  const service = getOCRService()
  return service.processFile(file, options)
}

/**
 * Initialize OCR service
 */
export async function initializeOCR(language: OCRLanguage = 'eng'): Promise<void> {
  const service = getOCRService()
  await service.initialize(language)
}

/**
 * Terminate OCR service and cleanup
 */
export async function terminateOCR(): Promise<void> {
  const service = getOCRService()
  await service.terminate()
}

/**
 * Get OCR service status
 */
export function getOCRStatus(): OCRStatus {
  const service = getOCRService()
  return service.getStatus()
}

/**
 * Cancel ongoing OCR processing
 */
export function cancelOCR(): void {
  const service = getOCRService()
  service.cancel()
}
