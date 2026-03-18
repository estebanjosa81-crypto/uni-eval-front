/**
 * Hook Personalizado: useDeleteConfirmation
 * Maneja la confirmación unificada de eliminación con modal
 */

import { useCallback, useState } from 'react'
import { useAsyncOperation } from './useAsyncOperation'
import { createModuleLogger } from '../lib/logger'

interface UseDeleteConfirmationOptions {
  onSuccess?: (data?: any) => void
  onError?: (error: Error) => void
  showSuccessNotification?: boolean
  itemName?: string
}

interface ConfirmationState {
  isOpen: boolean
  title: string
  description: string
  deleteFunction?: () => Promise<any>
  customOnSuccess?: (data?: any) => void
}

export function useDeleteConfirmation(options: UseDeleteConfirmationOptions = {}) {
  const {
    onSuccess,
    onError,
    showSuccessNotification = true,
    itemName = 'el elemento'
  } = options

  const logger = createModuleLogger('useDeleteConfirmation')
  const asyncOp = useAsyncOperation()
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: ''
  })

  /**
   * Solicitar confirmación de eliminación
   */
  const requestDeleteConfirmation = useCallback(
    async (
      title: string,
      description: string,
      deleteFunction: () => Promise<any>,
      customOnSuccess?: (data?: any) => void
    ) => {
      logger.info(`Confirmación de eliminación solicitada: ${title}`)

      // Mostrar modal de confirmación
      setConfirmation({
        isOpen: true,
        title,
        description,
        deleteFunction,
        customOnSuccess
      })
    },
    [logger]
  )

  /**
   * Confirmar eliminación
   */
  const confirmDelete = useCallback(async () => {
    if (!confirmation.deleteFunction) return

    logger.info(`Eliminación confirmada: ${confirmation.title}`)

    try {
      // Ejecutar función de eliminación
      const result = await asyncOp.execute(confirmation.deleteFunction)

      // Callback de éxito personalizado o por defecto
      if (confirmation.customOnSuccess) {
        confirmation.customOnSuccess(result)
      } else if (onSuccess) {
        onSuccess(result)
      }

      if (showSuccessNotification) {
        logger.info(`${itemName} eliminado exitosamente`)
      }

      // Cerrar modal
      setConfirmation({ isOpen: false, title: '', description: '' })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`Error al eliminar: ${err.message}`)

      if (onError) {
        onError(err)
      }
    }
  }, [confirmation, asyncOp, onSuccess, onError, showSuccessNotification, itemName, logger])

  /**
   * Cancelar eliminación
   */
  const cancelDelete = useCallback(() => {
    logger.info(`Eliminación cancelada: ${confirmation.title}`)
    setConfirmation({ isOpen: false, title: '', description: '' })
    asyncOp.clearError()
  }, [confirmation.title, logger, asyncOp])

  return {
    // Modal state
    confirmationDialog: {
      isOpen: confirmation.isOpen,
      title: confirmation.title,
      description: confirmation.description,
      onConfirm: confirmDelete,
      onCancel: cancelDelete,
      isLoading: asyncOp.loading
    },
    // Actions
    requestDeleteConfirmation,
    confirmDelete,
    cancelDelete,
    // State
    isDeleting: asyncOp.loading,
    deleteError: asyncOp.error,
    clearError: asyncOp.clearError
  }
}
