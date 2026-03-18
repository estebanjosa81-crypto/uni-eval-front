"use client"
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Settings2,
  Loader2,
  Info,
  RotateCcw,
} from "lucide-react"
import { configuracionEvaluacionService } from "@/src/api"
import type { ConfiguracionTipo } from "@/src/api/services/app/cfg-t.service"

// ============================================================================
// Types
// ============================================================================

interface FiltroState {
  configuracionSeleccionada: number | null
}

interface FiltroProps {
  filtro: FiltroState
  onFiltroChange: (filtro: FiltroState) => void
  onLimpiarFiltro: () => void
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

// ============================================================================
// Main Component
// ============================================================================

export default function Filtro({
  filtro,
  onFiltroChange,
  onLimpiarFiltro,
  loading = false,
}: FiltroProps) {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    let mounted = true

    const cargarDatosIniciales = async () => {
      try {
        setLoadingData(true)

        const configsResponse = await configuracionEvaluacionService.getAllByRole().catch((err) => {
          logger.error('Filtro', 'Error cargando configuraciones', err)
          return { data: [] }
        })

        if (!mounted) return

        const configuracionesData = normalizeApiResponse<ConfiguracionTipo>(configsResponse)
        setConfiguraciones(configuracionesData)

        // Aplicar configuración por defecto si no hay ninguna seleccionada
        if (!filtro.configuracionSeleccionada && configuracionesData.length > 0) {
          const configuracionActiva = configuracionesData.find((c) => c.es_activo)
          const nuevaConfiguracion = (configuracionActiva || configuracionesData[0]).id
          onFiltroChange({ configuracionSeleccionada: nuevaConfiguracion })
        }

        logger.debug('Filtro', 'Datos iniciales cargados', { configuracionesData })
      } catch (error) {
        logger.error('Filtro', 'Error crítico cargando datos iniciales', error)
      } finally {
        if (mounted) setLoadingData(false)
      }
    }

    cargarDatosIniciales()

    return () => {
      mounted = false
    }
  }, [])

  // Handlers
  const handleFiltroChange = useCallback(
    (valor: number) => {
      onFiltroChange({ configuracionSeleccionada: valor })
    },
    [onFiltroChange]
  )

  const getConfiguracionSeleccionada = (): ConfiguracionTipo | null => {
    if (!filtro.configuracionSeleccionada || !configuraciones.length) return null
    return (
      configuraciones.find((c) => c.id === filtro.configuracionSeleccionada) ??
      null
    )
  }

  const configuracionSeleccionada = getConfiguracionSeleccionada()
  const filtroActivo = !!filtro.configuracionSeleccionada

  // Loading skeleton
  if (loadingData) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 rounded-md bg-muted animate-pulse" />
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
              Filtro de Evaluación
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {filtroActivo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLimpiarFiltro}
                disabled={loading}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Active filter chip */}
        {filtroActivo && configuracionSeleccionada && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Activo
            </span>
            <FilterChip
              label="Configuración"
              value={`${configuracionSeleccionada.tipo_evaluacion?.tipo?.nombre || 'Tipo'} - ${configuracionSeleccionada.tipo_evaluacion?.categoria?.nombre || ''}`}
              onRemove={onLimpiarFiltro}
            />
          </div>
        )}

        {/* Filter field */}
        <div className="p-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Settings2 className="h-3.5 w-3.5" />
              Configuración
              <span className="text-destructive">*</span>
            </label>
            <Select
              value={
                filtro.configuracionSeleccionada
                  ? String(filtro.configuracionSeleccionada)
                  : undefined
              }
              onValueChange={(v) => handleFiltroChange(parseInt(v))}
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
