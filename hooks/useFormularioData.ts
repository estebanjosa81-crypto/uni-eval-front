import { useCallback, useState } from 'react';
import {
  tiposEvaluacionService,
  aspectosEvaluacionService,
  escalasValoracionService,
  categoriaTipoService,
  categoriaAspectoService,
  categoriaEscalaService,
  categoriaTipoMapService,
  categoriaAspectoMapService,
  categoriaEscalaMapService,
  rolService,
  type Tipo,
  type Aspecto,
  type Escala,
  type CategoriaTipo,
  type RolMixto,
} from '@/src/api';
import type { PaginationMeta, PaginationParams } from '@/src/api/types/api.types';

type ContentType = 'tipo' | 'aspecto' | 'escala';

interface CategoryItemsMap {
  tipo: Map<number, (Tipo & { map_id?: number })[]>;
  aspecto: Map<number, (Aspecto & { map_id?: number })[]>;
  escala: Map<number, (Escala & { map_id?: number })[]>;
}

interface UseFormularioDataReturn {
  // Loading states
  isLoading: boolean;
  isLoadingCategories: boolean;
  
  // Data states
  categoriasTipo: CategoriaTipo[];
  categoriasAspecto: any[];
  categoriasEscala: any[];
  categoryItemsMap: CategoryItemsMap;
  categoriasTipoPagination: PaginationMeta | null;
  categoriasAspectoPagination: PaginationMeta | null;
  categoriasEscalaPagination: PaginationMeta | null;
  aspectos: Aspecto[];
  escalas: Escala[];
  rolesDisponibles: RolMixto[];
  
  // Functions
  loadCategoriasTipo: (params?: PaginationParams) => Promise<void>;
  loadCategoriasAspecto: (params?: PaginationParams) => Promise<void>;
  loadCategoriasEscala: (params?: PaginationParams) => Promise<void>;
  loadAspectos: () => Promise<void>;
  loadEscalas: () => Promise<void>;
  loadRolesDisponibles: () => Promise<void>;
  loadItemsForCategories: (type: ContentType, categories: any[]) => Promise<void>;
  cargarDatosIniciales: () => Promise<void>;
  
  // State setters
  setCategoriasTipo: (value: any) => void;
  setCategoriasAspecto: (value: any) => void;
  setCategoriasEscala: (value: any) => void;
  setCategoryItemsMap: (value: any) => void;
  setCategoriasTipoPagination: (value: any) => void;
  setCategoriasAspectoPagination: (value: any) => void;
  setCategoriasEscalaPagination: (value: any) => void;
  setAspectos: (value: any) => void;
  setEscalas: (value: any) => void;
  setRolesDisponibles: (value: any) => void;
}

/**
 * Hook personalizado para manejar toda la lógica de carga de datos de Formulario
 * Centraliza la obtención de categorías, items y sus asociaciones
 * Proporciona funciones de refetch optimizadas para uso en modales
 */
