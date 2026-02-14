"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { configuracionEvaluacionService } from "@/src/api"
import { filterService } from "@/src/api/services/filter/filter.service"
import type { ConfiguracionTipo } from "@/src/api/services/app/cfg-t.service"

// ============================================================================
// Types
// ============================================================================

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface FiltrosProps {
  filtros: FiltrosState
  onFiltrosChange: (filtros: FiltrosState) => void
  onLimpiarFiltros: () => void
  loading?: boolean
}

interface ApiResponse<T> {
  success?: boolean
  data?: T | { data: T }
  message?: string
}

// ============================================================================
// Logger
// ============================================================================

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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normaliza respuestas de API para manejar diferentes formatos
 */
const normalizeApiResponse = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const apiResponse = response as ApiResponse<T>
    if (Array.isArray(apiResponse.data)) return apiResponse.data
    if (apiResponse.data && typeof apiResponse.data === 'object' && Array.isArray((apiResponse.data as any).data)) {
      return (apiResponse.data as any).data
    }
  }
  return []
}

/**
 * Cuenta filtros activos en el estado
 */
const contarFiltrosActivos = (filtros: FiltrosState): number => {
  return [
    filtros.sedeSeleccionada,
    filtros.programaSeleccionado,
    filtros.semestreSeleccionado,
    filtros.grupoSeleccionado,
  ].filter(Boolean).length
}

/**
 * Formatea una fecha en formato YYYY-MM-DD sin problemas de zona horaria
 */
const formatearFecha = (fechaString: string): string => {
  try {
    const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return fechaString

    const [, year, month, day] = match
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return fechaString
  }
}

/**
 * Obtiene el período más reciente de una lista
 */
const obtenerPeriodoMasReciente = (periodos: string[]): string | null => {
  if (!periodos?.length) return null

  return [...periodos].sort((a, b) => {
    const [anoA, semestreA] = a.split('-').map(Number)
    const [anoB, semestreB] = b.split('-').map(Number)

    if (anoA !== anoB) return anoB - anoA
    return semestreB - semestreA
  })[0] ?? null
}


// ============================================================================
// Component
// ============================================================================

