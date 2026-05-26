// ============================================================================
// EXTRACTION TYPES & INTERFACES
// ============================================================================

export interface ExtractedField {
  value: string | null
  confidence: number
  rawMatches?: string[]
  extractedAt?: string
}

export interface ExtractedFields {
  name: ExtractedField
  email: ExtractedField
  phone: ExtractedField
  address: ExtractedField
  businessName?: ExtractedField
  tin?: ExtractedField
  permitNumber?: ExtractedField
  referenceNumber?: ExtractedField
  receiptNumber?: ExtractedField
  date?: ExtractedField
  amount?: ExtractedField
}

export interface ExtractionResult {
  success: boolean
  fields: ExtractedFields
  rawText: string
  sanitizedText: string
  processingTime: number
  error?: string
  metadata?: {
    documentType?: string
    language?: string
    pageCount?: number
  }
}

export interface ExtractionOptions {
  documentType?: 'permit' | 'receipt' | 'id' | 'business_registration' | 'generic'
  language?: string
  strictMode?: boolean
  includeRawMatches?: boolean
}

export interface FieldValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

export interface ExtractedFieldRecord {
  id: string
  document_id: string
  field_name: string
  field_value: string
  confidence_score: number
  is_verified: boolean
  verified_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface OCRHistoryRecord {
  id: string
  document_id: string
  raw_ocr_text: string
  processed_fields: ExtractedFields
  processing_status: 'success' | 'partial' | 'failed'
  processed_at: string
  created_at: string
}

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const EXTRACTION_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(?:\+63|0)?(?:9\d{2}|\(0\d{2}\))\s?-?\s?\d{3}\s?-?\s?\d{4}|\b\d{10,11}\b/g,
  tin: /\b\d{3}-\d{3}-\d{3}-\d{3}\b|\b\d{9}\b/g,
  permitNumber: /(?:permit|license|no\.?|#)\s*:?\s*([A-Z0-9-]{5,20})/gi,
  referenceNumber: /(?:ref|reference|ref\.?|ref\s*no\.?)\s*:?\s*([A-Z0-9-]{5,20})/gi,
  receiptNumber: /(?:receipt|rcpt|or|official receipt)\s*:?\s*([A-Z0-9-]{5,20})/gi,
  date: /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi,
  amount: /(?:php|₱|\$|usd)\s*[\d,]+\.?\d{0,2}|[\d,]+\.?\d{0,2}\s*(?:php|₱|\$|usd)?/gi,
  businessName: /(?:business|company|corp|corporation|inc|incorporated|llc|ltd)\s*:?\s*([A-Za-z0-9\s&.,'-]{5,100})/gi,
  barangay: /(?:barangay|brgy|brgy\.)\s*:?\s*([A-Za-z\s'-]{3,50})/gi,
  street: /(?:street|st|st\.|avenue|ave|ave\.|road|rd|rd\.|boulevard|blvd|blvd\.)\s*:?\s*([A-Za-z0-9\s'-]{3,100})/gi,
  city: /(?:city|municipality|mun|mun\.)\s*:?\s*([A-Za-z\s'-]{3,50})/gi,
  province: /(?:province|prov|prov\.)\s*:?\s*([A-Za-z\s'-]{3,50})/gi,
}

export const CONFIDENCE_THRESHOLDS = {
  name: 70,
  email: 95,
  phone: 85,
  address: 60,
  businessName: 75,
  tin: 90,
  permitNumber: 80,
  referenceNumber: 75,
  receiptNumber: 80,
  date: 85,
  amount: 80,
}

export const VALIDATION_PATTERNS = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
  phone: /^(?:\+63|0)?(?:9\d{2}|\(0\d{2}\))\s?-?\s?\d{3}\s?-?\s?\d{4}$|^\d{10,11}$/,
  tin: /^\d{3}-\d{3}-\d{3}-\d{3}$|^\d{9}$/,
  date: /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$|^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,
  amount: /^[\d,]+\.?\d{0,2}$/,
}
