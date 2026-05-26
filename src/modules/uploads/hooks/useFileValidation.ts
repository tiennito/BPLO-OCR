import { useState, useCallback } from 'react'
import { validationService } from '../services/validationService'
import type { ValidationResult } from '../types/upload.types'

export function useFileValidation() {
  const [validationError, setValidationError] = useState<string | null>(null)

  const validate = useCallback((file: File): ValidationResult => {
    const result = validationService.validate(file)
    setValidationError(result.error ?? null)
    return result
  }, [])

  const clearError = useCallback(() => setValidationError(null), [])

  return { validationError, validate, clearError }
}
