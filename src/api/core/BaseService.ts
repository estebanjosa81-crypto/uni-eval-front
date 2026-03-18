/**
 * Servicio base genérico para operaciones CRUD
 * Proporciona implementación reutilizable para todos los servicios
 */

import { httpClient } from './HttpClient';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api.types';
import type { ValidationResult, Validator } from '../validation/validation.types';

export interface BaseServiceValidators<CreateInput, UpdateInput> {
  create?: Validator<CreateInput>;
  update?: Validator<UpdateInput>;
  bulk?: Validator<any>;
}

export interface BaseServiceConfig<CreateInput, UpdateInput> {
  validators?: BaseServiceValidators<CreateInput, UpdateInput>;
}

/**
 * Clase base genérica para servicios CRUD
 * @template T - Tipo de entidad principal
 * @template CreateInput - Tipo de input para crear
 * @template UpdateInput - Tipo de input para actualizar
 */
export class BaseService<T extends { id: number }, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  private validators?: BaseServiceValidators<CreateInput, UpdateInput>;

  constructor(private baseUrl: string, config: BaseServiceConfig<CreateInput, UpdateInput> = {}) {
    this.validators = config.validators;
  }

  private getValidationError(result: ValidationResult) {
    return {
      code: 400,
      message: result.message || 'Validacion fallida',
      details: result.issues,
    };
  }

  private runValidation(
    validator: Validator<any> | undefined,
    data: any,
    context?: any
  ): ValidationResult | null {
    if (!validator) return null;
    return validator(data, context);
  }

  private isApiResponse(value: any): value is ApiResponse<any> {
    return Boolean(value && typeof value === 'object' && 'success' in value && 'data' in value);
  }

  /**
   * GET all con paginación opcional
   */
  async getAll(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.getAllFrom(this.baseUrl, params);
  }

  /**
   * GET all con paginación para endpoint custom
   */
  protected async getAllFrom(
    endpoint: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const response = await httpClient.getWithMeta<any>(endpoint, {
        params,
      });

      const pagination = this.normalizePagination(response);
      const data = Array.isArray(response?.data) ? response.data : [];
      return {
        success: true,
        data: {
          data,
          pagination,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * GET por ID
   */
  async getById(id: number): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.get<T>(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * POST crear nuevo
   */
  async create(data: CreateInput): Promise<ApiResponse<T>> {
    try {
      const validation = this.runValidation(this.validators?.create, data);
      if (validation && !validation.valid) {
        return {
          success: false,
          data: {} as any,
          error: this.getValidationError(validation),
        };
      }
      const response = await httpClient.post<T>(this.baseUrl, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * PUT actualizar por ID
   */
  async update(id: number, data: UpdateInput): Promise<ApiResponse<T>> {
    try {
      const validation = this.runValidation(this.validators?.update, data);
      if (validation && !validation.valid) {
        return {
          success: false,
          data: {} as any,
          error: this.getValidationError(validation),
        };
      }
      const response = await httpClient.put<T>(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * DELETE por ID
   */
  async delete(id: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { success: false, message: error.message } as any,
        error,
      };
    }
  }

  /**
   * PATCH toggle booleano (campos comunes: es_activo, es_cmt, etc)
   */
  async toggleField(id: number, field: string): Promise<ApiResponse<T>> {
    try {
      const response = await httpClient.patch<T>(`${this.baseUrl}/${id}/toggle/${field}`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * Actualizar un campo booleano específico
   * Maneja conversión de número a booleano si es necesario
   * @param id - ID del registro
   * @param field - Nombre del campo a actualizar
   * @param value - Valor booleano o número (0/1)
   */
  async updateBooleanField(
    id: number,
    field: string,
    value: number | boolean
  ): Promise<ApiResponse<T>> {
    const booleanValue = typeof value === 'boolean' ? value : Boolean(value);
    const updateData = { [field]: booleanValue } as UpdateInput;
    return this.update(id, updateData);
  }

  /**
   * POST bulk insert
   */
  async bulkCreate(data: { items: any[] }, options?: { validationContext?: any }): Promise<ApiResponse<any>> {
    try {
      const validation = this.runValidation(this.validators?.bulk, data, options?.validationContext);
      if (validation && !validation.valid) {
        return {
          success: false,
          data: {} as any,
          error: this.getValidationError(validation),
        };
      }
      const response = await httpClient.post(`${this.baseUrl}/bulk`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * GET custom endpoint
   */
  async getCustom(endpoint: string): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.get(`${this.baseUrl}${endpoint}`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as any,
        error,
      };
    }
  }

  /**
   * Método genérico para ejecutar operaciones async con manejo de errores y respuesta tipada
   * Evita repetir try-catch en los servicios específicos
   * @param fn - Función async a ejecutar
   * @param defaultErrorData - Datos por defecto en caso de error
   */
  protected async executeAsync<R>(
    fn: () => Promise<any>,
    defaultErrorData: R
  ): Promise<ApiResponse<R>> {
    try {
      const response = await fn();
      if (this.isApiResponse(response)) {
        return response;
      }
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        data: defaultErrorData,
        error,
      };
    }
  }

  private normalizePagination(response: any): PaginatedResponse<T>['pagination'] {
    if (response?.pagination) {
      return this.mapPagination(response.pagination);
    }
    if (response?.meta) {
      return this.mapPagination(response.meta);
    }
    return {
      page: 1,
      limit: 10,
      total: Array.isArray(response?.data) ? response.data.length : 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  private mapPagination(meta: any): PaginatedResponse<T>['pagination'] {
    const page = meta.page ?? 1;
    const totalPages = meta.pages ?? meta.totalPages ?? 1;
    const limit = meta.limit ?? 10;
    const total = meta.total ?? 0;
    const hasNextPage = meta.hasNext ?? meta.hasNextPage ?? page < totalPages;
    const hasPreviousPage = meta.hasPrev ?? meta.hasPreviousPage ?? page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
