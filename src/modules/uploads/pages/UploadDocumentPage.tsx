'use client'

import React from 'react'
import { FileUpload } from '../components/FileUpload'

interface Props {
  applicationId?: string
  uploadedBy?: string
  documentType?: string
}

export default function UploadDocumentPage({
  applicationId,
  uploadedBy = 'applicant',
  documentType = 'business_permit',
}: Props) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            eBPLS — Document Upload
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your business permit document for OCR processing and verification.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="flex items-center gap-2 mb-8 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Upload Document
          </span>
          <span className="flex-1 h-px bg-gray-200" />
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">2</span>
            Preview
          </span>
          <span className="flex-1 h-px bg-gray-200" />
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">3</span>
            Process OCR
          </span>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <FileUpload
            documentType={documentType}
            uploadedBy={uploadedBy}
            applicationId={applicationId}
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Accepted formats: JPG, JPEG, PNG, PDF &nbsp;•&nbsp; Maximum file size: 5MB
        </p>
      </div>
    </main>
  )
}
