"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { authService, type UserProfile } from "@/src/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  User as UserIcon,
  LogOut,
  Calendar,
  ChevronDown,
  GraduationCap,
  ChevronRight,
  Building2,
  FileText,
  ArrowLeft,
  MapPin,
  BookOpen,
} from "lucide-react"
import type { User } from "@/src/api/core/auth/types"

interface HeaderProps {
  onLogout?: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [perfilAcademico, setPerfilAcademico] = useState<UserProfile | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const pathname = usePathname()
  const router = useRouter()

  const isInEvaluacion =
    pathname?.includes("/estudiante/evaluacion/") ||
    pathname?.includes("/estudiante/evaluar/") ||
    (pathname?.includes("/estudiante/dashboard/") && pathname !== "/estudiante/dashboard")

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setUser(JSON.parse(storedUser))
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }, [])

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoadingPerfil(true)
        const response = await authService.getProfile()
        if (response.success && response.data) setPerfilAcademico(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingPerfil(false)
      }
    }

    if (user) cargarPerfil()
  }, [user])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const capitalizeName = (name?: string | null) => {
    if (!name) return ""
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return capitalizeName(name)
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    if (onLogout) onLogout()
    else window.location.href = "/"
  }

  if (!user) {
    return (
      <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="font-bold text-lg">EduPortal</h1>
          </Link>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </header>
    )
  }

  const capitalizedName = capitalizeName(user.user_name)

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-xl border-b shadow"
            : "bg-white/60 backdrop-blur"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">

          {/* Left */}
          <div className="flex items-center gap-3">
            {isInEvaluacion && (
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h1 className="font-bold text-lg">EduPortal</h1>
            </Link>
          </div>

          {/* Right */}
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-xl px-2"
              >
                {/* NOMBRE AL LADO DEL ICON */}
                <span className="font-medium text-sm hidden sm:block">
                  {capitalizedName}
                </span>

                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold">
                    {getInitials(capitalizedName)}
                  </AvatarFallback>
                </Avatar>

                <ChevronDown
                  className={`h-4 w-4 transition ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 p-5" align="end">

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Mi Perfil
                  <ChevronRight className="ml-auto h-4 w-4" />
                </DropdownMenuItem>

                {/* MATERIAS */}
                <DropdownMenuItem onClick={() => router.push("/estudiante/materias") }>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Materias
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modal Perfil */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Perfil del Estudiante</DialogTitle>
          </DialogHeader>

          {loadingPerfil ? (
            <Skeleton className="h-32 w-full" />
          ) : perfilAcademico ? (
            <div className="space-y-4">
              <p className="font-bold text-lg">
                {capitalizeName(perfilAcademico.nombre_completo)}
              </p>

              <Badge>{perfilAcademico.semestre}</Badge>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<GraduationCap size={18} />}
                  label="Programa"
                  value={perfilAcademico.programa}
                />

                <InfoItem
                  icon={<Building2 size={18} />}
                  label="Facultad"
                  value={perfilAcademico.facultad}
                />

                <InfoItem
                  icon={<MapPin size={18} />}
                  label="Sede"
                  value={perfilAcademico.sede}
                />

                <InfoItem
                  icon={<Calendar size={18} />}
                  label="Periodo"
                  value={perfilAcademico.periodo}
                />
              </div>

              {perfilAcademico.materias && (
                <div className="space-y-2">
                  <p className="font-semibold flex items-center gap-2">
                    <FileText size={16} /> Materias
                  </p>

                  {perfilAcademico.materias.map((m, i) => (
                    <div key={i} className="p-2 border rounded-lg text-sm">
                      {m.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p>No se pudo cargar el perfil.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  )
}
