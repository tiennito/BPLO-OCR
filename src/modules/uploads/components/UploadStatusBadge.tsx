import React from 'react'
import type { DocumentStatus, OCRStatus } from '../types/upload.types'

const STATUS_MAP: Record<DocumentStatus | OCRStatus, { label: string; className: string }> = {
  pending_upload:       { label: 'Pending Upload',      className: 'bg-gray-100 text-gray-600' },
  uploaded:             { label: 'Uploaded',            className: 'bg-blue-100 text-blue-700' },
  under_ocr_processing: { label: 'Processing OCR',      className: 'bg-yellow-100 text-yellow-700' },
  ocr_completed:        { label: 'OCR Completed',       className: 'bg-green-100 text-green-700' },
  ocr_failed:           { label: 'OCR Failed',          className: 'bg-red-100 text-red-700' },
  rejected:             { label: 'Rejected',            className: 'bg-red-100 text-red-700' },
  approved:             { label: 'Approved',            className: 'bg-emerald-100 text-emerald-700' },
  ready:                { label: 'Ready',               className: 'bg-blue-100 text-blue-700' },
  processing:           { label: 'Processing',          className: 'bg-yellow-100 text-yellow-700 animate-pulse' },
  completed:            { label: 'Completed',           className: 'bg-green-100 text-green-700' },
  failed:               { label: 'Failed',              className: 'bg-red-100 text-red-700' },
  retry:                { label: 'Retrying',            className: 'bg-orange-100 text-orange-700 animate-pulse' },
}

interface Props {
  status: DocumentStatus | OCRStatus
}

export const UploadStatusBadge: React.FC<Props> = ({ status }) => {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
