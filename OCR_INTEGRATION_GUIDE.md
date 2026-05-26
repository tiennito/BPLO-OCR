# OCR Integration Guide

## Overview

The eBPLS system now includes a production-ready OCR service powered by **tesseract.js**. This guide covers architecture, usage, and integration patterns.

---

## Architecture

### Core Components

```
src/
├── services/
│   ├── ocr.ts                 # Main OCR service (singleton)
│   └── ocr.validation.ts      # Validation & text utilities
├── hooks/
│   └── useOCR.ts              # React hook for OCR state management
├── types/
│   └── ocr.types.ts           # TypeScript interfaces
└── modules/uploads/
    └── components/
        ├── FileUpload.tsx     # Integrated upload + OCR UI
        └── OCRResultViewer.tsx # Result display component
```

### Service Architecture

**OCRService (Singleton)**
- Lazy initialization of tesseract.js worker
- Single worker instance reused across app
- Automatic cleanup on terminate
- Progress tracking via worker logger

**Validation Layer**
- MIME type checking
- File extension validation
- Blocked file types (exe, bat, php, js, etc.)
- File size limits (5MB default)

**Text Processing**
- Sanitization (removes control characters)
- Whitespace normalization
- Line/word extraction
- Confidence calculation

---

## Usage Examples

### Basic OCR Processing

```typescript
import { extractText } from '@/src/services/ocr'

const response = await extractText(file, {
  language: 'eng',
  timeout: 120000,
})

if (response.success) {
  console.log(response.data.text)
  console.log(response.data.confidence)
  console.log(response.data.processingTime)
}
```

### Using the Hook

```typescript
import { useOCR } from '@/src/hooks/useOCR'

export function MyComponent() {
  const { status, progress, result, error, process, cancel, reset } = useOCR({
    onProgress: (prog) => console.log(`${prog.progress}%`),
    onComplete: (result) => console.log('Done:', result.text),
    onError: (err) => console.error(err.message),
  })

  const handleProcess = async () => {
    await process(file, { language: 'eng' })
  }

  return (
    <div>
      <button onClick={handleProcess}>Process OCR</button>
      <button onClick={cancel}>Cancel</button>
      <button onClick={reset}>Reset</button>
      <p>Status: {status} ({progress}%)</p>
      {result && <pre>{result.text}</pre>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  )
}
```

### In FileUpload Component

The `FileUpload` component automatically integrates OCR:

```typescript
<FileUpload
  documentType="business_permit"
  uploadedBy="user@example.com"
  applicationId="app-123"
/>
```

Features:
- Drag & drop upload
- File preview
- One-click OCR processing
- Result viewer with copy/download
- Progress tracking

---

## API Reference

### extractText(file, options)

Extract text from a file using OCR.

**Parameters:**
- `file: File` - The file to process
- `options?: OCRServiceOptions` - Configuration

**Returns:** `Promise<OCRServiceResponse>`

```typescript
interface OCRServiceResponse {
  success: boolean
  data: OCRResult | null
  error: OCRProcessingError | null
  status: OCRStatus
}

interface OCRResult {
  text: string
  confidence: number
  processingTime: number
  language: OCRLanguage
  metadata?: {
    imageWidth?: number
    imageHeight?: number
    dpi?: number
  }
}
```

### useOCR(options)

React hook for OCR state management.

**Parameters:**
- `options?: UseOCROptions` - Callbacks

**Returns:**
```typescript
{
  status: OCRStatus
  progress: number
  result: OCRResult | null
  error: OCRProcessingError | null
  isProcessing: boolean
  process: (file: File, options?: OCRServiceOptions) => Promise<void>
  cancel: () => void
  reset: () => void
}
```

### Validation Functions

```typescript
import { ocrValidation } from '@/src/services/ocr.validation'

// Validate file before processing
const { valid, error } = ocrValidation.validateFile(file)

// Check file type
const isImage = ocrValidation.isImageFile(file.type)
const isPdf = ocrValidation.isPdfFile(file.type)

// Get extension
const ext = ocrValidation.getFileExtension(file.name)
```

### Text Utilities

