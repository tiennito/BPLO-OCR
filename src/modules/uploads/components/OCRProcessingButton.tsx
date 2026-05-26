import React from 'react'
import { ScanText, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import type { OCRStatus } from '../types/upload.types'

interface Props {
  status: OCRStatus
  disabled?: boolean
  onClick: () => void
}

const CONFIG: Record<OCRStatus, { label: string; icon: React.ReactNode; className: string }> = {
  ready:      { label: 'Process OCR',   icon: <ScanText className="w-4 h-4" />,   className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  processing: { label: 'Processing...', icon: <Loader2 className="w-4 h-4 animate-spin" />, className: 'bg-blue-400 text-white cursor-not-allowed' },
  retry:      { label: 'Retrying...',   icon: <Loader2 className="w-4 h-4 animate-spin" />, className: 'bg-orange-400 text-white cursor-not-allowed' },
  completed:  { label: 'Re-process OCR', icon: <RefreshCw className="w-4 h-4" />, className: 'bg-green-600 hover:bg-green-700 text-white' },
  failed:     { label: 'Retry OCR',     icon: <RefreshCw className="w-4 h-4" />,  className: 'bg-red-600 hover:bg-red-700 text-white' },
}

export const OCRProcessingButton: React.FC<Props> = ({ status, disabled, onClick }) => {
  const { label, icon, className } = CONFIG[status]
  const isLoading = status === 'processing' || status === 'retry'

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 ${className}`}
      aria-label={label}
      aria-busy={isLoading}
    >
      {icon}
      {label}
      {status === 'completed' && <CheckCircle className="w-4 h-4 ml-1" />}
      {status === 'failed' && <XCircle className="w-4 h-4 ml-1" />}
    </button>
  )
}
