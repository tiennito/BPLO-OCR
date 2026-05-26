# OCR Quick Reference Card

## 🚀 Get Started in 30 Seconds

### Option 1: Use FileUpload Component (Recommended)
```typescript
import { FileUpload } from '@/src/modules/uploads/components/FileUpload'

export function App() {
  return (
    <FileUpload
      documentType="business_permit"
      uploadedBy="user@example.com"
      applicationId="app-123"
    />
  )
}
```

### Option 2: Use useOCR Hook
```typescript
import { useOCR } from '@/src/hooks/useOCR'

export function MyComponent() {
  const { status, progress, result, error, process } = useOCR()

  return (
    <div>
      <input type="file" onChange={(e) => process(e.target.files[0])} />
      <p>{status} ({progress}%)</p>
      {result && <pre>{result.text}</pre>}
    </div>
  )
}
```

### Option 3: Direct Service Usage
```typescript
import { extractText } from '@/src/services/ocr'

const response = await extractText(file, { language: 'eng' })
if (response.success) {
  console.log(response.data.text)
}
```

---

## 📚 Import Cheat Sheet

```typescript
// Services
import { extractText, initializeOCR, terminateOCR } from '@/src/services/ocr'
import { ocrValidation, ocrTextSanitization, ocrResultFormatting } from '@/src/services/ocr.validation'

// Hooks
import { useOCR } from '@/src/hooks/useOCR'

// Components
import { FileUpload } from '@/src/modules/uploads/components/FileUpload'
import { OCRResultViewer } from '@/src/modules/uploads/components/OCRResultViewer'
import { OCRProcessingButton } from '@/src/modules/uploads/components/OCRProcessingButton'

// Types
import type { OCRResult, OCRStatus, OCRProcessingError } from '@/src/types/ocr.types'
```

---

## 🎯 Common Tasks

### Extract Text from File
```typescript
const response = await extractText(file)
if (response.success) {
  const text = response.data.text
  const confidence = response.data.confidence
  const time = response.data.processingTime
}
```

### Validate File Before Processing
```typescript
import { ocrValidation } from '@/src/services/ocr.validation'

const { valid, error } = ocrValidation.validateFile(file)
if (!valid) {
  console.error(error.message)
}
```

### Process Multiple Languages
```typescript
// English
await extractText(file, { language: 'eng' })

// French
await extractText(file, { language: 'fra' })

// German
await extractText(file, { language: 'deu' })

// Spanish
await extractText(file, { language: 'spa' })

// Chinese Simplified
await extractText(file, { language: 'chi_sim' })

// Chinese Traditional
await extractText(file, { language: 'chi_tra' })
```

### Handle Errors
```typescript
const response = await extractText(file)

if (!response.success) {
  const error = response.error
  console.error(`[${error.code}] ${error.message}`)
  
  // Handle specific errors
  if (error.code === 'FILE_TOO_LARGE') {
    console.error('File exceeds 5MB limit')
  } else if (error.code === 'OCR_TIMEOUT') {
    console.error('Processing took too long')
  }
}
```

### Track Progress
```typescript
const { status, progress, process } = useOCR({
  onProgress: (prog) => {
    console.log(`${prog.stage}: ${prog.progress}%`)
  },
  onComplete: (result) => {
    console.log('Done!', result.text)
  },
  onError: (error) => {
    console.error(error.message)
  },
})

await process(file)
```

### Sanitize Text
```typescript
import { ocrTextSanitization } from '@/src/services/ocr.validation'

const clean = ocrTextSanitization.sanitize(rawText)
const normalized = ocrTextSanitization.normalizeWhitespace(clean)
const lines = ocrTextSanitization.extractLines(normalized)
const words = ocrTextSanitization.extractWords(normalized)
```

### Format Results
```typescript
import { ocrResultFormatting } from '@/src/services/ocr.validation'

const formatted = ocrResultFormatting.formatForDisplay(text, 500)
const timeStr = ocrResultFormatting.formatProcessingTime(1500)
const avgConfidence = ocrResultFormatting.calculateAverageConfidence(blocks)
```

---

## 🔧 Configuration

### Adjust Timeout
```typescript
await extractText(file, {
  timeout: 180000 // 3 minutes
})
```

### Set Language
```typescript
await extractText(file, {
  language: 'fra' // French
})
```

### Custom Worker Path
```typescript
await extractText(file, {
  workerPath: '/path/to/worker.js'
})
```

---

## 📊 Status Values

```typescript
type OCRStatus = 
  | 'idle'       // Not processing
  | 'preparing'  // Initializing worker
  | 'processing' // Recognizing text
  | 'completed'  // Done successfully
  | 'failed'     // Error occurred
```

