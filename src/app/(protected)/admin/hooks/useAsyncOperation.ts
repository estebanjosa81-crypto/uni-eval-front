/**
 * Hook Personalizado: useAsyncOperation
 * Maneja operaciones asincrónicas con loading y error states
 * Pattern consistente para API calls
 */

import { useState, useCallback } from 'react'
import type { ErrorContext } from '../types'

interface UseAsyncOperationOptions {
  onError?: (error: ErrorContext) => void
  onSuccess?: () => void
}

export function useAsyncOperation<T = any>(
  options?: UseAsyncOperationOptions
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorContext | null>(null)
  const [data, setData] = useState<T | null>(null)

  /**
   * Ejecutar operación asincrónica
   */
  const execute = useCallback(
    async (operation: () => Promise<T>, errorContext?: Omit<ErrorContext, 'timestamp' | 'message'>) => {
      try {
        setLoading(true)
        setError(null)
        const result = await operation()
        setData(result)
        options?.onSuccess?.()
        return result
      } catch (err: any) {
        const errorObj: ErrorContext = {
          message: err?.message || 'Error desconocido',
          code: err?.code,
          details: err,
          timestamp: new Date(),
          severity: 'high',
          ...errorContext
        }
        setError(errorObj)
        options?.onError?.(errorObj)
        throw errorObj
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  /**
   * Reintentar última operación
   */
  const retry = useCallback(
    async (operation: () => Promise<T>) => {
      return execute(operation)
    },
    [execute]
  )

  /**
   * Limpiar estado de error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Resetear todo
   */
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    // Estado
    loading,
    error,
    data,
    // Acciones
    execute,
    retry,
    clearError,
    reset,
    // Flags de ayuda
    isError: !!error,
    isSuccess: !loading && !error && data !== null
  }
}
