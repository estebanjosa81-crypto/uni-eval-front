/**
 * Hook Personalizado: usePagination
 * Centraliza la lógica de paginación
 * Reutilizable en lists y tablas
 */

import { useState, useCallback, useMemo } from 'react'
import type { PaginationInfo } from '../types'
import { PAGINATION_DEFAULTS } from '../constants'

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export function usePagination(
  total: number = 0,
  options?: UsePaginationOptions
) {
  const [page, setPage] = useState(options?.initialPage ?? PAGINATION_DEFAULTS.DEFAULT_PAGE)
  const [limit, setLimit] = useState(options?.initialLimit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT)

  /**
   * Calcular información de paginación
   */
  const pagination: PaginationInfo = useMemo(() => {
    const pages = Math.ceil(total / limit) || 1
    const hasNextPage = page < pages
    const hasPrevPage = page > 1

    return {
      page,
      limit,
      total,
      pages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  }, [page, limit, total])

  /**
   * Cambiar página
   */
  const changePage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, pagination.pages))
      setPage(validPage)
      options?.onPageChange?.(validPage)
    },
    [pagination.pages, options]
  )

  /**
   * Ir a primera página
   */
  const goFirst = useCallback(() => {
    changePage(1)
  }, [changePage])

  /**
   * Ir a última página
   */
  const goLast = useCallback(() => {
    changePage(pagination.pages)
  }, [changePage, pagination.pages])

  /**
   * Ir a página siguiente
   */
  const goNext = useCallback(() => {
    if (pagination.hasNextPage) {
      changePage(page + 1)
    }
  }, [page, pagination.hasNextPage, changePage])

  /**
   * Ir a página anterior
   */
  const goPrevious = useCallback(() => {
    if (pagination.hasPrevPage) {
      changePage(page - 1)
    }
  }, [page, pagination.hasPrevPage, changePage])

  /**
   * Cambiar límite de items por página
   */
  const changeLimit = useCallback(
    (newLimit: number) => {
      const validLimit = Math.max(
        PAGINATION_DEFAULTS.MIN_LIMIT,
        Math.min(newLimit, PAGINATION_DEFAULTS.MAX_LIMIT)
      )
      setLimit(validLimit)
      setPage(1) // Reset a primera página cuando cambia el limit
      options?.onLimitChange?.(validLimit)
    },
    [options]
  )

  /**
   * Resetear a página 1
   */
  const reset = useCallback(() => {
    setPage(PAGINATION_DEFAULTS.DEFAULT_PAGE)
    setLimit(PAGINATION_DEFAULTS.DEFAULT_LIMIT)
  }, [])

  return {
    // Estado
    page,
    limit,
    total,
    // Info calculada
    pagination,
    // Acciones
    changePage,
    goFirst,
    goLast,
    goNext,
    goPrevious,
    changeLimit,
    reset
  }
}
