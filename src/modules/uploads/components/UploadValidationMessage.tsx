import React from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

type Variant = 'error' | 'success' | 'info'

interface Props {
  message: string
  variant?: Variant
}

const STYLES: Record<Variant, { wrapper: string; icon: React.ReactNode }> = {
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',     icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> },
  success: { wrapper: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> },
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',   icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" /> },
}

export const UploadValidationMessage: React.FC<Props> = ({ message, variant = 'error' }) => {
  const { wrapper, icon } = STYLES[variant]
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${wrapper}`} role="alert">
      {icon}
      <span>{message}</span>
    </div>
  )
}
