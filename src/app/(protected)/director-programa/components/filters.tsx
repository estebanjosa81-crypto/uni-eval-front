"use client"
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Loader2,
  Info,
  RotateCcw,
} from "lucide-react"
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
  programaFijoNombre?: string
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

function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string
  value: string
  onRemove: () => void
}) {
  return (
    <Badge
      variant="secondary"
      className="pl-2.5 pr-1 py-1 gap-1.5 text-xs font-medium bg-foreground/5 text-foreground border-border hover:bg-foreground/10 transition-colors"
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="max-w-[120px] truncate">{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
        aria-label={`Remover filtro ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

function FilterField({
  icon: Icon,
  label,
  value,
  placeholder,
  options,
  disabled,
  isLoading,
  onChange,
}: {
  icon: React.ElementType
  label: string
  value: string
  placeholder: string
  options: string[]
  disabled?: boolean
  isLoading?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 text-sm bg-card border-border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
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
  programaFijoNombre,
}: FiltrosProps) {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([])
  const [periodos, setPeriodos] = useState<string[]>([])
  const [sedes, setSedes] = useState<string[]>([])
  const [programas, setProgramas] = useState<string[]>([])
  const [semestres, setSemestres] = useState<string[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingOpciones, setLoadingOpciones] = useState(false)
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
          const programasData = normalizeApiResponse<string>(programasResponse)
          if (mounted) {
            setProgramas(programasData)

            if (programaFijoNombre) {
              const programaMatch = programasData.find(
                (programa) => programa.trim().toLowerCase() === programaFijoNombre.trim().toLowerCase(),
              )

              if (programaMatch && filtros.programaSeleccionado !== programaMatch) {
                onFiltrosChange({
                  ...filtros,
                  programaSeleccionado: programaMatch,
                })
              }
            }
          }
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
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-9 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card mb-6 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Filtros de Evaluación
            </h3>
            {filtrosActivos > 0 && (
              <Badge
                variant="default"
                className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full"
              >
                {filtrosActivos}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {filtrosActivos > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLimpiarFiltros}
                disabled={loading}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {filtrosActivos > 0 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40 border-b border-border flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Activos
            </span>
            {filtros.sedeSeleccionada && (
              <FilterChip
                label="Sede"
                value={filtros.sedeSeleccionada}
                onRemove={() => handleFiltroChange('sedeSeleccionada', '')}
              />
            )}
            {filtros.programaSeleccionado && (
              <FilterChip
                label="Programa"
                value={filtros.programaSeleccionado}
                onRemove={() => handleFiltroChange('programaSeleccionado', '')}
              />
            )}
            {filtros.semestreSeleccionado && (
              <FilterChip
                label="Semestre"
                value={filtros.semestreSeleccionado}
                onRemove={() => handleFiltroChange('semestreSeleccionado', '')}
              />
            )}
            {filtros.grupoSeleccionado && (
              <FilterChip
                label="Grupo"
                value={filtros.grupoSeleccionado}
                onRemove={() => handleFiltroChange('grupoSeleccionado', '')}
              />
            )}
          </div>
        )}

        {/* Filter fields */}
        <div className="p-5">
          {/* Required row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5" />
                Configuración
                <span className="text-destructive">*</span>
              </label>
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
                <SelectTrigger className="h-9 text-sm bg-card border-border">
                  <SelectValue placeholder="Selecciona configuración" />
                </SelectTrigger>
                <SelectContent>
                  {configuraciones.map((config) => (
                    <SelectItem key={config.id} value={String(config.id)}>
                      <span className="flex items-center gap-2">
                        {config.tipo_evaluacion?.tipo?.nombre || `Tipo ${config.tipo_id}`}
                        {" - "}
                        {config.tipo_evaluacion?.categoria?.nombre || ""}
                        {config.es_activo && (
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Período
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={filtros.periodoSeleccionado || undefined}
                onValueChange={(v) => handleFiltroChange('periodoSeleccionado', v)}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-sm bg-card border-border">
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo} value={periodo}>
                      {periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="mb-5" />

          {/* Optional cascading filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterField
              icon={MapPin}
              label="Sede"
              value={filtros.sedeSeleccionada}
              placeholder="Todas las sedes"
              options={sedes}
              disabled={loading || loadingOpciones}
              isLoading={loadingOpciones}
              onChange={(v) => handleFiltroChange('sedeSeleccionada', v)}
            />

            <FilterField
              icon={GraduationCap}
              label="Programa"
              value={filtros.programaSeleccionado}
              placeholder="Todos los programas"
              options={programas}
              disabled={loading || loadingOpciones || !filtros.sedeSeleccionada || !!programaFijoNombre}
              isLoading={loadingOpciones && !!filtros.sedeSeleccionada}
              onChange={(v) => handleFiltroChange('programaSeleccionado', v)}
            />

            <FilterField
              icon={BookOpen}
              label="Semestre"
              value={filtros.semestreSeleccionado}
              placeholder="Todos"
              options={semestres}
              disabled={loading || loadingOpciones || !filtros.programaSeleccionado}
              isLoading={loadingOpciones && !!filtros.programaSeleccionado}
              onChange={(v) => handleFiltroChange('semestreSeleccionado', v)}
            />

            <FilterField
              icon={Users}
              label="Grupo"
              value={filtros.grupoSeleccionado}
              placeholder="Todos"
              options={grupos}
              disabled={loading || loadingOpciones || !filtros.semestreSeleccionado}
              isLoading={loadingOpciones && !!filtros.semestreSeleccionado}
              onChange={(v) => handleFiltroChange('grupoSeleccionado', v)}
            />
          </div>
        </div>

        {/* Configuration details collapsible */}
        {configuracionSeleccionada && (
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full px-5 py-3 border-t border-border text-sm hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    Detalle de configuración
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      configuracionSeleccionada.es_activo
                        ? "border-green-500/30 text-green-700 bg-green-50"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {configuracionSeleccionada.es_activo ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    configOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-4 pt-1">
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Tipo
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {configuracionSeleccionada.tipo_evaluacion.tipo.nombre}
                        {" - "}
                        {configuracionSeleccionada.tipo_evaluacion.categoria.nombre}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Fecha inicio
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          {formatearFecha(configuracionSeleccionada.fecha_inicio)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Fecha fin
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          {formatearFecha(configuracionSeleccionada.fecha_fin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </TooltipProvider>
  )
}