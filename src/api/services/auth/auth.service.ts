/**
 * Servicio de autenticación
 * Maneja login, logout y gestión de tokens
 * Con mejoras profesionales: logging, rate limiting y refresh automático
 */

import { httpClient } from '../../core/HttpClient';
import type { ApiResponse } from '../../types/api.types';
import { logger } from '../../utils/logger';
import { tokenManager } from '../../utils/tokenManager';
import { rateLimiter } from '../../utils/rateLimiter';

// ========================
// TYPES
// ========================

export interface DataloginUser {
  user_id: number;
  user_name: string;
  user_username: string;
  user_email: string;
  user_idrole: number;
  user_statusid: string;
  role_name: string;
}

export interface AuthUserLookup extends DataloginUser {
  rolesAuth?: Array<{ id: number; name: string }>;
  rolesAuthIds?: number[];
  rolesApp?: Array<{ id: number; name: string }>;
  rolesAppIds?: number[];
  roles?: string[];
  rolesIds?: number[];
}

export interface LoginRequest {
  user_username: string;
  user_password: string;
}

export interface LoginResponse {
  user: {
    user_id: number;
    user_name: string;
    user_username: string;
    user_email: string;
    rolesAuth: Array<{ id: number; name: string }>;
    rolesAuthIds: number[];
    rolesApp: Array<{ id: number; name: string }>;
    rolesAppIds: number[];
  };
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  jti: string;
  refreshExpiresAt: string;
}

export interface RefreshTokenRequest {
  user_id: number;
  refresh_token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  jti: string;
  refreshExpiresAt: string;
}

export interface UserProfileMateria {
  id: number;
  codigo: number | string;
  nombre: string;
  docente?: {
    documento: string;
    nombre: string;
  } | null;
}

export interface UserProfile {
  sede: string;
  facultad: string;
  nombre_completo: string;
  documento: string;
  programa: string;
  periodo: string;
  semestre: string;
  n_semestre: number | null;
  grupo: string | null;
  materias: UserProfileMateria[];
}

export interface AuthResponse extends ApiResponse<LoginResponse> {
  message: string;
}

// ========================
// AUTH SERVICE
// ========================

