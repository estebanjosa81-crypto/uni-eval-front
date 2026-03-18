/**
 * Types / Interfaces Centralizadas para el módulo Admin
 * Centraliza todos los tipos de datos usados en las páginas y componentes
 */

/**
 * Estado de Filtros - CENTRALIZADO
 * Se usa en dashboard, docente, formulario para evitar redefinición
 */
export interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

/**
 * Información de Paginación Unificada
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
  nextPage?: number | null
  prevPage?: number | null
}

/**
 * Estructura Modal Genérica
 */
export interface ModalState {
  isOpen: boolean
  item?: Record<string, any>
}

/**
 * Parámetros de Búsqueda y Sort
 */
export interface SearchParams {
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Respuesta de API Genérica
 */
export interface ApiResponse<T> {
  success?: boolean
  data?: T | { data: T }
  message?: string
  pagination?: PaginationInfo
}

/**
 * Configuración de Paso/Step en Wizards
 */
export interface ConfigurationStep {
  id: number
  title: string
  description: string
  completed: boolean
  icon?: React.ElementType
}

/**
 * Estados Loading comunes
 */
export interface LoadingStates {
  initial: boolean
  data: boolean
  action: boolean
  options: boolean
}

/**
 * Estructura de Errores
 */
export interface FormErrors {
  [key: string]: string | undefined
}

/**
 * Estructura de Toast/Notificación
 */
export interface ToastNotification {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

/**
 * Estados de Entidad (para badges y estados)
 */
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'error' | 'completed'

/**
 * Estado de Evaluación (para colores en gráficos)
 */
export type EvaluationStatus = 
  | 'excelente'
  | 'bueno'
  | 'regular'
  | 'necesita_mejora'
  | 'sin_evaluar'

/**
 * Información del Usuario con Roles
 */
export interface UserWithRoles {
  user_id: number
  user_name: string
  user_username: string
  user_email: string
  rolesAuth?: Array<{ id: number; name: string }>
  rolesApp?: Array<{ id: number; name: string }>
  roles?: string[]
  rolesIds?: number[]
}

/**
 * Contexto de Error para boundary
 */
export interface ErrorContext {
  message: string
  code?: string
  details?: unknown
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
}
