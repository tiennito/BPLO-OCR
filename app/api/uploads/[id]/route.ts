import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/src/modules/uploads/services/uploadService'
import { validationService } from '@/src/modules/uploads/services/validationService'

type Params = { params: { id: string } }

// GET /api/uploads/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { data, error } = await uploadService.getById(params.id)
  if (error || !data) return NextResponse.json({ error: error ?? 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

// PUT /api/uploads/:id  (replace file)
export async function PUT(req: NextRequest, { params }: Params) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const uploadedBy = formData.get('uploadedBy') as string | null

  if (!file || !uploadedBy)
    return NextResponse.json({ error: 'Missing required fields: file, uploadedBy' }, { status: 400 })

  const validation = validationService.validate(file)
  if (!validation.isValid)
    return NextResponse.json({ error: validation.error }, { status: 422 })

  const { data, error } = await uploadService.replace(params.id, file, uploadedBy)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ data })
}

// DELETE /api/uploads/:id  (soft delete)
export async function DELETE(req: NextRequest, { params }: Params) {
  const { searchParams } = req.nextUrl
  const deletedBy = searchParams.get('deletedBy') ?? 'system'

  const { error } = await uploadService.softDelete(params.id, deletedBy)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ message: 'Document deleted successfully' })
}