export const authService = {
  /**
   * Listar todos los usuarios remotos
   * GET /auth/
   */
  getAllUsers: async (): Promise<ApiResponse<DataloginUser[]>> => {
    try {
      logger.info('Obteniendo lista de usuarios');
      const response = await httpClient.get<{ success: boolean; data: DataloginUser[] }>('/auth/');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Error al obtener usuarios', { error: error.message });
      return {
        success: false,
        data: [],
        error,
      };
    }
  },

  /**
   * Obtener usuario por ID
   * GET /auth/id/{id}
   */
  getUserById: async (id: number): Promise<ApiResponse<DataloginUser>> => {
    try {
      logger.info('Obteniendo usuario por ID', { id });
      const userData = await httpClient.get<DataloginUser>(`/auth/id/${id}`);
      
      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      logger.error('Error al obtener usuario por ID', { id, error: error.message });
      return {
        success: false,
        data: {} as DataloginUser,
        error,
      };
    }
  },

  /**
   * Obtener usuario por username
   * GET /auth/username/{username}
   */
  getUserByUsername: async (username: string): Promise<ApiResponse<AuthUserLookup>> => {
    try {
      logger.info('Obteniendo usuario por username', { username });
      const response = await httpClient.getWithMeta<AuthUserLookup>(`/auth/username/${username}`);
      
      return {
        success: response.success || true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Error al obtener usuario por username', { username, error: error.message });
      return {
        success: false,
        data: {} as AuthUserLookup,
        error,
      };
    }
  },

  /**
   * Obtener perfil del usuario autenticado (estudiante)
   * GET /user
   */
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      logger.info('Obteniendo perfil del usuario autenticado');
      const response = await httpClient.get<UserProfile>('/user');

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      logger.error('Error al obtener perfil del usuario', { error: error.message });
      return {
        success: false,
        data: {} as UserProfile,
        error,
      };
    }
  },

  /**
   * Login con credenciales
   * POST /auth/login
   * Incluye rate limiting avanzado:
   * - 3 intentos silenciosos (sin mostrar contador)
   * - 5 intentos importantes con penalizaciones progresivas
   * - Bloqueo exponencial: 30s → 2min → 10min → 1h
   * - Persistencia en localStorage
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const identifier = credentials.user_username;
    
    try {
      // Verificar rate limiting
      const { allowed, remaining, blockedFor, penaltyTimeRemaining, showCounter } = rateLimiter.canAttempt(identifier);
      
      if (!allowed) {
        // Si está bloqueado (máximo de intentos alcanzado)
        if (blockedFor) {
          logger.warn('Intento de login bloqueado por rate limit', { 
            username: identifier, 
            blockedFor 
          });
          
          return {
            success: false,
            data: null as any,
            message: `Demasiados intentos fallidos. Intenta de nuevo en ${blockedFor} segundos.`,
            error: { code: 429, blockedFor },
          };
        }
        
        // Si está bajo penalización (espera entre intentos)
        if (penaltyTimeRemaining && penaltyTimeRemaining > 0) {
          logger.warn('Usuario bajo penalización temporal', { 
            username: identifier, 
            penaltySeconds: penaltyTimeRemaining 
          });
          
          return {
            success: false,
            data: null as any,
            message: `Por favor espera ${penaltyTimeRemaining} segundo${penaltyTimeRemaining > 1 ? 's' : ''} antes de intentar de nuevo.`,
            error: { code: 429, penaltyTimeRemaining },
          };
        }
      }
      
      logger.info('Iniciando login', { username: identifier, attemptsRemaining: remaining });
      
      const response = await httpClient.post<LoginResponse>('/auth/login', credentials);
      
      // Login exitoso - resetear rate limiter
      rateLimiter.reset(identifier);
      
      // Guardar tokens usando tokenManager
      if (response && typeof response === 'object' && 'accessToken' in response) {
        tokenManager.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          accessTokenExpiresAt: response.accessTokenExpiresAt,
          refreshTokenExpiresAt: response.refreshExpiresAt,
          userId: response.user.user_id, // Guardar el userId
        });
        
        // Iniciar background refresh automático
        tokenManager.startBackgroundRefresh();
      }
      
      logger.info('Login exitoso', { username: identifier, userId: response.user.user_id });

      return {
        success: true,
        data: response,
        message: 'Autenticación exitosa',
      };
    } catch (error: any) {
      // Registrar intento fallido
      rateLimiter.recordAttempt(identifier);
      
      const remaining = rateLimiter.getRemainingAttempts(identifier);
      const { showCounter } = rateLimiter.canAttempt(identifier);
      
      logger.error('Login fallido', { 
        username: identifier, 
        error: error.message,
        attemptsRemaining: remaining,
        showCounter 
      });
      
      let errorMessage = error.message || 'Error al autenticar';
      
      // Solo mostrar contador de intentos después de los 3 intentos silenciosos
      if (showCounter && remaining > 0) {
        errorMessage += ` (${remaining} intentos restantes)`;
      }
      
      return {
        success: false,
        data: null as any,
        message: errorMessage,
        error,
      };
    }
  },

  /**
   * Logout
   * POST /auth/logout
   * Revoca el refresh token en el servidor y limpia tokens locales
   */
  logout: async (): Promise<ApiResponse<{ revoked: boolean }>> => {
    try {
      logger.info('Cerrando sesión');
      
      // Detener background refresh
      tokenManager.stopBackgroundRefresh();
      
      // Intentar revocar el token en el servidor
      const response = await httpClient.post<{ success: boolean; data: { revoked: boolean } }>('/auth/logout', {});
      
      // Limpiar tokens locales independientemente de la respuesta del servidor
      tokenManager.clearTokens();
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Error al hacer logout', { error: error.message });
      
      // Aún así limpiar tokens locales
      tokenManager.clearTokens();
      tokenManager.stopBackgroundRefresh();
      
      return {
        success: false,
        data: { revoked: false },
        error,
      };
    }
  },

  /**
   * Refrescar access token usando refresh token
   * POST /auth/refresh
   */
  refreshToken: async (userId: number, refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    try {
      logger.info('Refrescando token', { userId });
      
      const response = await httpClient.post<{ success: boolean; data: RefreshTokenResponse }>('/auth/refresh', {
        user_id: userId,
        refresh_token: refreshToken,
      });
      
      // Actualizar tokens usando tokenManager
      if (response.data) {
        tokenManager.setTokens({
          accessToken: response.data.accessToken,
          accessTokenExpiresAt: response.data.accessTokenExpiresAt,
          refreshToken: response.data.refreshToken,
          refreshTokenExpiresAt: response.data.refreshExpiresAt,
          userId: userId, // Mantener el userId
        });
      }
      
      logger.info('Token refrescado exitosamente', { userId });
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Error al refrescar token', { userId, error: error.message });
      return {
        success: false,
        data: {} as RefreshTokenResponse,
        error,
      };
    }
  },

  /**
   * Obtener token actual
   */
  getToken: (): string | null => {
    return tokenManager.getAccessToken();
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated: (): boolean => {
    return tokenManager.hasValidTokens();
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  /**
   * Refrescar token manualmente (normalmente se hace automáticamente)
   * @deprecated Usar refreshToken() en su lugar
   */
  refreshAccessToken: async (): Promise<AuthResponse> => {
    try {
      logger.info('Refrescando token manualmente (deprecated)');
      const success = await tokenManager.refreshTokenIfNeeded();
      
      if (success) {
        return {
          success: true,
          data: null as any,
          message: 'Token refrescado',
        };
      }
      
      throw new Error('No se pudo refrescar el token');
    } catch (error: any) {
      logger.error('Error al refrescar token', { error: error.message });
      return {
        success: false,
        data: null as any,
        message: error.message || 'Error al refrescar token',
        error,
      };
    }
  },
  
  /**
   * Verificar y refrescar token automáticamente si es necesario
   */
  ensureValidToken: async (): Promise<boolean> => {
    return tokenManager.refreshTokenIfNeeded();
  },
};
