/**
 * Tipos de autorización y roles
 * Alineados con la estructura del backend
 * 
 * NOTA IMPORTANTE PARA PRODUCCIÓN:
 * - Usar IDs para lógica interna (seguridad, rendimiento, mantenibilidad)
 * - Usar nombres solo para presentación al usuario
 * - Backend diferencia entre rolesAuth (autenticación) y rolesApp (aplicación)
 */

// ========================
// USER & ROLES
// ========================

export interface Role {
  id: number;
  name: string;
}

export interface User {
  user_id: number;
  user_name: string;
  user_username: string;
  user_email: string;
  rolesAuth: Role[];
  rolesAuthIds: number[];
  rolesApp: Role[];
  rolesAppIds: number[];
  roles?: string[];
  rolesIds?: number[];
}

// ========================
// AUTHORIZATION
// ========================

export type AppRoleName = 'Admin' | 'Docente' | 'Estudiante' | 'Director Programa';
export type RoleType = 'app' | 'auth';

export interface RoutePermission {
  path: string;
  allowedRoleIds: number[];
  requiresAuth: boolean;
  type?: RoleType;
}

export interface AuthorizationContext {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  hasAppRole: (roleIds: number | number[]) => boolean;
  hasAuthRole: (roleIds: number | number[]) => boolean;
  hasRole: (roleName: AppRoleName | AppRoleName[]) => boolean;
  hasGlobalRole: () => boolean;
  canAccessRoute: (path: string, allowedRoleIds?: number[]) => boolean;
  getPrimaryRole: () => AppRoleName | null;
  getPrimaryRoleId?: () => number | null;
  getDefaultRoute: () => string;
}

// ========================
// CONSTANTS - ROLE IDS (Base de verdad)
// ========================

export const APP_ROLE_IDS = {
  ADMIN: 1,
  DOCENTE: 2,
  ESTUDIANTE: 3,
  DIRECTOR_PROGRAMA: 4,
} as const;

export const AUTH_ROLE_IDS = {
  ESTUDIANTE: 1,
  DOCENTE: 2,
  ADMIN: 3,
} as const;

// ========================
// MAPPING - IDs a Nombres (Para presentación)
// ========================

export const APP_ROLE_ID_TO_NAME: Record<number, AppRoleName> = {
  [APP_ROLE_IDS.ADMIN]: 'Admin',
  [APP_ROLE_IDS.DOCENTE]: 'Docente',
  [APP_ROLE_IDS.ESTUDIANTE]: 'Estudiante',
  [APP_ROLE_IDS.DIRECTOR_PROGRAMA]: 'Director Programa',
} as const;

export const APP_ROLE_NAME_TO_ID: Record<AppRoleName, number> = {
  'Admin': APP_ROLE_IDS.ADMIN,
  'Docente': APP_ROLE_IDS.DOCENTE,
  'Estudiante': APP_ROLE_IDS.ESTUDIANTE,
  'Director Programa': APP_ROLE_IDS.DIRECTOR_PROGRAMA,
} as const;

// ========================
// ROUTES - Usando IDs
// ========================

export const ROLE_ROUTES: Record<number, string> = {
  [APP_ROLE_IDS.ADMIN]: '/admin/dashboard',
  [APP_ROLE_IDS.DOCENTE]: '/docente/dashboard',
  [APP_ROLE_IDS.ESTUDIANTE]: '/estudiante/bienvenida',
  [APP_ROLE_IDS.DIRECTOR_PROGRAMA]: '/docente/dashboard',
};

export const ROLE_PRIORITY: number[] = [
  APP_ROLE_IDS.ADMIN,
  APP_ROLE_IDS.DIRECTOR_PROGRAMA,
  APP_ROLE_IDS.DOCENTE,
  APP_ROLE_IDS.ESTUDIANTE,
];
