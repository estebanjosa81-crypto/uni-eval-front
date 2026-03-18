/**
 * Hook de autenticación y autorización
 * Proporciona acceso a la información del usuario y funciones de autorización
 * 
 * VERSIÓN PRODUCCIÓN: Usa IDs internamente, nombres para presentación
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/src/api';
import type { User, AppRoleName, AuthorizationContext } from './types';
import {
  hasGlobalRole,
  hasRole,
  hasAppRole,
  hasAuthRole,
  getPrimaryRole,
  getPrimaryRoleId,
  getDefaultRoute,
  canAccessRoute,
  getUserRoleNames,
  getAuthorizationInfo,
} from './authorization.service';

/**
 * Hook principal de autenticación
 * Expone funciones que usan IDs internamente para seguridad
 */
export function useAuth(): AuthorizationContext {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    loadUser();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'authToken') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkHasRole = useCallback(
    (roleName: AppRoleName | AppRoleName[]) => hasRole(user, roleName),
    [user]
  );

  const checkHasAppRole = useCallback(
    (roleIds: number | number[]) => hasAppRole(user, roleIds),
    [user]
  );

  const checkHasAuthRole = useCallback(
    (roleIds: number | number[]) => hasAuthRole(user, roleIds),
    [user]
  );

  const checkHasGlobalRole = useCallback(
    () => hasGlobalRole(user),
    [user]
  );

  const checkCanAccessRoute = useCallback(
    (path: string, allowedRoleIds?: number[]) => canAccessRoute(user, path, allowedRoleIds),
    [user]
  );

  const getUserPrimaryRole = useCallback(
    () => getPrimaryRole(user),
    [user]
  );

  const getUserPrimaryRoleId = useCallback(
    () => getPrimaryRoleId(user),
    [user]
  );

  const getUserDefaultRoute = useCallback(
    () => getDefaultRoute(user),
    [user]
  );

  return {
    isAuthenticated,
    user,
    isLoading,
    hasRole: checkHasRole,
    hasAppRole: checkHasAppRole,
    hasAuthRole: checkHasAuthRole,
    hasGlobalRole: checkHasGlobalRole,
    canAccessRoute: checkCanAccessRoute,
    getPrimaryRole: getUserPrimaryRole,
    getDefaultRoute: getUserDefaultRoute,
  } as unknown as AuthorizationContext;
}

/**
 * Hook para requerir autenticación
 * Redirige al login si no está autenticado
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (hasChecked) return;

    const checkAuth = async () => {
      const token = authService.getToken();
      
      if (!token) {
        router.push(redirectTo);
        setHasChecked(true);
        return;
      }

      setIsChecking(false);
      setHasChecked(true);
    };

    checkAuth();
  }, [router, redirectTo, hasChecked]);

  return { isAuthenticated, user, isChecking };
}

/**
 * Hook para requerir roles específicos usando IDs
 * Redirige a la ruta predeterminada si no tiene el rol
 * 
 * @param requiredRoleIds - ID o IDs de roles requeridos (usar APP_ROLE_IDS)
 * @example useRequireRole(APP_ROLE_IDS.ADMIN)
 * @example useRequireRole([APP_ROLE_IDS.ADMIN, APP_ROLE_IDS.DOCENTE])
 */
export function useRequireRole(requiredRoleIds: number | number[]) {
  const router = useRouter();
  const { user, isLoading, hasAppRole: checkHasAppRole, getDefaultRoute: getUserDefaultRoute } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Esperar a que termine de cargar antes de hacer cualquier cosa
    if (isLoading) return;
    if (hasChecked) return;

    const checkRole = () => {
      if (!user) {
        router.push('/login');
        setHasChecked(true);
        return;
      }

      const authorized = checkHasAppRole(requiredRoleIds);
      
      if (!authorized) {
        // Redirigir a la ruta predeterminada del usuario
        const defaultRoute = getUserDefaultRoute();
        router.push(defaultRoute);
        setHasChecked(true);
        return;
      }

      setIsAuthorized(true);
      setHasChecked(true);
    };

    checkRole();
  }, [user, isLoading, requiredRoleIds, checkHasAppRole, getUserDefaultRoute, router, hasChecked]);

  return { isAuthorized, user };
}

/**
 * Hook para obtener información de autorización
 */
export function useAuthorizationInfo() {
  const { user } = useAuth();
  return getAuthorizationInfo(user);
}

/**
 * Hook para verificar permisos de ruta
 * Acepta IDs de roles (números) en lugar de nombres
 */
export function useRoutePermissions(routePath: string, allowedRoleIds?: number[]) {
  const { user } = useAuth();
  const canAccess = canAccessRoute(user, routePath, allowedRoleIds);

  return {
    canAccess,
    user,
    isAuthenticated: !!user,
  };
}
