/**
 * Logger Centralizado
 * Proporciona un sistema de logging consistente
 */

import { LOGGER_CONFIG } from '../constants'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogObject {
  module: string
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

/**
 * Sistema de logging formatado
 */
class Logger {
  private isDevelopment = LOGGER_CONFIG.ENABLED_IN_DEV

  /**
   * Formatear salida de log
   */
  private formatLog(
    module: string,
    level: LogLevel,
    message: string,
    data?: unknown
  ): LogObject {
    return {
      module,
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log de Debug
   */
  debug(module: string, message: string, data?: unknown) {
    if (!this.isDevelopment) return

    const logObj = this.formatLog(module, 'debug', message, data)
    console.log(
      `%c[${logObj.timestamp}] %c[${module}] %c${message}`,
      'color: gray; font-size: 0.8em;',
      'color: #0066cc; font-weight: bold;',
      'color: inherit;',
      data
    )
  }

  /**
   * Log de Info
   */
  info(module: string, message: string, data?: unknown) {
    const logObj = this.formatLog(module, 'info', message, data)
    console.info(
      `%c[${module}] %c✓ ${message}`,
      'color: #0066cc; font-weight: bold;',
      'color: #07711e; font-weight: 500;',
      data
    )
  }

  /**
   * Log de Warning
   */
  warn(module: string, message: string, data?: unknown) {
    const logObj = this.formatLog(module, 'warn', message, data)
    console.warn(
      `%c[${module}] %c⚠ ${message}`,
      'color: #ff9900; font-weight: bold;',
      'color: #ff9900; font-weight: 500;',
      data
    )
  }

  /**
   * Log de Error
   */
  error(module: string, message: string, error?: unknown) {
    const logObj = this.formatLog(module, 'error', message, error)
    console.error(
      `%c[${module}] %c✕ ${message}`,
      'color: #cc0000; font-weight: bold;',
      'color: #cc0000; font-weight: 500;',
      error
    )
  }

  /**
   * Log con tabla (útil para arrays/objetos)
   */
  table(data: any[], columns?: string[]) {
    if (!this.isDevelopment) return
    console.table(data, columns)
  }

  /**
   * Crear grupo de logs
   */
  group(label: string) {
    if (!this.isDevelopment) return
    console.group(`📦 ${label}`)
  }

  /**
   * Cerrar grupo de logs
   */
  groupEnd() {
    if (!this.isDevelopment) return
    console.groupEnd()
  }
}

/**
 * Instancia única del logger
 */
export const logger = new Logger()

/**
 * Helpers rápidos por módulo
 */
export const createModuleLogger = (moduleName: string) => ({
  debug: (message: string, data?: unknown) => logger.debug(moduleName, message, data),
  info: (message: string, data?: unknown) => logger.info(moduleName, message, data),
  warn: (message: string, data?: unknown) => logger.warn(moduleName, message, data),
  error: (message: string, error?: unknown) => logger.error(moduleName, message, error),
  table: (data: any[], columns?: string[]) => logger.table(data, columns),
  group: (label: string) => logger.group(label),
  groupEnd: () => logger.groupEnd()
})
