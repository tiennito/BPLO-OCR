import type { OCRErrorCode, OCRProcessingError, OCRValidationOptions } from '@/src/types/ocr.types'

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf']
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'php', 'js', 'sh', 'cmd', 'msi', 'vbs']

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const ocrValidation = {
  /**
   * Validate file before OCR processing
   */
  validateFile(
    file: File,
    options: OCRValidationOptions = {}
  ): { valid: boolean; error?: OCRProcessingError } {
    const maxSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    const mimeTypes = options.allowedMimeTypes ?? ALLOWED_MIME_TYPES
    const extensions = options.allowedExtensions ?? ALLOWED_EXTENSIONS

    // Check file exists
    if (!file) {
      return {
        valid: false,
        error: createError('INVALID_FILE_TYPE', 'No file provided'),
      }
    }

    // Check file size
    if (file.size === 0) {
      return {
        valid: false,
        error: createError('FILE_EMPTY', 'File is empty'),
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: createError(
          'FILE_TOO_LARGE',
          `File exceeds ${maxSize / 1024 / 1024}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
        ),
      }
    }

    // Check MIME type
    if (!mimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: createError(
          'INVALID_FILE_TYPE',
          `Invalid MIME type: ${file.type}. Accepted: ${mimeTypes.join(', ')}`
        ),
      }
    }

    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: createError(
          'UNSUPPORTED_FORMAT',
          `File type ".${ext}" is not allowed for security reasons`
        ),
      }
    }

    if (!extensions.includes(ext)) {
      return {
        valid: false,
        error: createError(
          'UNSUPPORTED_FORMAT',
          `Unsupported file extension: .${ext}. Accepted: ${extensions.join(', ')}`
        ),
      }
    }

    return { valid: true }
  },

  /**
   * Check if file is image-based (not PDF)
   */
  isImageFile(mimeType: string): boolean {
    return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)
  },

  /**
   * Check if file is PDF
   */
  isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf'
  },

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? ''
  },
}

// ============================================================================
// ERROR CREATION HELPER
// ============================================================================

export function createError(
  code: OCRErrorCode,
  message: string,
  details?: Record<string, unknown>
): OCRProcessingError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// TEXT SANITIZATION
// ============================================================================

export const ocrTextSanitization = {
  /**
   * Sanitize OCR extracted text
   */
  sanitize(text: string): string {
    if (!text) return ''

    return text
      .replace(/\0/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim()
  },

  /**
   * Remove extra whitespace
   */
  normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
      .trim()
  },

  /**
   * Extract lines from text
   */
  extractLines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  },

  /**
   * Extract words from text
   */
  extractWords(text: string): string[] {
    return text
      .split(/\s+/)
      .filter((word) => word.length > 0)
  },
}

// ============================================================================
// RESULT FORMATTING
// ============================================================================

export const ocrResultFormatting = {
  /**
   * Format OCR result for display
   */
  formatForDisplay(text: string, maxLength?: number): string {
    let formatted = ocrTextSanitization.sanitize(text)
    formatted = ocrTextSanitization.normalizeWhitespace(formatted)

    if (maxLength && formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength) + '...'
    }

    return formatted
  },

  /**
   * Calculate average confidence from blocks
   */
  calculateAverageConfidence(blocks?: Array<{ confidence: number }>): number {
    if (!blocks || blocks.length === 0) return 0
    const sum = blocks.reduce((acc, block) => acc + block.confidence, 0)
    return Math.round((sum / blocks.length) * 100) / 100
  },

  /**
   * Format processing time
   */
  formatProcessingTime(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  },
}
