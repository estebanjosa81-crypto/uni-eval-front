"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DocenteAspectosMetrics,
  metricService,
  MetricFilters 
} from "@/src/api/services/metric/metric.service";
import {
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';

interface AnalisisAspectosProps {
  filters: MetricFilters;
  loading?: boolean;
  mostrar?: boolean;
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeAspectosResponse = (response: any): DocenteAspectosMetrics | null => {
  const payload = response?.data?.data || response?.data || response;
  if (!payload || typeof payload !== "object") return null;

  const evaluacion = payload.evaluacion_estudiantes || payload.evaluacionEstudiantes;
  const autoevaluacion = payload.autoevaluacion_docente || payload.autoevaluacionDocente;
  const resultado = payload.resultado_final || payload.resultadoFinal;

  if (!evaluacion || !autoevaluacion || !resultado) return null;

  return {
    ...payload,
    evaluacion_estudiantes: evaluacion,
    autoevaluacion_docente: autoevaluacion,
    resultado_final: resultado,
  } as DocenteAspectosMetrics;
};

export default function AnalisisAspectos({
  filters,
  loading = false,
  mostrar = true,
}: AnalisisAspectosProps) {
  const [aspectosAgregados, setAspectosAgregados] = useState<DocenteAspectosMetrics | null>(null);
  const [aspectosAgregadosLoading, setAspectosAgregadosLoading] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState({
    est: true,
    auto: true
  });

  // Helper para obtener color del promedio (paleta minimalista)
  const getPromedioColor = (promedio: number) => {
    if (promedio >= 4.0) return "text-emerald-600";
    if (promedio >= 3.5) return "text-slate-700";
    if (promedio >= 3.0) return "text-amber-600";
    if (promedio > 0) return "text-red-600";
    return "text-slate-300";
  };

  // Helper para obtener badge color de la diferencia
  const getDiferenciaBadgeClass = (diferencia: number) => {
    const abs = Math.abs(diferencia);
    if (abs <= 0.3) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (abs <= 0.6) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  // Handler para cargar aspectos agregados
  const loadAspectosAgregados = async () => {
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setAspectosAgregadosLoading(true);

    try {
      const response = await metricService.getDocenteAspectos({
        ...filters,
      });

      const normalized = normalizeAspectosResponse(response);
      setAspectosAgregados(normalized);
    } catch (error) {
      console.error("Error al obtener aspectos agregados:", error);
      setAspectosAgregados(null);
    } finally {
      setAspectosAgregadosLoading(false);
    }
  };

  useEffect(() => {
    if (filters && filters.cfg_t && mostrar) {
      loadAspectosAgregados();
    }
  }, [filters, mostrar]);

  if (!mostrar) {
    return null;
  }

  // Loading state
  if (loading || aspectosAgregadosLoading) {
    return (
      <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="col-span-2 h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const evaluacionEstudiantes = aspectosAgregados?.evaluacion_estudiantes;
  const autoevaluacionDocente = aspectosAgregados?.autoevaluacion_docente;
  const resultadoFinal = aspectosAgregados?.resultado_final;
  const escalaMaxima = aspectosAgregados?.escala_maxima ?? 5;
  const pesoEstudiantes = toNumberOrNull(evaluacionEstudiantes?.peso) ?? 0.8;
  const pesoDocente = toNumberOrNull(autoevaluacionDocente?.peso) ?? 0.2;
  const autoevaluacionesRealizadas = (autoevaluacionDocente?.total_respuestas ?? 0) > 0 ? 1 : 0;

  // Preparar datos unificados para comparación
  const uniqueNames = Array.from(new Set([
    ...(evaluacionEstudiantes?.aspectos?.map(a => a.nombre) || []),
    ...(autoevaluacionDocente?.aspectos?.map(a => a.nombre) || [])
  ])).filter(Boolean) as string[];

  const combinedData = uniqueNames.map(name => {
    const est = evaluacionEstudiantes?.aspectos?.find(a => a.nombre === name);
    const auto = autoevaluacionDocente?.aspectos?.find(a => a.nombre === name);

    const estPromedio = toNumberOrNull(est?.promedio) ?? (est && est.total_respuestas > 0 ? est.suma / est.total_respuestas : null);
    const autoPromedio = toNumberOrNull(auto?.promedio) ?? (auto && auto.total_respuestas > 0 ? auto.suma / auto.total_respuestas : null);

    return {
      name,
      est: estPromedio !== null ? Number(estPromedio.toFixed(2)) : null,
      auto: autoPromedio !== null ? Number(autoPromedio.toFixed(2)) : null,
      estTotal: est?.total_respuestas || 0,
      autoTotal: auto?.total_respuestas || 0,
    };
  });

  // Radar Data
  const radarData = combinedData.map(d => ({
    subject: d.name,
    Estudiantes: d.est,
    Docente: d.auto,
    fullMark: escalaMaxima
  }));

  // Custom Tooltip minimalista
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-slate-200 shadow-lg rounded-lg min-w-[160px]">
          <p className="font-semibold text-slate-900 mb-1 text-xs">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-2 text-xs mb-0.5">
                <div className="flex items-center gap-1">
                  <div 
                    className="h-1.5 w-1.5 rounded-full" 
                    style={{ backgroundColor: entry.color || entry.fill }}
                  ></div>
                  <span className="text-slate-600">{entry.name}:</span>
                </div>
                <span className="font-semibold text-slate-900">{entry.value.toFixed(2)}</span>
              </div>
            );
          })}
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
            <p>Estudiantes (peso): {(pesoEstudiantes * 100).toFixed(0)}%</p>
            <p>Autoevaluación (peso): {(pesoDocente * 100).toFixed(0)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const calcularDiferencia = (evaluacion: number, autoevaluacion: number) => {
    return evaluacion - autoevaluacion;
  };

  return (
    <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header minimalista */}
      <CardHeader className="pb-6 border-b border-slate-100 bg-slate-50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Análisis de Aspectos Evaluados
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm font-normal mt-0.5">
                Comparación entre evaluación de estudiantes y autoevaluación docente
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {aspectosAgregados && evaluacionEstudiantes && autoevaluacionDocente && combinedData.length > 0 ? (
          <div className="space-y-6">
            {/* KPI Metrics - Resumen ejecutivo minimalista */}
            <div className="grid grid-cols-3 gap-4">
              {/* Evaluación Estudiantes */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Estudiantes
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`text-4xl font-semibold ${getPromedioColor(toNumberOrNull(evaluacionEstudiantes.promedio_general) ?? 0)}`}>
                    {(toNumberOrNull(evaluacionEstudiantes.promedio_general) ?? 0).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-base">/{escalaMaxima.toFixed(1)}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-700">Respuestas:</span> {evaluacionEstudiantes.total_respuestas}</p>
                  <p><span className="font-medium text-slate-700">Peso:</span> {(pesoEstudiantes * 100).toFixed(0)}%</p>
                  <p><span className="font-medium text-slate-700">Ponderado:</span> {(toNumberOrNull(evaluacionEstudiantes.ponderado) ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Autoevaluación Docente */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Docente
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`text-4xl font-semibold ${getPromedioColor(toNumberOrNull(autoevaluacionDocente.promedio_general) ?? 0)}`}>
                    {(toNumberOrNull(autoevaluacionDocente.promedio_general) ?? 0).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-base">/{escalaMaxima.toFixed(1)}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-700">Respuestas:</span> {autoevaluacionesRealizadas}</p>
                  <p><span className="font-medium text-slate-700">Peso:</span> {(pesoDocente * 100).toFixed(0)}%</p>
                  <p><span className="font-medium text-slate-700">Ponderado:</span> {(toNumberOrNull(autoevaluacionDocente.ponderado) ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Resultado Final */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Nota Final
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`text-4xl font-semibold ${getPromedioColor(toNumberOrNull(resultadoFinal?.nota_final_ponderada) ?? 0)}`}>
                    {(toNumberOrNull(resultadoFinal?.nota_final_ponderada) ?? 0).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-base">/{escalaMaxima.toFixed(1)}</span>
                </div>
                <div className="text-sm">
                  <p className="text-slate-600">
                    <span className="font-medium text-slate-700">Nota final ponderada:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {(toNumberOrNull(resultadoFinal?.nota_final_ponderada) ?? 0).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-slate-600 mt-1">
                    <span className="font-medium text-slate-700">Diferencia:</span>{" "}
                    <span className={getDiferenciaBadgeClass(calcularDiferencia(toNumberOrNull(evaluacionEstudiantes.promedio_general) ?? 0, toNumberOrNull(autoevaluacionDocente.promedio_general) ?? 0))}>
                      {calcularDiferencia(toNumberOrNull(evaluacionEstudiantes.promedio_general) ?? 0, toNumberOrNull(autoevaluacionDocente.promedio_general) ?? 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido principal: Radar + Tabla */}
            <div className="grid grid-cols-3 gap-6">
              {/* Radar Chart - 60% */}
              <div className="col-span-2">
                <div className="p-6 rounded-lg bg-white border border-slate-200 h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Balance de Competencias</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Comparación visual por aspecto evaluado</p>
                  </div>
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" strokeWidth={0.5} />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={({ payload, x, y, textAnchor }: any) => (
                            <text
                              x={x}
                              y={y}
                              textAnchor={textAnchor}
                              fill="#475569"
                              fontSize={14}
                              fontWeight={500}
                            >
                              {payload.value.length > 20 ? `${payload.value.substring(0, 20)}...` : payload.value}
                            </text>
                          )}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, escalaMaxima]}
                          tick={{ fill: '#cbd5e1', fontSize: 12 }}
                          axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                        />
                        <Radar
                          name="Estudiantes"
                          dataKey="Estudiantes"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                          hide={!visibleSeries.est}
                        />
                        <Radar
                          name="Docente"
                          dataKey="Docente"
                          stroke="#64748b"
                          fill="#64748b"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                          hide={!visibleSeries.auto}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ cursor: 'pointer', paddingRight: '10px' }}
                          iconType="circle"
                          onClick={(e) => {
                            const key = e.dataKey === 'Estudiantes' ? 'est' : 'auto';
                            setVisibleSeries(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleSeries] }));
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tabla de Aspectos - 40% */}
              <div className="col-span-1">
                <div className="p-6 rounded-lg bg-white border border-slate-200 h-full overflow-y-auto max-h-[550px]">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Aspectos Detallados</h3>
                  <div className="space-y-3">
                    {combinedData.map((item, idx) => {
                      const diff = item.est !== null && item.auto !== null ? item.est - item.auto : null;
                      return (
                        <div key={idx} className="pb-3 border-b border-slate-100 last:border-b-0">
                          <p className="text-sm font-medium text-slate-900 mb-2 truncate" title={item.name}>
                            {item.name.length > 35 ? `${item.name.substring(0, 35)}...` : item.name}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {/* Estudiantes */}
                            <div className="bg-slate-50 rounded px-2 py-1.5">
                              <p className="text-xs text-slate-500 font-medium mb-0.5">Estud.</p>
                              <p className="text-base font-semibold text-indigo-600">
                                {item.est !== null ? item.est.toFixed(2) : "—"}
                              </p>
                            </div>

                            {/* Docente */}
                            <div className="bg-slate-50 rounded px-2 py-1.5">
                              <p className="text-xs text-slate-500 font-medium mb-0.5">Doc.</p>
                              <p className="text-base font-semibold text-slate-700">
                                {item.auto !== null ? item.auto.toFixed(2) : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Diferencia */}
                          {diff !== null && (
                            <Badge 
                              variant="outline" 
                              className={`w-full justify-center text-xs py-0.5 border ${getDiferenciaBadgeClass(diff)}`}
                            >
                              Dif: {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-base font-medium text-slate-500">
              No hay datos de aspectos disponibles
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Los aspectos aparecerán cuando se evalúen los docentes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