export const useFormularioData = (): UseFormularioDataReturn => {
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Data states
  const [categoriasTipo, setCategoriasTipo] = useState<CategoriaTipo[]>([]);
  const [categoriasAspecto, setCategoriasAspecto] = useState<any[]>([]);
  const [categoriasEscala, setCategoriasEscala] = useState<any[]>([]);
  const [categoryItemsMap, setCategoryItemsMap] = useState<CategoryItemsMap>({
    tipo: new Map(),
    aspecto: new Map(),
    escala: new Map(),
  });
  const [categoriasTipoPagination, setCategoriasTipoPagination] = useState<PaginationMeta | null>(null);
  const [categoriasAspectoPagination, setCategoriasAspectoPagination] = useState<PaginationMeta | null>(null);
  const [categoriasEscalaPagination, setCategoriasEscalaPagination] = useState<PaginationMeta | null>(null);
  const [aspectos, setAspectos] = useState<Aspecto[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolMixto[]>([]);

  const extractItems = useCallback(<T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    return [];
  }, []);

  const extractPagination = useCallback((payload: any): PaginationMeta | null => {
    if (payload?.pagination) return payload.pagination as PaginationMeta;
    if (payload?.meta) {
      const meta = payload.meta;
      const totalPages = meta.pages ?? meta.totalPages ?? 1;
      const page = meta.page ?? 1;
      return {
        page,
        limit: meta.limit ?? 10,
        total: meta.total ?? 0,
        totalPages,
        hasNextPage: meta.hasNext ?? meta.hasNextPage ?? page < totalPages,
        hasPreviousPage: meta.hasPrev ?? meta.hasPreviousPage ?? page > 1,
      };
    }
    return null;
  }, []);

  const loadCategoriasTipo = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriaTipoService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<CategoriaTipo>(response.data);
        setCategoriasTipo(items);
        setCategoriasTipoPagination(extractPagination(response.data));
        await loadItemsForCategories('tipo', items);
      } else {
        setCategoriasTipo([]);
        setCategoriasTipoPagination(null);
      }
    } catch (error) {
      console.error('Error cargando categorías tipo:', error);
      setCategoriasTipo([]);
      setCategoriasTipoPagination(null);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [extractItems, extractPagination]);

  const loadCategoriasAspecto = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriaAspectoService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<any>(response.data);
        setCategoriasAspecto(items);
        setCategoriasAspectoPagination(extractPagination(response.data));
        await loadItemsForCategories('aspecto', items);
      } else {
        setCategoriasAspecto([]);
        setCategoriasAspectoPagination(null);
      }
    } catch (error) {
      console.error('Error cargando categorías aspecto:', error);
      setCategoriasAspecto([]);
      setCategoriasAspectoPagination(null);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [extractItems, extractPagination]);

  const loadCategoriasEscala = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriaEscalaService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<any>(response.data);
        setCategoriasEscala(items);
        setCategoriasEscalaPagination(extractPagination(response.data));
        await loadItemsForCategories('escala', items);
      } else {
        setCategoriasEscala([]);
        setCategoriasEscalaPagination(null);
      }
    } catch (error) {
      console.error('Error cargando categorías escala:', error);
      setCategoriasEscala([]);
      setCategoriasEscalaPagination(null);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [extractItems, extractPagination]);

  const loadItemsForCategories = useCallback(async (type: ContentType, categories: any[]) => {
    try {
      let mapService: any;
      let method: string;

      if (type === 'tipo') {
        mapService = categoriaTipoMapService;
        method = 'listTiposByCategoria';
      } else if (type === 'aspecto') {
        mapService = categoriaAspectoMapService;
        method = 'listAspectosByCategoria';
      } else {
        mapService = categoriaEscalaMapService;
        method = 'listEscalasByCategoria';
      }

      const newMap = new Map<number, any[]>();

      for (const category of categories) {
        const response = await (mapService[method](category.id) as Promise<any>);

        if (response?.success && response.data?.items) {
          newMap.set(category.id, response.data.items);
        } else {
          newMap.set(category.id, []);
        }
      }

      setCategoryItemsMap(prev => ({
        ...prev,
        [type]: newMap,
      }));
    } catch (error) {
      console.error(`Error cargando items para ${type}:`, error);
    }
  }, []);

  const loadAspectos = useCallback(async () => {
    try {
      const response = await aspectosEvaluacionService.getAll({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        const items = extractItems<Aspecto>(response.data);
        setAspectos(items);
      }
    } catch (error) {
      console.error('Error cargando aspectos:', error);
    }
  }, [extractItems]);

  const loadEscalas = useCallback(async () => {
    try {
      const response = await escalasValoracionService.getAll({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        const items = extractItems<Escala>(response.data);
        setEscalas(items);
      }
    } catch (error) {
      console.error('Error cargando escalas:', error);
    }
  }, [extractItems]);

  const loadRolesDisponibles = useCallback(async () => {
    try {
      const response = await rolService.getAllMix();
      if (response.success && response.data) {
        const items = extractItems<RolMixto>(response.data);
        setRolesDisponibles(items);
      }
    } catch (error) {
      console.error('Error cargando roles disponibles:', error);
    }
  }, [extractItems]);

  const cargarDatosIniciales = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadCategoriasTipo(),
        loadCategoriasAspecto(),
        loadCategoriasEscala(),
        loadAspectos(),
        loadEscalas(),
        loadRolesDisponibles(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadCategoriasTipo, loadCategoriasAspecto, loadCategoriasEscala, loadAspectos, loadEscalas, loadRolesDisponibles]);

  return {
    isLoading,
    isLoadingCategories,
    categoriasTipo,
    categoriasAspecto,
    categoriasEscala,
    categoryItemsMap,
    categoriasTipoPagination,
    categoriasAspectoPagination,
    categoriasEscalaPagination,
    aspectos,
    escalas,
    rolesDisponibles,
    loadCategoriasTipo,
    loadCategoriasAspecto,
    loadCategoriasEscala,
    loadAspectos,
    loadEscalas,
    loadRolesDisponibles,
    loadItemsForCategories,
    cargarDatosIniciales,
    setCategoriasTipo,
    setCategoriasAspecto,
    setCategoriasEscala,
    setCategoryItemsMap,
    setCategoriasTipoPagination,
    setCategoriasAspectoPagination,
    setCategoriasEscalaPagination,
    setAspectos,
    setEscalas,
    setRolesDisponibles,
  };
};
