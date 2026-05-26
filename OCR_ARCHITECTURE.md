# OCR Architecture & Integration Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         eBPLS Upload System                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Components Layer                        │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │   FileUpload.tsx    │  │  OCRResultViewer.tsx            │  │  │
│  │  │                     │  │                                  │  │  │
│  │  │ • Drag & drop       │  │ • Display extracted text         │  │  │
│  │  │ • File preview      │  │ • Show confidence score          │  │  │
│  │  │ • OCR trigger       │  │ • Copy/download buttons          │  │  │
│  │  │ • Status display    │  │ • Image metadata                 │  │  │
│  │  └─────────────────────┘  └──────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ UploadProgress.tsx  │  │ UploadStatusBadge.tsx            │  │  │
│  │  │                     │  │                                  │  │  │
│  │  │ • Progress bar      │  │ • Status indicators              │  │  │
│  │  │ • Percentage        │  │ • Color-coded states             │  │  │
│  │  │ • Stage label       │  │ • Animations                     │  │  │
│  │  └─────────────────────┘  └──────────────────────────────────┘  │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                    │
│                                    │                                    │
│                            useOCR Hook                                  │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Hooks Layer                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  useOCR()                                                        │  │
│  │  • State management (status, progress, result, error)           │  │
│  │  • Process trigger                                              │  │
│  │  • Cancel/reset functionality                                   │  │
│  │  • Callback support (onProgress, onComplete, onError)           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                    │
│                                    │                                    │
│                            extractText()                                │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ OCRService (Singleton)                                     │ │  │
│  │  │                                                            │ │  │
│  │  │ • Worker management (lazy init, reuse, cleanup)           │ │  │
│  │  │ • File processing                                         │ │  │
│  │  │ • Progress tracking                                       │ │  │
│  │  │ • Error handling                                          │ │  │
│  │  │ • Timeout management                                      │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Validation Layer                                           │ │  │
│  │  │                                                            │ │  │
│  │  │ • MIME type validation                                    │ │  │
│  │  │ • File extension checking                                 │ │  │
│  │  │ • Blocked file types                                      │ │  │
│  │  │ • File size limits                                        │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Text Processing Layer                                      │ │  │
│  │  │                                                            │ │  │
│  │  │ • Sanitization (control char removal)                     │ │  │
│  │  │ • Whitespace normalization                                │ │  │
│  │  │ • Line/word extraction                                    │ │  │
│  │  │ • Confidence calculation                                  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                    │
│                                    │                                    │
│                            Tesseract.js                                 │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    OCR Engine Layer                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  Tesseract.js Worker                                            │  │
│  │  • Text recognition                                             │  │
│  │  • Language support (eng, fra, deu, spa, chi_sim, chi_tra)      │  │
│  │  • Progress logging                                             │  │
│  │  • Confidence scoring                                           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Action
    │
    ▼
┌─────────────────────┐
│ Select/Drop File    │
└─────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Validation Layer                    │
│ • MIME type check                   │
│ • Extension check                   │
│ • Size check                        │
│ • Blocked types check               │
└─────────────────────────────────────┘
    │
    ├─ Invalid ──────────────────────────────────┐
    │                                            │
    │                                    ┌──────────────────┐
    │                                    │ Show Error       │
    │                                    │ Message          │
    │                                    └──────────────────┘
    │
    ├─ Valid
    │
    ▼
┌─────────────────────────────────────┐
│ File Upload                         │
│ • Store in Supabase Storage         │
│ • Save metadata to DB               │
│ • Log audit event                   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Show Preview                        │
│ • Image thumbnail                   │
│ • File info                         │
│ • Replace/Remove buttons            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ User Clicks "Process OCR"           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Initialize OCR Worker               │
│ (if not already initialized)        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Load Language Model                 │
│ (if not already loaded)             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Process Image with Tesseract.js     │
│ • Recognize text                    │
│ • Calculate confidence              │
│ • Track progress                    │
└─────────────────────────────────────┘
    │
    ├─ Success
    │
    ▼
┌─────────────────────────────────────┐
│ Text Processing                     │
│ • Sanitize text                     │
│ • Normalize whitespace              │
│ • Extract metadata                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Display Results                     │
│ • Extracted text                    │
│ • Confidence score                  │
│ • Processing time                   │
│ • Copy/Download buttons             │
└─────────────────────────────────────┘
    │
    ├─ Error
    │
    ▼
┌─────────────────────────────────────┐
│ Show Error Message                  │
│ • Error code                        │
│ • User-friendly message             │
│ • Retry button                      │
└─────────────────────────────────────┘
```

---

## Component Integration Map

```
FileUpload Component
├── useFileValidation Hook
│   └── validationService
│       └── ocrValidation
│
├── useFileUpload Hook
│   └── uploadService
│       └── Supabase
│
├── useOCR Hook
│   └── extractText()
│       ├── ocrValidation
│       ├── OCRService (Singleton)
│       │   └── Tesseract.js Worker
│       └── ocrTextSanitization
│
├── FilePreview Component
│   └── validationService
│
├── OCRProcessingButton Component
│   └── (UI only)
│
├── OCRResultViewer Component
│   ├── ocrResultFormatting
│   └── ocrTextSanitization
│
├── UploadProgress Component
│   └── (UI only)
│
├── UploadStatusBadge Component
│   └── (UI only)
│
└── UploadValidationMessage Component
    └── (UI only)
