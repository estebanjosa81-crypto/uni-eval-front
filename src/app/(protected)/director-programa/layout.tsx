"use client"

import type React from "react"
import { DirectorProgramaSidebar } from "./components/director-programa-sidebar"
import { useSidebar } from "@/hooks/useSidebar"
import { useRequireRole } from "@/src/api/core/auth/useAuth"
import { APP_ROLE_IDS } from "@/src/api/core/auth/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DirectorProgramaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed, toggle } = useSidebar()
  const { isAuthorized } = useRequireRole(APP_ROLE_IDS.DIRECTOR_PROGRAMA)

  // Si no está autorizado, mostrar mensaje de acceso denegado
  if (isAuthorized === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              No tienes permisos para acceder al panel de Director de Programa.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DirectorProgramaSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggle} 
      />
      
      {/* Contenido principal - Añadido margin-left para compensar el sidebar fijo */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0 min-h-screen`}>
        <div className="flex-1 p-4 lg:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
