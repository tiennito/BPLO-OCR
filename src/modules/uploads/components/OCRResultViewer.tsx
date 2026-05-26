'use client'

import React from 'react'
import { Copy, Download, CheckCircle } from 'lucide-react'
import { ocrResultFormatting, ocrTextSanitization } from '@/src/services/ocr.validation'
import type { OCRResult } from '@/src/types/ocr.types'

interface Props {
  result: OCRResult
  onCopy?: () => void
  onDownload?: () => void
}

export const OCRResultViewer: React.FC<Props> = ({ result, onCopy, onDownload }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }, [result.text, onCopy])

  const handleDownload = React.useCallback(() => {
    const element = document.createElement('a')
    const file = new Blob([result.text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `ocr-result-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    onDownload?.()
  }, [result.text, onDownload])

  const lines = ocrTextSanitization.extractLines(result.text)
  const words = ocrTextSanitization.extractWords(result.text)
  const processingTimeFormatted = ocrResultFormatting.formatProcessingTime(result.processingTime)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900">OCR Results</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Download as text file"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Confidence</p>
          <p className="text-sm font-semibold text-gray-900">
            {(result.confidence * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Processing Time</p>
          <p className="text-sm font-semibold text-gray-900">{processingTimeFormatted}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Lines Detected</p>
          <p className="text-sm font-semibold text-gray-900">{lines.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Words Detected</p>
          <p className="text-sm font-semibold text-gray-900">{words.length}</p>
        </div>
      </div>

      {/* Extracted Text */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Extracted Text</p>
        <div className="relative">
          <pre className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs leading-relaxed text-gray-800 overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {result.text}
          </pre>
        </div>
      </div>

      {/* Image Metadata */}
      {result.metadata && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">Image Information</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            {result.metadata.imageWidth && (
              <div>Width: {result.metadata.imageWidth}px</div>
            )}
            {result.metadata.imageHeight && (
              <div>Height: {result.metadata.imageHeight}px</div>
            )}
            {result.metadata.dpi && (
              <div>DPI: {result.metadata.dpi}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
