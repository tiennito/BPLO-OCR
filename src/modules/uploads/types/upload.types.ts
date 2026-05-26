// ============================================================================
// ENUMS
// ============================================================================

export type UploadState = 'idle' | 'dragging' | 'uploading' | 'uploaded' | 'failed' | 'removed'

export type OCRStatus =
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retry'

export type DocumentStatus =
  | 'pending_upload'
  | 'uploaded'
  | 'under_ocr_processing'
  | 'ocr_completed'
  | 'ocr_failed'
  | 'rejected'
  | 'approved'

// ============================================================================
// CORE TYPES
// ============================================================================

export interface UploadedFileLocal {
  id: string
  file: File
  preview?: string
  uploadState: UploadState
  uploadProgress: number
  validationError?: string
  dbRecord?: UploadedDocument
}

export interface UploadedDocument {
  id: string
  application_id: string | null
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  ocr_status: DocumentStatus
  ocr_result: OCRResult | null
  uploaded_by: string
  uploaded_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OCRResult {
  id: string
  document_id: string
  processing_status: OCRStatus
  extracted_text: string | null
  confidence_score: number | null
  processed_at: string | null
  processed_by: string | null
  remarks: string | null
}

export interface AuditLog {
  id: string
  document_id: string
  action: string
  performed_by: string
  performed_at: string
  details: Record<string, unknown> | null
}

// ============================================================================
// SERVICE PAYLOADS
// ============================================================================

export interface UploadPayload {
  file: File
  applicationId?: string
  documentType: string
  uploadedBy: string
}

export interface OCRPayload {
  documentId: string
  filePath: string
  mimeType: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
