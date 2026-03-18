/**
 * Hook Personalizado: useFormValidation
 * Maneja validaciones de formularios de forma consistente
 */

import { useState, useCallback } from 'react'
import type { FormErrors } from '../types'

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

interface ValidationRules {
  [fieldName: string]: ValidationRule | ValidationRule[]
}

interface UseFormValidationOptions {
  onValidationError?: (errors: FormErrors) => void
}

export function useFormValidation(
  rules: ValidationRules,
  options?: UseFormValidationOptions
) {
  const [errors, setErrors] = useState<FormErrors>({})

  /**
   * Validar un campo específico
   */
  const validateField = useCallback(
    (fieldName: string, value: any): boolean => {
      const fieldRules = rules[fieldName]
      if (!fieldRules) return true

      const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

      for (const rule of rulesToCheck) {
        if (!rule.validate(value)) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: rule.message
          }))
          return false
        }
      }

      // Si pasa todas las validaciones, limpiar error
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[fieldName]
        return updated
      })

      return true
    },
    [rules]
  )

  /**
   * Validar múltiples campos
   */
  const validateForm = useCallback(
    (formData: Record<string, any>): boolean => {
      const newErrors: FormErrors = {}

      for (const [fieldName, value] of Object.entries(formData)) {
        const fieldRules = rules[fieldName]
        if (!fieldRules) continue

        const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

        for (const rule of rulesToCheck) {
          if (!rule.validate(value)) {
            newErrors[fieldName] = rule.message
            break
          }
        }
      }

      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) {
        options?.onValidationError?.(newErrors)
      }

      return Object.keys(newErrors).length === 0
    },
    [rules, options]
  )

  /**
   * Limpiar errores
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Limpiar error de un campo específico
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[fieldName]
      return updated
    })
  }, [])

  /**
   * Obtener error de un campo
   */
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors[fieldName]
    },
    [errors]
  )

  /**
   * Verificar si hay errores
   */
  const hasErrors = Object.keys(errors).length > 0

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasErrors
  }
}
