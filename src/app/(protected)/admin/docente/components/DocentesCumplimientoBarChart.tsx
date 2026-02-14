"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { MetricFilters, DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ========================
// TYPES
// ========================

interface DocentesCumplimientoBarChartProps {
  filters: {
    cfg_t: number
    sede?: string
    periodo?: string
    programa?: string
    semestre?: string
  }
}

interface ChartDataItem {
  docente: string
  nombre_docente: string
  label: string
  porcentaje_cumplimiento: number
  total_evaluaciones: number
  total_realizadas: number
  total_pendientes: number
}

interface ChartData {
  chart: "bar"
  title: string
  data: ChartDataItem[]
}

// ========================
// CONSTANTS
// ========================

const DOCENTE_SIN_ASIGNAR = "DOCENTE  SIN ASIGNAR"

const getBarColor = (percentage: number, nombreDocente: string): string => {
  if (nombreDocente === DOCENTE_SIN_ASIGNAR) {
    return "#9CA3AF" // gris
  }

  if (percentage >= 80) {
    return "#22C55E" // verde
  } else if (percentage >= 40) {
    return "#EAB308" // amarillo
  } else {
    return "#EF4444" // rojo
  }
}

// ========================
// CUSTOM TOOLTIP
// ========================

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ChartDataItem
  }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
      <p className="font-semibold text-gray-900">{data.nombre_docente}</p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Cumplimiento:</span> {data.porcentaje_cumplimiento.toFixed(1)}%
      </p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Total evaluaciones:</span> {data.total_evaluaciones}
      </p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Realizadas:</span> {data.total_realizadas}
      </p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Pendientes:</span> {data.total_pendientes}
      </p>
    </div>
  )
}

// ========================
// SKELETON LOADER
// ========================

const SkeletonLoader = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full" />
    ))}
  </div>
)

// ========================
// DATA TRANSFORMATION
// ========================

const transformData = (docentes: DocenteGeneralMetrics[]): ChartData => {
  const transformedData: ChartDataItem[] = docentes
    .map((docente) => ({
      docente: docente.docente,
      nombre_docente: docente.nombre_docente || "",
      label: docente.nombre_docente || "Sin nombre",
      porcentaje_cumplimiento: docente.porcentaje_cumplimiento,
      total_evaluaciones: docente.total_evaluaciones,
      total_realizadas: docente.total_realizadas,
      total_pendientes: docente.total_pendientes,
    }))
    .sort((a, b) => a.porcentaje_cumplimiento - b.porcentaje_cumplimiento)

  return {
    chart: "bar",
    title: "Porcentaje de cumplimiento por docente",
    data: transformedData,
  }
}

// ========================
// MAIN COMPONENT
// ========================

export default function DocentesCumplimientoBarChart({
  filters,
}: DocentesCumplimientoBarChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await metricService.getDocentes({
          cfg_t: filters.cfg_t,
          sede: filters.sede,
          periodo: filters.periodo,
          programa: filters.programa,
          semestre: filters.semestre,
          page: 1,
          limit: 600,
        })

        const transformedData = transformData(response.data)
        setChartData(transformedData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar datos"
        setError(errorMessage)
        console.error("Error cargando datos del gráfico:", err)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [filters])

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Porcentaje de cumplimiento por docente</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonLoader />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-6 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-900">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Porcentaje de cumplimiento por docente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No hay datos para mostrar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{chartData.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(400, chartData.data.length * 30)}>
          <BarChart
            data={chartData.data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" domain={[0, 100]} label={{ value: "Porcentaje (%)", position: "insideBottomRight", offset: -5 }} />
            <YAxis dataKey="label" type="category" width={190} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="porcentaje_cumplimiento" fill="#3B82F6" radius={[0, 8, 8, 0]}>
              {chartData.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.porcentaje_cumplimiento, entry.nombre_docente)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-700">&lt; 40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className="text-sm text-gray-700">40 - 79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-700">≥ 80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-sm text-gray-700">Sin asignar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
