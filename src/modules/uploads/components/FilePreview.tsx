import React from 'react'
import { FileText, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { validationService } from '../services/validationService'
import type { UploadedFileLocal } from '../types/upload.types'

interface Props {
  file: UploadedFileLocal
  onRemove: () => void
  onReplace: () => void
  uploadedAt?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export const FilePreview: React.FC<Props> = ({ file, onRemove, onReplace, uploadedAt }) => {
  const isImage = validationService.isImage(file.file.type)
  const isPdf = validationService.isPdf(file.file.type)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Image preview */}
      {isImage && file.preview && (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon for PDF */}
          {isPdf && (
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={file.file.name}>
              {file.file.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatSize(file.file.size)}
              {uploadedAt && ` • ${new Date(uploadedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {isPdf && file.preview && (
            <a
              href={file.preview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View PDF
            </a>
          )}

          <button
            onClick={onReplace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Replace file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace
          </button>

          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            aria-label="Remove file"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
