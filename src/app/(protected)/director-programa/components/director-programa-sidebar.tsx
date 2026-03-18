"use client"

import { Briefcase, BarChart, Users, FileText, Settings, BookOpen } from "lucide-react"
import { AppSidebar, type SidebarMenuItem } from "../../../../../components/ui/app-sidebar"

const directorProgramaMenuItems: SidebarMenuItem[] = [
  {
    href: "/director-programa/dashboard",
    icon: BarChart,
    label: "Dashboard",
    description: "Panel principal"
  },
  {
    href: "/director-programa/mis-materias",
    icon: BookOpen,
    label: "Mis Materias",
    description: "Materias asignadas"
  },
  {
    href: "/director-programa/eval/bienvenida",
    icon: FileText,
    label: "Mis Evaluaciones",
    description: "Evaluaciones asignadas"
  },
  {
    href: "/director-programa/docente",
    icon: Users,
    label: "Docentes",
    description: "Profesores del programa"
  },
  {
    href: "/director-programa/informes",
    icon: FileText,
    label: "Informes",
    description: "Reportes y análisis"
  },
]

interface DirectorProgramaSidebarProps {
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}

export function DirectorProgramaSidebar({ isCollapsed = false, onToggle }: DirectorProgramaSidebarProps) {
  return (
    <AppSidebar
      title="Director"
      titleIcon={Briefcase}
      menuItems={directorProgramaMenuItems}
      primaryColor="purple"
      secondaryColor="pink"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    />
  )
}
