/**
 * Factory genérico para crear servicios CRUD automáticamente
 * Replica la filosofía del backend: define una vez, usa en todas partes
 */

import { HttpClient, httpClient } from '../core/HttpClient';
import type {
  CrudService,
  PaginatedResponse,
  QueryParams,
  BulkCreateDTO,
  BulkUpdateDTO,
  BulkDeleteDTO,
  BulkOperationResult,
} from '../types/api.types';

export interface CrudServiceConfig {
  resource: string; // Ej: '/evaluacion'
  client?: HttpClient;
  enableBulk?: boolean;
  enableToggle?: boolean;
}

/**
 * Crea un servicio CRUD completo automáticamente
 * 
 * @example
 * const evaluacionService = createCrudService<Evaluacion>({
 *   resource: '/evaluacion'
 * });
 */
export function createCrudService<
  T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>
>(
  config: CrudServiceConfig
): CrudService<T, CreateDTO, UpdateDTO> & {
  // Métodos adicionales opcionales
  bulkCreate?: (data: BulkCreateDTO<CreateDTO>) => Promise<BulkOperationResult>;
  bulkUpdate?: (data: BulkUpdateDTO<T>) => Promise<BulkOperationResult>;
  bulkDelete?: (data: BulkDeleteDTO) => Promise<BulkOperationResult>;
  toggleBoolean?: (id: string | number, field: string) => Promise<T>;
} {
  const { resource, client = httpClient, enableBulk = false, enableToggle = true } = config;

  const service: any = {
    /**
     * Listar con paginación y filtros
     */
    list: async (params?: QueryParams): Promise<PaginatedResponse<T>> => {
      return client.get<PaginatedResponse<T>>(resource, { params });
    },

    /**
     * Obtener por ID
     */
    getById: async (id: string | number): Promise<T> => {
      return client.get<T>(`${resource}/${id}`);
    },

    /**
     * Crear nuevo registro
     */
    create: async (data: CreateDTO): Promise<T> => {
      return client.post<T>(resource, data);
    },

    /**
     * Actualizar registro existente
     */
    update: async (id: string | number, data: UpdateDTO): Promise<T> => {
      return client.put<T>(`${resource}/${id}`, data);
    },

    /**
     * Eliminar registro
     */
    delete: async (id: string | number): Promise<void> => {
      return client.delete<void>(`${resource}/${id}`);
    },
  };

  // Agregar toggle si está habilitado
  if (enableToggle) {
    service.toggleBoolean = async (id: string | number, field: string): Promise<T> => {
      return client.put<T>(`${resource}/${id}/toggle/${field}`, {});
    };
  }

  // Agregar operaciones bulk si están habilitadas
  if (enableBulk) {
    service.bulkCreate = async (data: BulkCreateDTO<CreateDTO>): Promise<BulkOperationResult> => {
      return client.post<BulkOperationResult>(`${resource}/bulk`, data);
    };

    service.bulkUpdate = async (data: BulkUpdateDTO<T>): Promise<BulkOperationResult> => {
      return client.put<BulkOperationResult>(`${resource}/bulk`, data);
    };

    service.bulkDelete = async (data: BulkDeleteDTO): Promise<BulkOperationResult> => {
      return client.delete<BulkOperationResult>(`${resource}/bulk`, {
        params: { ids: data.ids.join(',') },
      });
    };
  }

  return service;
}

/**
 * Extensiones comunes para servicios específicos
 */
export interface ServiceExtensions<T> {
  /**
   * Exportar datos
   */
  export?: (format: 'csv' | 'excel' | 'pdf', filters?: any) => Promise<Blob>;
  
  /**
   * Importar datos
   */
  import?: (file: File) => Promise<BulkOperationResult>;
  
  /**
   * Obtener estadísticas
   */
  stats?: () => Promise<any>;
  
  /**
   * Buscar por campo específico
   */
  findBy?: (field: string, value: any) => Promise<T[]>;
}

/**
 * Helper para extender servicios con métodos custom
 * 
 * @example
 * const evaluacionService = extendService(
 *   createCrudService({ resource: '/evaluacion' }),
 *   {
 *     getByProfesor: (profesorId) => httpClient.get(`/evaluacion/profesor/${profesorId}`)
 *   }
 * );
 */
export function extendService<T, Extensions extends Record<string, any>>(
  baseService: CrudService<T>,
  extensions: Extensions
): CrudService<T> & Extensions {
  return {
    ...baseService,
    ...extensions,
  };
}

/**
 * Crear servicio con configuración avanzada
 */
export interface AdvancedServiceConfig<T> extends CrudServiceConfig {
  transform?: {
    request?: (data: any) => any;
    response?: (data: T) => T;
  };
  cache?: boolean;
  validate?: (data: any) => boolean | { valid: boolean; message?: string };
}

export function createAdvancedService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  config: AdvancedServiceConfig<T>
) {
  const baseService = createCrudService<T, CreateDTO, UpdateDTO>(config);
  const { transform, validate } = config;

  const validateOrThrow = (data: any) => {
    if (!validate) return;
    const result = validate(data);
    if (typeof result === 'boolean') {
      if (!result) throw { code: 400, message: 'Validacion fallida' };
      return;
    }
    if (result && !result.valid) {
      throw { code: 400, message: result.message || 'Validacion fallida' };
    }
  };

  if (!transform && !validate) return baseService;

  // Wrapper para transformaciones y validacion
  const service: any = {
    ...baseService,
    create: async (data: CreateDTO) => {
      validateOrThrow(data);
      const transformed = transform?.request ? transform.request(data) : data;
      const result = await baseService.create(transformed);
      return transform?.response ? transform.response(result) : result;
    },
    update: async (id: string | number, data: UpdateDTO) => {
      validateOrThrow(data);
      const transformed = transform?.request ? transform.request(data) : data;
      const result = await baseService.update(id, transformed);
      return transform?.response ? transform.response(result) : result;
    },
  };

  if (baseService.bulkCreate) {
    service.bulkCreate = async (data: BulkCreateDTO<CreateDTO>) => {
      validateOrThrow(data);
      return baseService.bulkCreate?.(data);
    };
  }

  return service;
}
