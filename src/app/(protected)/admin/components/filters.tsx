"use client"
import { useState, useEffect, useCallback } from "react"
import type { ComponentType } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Calendar,
  MapPin,
  GraduationCap,
  BookOpen,
  Users,
  Settings2,
  Info,
  RotateCcw,
} from "lucide-react"
import { configuracionEvaluacionService } from "@/src/api"
import { filterService } from "@/src/api/services/filter/filter.service"
import type { ConfiguracionTipo } from "@/src/api/services/app/cfg-t.service"
import type { ApiResponse, FiltrosState } from "../types"

// ============================================================================
// Types
// ============================================================================

interface FiltrosProps {
  filtros: FiltrosState
  onFiltrosChange: (filtros: FiltrosState) => void
  onLimpiarFiltros: () => void
  loading?: boolean
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

const normalizeApiResponse = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const apiResponse = response as ApiResponse<T>
    if (Array.isArray(apiResponse.data)) return apiResponse.data
    if (
      apiResponse.data &&
      typeof apiResponse.data === 'object' &&
      Array.isArray((apiResponse.data as Record<string, unknown>).data)
    ) {
      return (apiResponse.data as Record<string, unknown>).data as T[]
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
// Sub-components
// ============================================================================

function ActiveFilterChip({
  label,
  value,
  removable = true,
  onRemove,
}: {
  label: string
  value: string
  removable?: boolean
  onRemove?: () => void
}) {
  return (
    <Badge
      variant="outline"
      className="h-7 gap-1.5 rounded-full border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700"
    >
      <span className="text-slate-500">{label}:</span>
      <span className="max-w-[150px] truncate text-slate-800">{value}</span>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="rounded-full p-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Remover filtro ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}

function FlowSteps() {
  return (
    <p className="mb-3 text-[11px] text-slate-500">
      Período → Sede → Programa → Semestre → Grupo
    </p>
  )
}

function FilterField({
  icon: Icon,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  placeholder: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-8 border-slate-200 bg-white text-xs transition-colors hover:border-slate-300 focus-visible:ring-slate-300">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-slate-200">
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function Filtros({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  loading = false,
}: FiltrosProps) {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([])
  const [periodos, setPeriodos] = useState<string[]>([])
  const [sedes, setSedes] = useState<string[]>([])
  const [programas, setProgramas] = useState<string[]>([])
  const [semestres, setSemestres] = useState<string[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

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

        if (hasChanges && mounted) {
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
  }, [onFiltrosChange, filtros.configuracionSeleccionada, filtros.periodoSeleccionado])

  // Cargar opciones dinámicas (sedes y programas)
  useEffect(() => {
    let mounted = true

    const cargarOpcionesSedes = async () => {
      try {
        // Cargar sedes
        const sedesResponse = await filterService.getSedes().catch((err) => {
          logger.error('Filtros', 'Error cargando sedes', err)
          return []
        })
        const sedesData = normalizeApiResponse<string>(sedesResponse)
        if (mounted) {
          setSedes(sedesData)
          
          // Seleccionar automáticamente la primera sede si no hay ninguna seleccionada
          // y hay período seleccionado (cascada)
          if (!filtros.sedeSeleccionada && sedesData.length > 0 && filtros.periodoSeleccionado) {
            onFiltrosChange({ ...filtros, sedeSeleccionada: sedesData[0] })
          }
        }

        // Cargar programas si hay sede seleccionada
        if (filtros.sedeSeleccionada && filtros.periodoSeleccionado) {
          const programasResponse = await filterService.getProgramas(
            filtros.sedeSeleccionada,
            filtros.periodoSeleccionado,
          ).catch((err) => {
            logger.error('Filtros', 'Error cargando programas', err)
            return []
          })
          const programasData = normalizeApiResponse<string>(programasResponse)
          if (mounted) {
            setProgramas(programasData)
          }
        } else {
          if (mounted) setProgramas([])
        }
      } finally {
        // No necesitamos loading para sedes
      }
    }

    cargarOpcionesSedes()

    return () => {
      mounted = false
    }
  }, [filtros.sedeSeleccionada, filtros.periodoSeleccionado, filtros.programaSeleccionado, onFiltrosChange])

  // Cargar semestres y grupos
  useEffect(() => {
    let mounted = true

    const cargarOpcionesSemestresGrupos = async () => {
      try {
        // Cargar semestres si hay programa seleccionado
        if (filtros.programaSeleccionado) {
          const semestresResponse = await filterService.getSemestres(
            filtros.sedeSeleccionada || undefined,
            filtros.periodoSeleccionado || undefined,
            filtros.programaSeleccionado,
          ).catch((err) => {
            logger.error('Filtros', 'Error cargando semestres', err)
            return []
          })
          const semestresData = normalizeApiResponse<string>(semestresResponse)
          if (mounted) {
            setSemestres(semestresData)
          }
        } else {
          if (mounted) setSemestres([])
        }

        // Cargar grupos si hay semestre seleccionado
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
          const gruposData = normalizeApiResponse<string>(gruposResponse)
          if (mounted) {
            setGrupos(gruposData)
          }
        } else {
          if (mounted) setGrupos([])
        }
      } finally {
        // No necesitamos loading
      }
    }

    cargarOpcionesSemestresGrupos()

    return () => {
      mounted = false
    }
  }, [filtros.programaSeleccionado, filtros.semestreSeleccionado, filtros.sedeSeleccionada, filtros.periodoSeleccionado, onFiltrosChange])

  // Handlers
  const handleFiltroChange = useCallback(
    (campo: keyof FiltrosState, valor: string | number) => {
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
        ;(nuevosFiltros[campoALimpiar] as string | number | null) = ''
      })

      onFiltrosChange(nuevosFiltros)
    },
    [filtros, onFiltrosChange]
  )

  const getConfiguracionSeleccionada = (): ConfiguracionTipo | null => {
    if (!filtros.configuracionSeleccionada || !configuraciones.length) return null
    return (
      configuraciones.find((c) => c.id === filtros.configuracionSeleccionada) ??
      null
    )
  }

  const configuracionSeleccionada = getConfiguracionSeleccionada()
  const filtrosActivos = contarFiltrosActivos(filtros)

  // Loading skeleton
  if (loadingData) {
    return (
      <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-0 border-b border-slate-100 px-4 py-2.5 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Filtros</h2>
          </div>
          {filtrosActivos > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLimpiarFiltros}
              disabled={loading}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 p-4">
        {/* Configuración y Período */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">Config.</label>
              <Select
                value={
                  filtros.configuracionSeleccionada
                    ? String(filtros.configuracionSeleccionada)
                    : undefined
                }
                onValueChange={(v) =>
                  handleFiltroChange('configuracionSeleccionada', parseInt(v))
                }
                disabled={loading}
              >
                <SelectTrigger className="h-8 border-slate-200 bg-white text-xs transition-colors hover:border-slate-300">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent className="border-slate-200">
                  {configuraciones.map((config) => (
                    <SelectItem key={config.id} value={String(config.id)}>
                      <span className="text-xs">
                        {config.tipo_evaluacion?.tipo?.nombre}{" "}
                        {config.es_activo && "✓"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">Período</label>
              <Select
                value={filtros.periodoSeleccionado || undefined}
                onValueChange={(v) => handleFiltroChange('periodoSeleccionado', v)}
                disabled={loading}
              >
                <SelectTrigger className="h-8 border-slate-200 bg-white text-xs transition-colors hover:border-slate-300">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent className="border-slate-200">
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo} value={periodo} className="text-xs">
                      {periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Segmentación Académica */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FilterField
              icon={MapPin}
              label="Sede"
              value={filtros.sedeSeleccionada}
              placeholder="Todas"
              options={sedes}
              onChange={(v) => handleFiltroChange('sedeSeleccionada', v)}
            />

            <FilterField
              icon={GraduationCap}
              label="Programa"
              value={filtros.programaSeleccionado}
              placeholder="Todos"
              options={programas}
              onChange={(v) => handleFiltroChange('programaSeleccionado', v)}
            />

            <FilterField
              icon={BookOpen}
              label="Semestre"
              value={filtros.semestreSeleccionado}
              placeholder="Todos"
              options={semestres}
              onChange={(v) => handleFiltroChange('semestreSeleccionado', v)}
            />

            <FilterField
              icon={Users}
              label="Grupo"
              value={filtros.grupoSeleccionado}
              placeholder="Todos"
              options={grupos}
              onChange={(v) => handleFiltroChange('grupoSeleccionado', v)}
            />
          </div>
        </div>

        {/* Filtros Activos */}
        {(filtros.sedeSeleccionada || filtros.programaSeleccionado || filtros.semestreSeleccionado || filtros.grupoSeleccionado) && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200/50 bg-slate-50 p-2">
            {filtros.sedeSeleccionada && (
              <Badge variant="outline" className="h-6 gap-1 rounded-full border-slate-300 bg-white px-2 text-[10px]">
                {filtros.sedeSeleccionada}
                <button
                  onClick={() => handleFiltroChange('sedeSeleccionada', '')}
                  className="ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filtros.programaSeleccionado && (
              <Badge variant="outline" className="h-6 gap-1 rounded-full border-slate-300 bg-white px-2 text-[10px]">
                {filtros.programaSeleccionado}
                <button
                  onClick={() => handleFiltroChange('programaSeleccionado', '')}
                  className="ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filtros.semestreSeleccionado && (
              <Badge variant="outline" className="h-6 gap-1 rounded-full border-slate-300 bg-white px-2 text-[10px]">
                {filtros.semestreSeleccionado}
                <button
                  onClick={() => handleFiltroChange('semestreSeleccionado', '')}
                  className="ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filtros.grupoSeleccionado && (
              <Badge variant="outline" className="h-6 gap-1 rounded-full border-slate-300 bg-white px-2 text-[10px]">
                {filtros.grupoSeleccionado}
                <button
                  onClick={() => handleFiltroChange('grupoSeleccionado', '')}
                  className="ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Detalle de Configuración */}
        {configuracionSeleccionada && (
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <button className="group flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50">
                <span className="font-medium text-slate-700">Detalles</span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform ${
                    configOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <p className="text-[10px] text-slate-500">Tipo</p>
                    <p className="font-medium text-slate-800">
                      {configuracionSeleccionada.tipo_evaluacion.tipo.nombre}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500">Inicio</p>
                      <p className="font-medium text-slate-800">
                        {formatearFecha(configuracionSeleccionada.fecha_inicio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Fin</p>
                      <p className="font-medium text-slate-800">
                        {formatearFecha(configuracionSeleccionada.fecha_fin)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}