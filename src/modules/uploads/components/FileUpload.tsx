'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, CloudUpload } from 'lucide-react'
import { UploadValidationMessage } from './UploadValidationMessage'
import { UploadProgress } from './UploadProgress'
import { FilePreview } from './FilePreview'
import { OCRProcessingButton } from './OCRProcessingButton'
import { OCRResultViewer } from './OCRResultViewer'
import { UploadStatusBadge } from './UploadStatusBadge'
import { useFileUpload } from '../hooks/useFileUpload'
import { useFileValidation } from '../hooks/useFileValidation'
import { useOCR } from '@/src/hooks/useOCR'

interface Props {
  documentType: string
  uploadedBy: string
  applicationId?: string
}

export const FileUpload: React.FC<Props> = ({ documentType, uploadedBy, applicationId }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { validationError, validate, clearError } = useFileValidation()

  const { file, uploadState, processFile, replace, remove } = useFileUpload({
    documentType,
    uploadedBy,
    applicationId,
    onError: (e) => validate({ name: '', size: 0, type: '' } as unknown as File) || clearError(),
  })

  const { status: ocrStatus, progress: ocrProgress, result: ocrResult, error: ocrError, process: processTesseract } = useOCR()

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (!dropped) return
      const result = validate(dropped)
      if (result.isValid) processFile(dropped)
    },
    [validate, processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (!selected) return
      const result = validate(selected)
      if (result.isValid) processFile(selected)
      e.target.value = ''
    },
    [validate, processFile]
  )

  const handleReplaceSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (!selected) return
      const result = validate(selected)
      if (result.isValid) replace(selected)
      e.target.value = ''
    },
    [validate, replace]
  )

  const handleOCR = useCallback(async () => {
    if (!file?.file) return
    await processTesseract(file.file, { language: 'eng' })
  }, [file, processTesseract])

  const isUploaded = uploadState === 'uploaded'
  const ocrButtonStatus = ocrStatus === 'idle' ? 'ready' : ocrStatus === 'processing' ? 'processing' : ocrStatus === 'preparing' ? 'processing' : ocrStatus === 'completed' ? 'completed' : 'failed'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">

      {/* ── Step 1: Upload Zone ── */}
      {!isUploaded && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document drop zone"
          className={`
            relative flex flex-col items-center justify-center gap-4 p-10
            border-2 border-dashed rounded-2xl cursor-pointer
            transition-all duration-200 select-none
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : uploadState === 'failed'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="File input"
          />

          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-white shadow'}`}>
            {uploadState === 'uploading'
              ? <CloudUpload className="w-8 h-8 text-blue-500 animate-bounce" />
              : <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            }
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {isDragging ? 'Drop to upload' : 'Drag & drop your document here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          </div>

          <p className="text-xs text-gray-400">
            JPG, JPEG, PNG, PDF &nbsp;•&nbsp; Max 5MB
          </p>

          {uploadState === 'uploading' && (
            <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
              <UploadProgress progress={50} />
            </div>
          )}
        </div>
      )}

      {/* ── Validation Error ── */}
      {validationError && <UploadValidationMessage message={validationError} variant="error" />}
      {uploadState === 'failed' && !validationError && (
        <UploadValidationMessage message="Upload failed. Please try again." variant="error" />
      )}

      {/* ── Step 2: Preview ── */}
      {isUploaded && file && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Uploaded Document</h3>
            <UploadStatusBadge status={file.dbRecord?.ocr_status ?? 'uploaded'} />
          </div>

          <FilePreview
            file={file}
            onRemove={remove}
            onReplace={() => replaceInputRef.current?.click()}
            uploadedAt={file.dbRecord?.uploaded_at}
          />

          <input
            ref={replaceInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleReplaceSelect}
            className="hidden"
            aria-label="Replace file input"
          />

          {/* ── Step 3: OCR ── */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">OCR Processing</p>
                <p className="text-xs text-gray-500">Extract text and data from your document</p>
              </div>
              <OCRProcessingButton status={ocrButtonStatus} onClick={handleOCR} disabled={ocrStatus === 'processing' || ocrStatus === 'preparing'} />
            </div>

            {(ocrStatus === 'processing' || ocrStatus === 'preparing') && (
              <div className="mt-2">
                <UploadProgress progress={ocrProgress} label="Extracting text..." />
              </div>
            )}

            {ocrError && (
              <div className="mt-2">
                <UploadValidationMessage message={ocrError.message} variant="error" />
              </div>
            )}

            {ocrStatus === 'completed' && ocrResult && (
              <div className="mt-2 space-y-3">
                <UploadValidationMessage message="OCR processing completed successfully." variant="success" />
                <OCRResultViewer result={ocrResult} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