```typescript
import { ocrTextSanitization, ocrResultFormatting } from '@/src/services/ocr.validation'

// Sanitize text
const clean = ocrTextSanitization.sanitize(text)
const normalized = ocrTextSanitization.normalizeWhitespace(text)

// Extract content
const lines = ocrTextSanitization.extractLines(text)
const words = ocrTextSanitization.extractWords(text)

// Format results
const formatted = ocrResultFormatting.formatForDisplay(text, 500)
const avgConfidence = ocrResultFormatting.calculateAverageConfidence(blocks)
const timeStr = ocrResultFormatting.formatProcessingTime(1500)
```

---

## Error Handling

All errors follow a consistent structure:

```typescript
interface OCRProcessingError {
  code: OCRErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

type OCRErrorCode =
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
```

**Example Error Handling:**

```typescript
const { data, error, status } = await extractText(file)

if (error) {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      console.error('File exceeds 5MB limit')
      break
    case 'OCR_TIMEOUT':
      console.error('Processing took too long')
      break
    case 'CORRUPTED_IMAGE':
      console.error('Image appears corrupted')
      break
    default:
      console.error(error.message)
  }
}
```

---

## Performance Optimization

### Worker Reuse

The OCR service uses a singleton pattern to reuse the tesseract.js worker:

```typescript
// First call initializes worker
await extractText(file1)

// Subsequent calls reuse worker (faster)
await extractText(file2)
```

### Lazy Initialization

Worker is only created when first needed:

```typescript
// Worker not created yet
const service = getOCRService()

// Worker created on first process call
await service.processFile(file)
```

### Cleanup

Terminate worker when done:

```typescript
import { terminateOCR } from '@/src/services/ocr'

// On app shutdown or page unload
await terminateOCR()
```

---

## Multi-Language Support

Supported languages:

```typescript
type OCRLanguage = 'eng' | 'fra' | 'deu' | 'spa' | 'chi_sim' | 'chi_tra'
```

**Usage:**

```typescript
await extractText(file, { language: 'fra' }) // French
await extractText(file, { language: 'deu' }) // German
await extractText(file, { language: 'spa' }) // Spanish
```

---

## Future Enhancements

The architecture supports:

1. **Cloud OCR Providers**
   - Google Cloud Vision
   - AWS Textract
   - Azure Form Recognizer

2. **Advanced Features**
   - Form field extraction
   - Receipt parsing
   - Permit number detection
   - Multi-page processing

3. **AI Integration**
   - Document classification
   - Confidence-based validation
   - Automatic field mapping

**To add a new provider:**

```typescript
// src/services/ocr.providers/googleVision.ts
export async function processWithGoogleVision(file: File) {
  // Implementation
}

// Update ocr.ts to support provider selection
export async function extractText(file: File, options: OCRServiceOptions) {
  if (options.provider === 'google') {
    return processWithGoogleVision(file)
  }
  // Default to tesseract.js
}
```

---

## Troubleshooting

### Worker Initialization Fails

**Problem:** "Failed to initialize OCR worker"

**Solution:**
- Check browser console for CORS errors
- Ensure tesseract.js is properly installed
- Try clearing browser cache

### OCR Timeout

**Problem:** Processing takes too long

**Solution:**
- Increase timeout: `{ timeout: 180000 }`
- Reduce image resolution
- Check browser performance

### Empty Results

**Problem:** "No text could be extracted"

**Solution:**
- Verify image quality
- Check image contrast
- Try different language setting
- Ensure image is not corrupted

### Memory Issues

**Problem:** Browser crashes during processing

**Solution:**
- Call `terminateOCR()` after batch processing
- Process files sequentially, not in parallel
- Reduce image size before processing

---

## Security

The OCR service includes:

- ✅ MIME type validation
- ✅ File extension checking
- ✅ Blocked file type detection
- ✅ File size limits
- ✅ Text sanitization (removes control characters)
- ✅ No external API calls (client-side only)

---

## Testing

```typescript
import { extractText } from '@/src/services/ocr'

describe('OCR Service', () => {
  it('should extract text from image', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const response = await extractText(file)
    expect(response.success).toBe(true)
    expect(response.data?.text).toBeDefined()
  })

  it('should reject invalid files', async () => {
    const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
    const response = await extractText(file)
    expect(response.success).toBe(false)
    expect(response.error?.code).toBe('UNSUPPORTED_FORMAT')
  })
})
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review error codes in `ocr.types.ts`
3. Verify file format and size
4. Check tesseract.js documentation
