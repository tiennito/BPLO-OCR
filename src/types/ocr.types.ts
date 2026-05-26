// ============================================================================
// OCR STATUS & STATE TYPES
// ============================================================================

export type OCRStatus = 'idle' | 'preparing' | 'processing' | 'completed' | 'failed'

export type OCRLanguage = 'eng' | 'fra' | 'deu' | 'spa' | 'chi_sim' | 'chi_tra'

// ============================================================================
// OCR PROGRESS TRACKING
// ============================================================================

export interface OCRProgress {
  status: OCRStatus
  progress: number // 0–100
  stage: 'idle' | 'initializing' | 'loading_language' | 'recognizing' | 'complete'
  message: string
}

// ============================================================================
// OCR RESULT STRUCTURE
// ============================================================================

export interface OCRTextBlock {
  text: string
  confidence: number
  bbox?: { x0: number; y0: number; x1: number; y1: number }
}

export interface OCRResult {
  text: string
  confidence: number
  blocks?: OCRTextBlock[]
  processingTime: number
  language: OCRLanguage
  pageCount?: number
  metadata?: {
    imageWidth?: number
    imageHeight?: number
    dpi?: number
  }
}

export interface OCRServiceResponse {
  success: boolean
  data: OCRResult | null
  error: OCRProcessingError | null
  status: OCRStatus
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export type OCRErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_EMPTY'
  | 'UNSUPPORTED_FORMAT'
  | 'CORRUPTED_IMAGE'
  | 'OCR_TIMEOUT'
  | 'WORKER_FAILED'
  | 'EMPTY_RESULT'
  | 'INITIALIZATION_FAILED'
  | 'UNKNOWN_ERROR'

export interface OCRProcessingError {
  code: OCRErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

// ============================================================================
// OCR SERVICE OPTIONS
// ============================================================================

export interface OCRServiceOptions {
  language?: OCRLanguage
  timeout?: number // milliseconds
  workerPath?: string
  corePath?: string
  onProgress?: (progress: OCRProgress) => void
}

export interface OCRValidationOptions {
  maxFileSize?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

// ============================================================================
// OCR HOOK STATE
// ============================================================================

export interface UseOCRState {
  status: OCRStatus
  progress: number
  result: OCRResult | null
  error: OCRProcessingError | null
  isProcessing: boolean
}

export interface UseOCRActions {
  process: (file: File, options?: OCRServiceOptions) => Promise<OCRServiceResponse>
  cancel: () => void
  reset: () => void
}
