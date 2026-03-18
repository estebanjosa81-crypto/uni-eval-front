/**
 * Cliente HTTP genérico para todas las peticiones al backend
 * Maneja interceptores, retry automático, refresh de tokens y logging
 */

import { apiConfig } from './apiConfig';
import { logger } from '../utils/logger';
import { tokenManager } from '../utils/tokenManager';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retry?: number;
  cache?: RequestCache;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: any;
}

export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: any) => any> = [];
  private isRefreshingToken: boolean = false;
  private refreshRetryCount: number = 0;
  private readonly MAX_REFRESH_RETRIES = 3;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || apiConfig.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...apiConfig.defaultHeaders,
    };
    
    // Validar configuración al inicializar
    this.validateConfig();
    
    // Configurar interceptor de auth automáticamente
    this.setupAuthInterceptor();
  }
  
  /**
   * Validar configuración de la API
   */
  private validateConfig(): void {
    if (!this.baseURL || this.baseURL === '') {
      logger.error('NEXT_PUBLIC_API_URL no está configurada');
      throw new Error('API URL no configurada. Define NEXT_PUBLIC_API_URL en tu archivo .env');
    }
    
    try {
      new URL(this.baseURL);
      logger.info('Cliente HTTP inicializado', { baseURL: this.baseURL });
    } catch (error) {
      logger.error('URL de API inválida', { baseURL: this.baseURL });
      throw new Error(`URL de API inválida: ${this.baseURL}`);
    }
  }
  
  /**
   * Configurar interceptor para agregar token automáticamente
   */
  private setupAuthInterceptor(): void {
    this.addRequestInterceptor(async (config) => {
      // Verificar y refrescar token si es necesario
      if (!this.isRefreshingToken) {
        await tokenManager.refreshTokenIfNeeded();
      }
      
      // Añadir token a headers
      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return config;
    });
  }

  /**
   * Añadir interceptor de request
   */
  addRequestInterceptor(interceptor: (config: any) => any) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Añadir interceptor de response
   */
  addResponseInterceptor(interceptor: (response: any) => any) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Construir query params
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Request HTTP genérico con manejo de errores y logging
   * Retorna la respuesta completa del API
   */
  private async requestApiResponse<T>(
    method: string,
    endpoint: string,
    options: RequestOptions & { body?: any } = {}
  ): Promise<ApiResponse<T> & Record<string, any>> {
    const { headers, params, timeout, retry = 0, body, cache } = options;

    // Construir URL
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}${endpoint}${queryString}`;
    
    logger.debug(`${method} ${endpoint}`, { params, hasBody: !!body });

    // Configuración del request
    let config: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      credentials: apiConfig.credentials,
      cache: cache || apiConfig.cache,
    };

    // Añadir body si existe
    if (body) {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Aplicar interceptores de request
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    try {
      // Timeout handling
      const controller = new AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Parsear respuesta
      let json: ApiResponse<T>;
      try {
        json = await response.json();
      } catch {
        const error: ApiError = {
          message: 'Error al parsear respuesta del servidor',
          code: response.status,
        };
        logger.error(`${method} ${endpoint} - Parse error`, { status: response.status });
        throw error;
      }

      // Aplicar interceptores de response
      for (const interceptor of this.responseInterceptors) {
        json = await interceptor(json);
      }

      // Manejar respuesta según estándar del backend
      if (!json.success) {
        const error: ApiError = {
          message: json.message || 'Error desconocido',
          code: response.status,
          details: json.error,
        };
        
        logger.warn(`${method} ${endpoint} - Error ${response.status}`, { 
          message: error.message 
        });
        
        // Si es 401 y no es un endpoint de autenticación, intentar refrescar token
        // Excluir /auth/login y /auth/refresh de reintentos automáticos
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !this.isRefreshingToken) {
          // Verificar si no hemos excedido el máximo de reintentos
          if (this.refreshRetryCount >= this.MAX_REFRESH_RETRIES) {
            logger.error('Máximo de reintentos de refresh alcanzado, limpiando tokens y redirigiendo a login');
            tokenManager.clearTokens();
            this.refreshRetryCount = 0;
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw error;
          }

          logger.info('Token inválido, intentando refrescar...', { retryCount: this.refreshRetryCount });
          this.isRefreshingToken = true;
          this.refreshRetryCount++;
          
          try {
            const refreshed = await tokenManager.refreshTokenIfNeeded();
            this.isRefreshingToken = false;
            
            if (refreshed) {
              logger.info('Token refrescado, reintentando request original');
              // Resetear el contador de reintentos si el refresh fue exitoso
              this.refreshRetryCount = 0;
              return this.requestApiResponse<T>(method, endpoint, options);
            } else {
              logger.error('No se pudo refrescar el token');
              tokenManager.clearTokens();
              this.refreshRetryCount = 0;
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } catch (refreshError) {
            this.isRefreshingToken = false;
            logger.error('Error al refrescar token', { error: refreshError });
            tokenManager.clearTokens();
            this.refreshRetryCount = 0;
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
        
        throw error;
      }
      
      logger.debug(`${method} ${endpoint} - Success`);
      return json;
    } catch (error: any) {
      // Retry logic
      if (retry > 0 && this.shouldRetry(error)) {
        logger.debug(`Reintentando ${method} ${endpoint} (${retry} intentos restantes)`);
        await this.delay(apiConfig.retryDelay);
        return this.requestApiResponse<T>(method, endpoint, { ...options, retry: retry - 1 });
      }

      // Log y re-throw error
      logger.error(`${method} ${endpoint} - Failed`, { 
        error: error.message,
        code: error.code 
      });
      throw this.normalizeError(error);
    }
  }

  /**
   * Request HTTP genérico que retorna solo data (compatibilidad)
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: RequestOptions & { body?: any } = {}
  ): Promise<T> {
    const json = await this.requestApiResponse<T>(method, endpoint, options);
    return json.data as T;
  }

  /**
   * Determinar si se debe reintentar
   */
  private shouldRetry(error: any): boolean {
    if (error.name === 'AbortError') return false;
    if (error.code && error.code >= 400 && error.code < 500) return false;
    return true;
  }

  /**
   * Normalizar errores
   */
  private normalizeError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout',
        code: 408,
      };
    }
    if (error.message && error.code !== undefined) {
      return error as ApiError;
    }
    return {
      message: error.message || 'Error de conexión',
      code: 0,
    };
  }

  /**
   * Delay helper para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * GET request que retorna respuesta completa (incluye pagination, message, etc.)
   */
  getWithMeta<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T> & Record<string, any>> {
    return this.requestApiResponse<T>('GET', endpoint, options);
  }

  /**
   * POST request
   */
  post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('POST', endpoint, { ...options, body: data });
  }

  /**
   * PUT request
   */
  put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...options, body: data });
  }

  /**
   * PATCH request
   */
  patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, { ...options, body: data });
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Download file (returns blob)
   */
  async downloadFile(
    endpoint: string,
    params?: Record<string, any>,
    options?: { showMessage?: boolean }
  ): Promise<{ data: Blob; filename?: string }> {
    const queryString = this.buildQueryString(params);
    const url = `${this.baseURL}${endpoint}${queryString}`;
    
    logger.debug(`Downloading file from ${endpoint}`, { params });

    const token = tokenManager.getAccessToken();
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: apiConfig.credentials,
      });

      if (!response.ok) {
        throw new Error(`Error al descargar archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Intentar obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename: string | undefined;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      logger.debug(`File downloaded successfully from ${endpoint}`);
      return { data: blob, filename };
    } catch (error) {
      logger.error(`Failed to download file from ${endpoint}`, { error });
      throw error;
    }
  }
}

// Instancia singleton del cliente HTTP
export const httpClient = new HttpClient();
export const apiClient = httpClient; // Alias para compatibilidad
