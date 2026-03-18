/**
 * Componente Error Boundary
 * Captura errores de componentes hijos y muestra UI amigable
 */

'use client'

import React, { type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ErrorContext } from '../../types'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorContext: ErrorContext | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorContext: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)

    const errorContext: ErrorContext = {
      message: error.message || 'Error desconocido',
      code: 'COMPONENT_ERROR',
      details: errorInfo,
      timestamp: new Date(),
      severity: 'high'
    }

    this.setState({ errorContext })
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorContext: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4'>
          <Card className='w-full max-w-2xl border-red-100 shadow-lg'>
            <CardHeader className='border-b border-red-100 bg-red-50'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-red-100 p-3'>
                  <AlertCircle className='h-6 w-6 text-red-600' />
                </div>
                <CardTitle className='text-2xl font-bold text-red-900'>
                  Algo salió mal
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className='space-y-6 pt-6'>
              {/* Mensaje de Error */}
              <div className='space-y-2'>
                <h3 className='font-semibold text-slate-900'>
                  Descripción del Error:
                </h3>
                <div className='rounded-lg bg-red-50 p-4 font-mono text-sm text-red-700 border border-red-200'>
                  {this.state.error.message}
                </div>
              </div>

              {/* Información Técnica (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && (
                <details className='space-y-2'>
                  <summary className='cursor-pointer font-semibold text-slate-700 hover:text-slate-900'>
                    Detalles técnicos
                  </summary>
                  <div className='rounded-lg bg-slate-100 p-4 font-mono text-xs text-slate-700 overflow-auto max-h-64'>
                    <pre>{this.state.error.stack}</pre>
                  </div>
                </details>
              )}

              {/* Sugerencias */}
              <div className='rounded-lg bg-blue-50 border border-blue-200 p-4'>
                <h4 className='mb-2 font-semibold text-blue-900'>
                  Puedes intentar:
                </h4>
                <ul className='space-y-1 text-sm text-blue-800 list-disc list-inside'>
                  <li>Recargar la página</li>
                  <li>Limpiar el caché del navegador</li>
                  <li>Contactar al equipo de soporte si el problema persiste</li>
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className='flex gap-3'>
                <Button
                  onClick={this.handleReset}
                  className='flex-1 gap-2 bg-blue-600 hover:bg-blue-700'
                >
                  <RefreshCw className='h-4 w-4' />
                  Intentar De Nuevo
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant='outline'
                  className='flex-1'
                >
                  Recargar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
