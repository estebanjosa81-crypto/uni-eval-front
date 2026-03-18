/**
 * Hook Personalizado: useFilters
 * Centraliza la lógica de gestión de filtros
 * Reutilizable en dashboard, docente, formulario
 */

import { useState, useCallback } from 'react'
import type { FiltrosState } from '../types'
import { countActiveFilters } from '../utils'

interface UseFiltersOptions {
  initialFilters?: Partial<FiltrosState>
  onFiltersChange?: (filters: FiltrosState) => void
}

export function useFilters(options?: UseFiltersOptions) {
  const defaultFilters: FiltrosState = {
    configuracionSeleccionada: null,
    semestreSeleccionado: '',
    periodoSeleccionado: '',
    programaSeleccionado: '',
    grupoSeleccionado: '',
    sedeSeleccionada: '',
    ...options?.initialFilters
  }

  const [filtros, setFiltros] = useState<FiltrosState>(defaultFilters)

  /**
   * Actualizar un filtro específico
   */
  const setFilter = useCallback(
    (key: keyof FiltrosState, value: any) => {
      setFiltros((prev) => {
        const updated = { ...prev, [key]: value }
        options?.onFiltersChange?.(updated)
        return updated
      })
    },
    [options]
  )

  /**
   * Actualizar múltiples filtros
   */
  const setMultipleFilters = useCallback(
    (updates: Partial<FiltrosState>) => {
      setFiltros((prev) => {
        const updated = { ...prev, ...updates }
        options?.onFiltersChange?.(updated)
        return updated
      })
    },
    [options]
  )

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(() => {
    const cleared = { ...defaultFilters }
    setFiltros(cleared)
    options?.onFiltersChange?.(cleared)
  }, [defaultFilters, options])

  /**
   * Resetear a valores iniciales
   */
  const resetFilters = useCallback(() => {
    setFiltros(defaultFilters)
    options?.onFiltersChange?.(defaultFilters)
  }, [defaultFilters, options])

  /**
   * Obtener cantidad de filtros activos
   */
  const activeFiltersCount = countActiveFilters(filtros)

  /**
   * Verificar si hay filtros activos
   */
  const hasActiveFilters = activeFiltersCount > 0

  /**
   * Obtener objeto formateado para API
   */
  const getApiFilters = useCallback(() => {
    return {
      cfg_t: filtros.configuracionSeleccionada,
      semestre: filtros.semestreSeleccionado || undefined,
      periodo: filtros.periodoSeleccionado || undefined,
      programa: filtros.programaSeleccionado || undefined,
      grupo: filtros.grupoSeleccionado || undefined,
      sede: filtros.sedeSeleccionada || undefined
    }
  }, [filtros])

  return {
    filtros,
    setFilter,
    setMultipleFilters,
    clearFilters,
    resetFilters,
    activeFiltersCount,
    hasActiveFilters,
    getApiFilters
  }
}
