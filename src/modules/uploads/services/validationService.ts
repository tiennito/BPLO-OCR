import type { ValidationResult } from '../types/upload.types'

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf']
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'php', 'js', 'sh', 'cmd', 'msi', 'vbs']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const validationService = {
  validate(file: File, maxSize = MAX_FILE_SIZE): ValidationResult {
    if (file.size === 0) return { isValid: false, error: 'File is empty.' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (BLOCKED_EXTENSIONS.includes(ext))
      return { isValid: false, error: `File type ".${ext}" is not allowed.` }

    if (!ACCEPTED_EXTENSIONS.includes(ext))
      return {
        isValid: false,
        error: `Invalid format. Accepted: ${ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')}`,
      }

    if (!ACCEPTED_MIME_TYPES.includes(file.type))
      return { isValid: false, error: 'Invalid MIME type detected.' }

    if (file.size > maxSize)
      return {
        isValid: false,
        error: `File exceeds ${maxSize / 1024 / 1024}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB).`,
      }

    return { isValid: true }
  },

  sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
  },

  isImage(mimeType: string): boolean {
    return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)
  },

  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf'
  },
}
