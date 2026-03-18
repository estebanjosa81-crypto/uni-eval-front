/**
 * Utils / Funciones Helper Comunes
 * Reutilizables en toda la sección admin
 */

/**
 * Formateador de números con separador decimal y miles
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0'

  let numValue: number
  if (typeof value === 'string') {
    numValue = parseFloat(value)
  } else {
    numValue = value
  }

  return isFinite(numValue) ? numValue.toLocaleString('es-CO') : '0'
}

/**
 * Formateador de números con decimales específicos
 */
export function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value === undefined || value === null) return `0.${'0'.repeat(decimals)}`
  return isFinite(value) ? value.toFixed(decimals) : `0.${'0'.repeat(decimals)}`
}

/**
 * Formateador de Porcentaje
 */
export function formatPercentage(completed: number, total: number, decimals: number = 2): number {
  if (total <= 0) return 0
  const value = (completed / total) * 100
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0
}

/**
 * Formateador de Fecha a formato legible (es-CO)
 */
export function formatDate(fechaString: string): string {
  try {
    const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return fechaString

    const [, year, month, day] = match
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return fechaString
  }
}

/**
 * Truncar texto con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Capitalizar primer carácter
 */
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Contar filtros activos en el estado
 */
export function countActiveFilters(filtros: Record<string, any>): number {
  return Object.values(filtros).filter((value) => {
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'number') return value !== 0 && value !== null
    return Boolean(value)
  }).length
}

/**
 * Obtener período más reciente de una lista
 */
export function getLatestPeriod(periodos: string[]): string | null {
  if (!periodos?.length) return null

  return [...periodos].sort((a, b) => {
    const [anoA, semestreA] = a.split('-').map(Number)
    const [anoB, semestreB] = b.split('-').map(Number)

    if (anoA !== anoB) return anoB - anoA
    return semestreB - semestreA
  })[0] ?? null
}

/**
 * Normalizar respuesta de API con estructura variable
 */
export function normalizeApiResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const apiResponse = response as any
    if (Array.isArray(apiResponse.data)) return apiResponse.data
    if (
      apiResponse.data &&
      typeof apiResponse.data === 'object' &&
      Array.isArray(apiResponse.data.data)
    ) {
      return apiResponse.data.data
    }
  }
  return []
}

/**
 * Debounce para funciones
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      fn(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Validar email básico
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Agrupar array por propiedad
 */
export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string | number, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    },
    {} as Record<string | number, T[]>
  )
}

/**
 * Ordenar array por múltiples propiedades
 */
export function sortBy<T>(
  array: T[],
  ...keys: (keyof T)[]
): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      if (a[key] < b[key]) return -1
      if (a[key] > b[key]) return 1
    }
    return 0
  })
}

/**
 * Crear slug desde texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Comparar dos objetos
 */
export function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => a[key] === b[key])
}

/**
 * Obtener diferencia entre dos arrays
 */
export function arrayDifference<T>(a: T[], b: T[]): T[] {
  return a.filter((item) => !b.includes(item))
}

/**
 * Mezclar dos objetos (shallow merge)
 */
export function mergeObjects<T extends Record<string, any>>(obj1: T, obj2: Partial<T>): T {
  return { ...obj1, ...obj2 }
}
