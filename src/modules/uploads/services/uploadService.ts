import { supabase } from '@/src/lib/supabase'
import { validationService } from './validationService'
import type { ApiResponse, UploadedDocument, UploadPayload } from '../types/upload.types'

const BUCKET = 'bplo-documents'

export const uploadService = {
  async upload(payload: UploadPayload): Promise<ApiResponse<UploadedDocument>> {
    const { file, applicationId, documentType, uploadedBy } = payload
    const safeName = `${Date.now()}_${validationService.sanitizeFilename(file.name)}`
    const filePath = `uploads/${safeName}`

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false })

    if (storageError) return { data: null, error: storageError.message }

    const { data, error: dbError } = await supabase
      .from('uploaded_documents')
      .insert({
        application_id: applicationId ?? null,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        ocr_status: 'uploaded',
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (dbError) return { data: null, error: dbError.message }

    await uploadService.logAudit(data.id, 'document_uploaded', uploadedBy, { file_name: file.name })

    return { data, error: null }
  },

  async getAll(applicationId?: string): Promise<ApiResponse<UploadedDocument[]>> {
    let query = supabase
      .from('uploaded_documents')
      .select('*')
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (applicationId) query = query.eq('application_id', applicationId)

    const { data, error } = await query
    return { data: data ?? [], error: error?.message ?? null }
  },

  async getById(id: string): Promise<ApiResponse<UploadedDocument>> {
    const { data, error } = await supabase
      .from('uploaded_documents')
      .select('*, ocr_processing_logs(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    return { data: data ?? null, error: error?.message ?? null }
  },

  async replace(
    id: string,
    file: File,
    uploadedBy: string
  ): Promise<ApiResponse<UploadedDocument>> {
    const existing = await uploadService.getById(id)
    if (!existing.data) return { data: null, error: 'Document not found.' }

    // Remove old file from storage
    await supabase.storage.from(BUCKET).remove([existing.data.file_path])

    const safeName = `${Date.now()}_${validationService.sanitizeFilename(file.name)}`
    const filePath = `uploads/${safeName}`

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false })

    if (storageError) return { data: null, error: storageError.message }

    const { data, error: dbError } = await supabase
      .from('uploaded_documents')
      .update({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        ocr_status: 'uploaded',
        ocr_result: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (dbError) return { data: null, error: dbError.message }

    await uploadService.logAudit(id, 'document_replaced', uploadedBy, { new_file: file.name })

    return { data, error: null }
  },

  async softDelete(id: string, deletedBy: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('uploaded_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { data: null, error: error.message }

    await uploadService.logAudit(id, 'document_deleted', deletedBy, {})

    return { data: null, error: null }
  },

  async getSignedUrl(filePath: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600)
    return data?.signedUrl ?? null
  },

  async logAudit(
    documentId: string,
    action: string,
    performedBy: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('upload_audit_logs').insert({
      document_id: documentId,
      action,
      performed_by: performedBy,
      details,
    })
  },
}
