"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { MateriaCompletionMetrics, GrupoCompletion, StudentInfo } from "@/src/api/services/metric/metric.service"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface CompletionModalProps {
  docente: string
  nombreDocente?: string
  codigoMateria: string
  nombreMateria?: string
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

export default function CompletionModal({
  docente,
  nombreDocente,
  codigoMateria,
  nombreMateria,
  filtros,
  onClose,
}: CompletionModalProps) {
  const [completionData, setCompletionData] = useState<MateriaCompletionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarCompletion()
  }, [])

  const cargarCompletion = async () => {
    if (!filtros.configuracionSeleccionada) {
      setError('Falta configuración seleccionada')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await metricService.getMateriaCompletion(docente, codigoMateria, {
        cfg_t: filtros.configuracionSeleccionada,
        sede: filtros.sedeSeleccionada || undefined,
        periodo: filtros.periodoSeleccionado || undefined,
        programa: filtros.programaSeleccionado || undefined,
        semestre: filtros.semestreSeleccionado || undefined,
        grupo: filtros.grupoSeleccionado || undefined,
      })

      setCompletionData(response)
      logger.debug('CompletionModal', 'Datos de completitud cargados', {
        docente: response.docente,
        grupos: response.grupos.length,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al cargar los datos: ${errorMsg}`)
      logger.error('CompletionModal', 'Error cargando completitud', err)
    } finally {
      setLoading(false)
    }
  }

  const renderStudentList = (students: StudentInfo[], status: 'completado' | 'pendiente') => {
    if (students.length === 0) {
      return (
        <p className="text-sm text-gray-500 py-2">
          {status === 'completado' ? 'No hay estudiantes con evaluación completada' : 'No hay estudiantes pendientes'}
        </p>
      )
    }

    return (
      <div className="space-y-1">
        {students.map((student) => (
          <div key={student.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
            {status === 'completado' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{student.nombre}</p>
              <p className="text-xs text-gray-500">{student.id}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderGrupoStats = (grupo: GrupoCompletion) => {
    const totalEstudiantes = grupo.completados.length + grupo.pendientes.length
    const porcentaje = totalEstudiantes > 0 ? Math.round((grupo.completados.length / totalEstudiantes) * 100) : 0

    return (
      <Card key={grupo.grupo} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Grupo {grupo.grupo}</CardTitle>
              <Badge variant="secondary">
                {grupo.completados.length}/{totalEstudiantes} completados
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{porcentaje}%</div>
              <p className="text-xs text-gray-600">Cumplimiento</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2 transition-all duration-300"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Completados */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">
                Completados ({grupo.completados.length})
              </h4>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              {renderStudentList(grupo.completados, 'completado')}
            </div>
          </div>

          {/* Pendientes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-gray-900">
                Pendientes ({grupo.pendientes.length})
              </h4>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              {renderStudentList(grupo.pendientes, 'pendiente')}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">Estado de Completitud de Evaluaciones</DialogTitle>
            {nombreDocente && (
              <p className="text-sm text-gray-600">
                Docente: <span className="font-semibold">{nombreDocente}</span>
              </p>
            )}
            {nombreMateria && (
              <p className="text-sm text-gray-600">
                Materia: <span className="font-semibold">{nombreMateria}</span> (Código: {codigoMateria})
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <Button onClick={cargarCompletion} variant="outline" size="sm" className="mt-3">
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && completionData && completionData.grupos.length > 0 && (
            <div className="space-y-4">
              {/* Resumen general */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {completionData.grupos.reduce((sum, g) => sum + g.completados.length, 0)}
                      </p>
                      <p className="text-xs text-gray-600">Total Completados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {completionData.grupos.reduce((sum, g) => sum + g.pendientes.length, 0)}
                      </p>
                      <p className="text-xs text-gray-600">Total Pendientes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(
                          (completionData.grupos.reduce((sum, g) => sum + g.completados.length, 0) /
                            (completionData.grupos.reduce((sum, g) => sum + g.completados.length + g.pendientes.length, 0) || 1)) *
                            100
                        )}
                        %
                      </p>
                      <p className="text-xs text-gray-600">Cumplimiento General</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grupos */}
              <div className="space-y-4">
                {completionData.grupos.map((grupo) => renderGrupoStats(grupo))}
              </div>
            </div>
          )}

          {!loading && !error && (!completionData || completionData.grupos.length === 0) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No hay datos disponibles para mostrar</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
          <Button onClick={cargarCompletion} disabled={loading} variant="default">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
