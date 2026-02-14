"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { DocenteGeneralMetrics, MateriaMetric, DocenteAspectosMetrics, AspectoMetric } from "@/src/api/services/metric/metric.service"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface AspectoMetricsModalProps {
  docente: DocenteGeneralMetrics
  materia: MateriaMetric
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

export default function AspectoMetricsModal({
  docente,
  materia,
  filtros,
  onClose,
}: AspectoMetricsModalProps) {
  const [metricsData, setMetricsData] = useState<DocenteAspectosMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarMetricas()
  }, [])

  const cargarMetricas = async () => {
    try {
      setLoading(true)
      const response = await metricService.getDocenteAspectos({
        cfg_t: filtros.configuracionSeleccionada!,
        docente: docente.docente,
        codigo_materia: materia.codigo_materia,
        sede: filtros.sedeSeleccionada || undefined,
        periodo: filtros.periodoSeleccionado || undefined,
        programa: filtros.programaSeleccionado || undefined,
        semestre: filtros.semestreSeleccionado || undefined,
        grupo: filtros.grupoSeleccionado || undefined,
      })

      setMetricsData(response)
      logger.debug('AspectoMetricsModal', 'Métricas cargadas', { 
        total_respuestas: response.total_respuestas,
        aspectos: response.aspectos.length 
      })
    } catch (error) {
      logger.error('AspectoMetricsModal', 'Error cargando métricas', error)
    } finally {
      setLoading(false)
    }
  }

  const getAspectoColor = (index: number): string => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ]
    return colors[index % colors.length]
  }

  const getAspectoLightColor = (index: number): string => {
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-900',
      'bg-green-50 border-green-200 text-green-900',
      'bg-purple-50 border-purple-200 text-purple-900',
      'bg-pink-50 border-pink-200 text-pink-900',
      'bg-orange-50 border-orange-200 text-orange-900',
      'bg-red-50 border-red-200 text-red-900',
      'bg-indigo-50 border-indigo-200 text-indigo-900',
      'bg-teal-50 border-teal-200 text-teal-900',
    ]
    return colors[index % colors.length]
  }

  const calculatePromedioPorAspecto = (aspecto: AspectoMetric): number => {
    if (aspecto.total_respuestas === 0) return 0
    return aspecto.suma / aspecto.total_respuestas
  }

  const getScoreColor = (promedio: number) => {
    if (promedio >= 4) return 'text-green-700'
    if (promedio >= 3) return 'text-blue-700'
    if (promedio >= 2) return 'text-orange-700'
    return 'text-red-700'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold truncate">Métricas por Aspecto</h2>
              <p className="text-purple-100 text-sm mt-1">
                {materia.nombre_materia} ({materia.codigo_materia})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 flex-shrink-0"
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
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600"></div>
              <span className="ml-4 text-gray-600 font-medium">Cargando métricas...</span>
            </div>
          ) : !metricsData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos</h3>
              <p className="text-gray-600">No hay métricas disponibles para este aspecto</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-700 font-semibold uppercase">Promedio General</p>
                    <p className={`text-3xl font-bold mt-2 ${getScoreColor(metricsData.promedio || 0)}`}>
                      {metricsData.promedio !== null ? metricsData.promedio.toFixed(2) : '—'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-blue-700 font-semibold uppercase">Total Respuestas</p>
                    <p className="text-3xl font-bold mt-2 text-blue-900">
                      {metricsData.total_respuestas}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border border-green-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-green-700 font-semibold uppercase">Suma Total</p>
                    <p className="text-3xl font-bold mt-2 text-green-900">
                      {metricsData.suma_total.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white border border-orange-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-orange-700 font-semibold uppercase">Desviación</p>
                    <p className="text-3xl font-bold mt-2 text-orange-900">
                      {metricsData.desviacion !== null ? metricsData.desviacion.toFixed(2) : '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Aspectos List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Evaluación por Aspecto</h3>
                <div className="grid grid-cols-1 gap-4">
                  {metricsData.aspectos.map((aspecto, index) => {
                    const promedioAspecto = calculatePromedioPorAspecto(aspecto)
                    return (
                      <div
                        key={`${aspecto.aspecto_id}-${index}`}
                        className={`border-2 rounded-xl p-5 transition-all duration-300 hover:shadow-lg ${getAspectoLightColor(index)}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAspectoColor(index)} flex items-center justify-center text-white font-bold text-sm`}
                              >
                                {index + 1}
                              </div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {aspecto.nombre || `Aspecto ${aspecto.aspecto_id}`}
                              </h4>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <div className="text-right">
                              <p className="text-xs text-gray-600 font-semibold">PROMEDIO</p>
                              <p className={`text-2xl font-bold ${getScoreColor(promedioAspecto)}`}>
                                {promedioAspecto.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-white/30">
                            <p className="text-xs font-semibold text-gray-700 uppercase">Respuestas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {aspecto.total_respuestas}
                            </p>
                          </div>
                          <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-white/30">
                            <p className="text-xs font-semibold text-gray-700 uppercase">Suma</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {aspecto.suma.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-white/30">
                            <p className="text-xs font-semibold text-gray-700 uppercase">% Respuestas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {metricsData.total_respuestas > 0
                                ? ((aspecto.total_respuestas / metricsData.total_respuestas) * 100).toFixed(0)
                                : 0}%
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-700">Progreso de respuestas</span>
                            <span className="font-semibold text-gray-600">
                              {aspecto.total_respuestas} / {metricsData.total_respuestas}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-white/30">
                            <div
                              className={`h-full bg-gradient-to-r ${getAspectoColor(index)} transition-all duration-500`}
                              style={{
                                width: `${
                                  metricsData.total_respuestas > 0
                                    ? (aspecto.total_respuestas / metricsData.total_respuestas) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
  )
}
