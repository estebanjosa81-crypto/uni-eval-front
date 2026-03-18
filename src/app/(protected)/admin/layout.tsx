"use client"

import type React from 'react'
import { AdminSidebar } from './components/admin-sidebar'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { useSidebar } from '@/hooks/useSidebar'
import { useRequireRole } from '@/src/api/core/auth/useAuth'
import { APP_ROLE_IDS } from '@/src/api/core/auth/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createModuleLogger } from './lib/logger'

const logger = createModuleLogger('AdminLayout')

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed, toggle } = useSidebar()
  const { isAuthorized } = useRequireRole(APP_ROLE_IDS.ADMIN)

  // Si no está autorizado, mostrar mensaje de acceso denegado
  if (isAuthorized === false) {
    logger.warn('Intento de acceso no autorizado al panel admin')
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <Card className='w-96 border-red-100 shadow-lg'>
          <CardHeader className='bg-red-50 border-b border-red-100'>
            <CardTitle className='text-red-900'>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <p className='text-slate-600 leading-relaxed'>
              No tienes permisos para acceder al panel de administración. Solo los administradores pueden acceder a esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={(error) => logger.error('Error en layout admin', error)}>
      <div className='min-h-screen bg-slate-50 overflow-x-hidden'>
        {/* Sidebar */}
        <AdminSidebar 
          isCollapsed={isCollapsed} 
          onToggle={toggle} 
        />
        
        {/* Main Content */}
        <main
          className={`min-h-screen min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <div className='min-w-0'>
            {children}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}