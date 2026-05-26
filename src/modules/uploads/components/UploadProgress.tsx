import React from 'react'

interface Props {
  progress: number // 0–100
  label?: string
}

export const UploadProgress: React.FC<Props> = ({ progress, label = 'Uploading...' }) => (
  <div className="w-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>{label}</span>
      <span>{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
)