---

## ❌ Error Codes

```typescript
'INVALID_FILE_TYPE'      // Wrong MIME type
'FILE_TOO_LARGE'         // Exceeds 5MB
'FILE_EMPTY'             // File is empty
'UNSUPPORTED_FORMAT'     // Wrong extension
'CORRUPTED_IMAGE'        // Image is corrupted
'OCR_TIMEOUT'            // Processing too slow
'WORKER_FAILED'          // Worker error
'EMPTY_RESULT'           // No text extracted
'INITIALIZATION_FAILED'  // Worker init failed
'UNKNOWN_ERROR'          // Other error
```

---

## 🎨 Component Props

### FileUpload
```typescript
<FileUpload
  documentType="business_permit"  // Required
  uploadedBy="user@example.com"   // Required
  applicationId="app-123"         // Optional
/>
```

### OCRResultViewer
```typescript
<OCRResultViewer
  result={ocrResult}              // Required
  onCopy={() => {}}               // Optional
  onDownload={() => {}}           // Optional
/>
```

### OCRProcessingButton
```typescript
<OCRProcessingButton
  status="ready"                  // Required
  onClick={() => {}}              // Required
  disabled={false}                // Optional
/>
```

---

## 🧪 Testing

### Test File Upload
```typescript
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
const response = await extractText(file)
expect(response.success).toBe(true)
```

### Test Validation
```typescript
const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
const { valid } = ocrValidation.validateFile(invalidFile)
expect(valid).toBe(false)
```

---

## 📈 Performance Tips

1. **Reuse Worker** - Singleton pattern handles this automatically
2. **Pre-initialize** - Call `initializeOCR()` on app load
3. **Process Sequentially** - Don't process multiple files in parallel
4. **Cleanup** - Call `terminateOCR()` when done
5. **Optimize Images** - Reduce resolution before processing

---

## 🔐 Security Checklist

- ✅ Always validate files before processing
- ✅ Check file size (max 5MB)
- ✅ Verify MIME type
- ✅ Sanitize extracted text
- ✅ Never expose credentials
- ✅ Use HTTPS in production
- ✅ Validate on backend too

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| OCR_INTEGRATION_GUIDE.md | Complete guide |
| OCR_EXAMPLES.ts | Code examples |
| OCR_ARCHITECTURE.md | System design |
| OCR_DEPLOYMENT_CHECKLIST.md | Deployment |
| OCR_IMPLEMENTATION_SUMMARY.md | Overview |
| OCR_FILE_MANIFEST.md | File listing |

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Worker init fails | Clear cache, reinstall tesseract.js |
| OCR timeout | Increase timeout, reduce image size |
| Empty results | Check image quality, try different language |
| Memory issues | Terminate worker, process sequentially |
| Slow performance | Pre-initialize worker, optimize images |

---

## 💡 Pro Tips

1. **Pre-initialize on app load**
   ```typescript
   useEffect(() => {
     initializeOCR('eng')
   }, [])
   ```

2. **Show progress to users**
   ```typescript
   const { progress } = useOCR({
     onProgress: (prog) => updateUI(prog.progress)
   })
   ```

3. **Handle errors gracefully**
   ```typescript
   const { error } = useOCR({
     onError: (err) => showUserMessage(err.message)
   })
   ```

4. **Cleanup on unmount**
   ```typescript
   useEffect(() => {
     return () => terminateOCR()
   }, [])
   ```

5. **Validate before processing**
   ```typescript
   const { valid, error } = ocrValidation.validateFile(file)
   if (!valid) return showError(error.message)
   ```

---

## 🚀 Next Steps

1. **Read** OCR_INTEGRATION_GUIDE.md
2. **Review** OCR_EXAMPLES.ts
3. **Test** locally with `npm run dev`
4. **Deploy** following OCR_DEPLOYMENT_CHECKLIST.md
5. **Monitor** performance in production

---

## 📞 Quick Help

**Q: How do I use OCR in my component?**
A: Import `useOCR` hook or use `FileUpload` component

**Q: What languages are supported?**
A: eng, fra, deu, spa, chi_sim, chi_tra

**Q: What's the max file size?**
A: 5MB (configurable)

**Q: How long does OCR take?**
A: First: 3-5s, Subsequent: 1-2s

**Q: Can I use cloud OCR providers?**
A: Yes, architecture supports future integration

**Q: Is it secure?**
A: Yes, client-side only with full validation

---

## ✨ You're All Set!

Everything is ready to use. Start with the FileUpload component or useOCR hook.

Happy coding! 🎉
