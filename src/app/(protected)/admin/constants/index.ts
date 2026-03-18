/**
 * Constantes Compartidas para Admin
 * Valores reutilizables en toda la sección admin
 */

/**
 * Configuración de Paginación por Defecto
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_LIMIT: 5,
  MAX_LIMIT: 100,
  LIMIT_OPTIONS: [5, 10, 20, 50, 100]
} as const

/**
 * Tiempos de Espera e Intervalos (en ms)
 */
export const TIMING = {
  DEBOUNCE_SEARCH: 500,
  DEBOUNCE_FILTER: 300,
  TOAST_DURATION: 3000,
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  MODAL_DELAY: 50
} as const

/**
 * Mensajes de Validación
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  MIN_LENGTH: (min: number) => `Mínimo ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Máximo ${max} caracteres`,
  EMAIL_INVALID: 'Email inválido',
  NUMBER_INVALID: 'Debe ser un número válido',
  CANNOT_UNDO: 'Esta acción no se puede deshacer'
} as const

/**
 * Mensajes de Éxito
 */
export const SUCCESS_MESSAGES = {
  CREATED: '¡Creación exitosa!',
  UPDATED: '¡Actualización exitosa!',
  DELETED: '¡Eliminación exitosa!',
  SAVED: '¡Guardado correctamente!',
  EXPORTED: '¡Exportación exitosa!',
  IMPORTED: '¡Importación exitosa!'
} as const

/**
 * Mensajes de Error
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Ocurrió un error inesperado',
  NETWORK: 'Error de conectividad',
  NOT_FOUND: 'Recurso no encontrado',
  UNAUTHORIZED: 'No tienes permisos',
  FORBIDDEN: 'Acceso denegado',
  VALIDATION_ERROR: 'Error de validación',
  SERVER_ERROR: 'Error del servidor'
} as const

/**
 * Rutas de Admin
 */
export const ADMIN_ROUTES = {
  ROOT: '/admin',
  DASHBOARD: '/admin/dashboard',
  DOCENTES: '/admin/docente',
  ROLES: '/admin/roles',
  FORMULARIO: '/admin/formulario',
  INFORMES: '/admin/informes',
  REPORTES: '/admin/reportes'
} as const

/**
 * Colores de Estados
 */
export const STATUS_COLORS = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  inactive: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-100'
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  }
} as const

/**
 * Límites de Caracteres para Formularios
 */
export const INPUT_LIMITS = {
  NAME: { min: 1, max: 100 },
  DESCRIPTION: { min: 1, max: 500 },
  EMAIL: { min: 5, max: 255 },
  USERNAME: { min: 3, max: 50 },
  SHORT_TEXT: { min: 1, max: 50 }
} as const

/**
 * Información de Puntajes y Calificaciones
 */
export const SCORE_RANGES = {
  EXCELLENT: { min: 4.5, max: 5, label: 'Excelente', color: 'text-emerald-600' },
  GOOD: { min: 4, max: 4.49, label: 'Bueno', color: 'text-blue-600' },
  AVERAGE: { min: 3, max: 3.99, label: 'Promedio', color: 'text-amber-600' },
  POOR: { min: 0, max: 2.99, label: 'Bajo', color: 'text-red-600' }
} as const

/**
 * Configuración de Logger en Desarrollo
 */
export const LOGGER_CONFIG = {
  ENABLED_IN_DEV: process.env.NODE_ENV === 'development',
  ENABLE_VERBOSE: false,
  MODULES_TO_LOG: ['Admin', 'Filters', 'Modal', 'API']
} as const

/**
 * Nulos y Valores por Defecto
 */
export const DEFAULTS = {
  EMPTY_STRING: '',
  NULL_ID: null,
  ZERO: 0,
  EMPTY_ARRAY: [],
  EMPTY_OBJECT: {}
} as const

/**
 * Identificadores de Composición de Clases Tailwind
 */
export const ROUNDED_SIZES = {
  SMALL: 'rounded-md',
  MEDIUM: 'rounded-lg',
  LARGE: 'rounded-xl',
  EXTRA_LARGE: 'rounded-2xl',
  FULL: 'rounded-[2.5rem]'
} as const

export const SHADOW_SIZES = {
  SMALL: 'shadow-sm',
  MEDIUM: 'shadow-md',
  LARGE: 'shadow-lg',
  EXTRA_LARGE: 'shadow-xl'
} as const
