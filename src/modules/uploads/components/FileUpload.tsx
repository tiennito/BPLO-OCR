'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, CloudUpload } from 'lucide-react'
import { UploadValidationMessage } from './UploadValidationMessage'
import { UploadProgress } from './UploadProgress'
import { FilePreview } from './FilePreview'
import { OCRProcessingButton } from './OCRProcessingButton'
import { UploadStatusBadge } from './UploadStatusBadge'
import { useFileUpload } from '../hooks/useFileUpload'
import { useOCRProcessing } from '../hooks/useOCRProcessing'
import { useFileValidation } from '../hooks/useFileValidation'

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

  const { ocrStatus, ocrResult, ocrError, process: runOCR, retry: retryOCR } = useOCRProcessing(uploadedBy)

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

  const handleOCR = useCallback(() => {
    if (!file?.dbRecord) return
    const { id, file_path, mime_type } = file.dbRecord
    if (ocrStatus === 'failed' || ocrStatus === 'completed') {
      retryOCR(id, file_path, mime_type)
    } else {
      runOCR(id, file_path, mime_type)
    }
  }, [file, ocrStatus, runOCR, retryOCR])

  const isUploaded = uploadState === 'uploaded'

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
              <OCRProcessingButton status={ocrStatus} onClick={handleOCR} />
            </div>

            {ocrError && <UploadValidationMessage message={ocrError} variant="error" />}

            {ocrResult && ocrStatus === 'completed' && (
              <div className="mt-2 space-y-3">
                <UploadValidationMessage message="OCR processing completed successfully." variant="success" />

                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Confidence Score</span>
                    <span className="font-semibold text-gray-800">
                      {ocrResult.confidence_score !== null
                        ? `${(ocrResult.confidence_score * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Processed At</span>
                    <span className="font-semibold text-gray-800">
                      {ocrResult.processed_at
                        ? new Date(ocrResult.processed_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  {ocrResult.extracted_text && (
                    <div className="mt-2">
                      <p className="text-gray-500 mb-1">Extracted Text</p>
                      <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 rounded p-2 max-h-40 overflow-y-auto text-xs leading-relaxed">
                        {ocrResult.extracted_text}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
