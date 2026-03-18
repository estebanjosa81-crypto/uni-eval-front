'use client'

import {
  BarChart,
  FileText,
  Users,
  FileCode,
  Download,
  Star
} from 'lucide-react'
import type { SidebarMenuItem } from '../../../../../components/ui/app-sidebar'
import { AppSidebar } from '../../../../../components/ui/app-sidebar'
import { ADMIN_ROUTES } from '../constants'
import { createModuleLogger } from '../lib/logger'

const logger = createModuleLogger('AdminSidebar')

/**
 * Items del menú de administración
 * Centralizado para fácil mantenimiento
 */
const adminMenuItems: SidebarMenuItem[] = [
  {
    href: ADMIN_ROUTES.DASHBOARD,
    icon: BarChart,
    label: 'Dashboard',
    description: 'Panel principal de control'
  },
  {
    href: ADMIN_ROUTES.DOCENTES,
    icon: Users,
    label: 'Docentes',
    description: 'Gestión y seguimiento de docentes'
  },
  {
    href: ADMIN_ROUTES.ROLES,
    icon: Star,
    label: 'Roles',
    description: 'Asignación de permisos y roles'
  },
  {
    href: ADMIN_ROUTES.FORMULARIO,
    icon: FileCode,
    label: 'Formulario',
    description: 'Creación y edición de formularios'
  },
  {
    href: ADMIN_ROUTES.INFORMES,
    icon: FileText,
    label: 'Informes',
    description: 'Reportes evaluaciones'
  },
  {
    href: ADMIN_ROUTES.REPORTES,
    icon: Download,
    label: 'Reportes',
    description: 'Análisis avanzado con IA'
  }
]

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}

/**
 * Sidebar de Administración
 * Menú principal de navegación para el panel admin
 */
export function AdminSidebar({ 
  isCollapsed = false, 
  onToggle 
}: AdminSidebarProps) {
  const handleToggle = (collapsed: boolean) => {
    logger.debug(`Sidebar ${collapsed ? 'colapsado' : 'expandido'}`)
    onToggle?.(collapsed)
  }

  return (
    <AppSidebar
      title='Admin'
      titleIcon={BarChart}
      menuItems={adminMenuItems}
      primaryColor='blue'
      secondaryColor='indigo'
      isCollapsed={isCollapsed}
      onToggle={handleToggle}
    />
  )
}
