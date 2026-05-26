import { supabase } from '@/src/lib/supabase'
import { uploadService } from './uploadService'
import type { ApiResponse, OCRPayload, OCRResult } from '../types/upload.types'

export const ocrService = {
  async processDocument(payload: OCRPayload, processedBy: string): Promise<ApiResponse<OCRResult>> {
    const { documentId, filePath, mimeType } = payload

    // Mark document as processing
    await supabase
      .from('uploaded_documents')
      .update({ ocr_status: 'under_ocr_processing' })
      .eq('id', documentId)

    await uploadService.logAudit(documentId, 'ocr_processing_started', processedBy, { filePath })

    try {
      // -----------------------------------------------------------------------
      // OCR ENGINE INTEGRATION POINT
      // Replace the block below with your actual OCR engine call.
      // e.g. Google Vision, Tesseract, AWS Textract, Azure Form Recognizer
      // -----------------------------------------------------------------------
      const ocrResponse = await ocrService.callOCREngine(filePath, mimeType)
      // -----------------------------------------------------------------------

      const { data: logData, error: logError } = await supabase
        .from('ocr_processing_logs')
        .insert({
          document_id: documentId,
          processing_status: 'completed',
          extracted_text: ocrResponse.text,
          confidence_score: ocrResponse.confidence,
          processed_by: processedBy,
          remarks: null,
        })
        .select()
        .single()

      if (logError) throw new Error(logError.message)

      await supabase
        .from('uploaded_documents')
        .update({ ocr_status: 'ocr_completed' })
        .eq('id', documentId)

      await uploadService.logAudit(documentId, 'ocr_processing_completed', processedBy, {
        confidence: ocrResponse.confidence,
      })

      return { data: logData, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR processing failed'

      await supabase
        .from('ocr_processing_logs')
        .insert({
          document_id: documentId,
          processing_status: 'failed',
          extracted_text: null,
          confidence_score: null,
          processed_by: processedBy,
          remarks: message,
        })

      await supabase
        .from('uploaded_documents')
        .update({ ocr_status: 'ocr_failed' })
        .eq('id', documentId)

      await uploadService.logAudit(documentId, 'ocr_processing_failed', processedBy, { message })

      return { data: null, error: message }
    }
  },

  async getOCRResult(documentId: string): Promise<ApiResponse<OCRResult>> {
    const { data, error } = await supabase
      .from('ocr_processing_logs')
      .select('*')
      .eq('document_id', documentId)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single()

    return { data: data ?? null, error: error?.message ?? null }
  },

  // ---------------------------------------------------------------------------
  // STUB — replace with real OCR engine integration
  // ---------------------------------------------------------------------------
  async callOCREngine(
    _filePath: string,
    _mimeType: string
  ): Promise<{ text: string; confidence: number }> {
    await new Promise((r) => setTimeout(r, 1500)) // simulate latency
    return {
      text: '[OCR engine not yet connected. Replace ocrService.callOCREngine() with your integration.]',
      confidence: 0,
    }
  },
}
