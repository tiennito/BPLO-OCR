import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/src/modules/uploads/services/uploadService'
import { validationService } from '@/src/modules/uploads/services/validationService'

// GET /api/uploads
export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('applicationId') ?? undefined
  const { data, error } = await uploadService.getAll(applicationId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/uploads
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const documentType = formData.get('documentType') as string | null
  const uploadedBy = formData.get('uploadedBy') as string | null
  const applicationId = formData.get('applicationId') as string | undefined

  if (!file || !documentType || !uploadedBy)
    return NextResponse.json({ error: 'Missing required fields: file, documentType, uploadedBy' }, { status: 400 })

  const validation = validationService.validate(file)
  if (!validation.isValid)
    return NextResponse.json({ error: validation.error }, { status: 422 })

  const { data, error } = await uploadService.upload({ file, documentType, uploadedBy, applicationId })
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
