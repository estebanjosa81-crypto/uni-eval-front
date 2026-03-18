/**
 * Tipos compartidos para la API
 * Interfaz para responses, paginación, filtros, etc.
 */

// ========================
// RESPONSE TYPES
// ========================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ========================
// FILTER TYPES
// ========================

export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: any;
}

export interface QueryParams extends PaginationParams, FilterParams {}

// ========================
// CRUD OPERATIONS
// ========================

export interface CrudService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  list: (params?: QueryParams) => Promise<PaginatedResponse<T>>;
  getById: (id: string | number) => Promise<T>;
  create: (data: CreateDTO) => Promise<T>;
  update: (id: string | number, data: UpdateDTO) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
  toggleBoolean?: (id: string | number, field: string) => Promise<T>;
}

// ========================
// ERROR TYPES
// ========================

export interface ApiError {
  message: string;
  code?: number;
  details?: any;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ========================
// ENTITY TYPES (Ejemplos base)
// ========================

export interface BaseEntity {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Evaluacion extends BaseEntity {
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: boolean;
  tipoEvaluacion?: string;
}

export interface Profesor extends BaseEntity {
  nombre: string;
  apellido: string;
  email: string;
  cedula?: string;
  telefono?: string;
  estado?: boolean;
}

export interface Asignatura extends BaseEntity {
  codAsignatura: string;
  nombre: string;
  creditos?: number;
  semestre?: number;
  estado?: boolean;
}

export interface Estudiante extends BaseEntity {
  nombre: string;
  apellido: string;
  email: string;
  codigo: string;
  estado?: boolean;
}

export interface Role extends BaseEntity {
  nombre: string;
  descripcion?: string;
  permisos?: string[];
}

// ========================
// BULK OPERATIONS
// ========================

export interface BulkCreateDTO<T> {
  data: T[];
}

export interface BulkUpdateDTO<T> {
  ids: (string | number)[];
  data: Partial<T>;
}

export interface BulkDeleteDTO {
  ids: (string | number)[];
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors?: Array<{
    id: string | number;
    error: string;
  }>;
}

// ========================
// ADVANCED FEATURES
// ========================

export interface ToggleBooleanDTO {
  id: string | number;
  field: string;
}

export interface ExportParams {
  format: 'csv' | 'excel' | 'pdf';
  filters?: FilterParams;
}

// ========================
// UTILITY TYPES
// ========================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;
