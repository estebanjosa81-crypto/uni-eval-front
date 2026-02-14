"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AspectoMetricsModal from "./AspectoMetricsModal"
import CompletionModal from "./CompletionModal"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { DocenteGeneralMetrics, DocenteMateriasMetrics, MateriaMetric } from "@/src/api/services/metric/metric.service"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface MateriasModalProps {
  docente: DocenteGeneralMetrics
  filtros: FiltrosState
  onClose: () => void
}

const logger = {
  debug: (module: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${module}] ${message}`, data ?? '')
    }
  },
  error: (module: string, message: string, error?: unknown) => {
    console.error(`[${module}] ${message}`, error ?? '')
  },
}

export default function MateriasModal({ docente, filtros, onClose }: MateriasModalProps) {
  const [materiasData, setMateriasData] = useState<DocenteMateriasMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMateria, setSelectedMateria] = useState<MateriaMetric | null>(null)
  const [showAspectoModal, setShowAspectoModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  useEffect(() => {
    cargarMaterias()
  }, [])

  const cargarMaterias = async () => {
    try {
      setLoading(true)
      const response = await metricService.getDocenteMaterias(docente.docente, {
        cfg_t: filtros.configuracionSeleccionada!,
        sede: filtros.sedeSeleccionada || undefined,
        periodo: filtros.periodoSeleccionado || undefined,
        programa: filtros.programaSeleccionado || undefined,
        semestre: filtros.semestreSeleccionado || undefined,
      })

      setMateriasData(response)
      logger.debug('MateriasModal', 'Materias cargadas', { total: response.materias.length })
    } catch (error) {
      logger.error('MateriasModal', 'Error cargando materias', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAspectos = (materia: MateriaMetric) => {
    setSelectedMateria(materia)
    setShowAspectoModal(true)
  }

  const handleViewCompletion = (materia: MateriaMetric) => {
    setSelectedMateria(materia)
    setShowCompletionModal(true)
  }

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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.045 4.228 9.273 10 9.273s10-4.228 10-9.273c0-5.044-4.228-9.247-10-9.247z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Materias de {docente.nombre_docente}</h2>
                <p className="text-blue-100 text-sm mt-1">ID: {docente.docente}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                <span className="ml-4 text-gray-600 font-medium">Cargando materias...</span>
              </div>
            ) : !materiasData || materiasData.materias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.045 4.228 9.273 10 9.273s10-4.228 10-9.273c0-5.044-4.228-9.247-10-9.247z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin materias</h3>
                <p className="text-gray-600">No hay materias asociadas a este docente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {materiasData.materias.map((materia, index) => (
                  <div
                    key={`${materia.codigo_materia}-${index}`}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {materia.nombre_materia}
                          </h3>
                          <p className="text-sm text-gray-600 font-mono">
                            Código: {materia.codigo_materia}
                          </p>
                        </div>

                        {/* Grupos */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Grupos:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {materia.grupo && (
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                {materia.grupo}
                              </span>
                            )}
                            {materia.grupos && materia.grupos.map((g) => (
                              <span
                                key={g.grupo}
                                className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold"
                              >
                                {g.grupo}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-semibold uppercase">Total Evaluaciones</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">
                            {materia.total_evaluaciones}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-700 font-semibold uppercase">Realizadas</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {materia.total_realizadas}
                          </p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-700 font-semibold uppercase">Pendientes</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">
                            {materia.total_pendientes}
                          </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-xs text-purple-700 font-semibold uppercase">Promedio</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">
                            {materia.promedio_general !== null
                              ? materia.promedio_general.toFixed(2)
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Cumplimiento</span>
                        <span className={`text-sm font-bold ${getCompletionPercentageText(materia.porcentaje_cumplimiento)}`}>
                          {materia.porcentaje_cumplimiento.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getCompletionPercentageColor(materia.porcentaje_cumplimiento)} transition-all duration-300`}
                          style={{ width: `${materia.porcentaje_cumplimiento}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <Button
                        onClick={() => handleViewCompletion(materia)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ver Completitud
                      </Button>
                      <Button
                        onClick={() => handleViewAspectos(materia)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Ver Aspectos
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 border-gray-300 hover:bg-gray-100"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Aspecto Metrics Modal */}
      {showAspectoModal && selectedMateria && (
        <AspectoMetricsModal
          docente={docente}
          materia={selectedMateria}
          filtros={filtros}
          onClose={() => {
            setShowAspectoModal(false)
            setSelectedMateria(null)
          }}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedMateria && (
        <CompletionModal
          docente={docente.docente}
          nombreDocente={docente.nombre_docente}
          codigoMateria={selectedMateria.codigo_materia}
          nombreMateria={selectedMateria.nombre_materia}
          filtros={filtros}
          onClose={() => {
            setShowCompletionModal(false)
            setSelectedMateria(null)
          }}
        />
      )}
    </>
  )
}
