"use client"

import { useState, useEffect } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, TrendingUp, Users, Target, BarChart3 } from "lucide-react"

interface DocentesCumplimientoBarChartProps {
  filters: {
    cfg_t: number
    sede?: string
    periodo?: string
    programa?: string
    semestre?: string
  }
}

interface ScatterDataItem {
  x: number // porcentaje_cumplimiento
  y: number // promedio_general
  z: number // total_evaluaciones
  name: string
  id: string
}

const getBubbleColor = (score: number | null): string => {
  if (!score) return "#94a3b8"
  if (score >= 4.5) return "#10b981" // emerald-500
  if (score >= 4.0) return "#3b82f6" // blue-500
  if (score >= 3.0) return "#f59e0b" // amber-500
  return "#ef4444" // red-500
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl space-y-2">
      <div className="border-b border-slate-100 pb-2 mb-2">
        <p className="font-semibold text-slate-800 text-xs">{data.name}</p>
        <p className="text-[10px] font-bold text-slate-400">ID: {data.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Participación</p>
          <p className="text-sm font-black text-indigo-600">{data.x.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Promedio</p>
          <p className="text-sm font-black text-emerald-600">{data.y?.toFixed(2) || "N/A"}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-medium text-muted-foreground">Evaluaciones Totales</p>
        <p className="text-sm font-black text-slate-700">{data.z}</p>
      </div>
    </div>
  )
}

export default function DocentesCumplimientoBarChart({
  filters,
}: DocentesCumplimientoBarChartProps) {
  const [data, setData] = useState<ScatterDataItem[] | null>(null)
  const [totalDocentes, setTotalDocentes] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const firstResponse = await metricService.getDocentes({
          cfg_t: filters.cfg_t,
          sede: filters.sede,
          periodo: filters.periodo,
          programa: filters.programa,
          semestre: filters.semestre,
          page: 1,
          limit: 100,
        })

        const totalPages = firstResponse.pagination?.pages || 1
        const totalFromPagination = firstResponse.pagination?.total || 0

        let allDocentes = [...firstResponse.data]

        if (totalPages > 1) {
          const pageRequests = Array.from({ length: totalPages - 1 }, (_, index) =>
            metricService.getDocentes({
              cfg_t: filters.cfg_t,
              sede: filters.sede,
              periodo: filters.periodo,
              programa: filters.programa,
              semestre: filters.semestre,
              page: index + 2,
              limit: 100,
            })
          )

          const remainingPages = await Promise.all(pageRequests)
          allDocentes = allDocentes.concat(remainingPages.flatMap((pageResponse) => pageResponse.data))
        }

        const transformed: ScatterDataItem[] = allDocentes
          .filter((d) => d.total_evaluaciones > 0)
          .map((d) => ({
            x: d.porcentaje_cumplimiento,
            y: d.promedio_general || 0,
            z: d.total_evaluaciones,
            name: d.nombre_docente || "S/N",
            id: d.docente,
          }))

        setData(transformed)
        setTotalDocentes(totalFromPagination)
      } catch (err) {
        console.error("Error loading scatter data:", err)
        setData([])
        setTotalDocentes(0)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [
    filters.cfg_t,
    filters.sede,
    filters.periodo,
    filters.programa,
    filters.semestre,
  ])

  if (!filters.cfg_t) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-6">
          <Target className="w-10 h-10 text-indigo-300" />
        </div>
        <p className="text-slate-400 font-semibold text-xs">Seleccione una configuración para activar analítica</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`scatter-skeleton-summary-${i}`} className="h-28 rounded-3xl bg-slate-50" />
          ))}
        </div>
        <Skeleton className="h-[450px] w-full rounded-[2.5rem] bg-slate-50/50" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse" />
          <div className="relative w-28 h-28 rounded-[3rem] bg-white border-2 border-slate-100 shadow-2xl shadow-indigo-100 flex items-center justify-center group hover:scale-110 transition-transform duration-500">
            <BarChart3 className="w-12 h-12 text-slate-200 group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg border-2 border-white">
            <Info className="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Analítica en Espera</h3>
        <p className="text-slate-400 font-medium text-xs max-w-sm leading-relaxed px-6">
          Datos insuficientes para analítica avanzada. Se requiere un umbral mínimo de actividad (evaluaciones realizadas) para proyectar la correlación entre participación y desempeño docente.
        </p>
        <div className="mt-12 flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-500">Estado: Sincronizando flujo de datos</span>
        </div>
      </div>
    )
  }

  const avgQual = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.y, 0) / data.length).toFixed(2) : "0.00"

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Resumen de Hallazgos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-indigo-50/20 border-2 border-indigo-100/50 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground leading-none mb-2">Meta Cumplimiento</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data.filter(d => d.x >= 80).length} <span className="text-xs font-normal text-slate-400">Líderes</span></p>
          </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-emerald-50/20 border-2 border-emerald-100/50 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground leading-none mb-2">Calidad Promedio</p>
            <p className="text-2xl font-black text-slate-900 italic tracking-tight">{avgQual}</p>
          </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-slate-50/50 border-2 border-slate-100 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground leading-none mb-2">Población Activa</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{totalDocentes} <span className="text-xs font-normal text-slate-400">Docentes</span></p>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Participación" 
              unit="%" 
              domain={[0, 100]}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
              label={{ value: 'CORRELACIÓN PARTICIPACIÓN (%)', position: 'insideBottom', offset: -20, fontSize: 10, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.1em' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Promedio" 
              domain={[0, 5]}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
              label={{ value: 'CALIDAD ACADÉMICA (0-5)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.1em' }}
            />
            <ZAxis type="number" dataKey="z" range={[150, 1500]} name="Evaluaciones" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Docentes" data={data}>
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.id}`} 
                  fill={getBubbleColor(entry.y)} 
                  fillOpacity={0.5} 
                  stroke={getBubbleColor(entry.y)} 
                  strokeWidth={2}
                  className="hover:fill-opacity-100 transition-all duration-300 cursor-pointer"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda y Explicación Premium */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-100">
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
            <span className="text-xs font-medium text-slate-500">Excelencia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
            <span className="text-xs font-medium text-slate-500">Óptimo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
            <span className="text-xs font-medium text-slate-500">En Mejora</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm shadow-red-200" />
            <span className="text-xs font-medium text-slate-500">Crítico</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 max-w-md">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <p className="text-xs font-normal text-slate-400 leading-relaxed">
            Análisis de densidad volumétrica: El área de cada nodo representa la carga académica total del docente.
          </p>
        </div>
      </div>
    </div>
  )
}
