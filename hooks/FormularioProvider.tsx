'use client';

import React, { useCallback, useState, useRef, ReactNode } from 'react';
import { FormularioContext, type DataRefreshType } from './useFormularioContext';
import {
  tiposEvaluacionService,
  configuracionEvaluacionService,
  aspectosEvaluacionService,
  escalasValoracionService,
  categoriaTipoService,
  categoriaAspectoService,
  categoriaEscalaService,
  categoriaTipoMapService,
  categoriaAspectoMapService,
  categoriaEscalaMapService,
  rolService,
  type PaginationParams,
} from '@/src/api';

interface FormularioProviderProps {
  children: ReactNode;
  onDataRefresh?: (types: DataRefreshType[]) => Promise<void>;
}

/**
 * Provider para el contexto de Formulario
 * Centraliza la lógica de refetch de datos con cache inteligente
 */
export const FormularioProvider: React.FC<FormularioProviderProps> = ({
  children,
  onDataRefresh,
}) => {
  // Estados de carga para cada tipo de dato
  const [isLoading, setIsLoading] = useState<Record<DataRefreshType, boolean>>({
    tipo: false,
    aspecto: false,
    escala: false,
    categoriasTipo: false,
    categoriasAspecto: false,
    categoriasEscala: false,
    all: false,
  });

  // Cache timestamps para evitar refetch muy frecuentes
  const cacheTimestamps = useRef<Record<DataRefreshType, number>>({
    tipo: 0,
    aspecto: 0,
    escala: 0,
    categoriasTipo: 0,
    categoriasAspecto: 0,
    categoriasEscala: 0,
    all: 0,
  });

  // Cache duration en milisegundos (300ms - suficiente para evitar race conditions)
  const CACHE_DURATION = 300;

  /**
   * Verifica si el cache aún es válido
   */
  const isCacheValid = useCallback((type: DataRefreshType): boolean => {
    const lastRefresh = cacheTimestamps.current[type];
    return Date.now() - lastRefresh < CACHE_DURATION;
  }, []);

  /**
   * Actualiza el timestamp del cache
   */
  const updateCacheTimestamp = useCallback((type: DataRefreshType) => {
    cacheTimestamps.current[type] = Date.now();
  }, []);

  /**
   * Invalida el cache de ciertos tipos
   */
  const invalidateCache = useCallback((types: DataRefreshType[]) => {
    types.forEach(type => {
      cacheTimestamps.current[type] = 0;
    });
  }, []);

  /**
   * Función genérica para refetching con manejo de errores
   */
  const performRefresh = useCallback(
    async (types: DataRefreshType[]) => {
      // Filtrar tipos que aún tienen cache válido
      const typesToRefresh = types.filter(type => !isCacheValid(type));

      if (typesToRefresh.length === 0) {
        return; // Todo está en cache
      }

      // Marcar como loading
      setIsLoading(prev => ({
        ...prev,
        ...Object.fromEntries(typesToRefresh.map(t => [t, true])),
      }));

      try {
        // Ejecutar refetch personalizado si se proporciona
        if (onDataRefresh) {
          await onDataRefresh(typesToRefresh);
        }

        // Actualizar timestamps de cache
        typesToRefresh.forEach(type => updateCacheTimestamp(type));
      } catch (error) {
        console.error('Error durante refetch automático:', error);
        // Re-throw para que el llamador pueda manejar el error
        throw error;
      } finally {
        // Marcar como no loading
        setIsLoading(prev => ({
          ...prev,
          ...Object.fromEntries(typesToRefresh.map(t => [t, false])),
        }));
      }
    },
    [isCacheValid, updateCacheTimestamp, onDataRefresh]
  );

  /**
   * Refetch de tipos de evaluación y categorías
   */
  const refetchTipos = useCallback(() => {
    return performRefresh(['tipo', 'categoriasTipo']);
  }, [performRefresh]);

  /**
   * Refetch de aspectos y categorías
   */
  const refetchAspectos = useCallback(() => {
    return performRefresh(['aspecto', 'categoriasAspecto']);
  }, [performRefresh]);

  /**
   * Refetch de escalas y categorías
   */
  const refetchEscalas = useCallback(() => {
    return performRefresh(['escala', 'categoriasEscala']);
  }, [performRefresh]);

  /**
   * Refetch solo de categorías de tipo
   */
  const refetchCategoriasTipo = useCallback(() => {
    return performRefresh(['categoriasTipo']);
  }, [performRefresh]);

  /**
   * Refetch solo de categorías de aspecto
   */
  const refetchCategoriasAspecto = useCallback(() => {
    return performRefresh(['categoriasAspecto']);
  }, [performRefresh]);

  /**
   * Refetch solo de categorías de escala
   */
  const refetchCategoriasEscala = useCallback(() => {
    return performRefresh(['categoriasEscala']);
  }, [performRefresh]);

  /**
   * Refetch de todos los datos
   */
  const refetchAll = useCallback(() => {
    return performRefresh(['all']);
  }, [performRefresh]);

  /**
   * Trigger genérico de refetch
   */
  const triggerRefresh = useCallback(
    async (types: DataRefreshType[] = ['all']) => {
      if (types.includes('all')) {
        await refetchAll();
      } else {
        await performRefresh(types);
      }
    },
    [refetchAll, performRefresh]
  );

  const value = {
    refetchTipos,
    refetchAspectos,
    refetchEscalas,
    refetchCategoriasTipo,
    refetchCategoriasAspecto,
    refetchCategoriasEscala,
    refetchAll,
    triggerRefresh,
    isLoading,
    invalidateCache,
  };

  return (
    <FormularioContext.Provider value={value}>
      {children}
    </FormularioContext.Provider>
  );
};
