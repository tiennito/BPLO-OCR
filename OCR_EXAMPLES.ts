// ============================================================================
// OCR QUICK START EXAMPLES
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Basic OCR in a Component
// ─────────────────────────────────────────────────────────────────────────

import { useOCR } from '@/src/hooks/useOCR'

export function BasicOCRExample() {
  const { status, progress, result, error, process } = useOCR()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await process(file, { language: 'eng' })
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      <p>Status: {status} ({progress}%)</p>
      {result && <pre>{result.text}</pre>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: OCR with Progress Tracking
// ─────────────────────────────────────────────────────────────────────────

import { useOCR } from '@/src/hooks/useOCR'
import type { OCRProgress } from '@/src/types/ocr.types'

export function OCRWithProgressExample() {
  const { status, progress, result, process } = useOCR({
    onProgress: (prog: OCRProgress) => {
      console.log(`[${prog.stage}] ${prog.progress}% - ${prog.message}`)
    },
    onComplete: (result) => {
      console.log('Extraction complete!')
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`Time: ${(result.processingTime / 1000).toFixed(2)}s`)
    },
    onError: (error) => {
      console.error(`[${error.code}] ${error.message}`)
    },
  })

  return (
    <div>
      <button onClick={() => process(file)}>Start OCR</button>
      <div style={{ width: '100%', height: '4px', backgroundColor: '#e0e0e0' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s',
          }}
        />
      </div>
      <p>{progress}% - {status}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Direct Service Usage
// ─────────────────────────────────────────────────────────────────────────

import { extractText, initializeOCR, terminateOCR } from '@/src/services/ocr'

export async function directOCRUsage() {
  // Initialize worker (optional, happens automatically)
  await initializeOCR('eng')

  // Process file
  const response = await extractText(file, {
    language: 'eng',
    timeout: 120000,
  })

  if (response.success && response.data) {
    console.log('Extracted text:', response.data.text)
    console.log('Confidence:', response.data.confidence)
    console.log('Processing time:', response.data.processingTime, 'ms')
  } else {
    console.error('Error:', response.error?.message)
  }

  // Cleanup when done
  await terminateOCR()
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: Validation Before OCR
// ─────────────────────────────────────────────────────────────────────────

import { ocrValidation } from '@/src/services/ocr.validation'
import { extractText } from '@/src/services/ocr'

export async function validateThenOCR(file: File) {
  // Validate file
  const validation = ocrValidation.validateFile(file, {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  })

  if (!validation.valid) {
    console.error('Validation failed:', validation.error?.message)
    return
  }

  // File is valid, proceed with OCR
  const response = await extractText(file)
  return response
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: Text Processing Utilities
// ─────────────────────────────────────────────────────────────────────────

import { ocrTextSanitization, ocrResultFormatting } from '@/src/services/ocr.validation'

export function processOCRText(rawText: string) {
  // Sanitize
  const clean = ocrTextSanitization.sanitize(rawText)

  // Normalize whitespace
  const normalized = ocrTextSanitization.normalizeWhitespace(clean)

  // Extract lines and words
  const lines = ocrTextSanitization.extractLines(normalized)
  const words = ocrTextSanitization.extractWords(normalized)

  // Format for display
  const formatted = ocrResultFormatting.formatForDisplay(normalized, 500)

  return {
    clean,
    normalized,
    lines,
    words,
    formatted,
    lineCount: lines.length,
    wordCount: words.length,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 6: Multi-Language OCR
// ─────────────────────────────────────────────────────────────────────────

import { extractText } from '@/src/services/ocr'
import type { OCRLanguage } from '@/src/types/ocr.types'

export async function multiLanguageOCR(file: File, language: OCRLanguage) {
  const response = await extractText(file, {
    language,
    timeout: 180000, // 3 minutes for language download
  })

  return response
}

// Usage:
// await multiLanguageOCR(file, 'fra') // French
// await multiLanguageOCR(file, 'deu') // German
// await multiLanguageOCR(file, 'spa') // Spanish

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 7: Batch Processing
// ─────────────────────────────────────────────────────────────────────────

import { extractText } from '@/src/services/ocr'

export async function batchOCR(files: File[]) {
  const results = []

  for (const file of files) {
    try {
      const response = await extractText(file)
      results.push({
        file: file.name,
        success: response.success,
        text: response.data?.text,
        error: response.error?.message,
      })
    } catch (err) {
      results.push({
        file: file.name,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 8: Error Handling
// ─────────────────────────────────────────────────────────────────────────

import { extractText } from '@/src/services/ocr'
import type { OCRErrorCode } from '@/src/types/ocr.types'

export async function ocrWithErrorHandling(file: File) {
  const response = await extractText(file)

  if (!response.success) {
    const error = response.error!
    const errorMessages: Record<OCRErrorCode, string> = {
      INVALID_FILE_TYPE: 'Please upload a valid image or PDF file.',
      FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
      FILE_EMPTY: 'The file appears to be empty.',
      UNSUPPORTED_FORMAT: 'This file format is not supported.',
      CORRUPTED_IMAGE: 'The image appears to be corrupted.',
      OCR_TIMEOUT: 'OCR processing took too long. Please try again.',
      WORKER_FAILED: 'OCR service encountered an error.',
      EMPTY_RESULT: 'No text could be extracted from the image.',
      INITIALIZATION_FAILED: 'Failed to initialize OCR service.',
      UNKNOWN_ERROR: 'An unexpected error occurred.',
    }

    const userMessage = errorMessages[error.code] || error.message
    console.error(userMessage)
    return null
  }

  return response.data
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 9: Integration with Upload Component
// ─────────────────────────────────────────────────────────────────────────

import { FileUpload } from '@/src/modules/uploads/components/FileUpload'

export function UploadWithOCRExample() {
  return (
    <FileUpload
      documentType="business_permit"
      uploadedBy="user@example.com"
      applicationId="app-123"
    />
  )
}

// The FileUpload component automatically:
// 1. Handles file upload
// 2. Validates file
// 3. Shows preview
// 4. Provides OCR button
// 5. Displays OCR results
// 6. Allows copy/download of extracted text

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 10: Custom OCR Result Display
// ─────────────────────────────────────────────────────────────────────────

import { OCRResultViewer } from '@/src/modules/uploads/components/OCRResultViewer'
import type { OCRResult } from '@/src/types/ocr.types'

export function CustomResultDisplay(result: OCRResult) {
  return (
    <OCRResultViewer
      result={result}
      onCopy={() => console.log('Text copied!')}
      onDownload={() => console.log('Text downloaded!')}
    />
  )
}

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================

/*
✅ OCR Service Setup
  - [x] tesseract.js installed
  - [x] OCR service created (src/services/ocr.ts)
  - [x] Validation utilities created
  - [x] TypeScript types defined

✅ React Integration
  - [x] useOCR hook created
  - [x] FileUpload component updated
  - [x] OCRResultViewer component created
  - [x] Progress tracking implemented

✅ Features
  - [x] Text extraction
  - [x] Progress tracking
  - [x] Error handling
  - [x] File validation
  - [x] Text sanitization
  - [x] Multi-language support
  - [x] Worker management
  - [x] Memory cleanup

✅ UI/UX
  - [x] Status badges
  - [x] Progress bars
  - [x] Error messages
  - [x] Result viewer
  - [x] Copy/download buttons
  - [x] Accessibility support

✅ Performance
  - [x] Worker reuse (singleton)
  - [x] Lazy initialization
  - [x] Async processing
  - [x] Memory cleanup
  - [x] Timeout handling

✅ Security
  - [x] MIME type validation
  - [x] File extension checking
  - [x] Blocked file types
  - [x] File size limits
  - [x] Text sanitization
  - [x] No external API calls
*/
