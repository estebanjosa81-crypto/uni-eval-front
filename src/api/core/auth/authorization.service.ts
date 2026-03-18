/**
 * Servicio de autorización - PRODUCCIÓN READY
 * 
 * Estrategia:
 * - Usa IDs internamente (seguridad, rendimiento, mantenibilidad)
 * - Mapea a nombres solo cuando es necesario (presentación)
 * - Diferencia entre rolesApp (aplicación) y rolesAuth (autenticación)
 * - Alineado 100% con validación del backend
 */

import type { 
  User, 
  AppRoleName, 
  RoutePermission,
  RoleType 
} from './types';
import { 
  APP_ROLE_IDS, 
  AUTH_ROLE_IDS,
  APP_ROLE_ID_TO_NAME,
  APP_ROLE_NAME_TO_ID,
  AUTH_ROLE_ID_TO_NAME,
  ROLE_ROUTES, 
  ROLE_PRIORITY 
} from './types';

// ========================
// VALIDACIONES POR TIPO DE ROL
// ========================

/**
 * Verifica si el usuario tiene un rol de aplicación específico (por ID)
 * @param user - Usuario a validar
 * @param roleIds - ID o IDs de roles a verificar
 * @returns true si el usuario tiene al menos uno de los roles
 */
export function hasAppRole(user: User | null, roleIds: number | number[]): boolean {
  if (!user || !user.rolesAppIds) return false;
  
  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
  return ids.some(id => user.rolesAppIds.includes(id));
}

/**
 * Verifica si el usuario tiene un rol de autenticación específico (por ID)
 * @param user - Usuario a validar
 * @param roleIds - ID o IDs de roles a verificar
 * @returns true si el usuario tiene al menos uno de los roles
 */
export function hasAuthRole(user: User | null, roleIds: number | number[]): boolean {
  if (!user || !user.rolesAuthIds) return false;
  
  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
  return ids.some(id => user.rolesAuthIds.includes(id));
}

/**
 * Verifica si el usuario tiene rol global (Admin en app)
 * Similar a hasGlobalRole en el backend
 */
export function hasGlobalRole(user: User | null): boolean {
  return hasAppRole(user, APP_ROLE_IDS.ADMIN);
}

// ========================
// VALIDACIONES POR NOMBRE
// ========================

/**
 * Verifica si el usuario tiene un rol específico por nombre
 * NOTA: Internamente usa IDs para la comparación
 */
export function hasRole(user: User | null, roleName: AppRoleName | AppRoleName[]): boolean {
  if (!user) return false;
  
  // Si tiene rol global, tiene acceso a todo
  if (hasGlobalRole(user)) return true;
  
  const roleNames = Array.isArray(roleName) ? roleName : [roleName];
  const roleIds = roleNames.map(name => APP_ROLE_NAME_TO_ID[name]);
  
  return hasAppRole(user, roleIds);
}

// ========================
// INFORMACIÓN DEL USUARIO
// ========================

/**
 * Obtiene los IDs de roles de aplicación del usuario
 */
export function getUserAppRoleIds(user: User | null): number[] {
  return user?.rolesAppIds ?? [];
}

/**
 * Obtiene los IDs de roles de autenticación del usuario
 */
export function getUserAuthRoleIds(user: User | null): number[] {
  return user?.rolesAuthIds ?? [];
}

/**
 * Obtiene los nombres de roles desde rolesApp (para presentación)
 */
export function getUserRoleNames(user: User | null): AppRoleName[] {
  if (!user || !user.rolesAppIds) return [];
  
  return user.rolesAppIds
    .map(id => APP_ROLE_ID_TO_NAME[id])
    .filter(Boolean);
}

/**
 * Obtiene el rol principal del usuario según prioridad
 */
export function getPrimaryRole(user: User | null): AppRoleName | null {
  if (!user) return null;
  
  const userRoleIds = getUserAppRoleIds(user);
  
  // Buscar el rol con mayor prioridad
  for (const priorityId of ROLE_PRIORITY) {
    if (userRoleIds.includes(priorityId)) {
      return APP_ROLE_ID_TO_NAME[priorityId] ?? null;
    }
  }
  
  return null;
}

/**
 * Obtiene el ID del rol principal (para backend)
 */
export function getPrimaryRoleId(user: User | null): number | null {
  if (!user) return null;
  
  const userRoleIds = getUserAppRoleIds(user);
  
  for (const priorityId of ROLE_PRIORITY) {
    if (userRoleIds.includes(priorityId)) {
      return priorityId;
    }
  }
  
  return null;
}

// ========================
// RUTAS Y NAVEGACIÓN
// ========================

/**
 * Obtiene la ruta predeterminada según el rol del usuario
 */
