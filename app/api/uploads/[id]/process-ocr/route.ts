import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/src/modules/uploads/services/uploadService'
import { ocrService } from '@/src/modules/uploads/services/ocrService'

type Params = { params: { id: string } }

// POST /api/uploads/:id/process-ocr
export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => ({}))
  const processedBy: string = body.processedBy ?? 'system'

  const { data: doc, error: fetchError } = await uploadService.getById(params.id)
  if (fetchError || !doc)
    return NextResponse.json({ error: fetchError ?? 'Document not found' }, { status: 404 })

  const { data, error } = await ocrService.processDocument(
    { documentId: doc.id, filePath: doc.file_path, mimeType: doc.mime_type },
    processedBy
  )

  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ data })
}

// GET /api/uploads/:id/process-ocr  (fetch latest OCR result)
export async function GET(_req: NextRequest, { params }: Params) {
  const { data, error } = await ocrService.getOCRResult(params.id)
  if (error) return NextResponse.json({ error }, { status: 404 })
  return NextResponse.json({ data })
}
