"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  UserCheck, 
  BarChart2, 
  Star, 
  Target,
  ArrowRight
} from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts'
import { metricService } from "@/src/api/services/metric/metric.service"
import type { 
  DocenteGeneralMetrics, 
  MateriaMetric, 
  DocenteAspectosMetrics 
} from "@/src/api/services/metric/metric.service"
import type { FiltrosState } from "../../types"

interface AspectoMetricsModalProps {
  docente: DocenteGeneralMetrics
  materia: MateriaMetric
  filtros: FiltrosState
  onClose: () => void
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
        grupo: filtros.grupoSeleccionado || materia.grupo || undefined,
      })

      setMetricsData(response)
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (promedio: number) => {
    if (promedio >= 4.5) return 'text-emerald-600'
    if (promedio >= 4.0) return 'text-blue-600'
    if (promedio >= 3.0) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getDiferenciaColor = (diferencia: number) => {
    if (Math.abs(diferencia) <= 0.3) return "text-green-600";
    if (Math.abs(diferencia) <= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  // Preparar datos para el radar con useMemo
  const radarData = useMemo(() => {
    if (!metricsData) return [];

    const allAspectNames = Array.from(new Set([
      ...metricsData.evaluacion_estudiantes.aspectos.map(a => a.nombre).filter(Boolean),
      ...metricsData.autoevaluacion_docente.aspectos.map(a => a.nombre).filter(Boolean)
    ]));

    return allAspectNames.map(nombre => {
      const est = metricsData.evaluacion_estudiantes.aspectos.find(a => a.nombre === nombre);
      const auto = metricsData.autoevaluacion_docente.aspectos.find(a => a.nombre === nombre);
      
      return {
        subject: nombre as string,
        Estudiantes: est?.promedio || 0,
        Docente: auto?.promedio || 0,
        estCompleto: est,
        autoCompleto: auto
      };
    });
  }, [metricsData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-2xl rounded-2xl min-w-[220px]">
          <p className="font-bold text-slate-800 mb-3 text-sm border-b border-slate-50 pb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                <span className="text-xs text-slate-500 font-medium">{entry.name}:</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl max-w-6xl w-full my-8 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con diseño premium */}
        <div className="bg-white border-b border-slate-100 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <BarChart2 className="w-48 h-48 text-slate-900" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Métricas de Desempeño</h2>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium px-3 py-1 rounded-xl text-xs">
                    Vista Detallada
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 font-medium text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-black italic">{materia.nombre_materia}</span>
                    {materia.grupo && (
                      <Badge variant="outline" className="rounded-lg bg-indigo-50 border-indigo-100 text-indigo-600 font-black text-[9px] px-2 py-0">
                        GRUPO: {materia.grupo}
                      </Badge>
                    )}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block" />
                  <span className="text-[10px] flex items-center gap-1.5">
                    DOCENTE: <span className="text-slate-900 font-black italic">{docente.nombre_docente || docente.docente}</span>
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block" />
                  <span className="text-[10px] flex items-center gap-1.5">
                    CÓDIGO: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{materia.codigo_materia}</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all duration-300 border border-slate-200 group shadow-sm"
            >
              <ArrowRight className="w-6 h-6 rotate-180 text-slate-400 group-hover:-translate-x-1 group-hover:text-slate-900 transition-all" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Star className="w-6 h-6 text-slate-200" />
                </div>
              </div>
              <p className="mt-6 text-slate-500 font-medium text-xs">Cargando análisis profundo...</p>
            </div>
          ) : !metricsData ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-bold">Sin datos para mostrar</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Stats - Comparative Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Evaluación Estudiantes */}
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-slate-400">Estudiantes</p>
                    <div className="text-right">
                      <Badge className="bg-blue-50 text-blue-600 border-none font-bold">{(metricsData.evaluacion_estudiantes.peso * 100).toFixed(0)}% Peso</Badge>
                      <p className="text-xs font-medium text-blue-300 mt-1">Aporte: +{(metricsData.evaluacion_estudiantes.ponderado || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-black ${getScoreColor(metricsData.evaluacion_estudiantes.promedio_general || 0)}`}>
                      {(metricsData.evaluacion_estudiantes.promedio_general || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold text-slate-400 italic">/5.00</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-normal">{materia.total_realizadas} Evaluaciones</span>
                    </div>
                    <span className="text-xs font-normal text-slate-300">{metricsData.evaluacion_estudiantes.total_respuestas} Ítems</span>
                  </div>
                </div>

                {/* Autoevaluación Docente */}
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-slate-400">Docente</p>
                    <div className="text-right">
                      <Badge className="bg-purple-50 text-purple-600 border-none font-bold">{(metricsData.autoevaluacion_docente.peso * 100).toFixed(0)}% Peso</Badge>
                      <p className="text-xs font-medium text-purple-300 mt-1">Aporte: +{(metricsData.autoevaluacion_docente.ponderado || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-black ${getScoreColor(metricsData.autoevaluacion_docente.promedio_general || 0)}`}>
                      {(metricsData.autoevaluacion_docente.promedio_general || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold text-slate-400 italic">/5.00</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserCheck className="w-4 h-4" />
                      <span className="text-xs font-normal">1 Autoevaluación</span>
                    </div>
                    <span className="text-xs font-normal text-slate-300">{metricsData.autoevaluacion_docente.total_respuestas} Ítems</span>
                  </div>
                </div>

                {/* Resultado Final */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-24 h-24 text-white" />
                  </div>
                  <p className="text-xs font-medium text-white/50 mb-4">Puntaje Final</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-white tracking-tighter">
                      {(metricsData.resultado_final.nota_final_ponderada || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold text-white/40 mb-1">PONDERADO</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/60">Diferencia:</span>
                      <span className={`text-sm font-black p-1 rounded-lg bg-white/5 ${getDiferenciaColor((metricsData.evaluacion_estudiantes.promedio_general || 0) - (metricsData.autoevaluacion_docente.promedio_general || 0))}`}>
                        {((metricsData.evaluacion_estudiantes.promedio_general || 0) - (metricsData.autoevaluacion_docente.promedio_general || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts & Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="p-8 pb-12 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-10">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Equilibrio de Competencias
                    </h3>
                  </div>
                  <div className="w-full h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={({ payload, x, y, textAnchor }: any) => (
                            <text x={x} y={y} textAnchor={textAnchor} fill="#94a3b8" fontSize={11} fontWeight={700}>
                              {payload.value.length > 20 ? `${payload.value.substring(0, 20)}...` : payload.value}
                            </text>
                          )}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                        <Radar
                          name="Estudiantes"
                          dataKey="Estudiantes"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.15}
                          strokeWidth={3}
                          connectNulls
                        />
                        <Radar
                          name="Docente"
                          dataKey="Docente"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.15}
                          strokeWidth={3}
                          connectNulls
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '30px' }} iconType="circle" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comparative List */}
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-400">Comparativa por Ítem</h3>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400 tracking-tighter">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> EST.</span>
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> AUTO.</span>
                    </div>
                  </div>
                  {radarData.map((item: typeof radarData[number], idx: number) => {
                    const diff = item.Estudiantes - item.Docente;
                    return (
                      <div key={idx} className="group p-5 rounded-3xl bg-white border border-slate-100 hover:border-blue-100 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                            {item.subject}
                          </p>
                          <Badge className={`border-none font-black text-[10px] ${getDiferenciaColor(diff)}`}>
                            {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black text-blue-400">
                              <span>ESTUDIANTES</span>
                              <span>{item.Estudiantes.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${(item.Estudiantes / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black text-purple-400">
                              <span>AUTOCALIFICACIÓN</span>
                              <span>{item.Docente.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-purple-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${(item.Docente / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-6 border-t border-slate-100 flex justify-end items-center gap-4">
          <p className="text-xs font-bold text-slate-400 mr-auto flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Escala basada en {metricsData?.escala_maxima || 5}.0
          </p>
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-8 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cerrar Reporte
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  )
}
