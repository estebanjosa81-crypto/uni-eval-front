/**
 * Hook Personalizado: useModal
 * Patrón consistente para manejo de modales
 * Reutilizable en todos los componentes que usan modales
 */

import { useState, useCallback } from 'react'

interface UseModalOptions<T> {
  initialItem?: T
  onOpen?: (item?: T) => void
  onClose?: () => void
}

export function useModal<T = any>(options?: UseModalOptions<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | undefined>(options?.initialItem)

  /**
   * Abrir modal (opcionalmente con un item)
   */
  const open = useCallback(
    (itemData?: T) => {
      setItem(itemData)
      setIsOpen(true)
      options?.onOpen?.(itemData)
    },
    [options]
  )

  /**
   * Cerrar modal
   */
  const close = useCallback(() => {
    setIsOpen(false)
    setItem(undefined)
    options?.onClose?.()
  }, [options])

  /**
   * Toggle del modal
   */
  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  /**
   * Actualizar item dentro del modal
   */
  const setModalItem = useCallback((newItem: T) => {
    setItem(newItem)
  }, [])

  /**
   * Verificar si hay item en edición
   */
  const isEditing = Boolean(item)

  return {
    isOpen,
    item,
    open,
    close,
    toggle,
    setModalItem,
    isEditing
  }
}