export default function Filtros({ 
  filtros, 
  onFiltrosChange, 
  onLimpiarFiltros, 
  loading = false 
}: FiltrosProps) {
  // Estados para las opciones de los selects
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([])
  const [periodos, setPeriodos] = useState<string[]>([])
  const [sedes, setSedes] = useState<string[]>([])
  const [programas, setProgramas] = useState<string[]>([])
  const [semestres, setSemestres] = useState<string[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingOpciones, setLoadingOpciones] = useState(false)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    let mounted = true

    const cargarDatosIniciales = async () => {
      try {
        setLoadingData(true)

        const [configsResponse, periodosResponse] = await Promise.all([
          configuracionEvaluacionService.getAllByRole().catch((err) => {
            logger.error('Filtros', 'Error cargando configuraciones', err)
            return { data: [] }
          }),
          filterService.getPeriodos().catch((err) => {
            logger.error('Filtros', 'Error cargando periodos', err)
            return []
          }),
        ])

        if (!mounted) return

        const configuracionesData = normalizeApiResponse<ConfiguracionTipo>(configsResponse)
        const periodosData = normalizeApiResponse<string>(periodosResponse)

        setConfiguraciones(configuracionesData)
        setPeriodos(periodosData)

        // Aplicar configuración y período por defecto
        const nuevosFiltros = { ...filtros }
        let hasChanges = false

        if (!filtros.configuracionSeleccionada && configuracionesData.length > 0) {
          const configuracionActiva = configuracionesData.find((c) => c.es_activo)
          nuevosFiltros.configuracionSeleccionada = (configuracionActiva || configuracionesData[0]).id
          hasChanges = true
        }

        if (!filtros.periodoSeleccionado && periodosData.length > 0) {
          const periodoMasReciente = obtenerPeriodoMasReciente(periodosData)
          if (periodoMasReciente) {
            nuevosFiltros.periodoSeleccionado = periodoMasReciente
            hasChanges = true
          }
        }

        if (hasChanges) {
          onFiltrosChange(nuevosFiltros)
        }

        logger.debug('Filtros', 'Datos iniciales cargados', { configuracionesData, periodosData })
      } catch (error) {
        logger.error('Filtros', 'Error crítico cargando datos iniciales', error)
      } finally {
        if (mounted) setLoadingData(false)
      }
    }

    cargarDatosIniciales()

    return () => {
      mounted = false
    }
  }, [])

  // Cargar opciones dinámicas
  useEffect(() => {
    let mounted = true

    const cargarOpcionesFiltros = async () => {
      try {
        setLoadingOpciones(true)

        // Cargar sedes
        const sedesResponse = await filterService.getSedes().catch((err) => {
          logger.error('Filtros', 'Error cargando sedes', err)
          return []
        })
        const sedesData = normalizeApiResponse<string>(sedesResponse)
        if (mounted) {
          setSedes(sedesData)
          
          // Seleccionar automáticamente la primera sede si no hay ninguna seleccionada
          if (!filtros.sedeSeleccionada && sedesData.length > 0) {
            onFiltrosChange({ ...filtros, sedeSeleccionada: sedesData[0] })
          }
        }

        // Cargar programas
        if (filtros.sedeSeleccionada) {
          const programasResponse = await filterService.getProgramas(
            filtros.sedeSeleccionada,
            filtros.periodoSeleccionado || undefined,
          ).catch((err) => {
            logger.error('Filtros', 'Error cargando programas', err)
            return []
          })
          if (mounted) setProgramas(normalizeApiResponse<string>(programasResponse))
        } else {
          if (mounted) setProgramas([])
        }

        // Cargar semestres
        if (filtros.programaSeleccionado) {
          const semestresResponse = await filterService.getSemestres(
            filtros.sedeSeleccionada || undefined,
            filtros.periodoSeleccionado || undefined,
            filtros.programaSeleccionado,
          ).catch((err) => {
            logger.error('Filtros', 'Error cargando semestres', err)
            return []
          })
          if (mounted) setSemestres(normalizeApiResponse<string>(semestresResponse))
        } else {
          if (mounted) setSemestres([])
        }

        // Cargar grupos
        if (filtros.semestreSeleccionado) {
          const gruposResponse = await filterService.getGrupos(
            filtros.sedeSeleccionada || undefined,
            filtros.periodoSeleccionado || undefined,
            filtros.programaSeleccionado || undefined,
            filtros.semestreSeleccionado,
          ).catch((err) => {
            logger.error('Filtros', 'Error cargando grupos', err)
            return []
          })
          if (mounted) setGrupos(normalizeApiResponse<string>(gruposResponse))
        } else {
          if (mounted) setGrupos([])
        }
      } finally {
        if (mounted) setLoadingOpciones(false)
      }
    }

    cargarOpcionesFiltros()

    return () => {
      mounted = false
    }
  }, [filtros.sedeSeleccionada, filtros.periodoSeleccionado, filtros.programaSeleccionado, filtros.semestreSeleccionado])

  // Handlers
  const handleFiltroChange = (campo: keyof FiltrosState, valor: string | number) => {
    const nuevosFiltros = { ...filtros, [campo]: valor }

    // Limpiar filtros dependientes según la cascada
    const cascadaLimpiezas: Record<keyof FiltrosState, (keyof FiltrosState)[]> = {
      periodoSeleccionado: ['sedeSeleccionada', 'programaSeleccionado', 'semestreSeleccionado', 'grupoSeleccionado'],
      sedeSeleccionada: ['programaSeleccionado', 'semestreSeleccionado', 'grupoSeleccionado'],
      programaSeleccionado: ['semestreSeleccionado', 'grupoSeleccionado'],
      semestreSeleccionado: ['grupoSeleccionado'],
      grupoSeleccionado: [],
      configuracionSeleccionada: [],
    }

    const camposALimpiar = cascadaLimpiezas[campo] || []
    camposALimpiar.forEach((campoALimpiar) => {
      ;(nuevosFiltros[campoALimpiar] as any) = ''
    })

    onFiltrosChange(nuevosFiltros)
  }

  const getConfiguracionSeleccionada = (): ConfiguracionTipo | null => {
    if (!filtros.configuracionSeleccionada || !configuraciones.length) return null
    return configuraciones.find((c) => c.id === filtros.configuracionSeleccionada) ?? null
  }

  const configuracionSeleccionada = getConfiguracionSeleccionada()

  if (loadingData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-gray-900">Filtros</CardTitle>
          <CardDescription className="text-gray-600">Cargando opciones de filtrado...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
  <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
      <CardTitle className="text-xl font-bold flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
        </div>
        Filtros de Evaluación
      </CardTitle>
      <CardDescription className="text-blue-100 mt-2">
        Configura los parámetros de evaluación y personaliza los criterios de filtrado para obtener datos específicos
      </CardDescription>
      
      {/* Indicador de filtros activos */}
      {contarFiltrosActivos(filtros) > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-blue-200 text-sm">Filtros activos:</span>
          {filtros.sedeSeleccionada && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              Sede: {filtros.sedeSeleccionada}
            </span>
          )}
          {filtros.programaSeleccionado && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              Programa: {filtros.programaSeleccionado.substring(0, 20)}{filtros.programaSeleccionado.length > 20 ? '...' : ''}
            </span>
          )}
          {filtros.semestreSeleccionado && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              Semestre: {filtros.semestreSeleccionado}
            </span>
          )}
          {filtros.grupoSeleccionado && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              Grupo: {filtros.grupoSeleccionado}
            </span>
          )}
        </div>
      )}
    </CardHeader>
    
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        
        {/* Selector de Configuración */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Configuración
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={filtros.configuracionSeleccionada || ""}
              onChange={(e) => handleFiltroChange('configuracionSeleccionada', parseInt(e.target.value))}
              disabled={loading}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Selecciona configuración</option>
              {configuraciones.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.tipo_evaluacion?.tipo?.nombre || `Evaluación Tipo ${config.tipo_evaluacion_id}`} - {config.tipo_evaluacion?.categoria?.nombre || ''} {config.es_activo && "✓"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Periodo */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Periodo
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={filtros.periodoSeleccionado}
              onChange={(e) => handleFiltroChange('periodoSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Selecciona periodo</option>
              {periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Sede */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Sede
            {sedes.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({sedes.length})</span>
            )}
          </label>
          <div className="relative">
            <select
              value={filtros.sedeSeleccionada}
              onChange={(e) => handleFiltroChange('sedeSeleccionada', e.target.value)}
              disabled={loading || loadingOpciones}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todas las sedes</option>
              {sedes.map((sede) => (
                <option key={sede} value={sede}>
                  {sede}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Programa */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Programa
            {programas.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({programas.length})</span>
            )}
          </label>
          <div className="relative">
            <select
              value={filtros.programaSeleccionado}
              onChange={(e) => handleFiltroChange('programaSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.sedeSeleccionada}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los programas</option>
              {programas.map((programa) => (
                <option key={programa} value={programa}>
                  {programa}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Semestre */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Semestre
            {semestres.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({semestres.length})</span>
            )}
          </label>
          <div className="relative">
            <select
              value={filtros.semestreSeleccionado}
              onChange={(e) => handleFiltroChange('semestreSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.programaSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los semestres</option>
              {semestres.map((semestre) => (
                <option key={semestre} value={semestre}>
                  {semestre}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Grupo */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Grupo
            {grupos.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({grupos.length})</span>
            )}
          </label>
          <div className="relative">
            <select
              value={filtros.grupoSeleccionado}
              onChange={(e) => handleFiltroChange('grupoSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.semestreSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón para mostrar/ocultar información de la configuración */}
      {configuracionSeleccionada && (
        <div className="mb-6">
          <button
            onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
            className="group flex items-center gap-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-blue-300 hover:shadow-md"
          >
            <div className="p-1 bg-blue-200 group-hover:bg-blue-300 rounded-lg transition-colors duration-200">
              <svg 
                className={`w-3 h-3 transition-transform duration-300 ${mostrarConfiguracion ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {mostrarConfiguracion ? 'Ocultar' : 'Ver'} información de la configuración
            <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
          </button>
        </div>
      )}

      {/* Información de la configuración seleccionada (colapsible) */}
      {configuracionSeleccionada && mostrarConfiguracion && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl p-6 mb-6 transition-all duration-500 ease-out transform shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-blue-900 font-bold text-lg flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-xl">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
                Configuración: {configuracionSeleccionada.tipo_evaluacion.tipo.nombre} - {configuracionSeleccionada.tipo_evaluacion.categoria.nombre}
              </h4>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                configuracionSeleccionada.es_activo 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  configuracionSeleccionada.es_activo ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                {configuracionSeleccionada.es_activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 text-sm">Fecha de Inicio</span>
                  <p className="text-gray-900 font-medium">{formatearFecha(configuracionSeleccionada.fecha_inicio)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-blue-100">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 text-sm">Fecha de Fin</span>
                  <p className="text-gray-900 font-medium">{formatearFecha(configuracionSeleccionada.fecha_fin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón para limpiar filtros */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onLimpiarFiltros}
          disabled={loading}
          className="px-8 py-2.5 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar Filtros
        </Button>
      </div>
    </CardContent>
  </Card>
)
}