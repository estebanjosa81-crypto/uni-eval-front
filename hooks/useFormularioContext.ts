import { createContext, useContext, useCallback, useState, useRef } from 'react';

export type DataRefreshType = 'tipo' | 'aspecto' | 'escala' | 'categoriasTipo' | 'categoriasAspecto' | 'categoriasEscala' | 'all';

interface FormularioContextType {
  // Refetch functions para cada tipo de dato
  refetchTipos: () => Promise<void>;
  refetchAspectos: () => Promise<void>;
  refetchEscalas: () => Promise<void>;
  refetchCategoriasTipo: () => Promise<void>;
  refetchCategoriasAspecto: () => Promise<void>;
  refetchCategoriasEscala: () => Promise<void>;
  refetchAll: () => Promise<void>;
  
  // Trigger de refetch específico
  triggerRefresh: (types: DataRefreshType[]) => Promise<void>;
  
  // Estados de carga
  isLoading: Record<DataRefreshType, boolean>;
  
  // Invalidar cache
  invalidateCache: (types: DataRefreshType[]) => void;
}

export const FormularioContext = createContext<FormularioContextType | undefined>(undefined);

/**
 * Hook para usar el contexto de Formulario
 * Proporciona acceso a funciones de refetch automático y gestión de cache
 */
export const useFormularioContext = () => {
  const context = useContext(FormularioContext);
  if (!context) {
    throw new Error('useFormularioContext debe ser usado dentro de FormularioProvider');
  }
  return context;
};

/**
 * Hook simplificado que retorna un callback onSuccess mejorado
 * Refetcha automáticamente los datos especificados
 */
export const useFormularioRefresh = (dataTypes: DataRefreshType[] = ['all']) => {
  const { triggerRefresh } = useFormularioContext();
  
  return useCallback(async () => {
    try {
      await triggerRefresh(dataTypes);
    } catch (error) {
      console.error('Error en refetch automático:', error);
    }
  }, [dataTypes, triggerRefresh]);
};

/**
 * Hook para obtener handlers específicos de refetch por tipo
 * Útil para modales que necesitan refetchar solo ciertos datos
 */
export const useFormularioRefreshHandlers = () => {
  const context = useFormularioContext();
  
  return {
    onSuccessTipo: context.refetchCategoriasTipo,
    onSuccessAspecto: context.refetchCategoriasAspecto,
    onSuccessEscala: context.refetchCategoriasEscala,
    onSuccessAll: context.refetchAll,
  };
};
