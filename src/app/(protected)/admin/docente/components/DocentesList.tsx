"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MateriasModal from "./MateriasModal"
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

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

  const getCompletionPercentageColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200'
    if (percentage < 25) return 'bg-red-200'
    if (percentage < 50) return 'bg-orange-200'
    if (percentage < 75) return 'bg-yellow-200'
    return 'bg-green-200'
  }

  const getCompletionPercentageText = (percentage: number) => {
    if (percentage === 0) return 'text-gray-600'
    if (percentage < 25) return 'text-red-700'
    if (percentage < 50) return 'text-orange-700'
    if (percentage < 75) return 'text-yellow-700'
    return 'text-green-700'
  }

  const getStatusBadge = (docente: DocenteGeneralMetrics) => {
    if (docente.total_pendientes === 0 && docente.total_realizadas > 0) {
      return { label: 'Completado', color: 'bg-green-100 text-green-800' }
    }
    if (docente.total_realizadas > 0) {
      return { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' }
    }
    return { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' }
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
    if (pagination.page > 1) {
      buttons.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={loading}
          className="border-gray-300 hover:border-blue-500"
        >
          Anterior
        </Button>
      )
    }

    // Números de página
    if (startPage > 1) {
      buttons.push(
        <Button
          key={1}
          variant={pagination.page === 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={loading}
          className={pagination.page === 1 ? 'bg-blue-600' : 'border-gray-300'}
        >
          1
        </Button>
      )
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-2 py-2 text-gray-500">
            ...
          </span>
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={pagination.page === i ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(i)}
          disabled={loading}
          className={
            pagination.page === i
              ? 'bg-blue-600'
              : 'border-gray-300 hover:border-blue-500'
          }
        >
          {i}
        </Button>
      )
    }

    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        buttons.push(
          <span key="dots2" className="px-2 py-2 text-gray-500">
            ...
          </span>
        )
      }
      buttons.push(
        <Button
          key={pagination.pages}
          variant={pagination.page === pagination.pages ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(pagination.pages)}
          disabled={loading}
          className={
            pagination.page === pagination.pages
              ? 'bg-blue-600'
              : 'border-gray-300 hover:border-blue-500'
          }
        >
          {pagination.pages}
        </Button>
      )
    }

    // Botón siguiente
    if (pagination.page < pagination.pages) {
      buttons.push(
        <Button
          key="next"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={loading}
          className="border-gray-300 hover:border-blue-500"
        >
          Siguiente
        </Button>
      )
    }

    return buttons
  }

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3.934a3 3 0 01-2.868-4.06m17.868 0a9.003 9.003 0 01-5.909 3.042M15 21H9m6 0h6a3 3 0 01-2.868-4.06m-11.868 0a9.003 9.003 0 015.909-3.042m0 0A9 9 0 0127 12c0-4.978-4.029-9-9-9s-9 4.022-9 9" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Docentes</CardTitle>
                <p className="text-green-100 text-sm mt-1">
                  Total: {pagination.total} docentes | Página {pagination.page} de {pagination.pages}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                placeholder="Buscar por nombre o ID de docente..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                disabled={loading}
                className="pl-10 border-2 border-gray-200 focus:border-green-500 rounded-xl h-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-green-600"></div>
              <span className="ml-4 text-gray-600 font-medium">Cargando docentes...</span>
            </div>
          ) : docentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay docentes</h3>
              <p className="text-gray-600">Ajusta los filtros o intenta una búsqueda diferente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID Docente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Total Evaluaciones</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Realizadas</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Pendientes</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Cumplimiento</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Promedio</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {docentes.map((docente, index) => {
                    const status = getStatusBadge(docente)
                    return (
                      <tr
                        key={`${docente.docente}-${index}`}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {docente.docente}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {docente.nombre_docente?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {docente.nombre_docente || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {docente.total_evaluaciones}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                            {docente.total_realizadas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-lg">
                            {docente.total_pendientes}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getCompletionPercentageColor(
                                  docente.porcentaje_cumplimiento
                                )} transition-all duration-300`}
                                style={{
                                  width: `${docente.porcentaje_cumplimiento}%`,
                                }}
                              ></div>
                            </div>
                            <span
                              className={`text-xs font-semibold ${getCompletionPercentageText(
                                docente.porcentaje_cumplimiento
                              )}`}
                            >
                              {docente.porcentaje_cumplimiento.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-900">
                            {docente.promedio_general !== null
                              ? docente.promedio_general.toFixed(2)
                              : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleViewMaterias(docente)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Ver Materias
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && !loading && docentes.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200">
              <div className="flex gap-1">{renderPaginationButtons()}</div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  )
}
