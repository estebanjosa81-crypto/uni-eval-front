"use client"

import { GraduationCap, BarChart, FileText, Users, BookOpen, Calendar } from "lucide-react"
import { AppSidebar, type SidebarMenuItem } from "../../../../../components/ui/app-sidebar"

const docenteMenuItems: SidebarMenuItem[] = [
  {
    href: "/docente/dashboard",
    icon: BarChart,
    label: "Dashboard",
    description: "Panel principal"
  },
  {
    href: "/docente/mis-materias",
    icon: BookOpen,
    label: "Mis Materias",
    description: "Materias asignadas"
  },
  {
    href: "/docente/eval/bienvenida",
    icon: FileText,
    label: "Mis Evaluaciones",
    description: "Evaluaciones asignadas"
  }
]

interface DocenteSidebarProps {
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}

export function DocenteSidebar({ isCollapsed = false, onToggle }: DocenteSidebarProps) {
  return (
    <AppSidebar
      title="Docente"
      titleIcon={GraduationCap}
      menuItems={docenteMenuItems}
      primaryColor="green"
      secondaryColor="emerald"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    />
  )
}