```

---

## State Management Flow

```
FileUpload Component State
│
├── uploadState: 'idle' | 'uploading' | 'uploaded' | 'failed'
│   └── Managed by useFileUpload hook
│
├── ocrStatus: 'idle' | 'preparing' | 'processing' | 'completed' | 'failed'
│   └── Managed by useOCR hook
│
├── ocrProgress: 0-100
│   └── Updated via onProgress callback
│
├── ocrResult: OCRResult | null
│   └── Set on successful completion
│
├── ocrError: OCRProcessingError | null
│   └── Set on failure
│
└── isDragging: boolean
    └── Local state for drag & drop UI
```

---

## Error Handling Flow

```
File Processing
    │
    ▼
┌─────────────────────────────────────┐
│ Validation Check                    │
└─────────────────────────────────────┘
    │
    ├─ INVALID_FILE_TYPE
    ├─ FILE_TOO_LARGE
    ├─ FILE_EMPTY
    ├─ UNSUPPORTED_FORMAT
    │
    └─ Valid
        │
        ▼
    ┌─────────────────────────────────────┐
    │ OCR Processing                      │
    └─────────────────────────────────────┘
        │
        ├─ CORRUPTED_IMAGE
        ├─ OCR_TIMEOUT
        ├─ WORKER_FAILED
        ├─ EMPTY_RESULT
        ├─ INITIALIZATION_FAILED
        │
        └─ Success
            │
            ▼
        ┌─────────────────────────────────────┐
        │ Return OCRResult                    │
        └─────────────────────────────────────┘

All errors follow structure:
{
  code: OCRErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: string
}
```

---

## Performance Optimization Strategy

```
App Initialization
    │
    ▼
┌─────────────────────────────────────┐
│ OCRService Singleton Created        │
│ (Worker not yet initialized)        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ User Uploads File                   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ First OCR Process                   │
│ • Initialize worker (3-5s)          │
│ • Load language (included)          │
│ • Process image (1-2s)              │
│ Total: 4-7 seconds                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Subsequent OCR Processes            │
│ • Worker already initialized        │
│ • Language already loaded           │
│ • Process image (1-2s)              │
│ Total: 1-2 seconds                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ App Cleanup                         │
│ • Terminate worker                  │
│ • Free memory                       │
│ • Cleanup resources                 │
└─────────────────────────────────────┘
```

---

## Security Layers

```
User Input
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 1: File Type Validation       │
│ • MIME type check                   │
│ • Extension validation              │
│ • Blocked types (exe, bat, php...)  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 2: File Size Validation       │
│ • Maximum 5MB                       │
│ • Empty file check                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 3: Processing                 │
│ • Client-side only                  │
│ • No external API calls             │
│ • No credential exposure            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 4: Text Sanitization          │
│ • Remove control characters         │
│ • Normalize whitespace              │
│ • Safe for display                  │
└─────────────────────────────────────┘
    │
    ▼
Safe Output
```

---

## Integration with Existing Systems

```
eBPLS Upload Workflow
│
├── Step 1: Upload Document
│   └── FileUpload Component
│       └── useFileUpload Hook
│           └── uploadService
│               └── Supabase Storage
│
├── Step 2: Preview Document
│   └── FilePreview Component
│       └── Display image/PDF
│
└── Step 3: Process OCR
    └── OCRProcessingButton Component
        └── useOCR Hook
            └── extractText()
                └── Tesseract.js
                    └── OCRResultViewer Component
                        └── Display Results

Database Integration:
├── uploaded_documents table
│   └── Stores file metadata
│
├── ocr_processing_logs table
│   └── Stores OCR results
│
└── upload_audit_logs table
    └── Stores all actions
```

---

## Scalability Path

```
Current Implementation
└── Tesseract.js (Client-side)

Future Enhancements
├── Cloud Providers
│   ├── Google Cloud Vision
│   ├── AWS Textract
│   └── Azure Form Recognizer
│
├── Advanced Features
│   ├── Form field extraction
│   ├── Receipt parsing
│   ├── Permit number detection
│   └── Multi-page processing
│
└── AI Integration
    ├── Document classification
    ├── Confidence-based validation
    └── Automatic field mapping

Implementation Pattern:
1. Add provider abstraction layer
2. Implement provider-specific logic
3. Update service to support selection
4. No breaking changes to existing code
```

---

## Deployment Architecture

```
Development
    │
    ├── npm run dev
    ├── Test locally
    └── Verify functionality
        │
        ▼
Staging
    │
    ├── Build: npm run build
    ├── Deploy to staging
    ├── Run integration tests
    └── Performance testing
        │
        ▼
Production
    │
    ├── Deploy to production
    ├── Monitor performance
    ├── Track errors
    └── Gather user feedback
```

---

## Key Metrics & Monitoring

```
Performance Metrics
├── First OCR Time: 3-5 seconds
├── Subsequent OCR Time: 1-2 seconds
├── Memory Usage: 50-100MB per worker
├── Success Rate: >95%
└── Error Rate: <5%

User Experience Metrics
├── Upload Success Rate
├── OCR Success Rate
├── Average Processing Time
├── User Satisfaction
└── Error Recovery Rate

System Metrics
├── Worker Initialization Time
├── Language Loading Time
├── Memory Cleanup Efficiency
├── Timeout Occurrences
└── Worker Reuse Rate
```

---

This architecture ensures:
✅ Scalability for future enhancements
✅ Security at multiple layers
✅ Performance optimization
✅ Clean separation of concerns
✅ Easy maintenance and debugging
✅ Production-ready implementation
