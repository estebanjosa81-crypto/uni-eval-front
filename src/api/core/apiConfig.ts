/**
 * Configuración centralizada de la API
 * Variables de entorno, timeouts, headers por defecto
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryDelay: number;
  maxRetries: number;
  defaultHeaders: Record<string, string>;
  credentials: RequestCredentials;
  cache: RequestCache;
}

export const apiConfig: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000, // 30 segundos
  retryDelay: 1000, // 1 segundo
  maxRetries: 2,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Para cookies/auth
  cache: 'no-cache',
};

/**
 * Endpoints conocidos (opcional, para type safety)
 */
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  
  // Evaluaciones
  evaluacion: '/evaluacion',
  
  // Profesores
  profesor: '/profesor',
  
  // Asignaturas
  asignatura: '/asignatura',
  
  // Estudiantes
  estudiante: '/estudiante',
  
  // Aspectos y escalas
  aspectoEscala: '/aspecto-escala',
  
  // Roles
  role: '/role',
  
  // Reportes
  reporte: '/reporte',
} as const;

/**
 * Headers dinámicos (ej: auth token)
 */
export const getAuthHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Update config (útil para testing o cambios dinámicos)
 */
export const updateApiConfig = (newConfig: Partial<ApiConfig>) => {
  Object.assign(apiConfig, newConfig);
};
