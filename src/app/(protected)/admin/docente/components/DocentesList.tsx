"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  FileSearch,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Settings
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import MateriasModal from "../../components/MateriasModal"
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"
import type { FiltrosState, PaginationInfo } from "../../types"

interface DocentesListProps {
  docentes: DocenteGeneralMetrics[]
  pagination: PaginationInfo
  loading: boolean
  filtros: FiltrosState
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  searchTerm: string
}

export default function DocentesList({
  docentes,
  pagination,
  loading,
  filtros,
  onPageChange,
  onSearch,
  searchTerm,
}: DocentesListProps) {
  const [selectedDocente, setSelectedDocente] = useState<DocenteGeneralMetrics | null>(null)
  const [showMateriasModal, setShowMateriasModal] = useState(false)

  const getStatusConfig = (docente: DocenteGeneralMetrics) => {
    if (docente.total_pendientes === 0 && docente.total_realizadas > 0) {
      return { 
        label: 'Completado', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: <CheckCircle2 className="w-3 h-3" />
      }
    }
    if (docente.total_realizadas > 0) {
      return { 
        label: 'En Progreso', 
        color: 'bg-blue-50 text-blue-700 border-blue-100',
        icon: <Clock className="w-3 h-3" />
      }
    }
    return { 
      label: 'Pendiente', 
      color: 'bg-slate-50 text-slate-600 border-slate-100',
      icon: <AlertCircle className="w-3 h-3" />
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-slate-300";
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 4.0) return "text-blue-600";
    if (score >= 3.0) return "text-amber-600";
    return "text-rose-600";
  }

  const handleViewMaterias = (docente: DocenteGeneralMetrics) => {
    setSelectedDocente(docente)
    setShowMateriasModal(true)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisible = 5
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2))
    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    // Botón anterior
    buttons.push(
      <Button
        key="prev"
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={loading || pagination.page === 1}
        className="rounded-xl hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    )

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={`page-btn-${i}`}
          variant={pagination.page === i ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(i)}
          disabled={loading}
          className={`h-9 w-9 rounded-xl font-bold transition-all duration-200 ${
            pagination.page === i 
              ? 'bg-slate-900 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          {i}
        </Button>
      )
    }

    // Botón siguiente
    buttons.push(
      <Button
        key="next"
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={loading || pagination.page === pagination.pages}
        className="rounded-xl hover:bg-slate-100 disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    )

    return buttons
  }

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            disabled={loading}
            className="pl-11 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl transition-all duration-300 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-4 rounded-full border-slate-200 text-slate-500 font-medium text-xs bg-white shadow-sm">
            <Users className="w-3.5 h-3.5 mr-2 text-indigo-500" />
            {pagination.total} Docentes
          </Badge>
          <div className="h-4 w-px bg-slate-200 mx-2" />
          <p className="text-xs font-medium text-muted-foreground">Página {pagination.page} / {pagination.pages}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground w-[34%] min-w-[280px] text-left">Docente</th>
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-left">Estado Operativo</th>
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-center">Evaluaciones</th>
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-left">Cumplimiento</th>
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-center">Calificación</th>
                <th className="px-6 py-5 text-xs font-medium text-muted-foreground text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(pagination.limit || 10)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-slate-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-1 w-16 rounded-full" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-32 space-y-2">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-8 w-12 rounded-lg mx-auto" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Skeleton className="h-10 w-28 rounded-2xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : docentes.length > 0 ? (
                docentes.map((docente) => {
                  const status = getStatusConfig(docente)
                  const compliance = docente.porcentaje_cumplimiento || 0
                  return (
                    <tr
                      key={`docente-row-${docente.docente}`}
                      className="group hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                              {docente.nombre_docente?.charAt(0) || 'D'}
                            </div>
                            {compliance === 100 && (
                              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg shadow-emerald-200">
                                <Award className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="w-full max-w-[420px] md:max-w-[520px]">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-900 transition-colors whitespace-normal break-words leading-snug">
                              {docente.nombre_docente || 'Sin nombre'}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground font-mono mt-1 flex items-center gap-1.5 whitespace-normal break-all">
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              ID: {docente.docente}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge variant="outline" className={`rounded-full border-2 px-3 py-1 font-medium text-xs flex items-center w-fit gap-2 shadow-sm ${status.color}`}>
                          <span className="relative flex h-2 w-2">
                             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color.split(' ')[1].replace('text-', 'bg-')}`}></span>
                             <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color.split(' ')[1].replace('text-', 'bg-')}`}></span>
                          </span>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm font-black text-slate-700">{docente.total_realizadas}</span>
                            <span className="text-xs font-normal text-slate-300">/ {docente.total_evaluaciones}</span>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={`comp-bar-${docente.docente}-${i}`} 
                                className={`h-1 w-2.5 rounded-full transition-all duration-500 ${
                                  (i / 5) * 100 < compliance ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-100'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="w-32">
                          <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[10px] font-black text-slate-900 italic tracking-tighter">{compliance.toFixed(0)}%</span>
                            <span className="text-xs font-normal text-slate-300">Progreso</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                compliance === 100 ? 'bg-emerald-500' : 
                                compliance > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center hover:scale-110 transition-transform cursor-help">
                          <span className={`text-2xl font-black italic tracking-tighter ${getScoreColor(docente.promedio_general)}`}>
                            {docente.promedio_general ? docente.promedio_general.toFixed(2) : "—"}
                          </span>
                          <div className="h-1 w-8 bg-slate-100 rounded-full mt-1 overflow-hidden shadow-inner">
                             <div 
                              className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(docente.promedio_general).replace('text-', 'bg-')}`} 
                              style={{ width: `${(docente.promedio_general || 0) * 20}%` }}
                             />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMaterias(docente)}
                          className="rounded-2xl border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 group/btn h-11 px-6 shadow-sm active:scale-95"
                        >
                          <Settings className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-500" />
                          <span className="font-medium text-xs">Gestionar</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto animate-in zoom-in duration-500">
                      <div className="p-10 rounded-[3rem] bg-slate-50 mb-6 border border-slate-100 shadow-inner">
                        <FileSearch className="w-16 h-16 text-slate-200" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">Sin resultados</h3>
                      <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                        No pudimos encontrar docentes con los filtros actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-3xl border border-slate-100">
        <p className="text-xs font-medium text-muted-foreground hidden md:block">
          Mostrando {docentes.length} de {pagination.total} registros institucionales
        </p>
        <div className="flex items-center gap-2 mx-auto md:mx-0">
          {renderPaginationButtons()}
        </div>
      </div>

      {/* Materias Modal */}
      {showMateriasModal && selectedDocente && (
        <MateriasModal
          docente={selectedDocente}
          filtros={filtros}
          onClose={() => {
            setShowMateriasModal(false)
            setSelectedDocente(null)
          }}
        />
      )}
    </div>
  )
}