export function getDefaultRoute(user: User | null): string {
  if (!user) return '/login';
  
  // Primero intentar con roles de aplicación
  const primaryRoleId = getPrimaryRoleId(user);
  
  if (primaryRoleId !== null && ROLE_ROUTES[primaryRoleId]) {
    return ROLE_ROUTES[primaryRoleId];
  }
  
  // Si no tiene roles de aplicación, verificar roles de autenticación
  const authRoleIds = getUserAuthRoleIds(user);
  
  // Si es estudiante (AUTH_ROLE_IDS.ESTUDIANTE = 1)
  if (authRoleIds.includes(AUTH_ROLE_IDS.ESTUDIANTE)) {
    return '/estudiante/bienvenida';
  }

  // Si es docente o docente de apoyo (AUTH_ROLE_IDS.DOCENTE = 2 o DOCENTE_APOYO = 15)
  // IMPORTANTE: Verificar docente ANTES que director programa (evita colisión de IDs)
  if (authRoleIds.includes(AUTH_ROLE_IDS.DOCENTE) || authRoleIds.includes(AUTH_ROLE_IDS.DOCENTE_APOYO)) {
    return '/docente/dashboard';
  }
  
  // Si es admin (AUTH_ROLE_IDS.ADMIN = 3)
  if (authRoleIds.includes(AUTH_ROLE_IDS.ADMIN)) {
    return '/admin/dashboard';
  }
  
  return '/login';
}

/**
 * Verifica si el usuario puede acceder a una ruta específica
 */
export function canAccessRoute(
  user: User | null, 
  routePath: string, 
  allowedRoleIds?: number[],
  roleType: RoleType = 'app'
): boolean {
  if (!user) return false;
  
  // Si tiene rol global, tiene acceso a todo
  if (hasGlobalRole(user)) return true;
  
  // Si no se especifican roles permitidos, cualquier usuario autenticado puede acceder
  if (!allowedRoleIds || allowedRoleIds.length === 0) return true;
  
  // Verificar según el tipo de rol
  if (roleType === 'auth') {
    return hasAuthRole(user, allowedRoleIds);
  }
  
  return hasAppRole(user, allowedRoleIds);
}

// ========================
// NORMALIZACIÓN (Para datos del backend)
// ========================

/**
 * Normaliza el nombre de un rol para mapeo a ID (roles de app)
 */
export function normalizeRoleName(roleName: string): AppRoleName | null {
  const normalized = roleName.toLowerCase().trim();
  
  const roleMap: Record<string, AppRoleName> = {
    'admin': 'Admin',
    'administrador': 'Admin',
    'director programa': 'Director Programa',
    'director_programa': 'Director Programa',
  };
  
  return roleMap[normalized] ?? null;
}

/**
 * Mapea nombre de rol de autenticación a ID
 * Maneja variaciones del backend como 'docente_planta', 'docente de apoyo'
 */
export function normalizeAuthRoleName(roleName: string): number | null {
  const normalized = roleName.toLowerCase().trim();
  
  const roleMap: Record<string, number> = {
    'estudiante': AUTH_ROLE_IDS.ESTUDIANTE,
    'docente': AUTH_ROLE_IDS.DOCENTE,
    'docente_planta': AUTH_ROLE_IDS.DOCENTE,
    'docente planta': AUTH_ROLE_IDS.DOCENTE,
    'docente_apoyo': AUTH_ROLE_IDS.DOCENTE_APOYO,
    'docente de apoyo': AUTH_ROLE_IDS.DOCENTE_APOYO,
    'admin': AUTH_ROLE_IDS.ADMIN,
    'administrador': AUTH_ROLE_IDS.ADMIN,
  };
  
  return roleMap[normalized] ?? null;
}

// ========================
// INFORMACIÓN DE AUTORIZACIÓN
// ========================

/**
 * Obtiene información detallada de autorización del usuario
 */
export function getAuthorizationInfo(user: User | null) {
  if (!user) {
    return {
      isAuthenticated: false,
      hasGlobalAccess: false,
      primaryRole: null,
      primaryRoleId: null,
      allRoles: [],
      allRoleIds: [],
      defaultRoute: '/login',
    };
  }
  
  return {
    isAuthenticated: true,
    hasGlobalAccess: hasGlobalRole(user),
    primaryRole: getPrimaryRole(user),
    primaryRoleId: getPrimaryRoleId(user),
    allRoles: getUserRoleNames(user),
    allRoleIds: getUserAppRoleIds(user),
    defaultRoute: getDefaultRoute(user),
  };
}

// ========================
// ROUTE PERMISSIONS (Por IDs)
// ========================

/**
 * Configuración de permisos por ruta (usando IDs)
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/admin': {
    path: '/admin',
    allowedRoleIds: [APP_ROLE_IDS.ADMIN],
    requiresAuth: true,
    type: 'app',
  },
  '/docente': {
    path: '/docente',
    allowedRoleIds: [AUTH_ROLE_IDS.DOCENTE, AUTH_ROLE_IDS.DOCENTE_APOYO],
    requiresAuth: true,
    type: 'auth',
  },
  '/estudiante': {
    path: '/estudiante',
    allowedRoleIds: [AUTH_ROLE_IDS.ESTUDIANTE],
    requiresAuth: true,
    type: 'auth',
  },
  '/director-programa': {
    path: '/director-programa',
    allowedRoleIds: [APP_ROLE_IDS.DIRECTOR_PROGRAMA],
    requiresAuth: true,
    type: 'app',
  },
};

/**
 * Obtiene los permisos para una ruta específica
 */
export function getRoutePermissions(routePath: string): RoutePermission | null {
  // Buscar coincidencia exacta primero
  if (ROUTE_PERMISSIONS[routePath]) {
    return ROUTE_PERMISSIONS[routePath];
  }
  
  // Buscar por prefijo
  for (const [path, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePath.startsWith(path)) {
      return permission;
    }
  }
  
  return null;
}
