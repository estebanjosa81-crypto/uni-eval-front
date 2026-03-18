"use client"

import type React from "react"
import { DocenteSidebar } from "./components/docente-sidebar"
import { useSidebar } from "@/hooks/useSidebar"
import { useAuth } from "@/src/api/core/auth/useAuth"
import { AUTH_ROLE_IDS } from "@/src/api/core/auth/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed, toggle } = useSidebar()
  const { user, isLoading, hasAuthRole } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    const authorized = hasAuthRole(AUTH_ROLE_IDS.DOCENTE)
    
    if (!authorized) {
      router.push('/')
      return
    }

    setIsAuthorized(true)
  }, [user, isLoading, hasAuthRole, router])

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
              No tienes permisos para acceder al panel de docentes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DocenteSidebar 
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
