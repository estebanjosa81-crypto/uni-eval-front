"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  AlertTriangle,
  ChevronRight,
  Book,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { 
  ProgramaSummary, 
  DocenteGeneralMetrics,
  AspectoMetric,
  MateriaMetric,
  DocenteAspectosMetrics,
  metricService,
  MetricFilters 
} from "@/src/api/services/metric/metric.service";

// Tipos extendidos para el componente
export interface DocenteConMetricas extends DocenteGeneralMetrics {
  avg?: number;
  adjusted?: number;
  realizados?: number;
  universo?: number;
  aspectos?: AspectoMetric[];
  estado?: "excelente" | "bueno" | "regular" | "necesita_mejora" | "sin_evaluar";
}

interface GraficaProgramaProps {
  datos?: ProgramaSummary[];
  filters: MetricFilters;
  loading?: boolean;
}

// Configuración del gráfico
const chartConfig: ChartConfig = {
  completadas: {
    label: "Completadas",
    color: "hsl(221, 83%, 53%)", // Azul
  },
  pendientes: {
    label: "Pendientes",
    color: "hsl(220, 9%, 46%)", // Gris
  },
};

// Función para simplificar nombres de programas en el eje X
const simplificarNombrePrograma = (nombre: string): string => {
  if (!nombre) return nombre;
  return nombre
    .replace(/TECNOLOGIA/gi, "TEC")
    .replace(/INGENIERIA/gi, "ING");
};

export default function GraficaPrograma({
  datos,
  filters,
  loading = false,
}: GraficaProgramaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    programa: string;
    tipo: "completadas" | "pendientes";
    docentes: DocenteConMetricas[];
    loading: boolean;
  }>({
    programa: "",
    tipo: "completadas",
    docentes: [],
    loading: false,
  });

  // Estado para mostrar/ocultar las cards de resumen
  const [showProgramCards, setShowProgramCards] = useState(false);

  // Estado unificado para expandir/contraer secciones de un docente
  const [docenteExpandido, setDocenteExpandido] = useState<{ id: string | null; tipo: 'materias' | 'aspectos' | null }>({ 
    id: null, 
    tipo: null 
  });
  const [materiasLoading, setMateriasLoading] = useState<{ [key: string]: boolean }>({});
  const [docenteMaterias, setDocenteMaterias] = useState<{ [key: string]: MateriaMetric[] }>({});
  const [aspectosLoading, setAspectosLoading] = useState<{ [key: string]: boolean }>({});
  const [docenteAspectos, setDocenteAspectos] = useState<{ [key: string]: DocenteAspectosMetrics }>({});

  // Calcular estado basado en promedio
  const calcularEstado = (promedio: number | null): DocenteConMetricas["estado"] => {
    if (promedio === null) return "sin_evaluar";
    if (promedio >= 4.0) return "excelente";
    if (promedio >= 3.5) return "bueno";
    if (promedio >= 3.0) return "regular";
    return "necesita_mejora";
  };

  // Enriquecer docente con aspectos y estado
  const enriquecerDocente = async (docente: DocenteGeneralMetrics, programa: string): Promise<DocenteConMetricas> => {
    const docenteEnriquecido: DocenteConMetricas = {
      ...docente,
      estado: calcularEstado(docente.promedio_general),
      avg: docente.promedio_general || 0,
      adjusted: docente.promedio_general || 0,
      realizados: docente.total_realizadas,
      universo: docente.total_evaluaciones,
      aspectos: [],
    };

    return docenteEnriquecido;
  };

  // Handler para clic en barras
  const handleBarClick = async (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => {
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setDialogData({
      programa,
      tipo,
      docentes: [],
      loading: true,
    });
    setDialogOpen(true);

    try {
      const response = await metricService.getDocentes({
        ...filters,
        programa,
      });

      const docentesEnriquecidos = await Promise.all(
        response.data.map((doc) => enriquecerDocente(doc, programa))
      );

      setDialogData((prev) => ({
        ...prev,
        docentes: docentesEnriquecidos,
        loading: false,
      }));
    } catch (error) {
      console.error("Error al obtener docentes:", error);
      setDialogData((prev) => ({
        ...prev,
        docentes: [],
        loading: false,
      }));
    }
  };

  // Handler para clic en un docente (expandir/contraer materias)
  const handleDocenteClick = async (docente: DocenteConMetricas) => {
    const docenteId = docente.docente;
    
    if (docenteExpandido.id === docenteId && docenteExpandido.tipo === 'materias') {
      setDocenteExpandido({ id: null, tipo: null });
      return;
    }

    if (docenteMaterias[docenteId]) {
      setDocenteExpandido({ id: docenteId, tipo: 'materias' });
      return;
    }

    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setMateriasLoading((prev) => ({ ...prev, [docenteId]: true }));

    try {
      const response = await metricService.getDocenteMaterias(docenteId, {
        ...filters,
        programa: dialogData.programa,
      });

      setDocenteMaterias((prev) => ({
        ...prev,
        [docenteId]: response.materias,
      }));
      setDocenteExpandido({ id: docenteId, tipo: 'materias' });
    } catch (error) {
      console.error("Error al obtener materias del docente:", error);
    } finally {
      setMateriasLoading((prev) => ({ ...prev, [docenteId]: false }));
    }
  };

  // Handler para expandir/contraer aspectos de un docente
  const handleAspectosClick = async (docente: DocenteConMetricas) => {
    const docenteId = docente.docente;
    
    if (docenteExpandido.id === docenteId && docenteExpandido.tipo === 'aspectos') {
      setDocenteExpandido({ id: null, tipo: null });
      return;
    }

    if (docenteAspectos[docenteId]) {
      setDocenteExpandido({ id: docenteId, tipo: 'aspectos' });
      return;
    }

    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setAspectosLoading((prev) => ({ ...prev, [docenteId]: true }));

    try {
      const response = await metricService.getDocenteAspectos({
        ...filters,
        programa: dialogData.programa,
        docente: docenteId,
      });

      setDocenteAspectos((prev) => ({
        ...prev,
        [docenteId]: response,
      }));
      setDocenteExpandido({ id: docenteId, tipo: 'aspectos' });
    } catch (error) {
      console.error("Error al obtener aspectos del docente:", error);
    } finally {
      setAspectosLoading((prev) => ({ ...prev, [docenteId]: false }));
    }
  };

  const estadisticas: ProgramaSummary[] = datos && datos.length > 0 ? datos : [];

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    return estadisticas.map((item: ProgramaSummary) => {
      const { metricas } = item;
      const completadas = metricas.total_realizadas;
      const pendientes = metricas.total_pendientes;
      const total = metricas.total_evaluaciones;
      const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
      const nombreSimplificado = simplificarNombrePrograma(item.nombre);
      
      return {
        name: nombreSimplificado.length > 15 ? nombreSimplificado.substring(0, 15) + '...' : nombreSimplificado,
        programaCompleto: item.nombre,
        completadas,
        pendientes,
        total,
        porcentaje,
        selected: item.selected ?? false,
      };
    });
  }, [estadisticas]);

  const hasSelected = useMemo(
    () => estadisticas.some((item) => item.selected),
    [estadisticas]
  );

  // Calcular totales
  const totales = useMemo(() => {
    return estadisticas.reduce(
      (acc, item) => ({
        completadas: acc.completadas + item.metricas.total_realizadas,
        pendientes: acc.pendientes + item.metricas.total_pendientes,
        total: acc.total + item.metricas.total_evaluaciones,
      }),
      { completadas: 0, pendientes: 0, total: 0 }
    );
  }, [estadisticas]);

  // Helper para obtener color e icono del estado
  const getEstadoInfo = (estado: DocenteConMetricas["estado"]) => {
    switch (estado) {
      case "excelente":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <Star className="h-4 w-4" />,
          label: "Excelente",
          bgGradient: "from-green-50 to-green-100",
        };
      case "bueno":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Bueno",
          bgGradient: "from-blue-50 to-blue-100",
        };
      case "regular":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <AlertTriangle className="h-4 w-4" />,
          label: "Regular",
          bgGradient: "from-yellow-50 to-yellow-100",
        };
      case "necesita_mejora":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <TrendingDown className="h-4 w-4" />,
          label: "Necesita Mejora",
          bgGradient: "from-red-50 to-red-100",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          icon: <Clock className="h-4 w-4" />,
          label: "Sin Evaluar",
          bgGradient: "from-gray-50 to-gray-100",
        };
    }
  };

  // Helper para obtener color del promedio
  const getPromedioColor = (promedio: number) => {
    if (promedio >= 4.0) return "text-green-600";
    if (promedio >= 3.5) return "text-blue-600";
    if (promedio >= 3.0) return "text-yellow-600";
    if (promedio > 0) return "text-red-600";
    return "text-gray-400";
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
            {data?.programaCompleto || label}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Completadas</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.completadas}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Pendientes</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.pendientes}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">
                  {data?.total}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="font-semibold text-blue-600">
                  {data?.porcentaje}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Estadísticas por Programa
              </CardTitle>
              <CardDescription className="text-gray-500">
                Cargando datos...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Estadísticas por Programa
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  {estadisticas.length > 0 
                    ? "Haz clic en las barras para ver el detalle de docentes"
                    : "Seleccione una configuración para ver las estadísticas"}
                </CardDescription>
              </div>
            </div>

            {/* Resumen rápido */}
            {estadisticas.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {totales.completadas} completadas
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {totales.pendientes} pendientes
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {estadisticas.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-500">
                No hay datos de programas disponibles
              </p>
              <p className="text-sm mt-2 text-gray-400">
                Las estadísticas aparecerán cuando se carguen los datos
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico */}
              <div className="h-[400px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.toString()}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="completadas"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "completadas")
                      }
                    >
                      {chartData.map((data, index) => (
                        <Cell
                          key={`completadas-${index}`}
                          className="hover:opacity-80 transition-opacity"
                          fill={
                            hasSelected && !data.selected
                              ? "hsl(215, 16%, 85%)"
                              : "hsl(221, 83%, 53%)"
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="pendientes"
                      fill="hsl(220, 9%, 46%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "pendientes")
                      }
                    >
                      {chartData.map((data, index) => (
                        <Cell
                          key={`pendientes-${index}`}
                          className="hover:opacity-80 transition-opacity"
                          fill={
                            hasSelected && !data.selected
                              ? "hsl(215, 16%, 85%)"
                              : "hsl(220, 9%, 46%)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Completadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Pendientes
                  </span>
                </div>
              </div>

              {/* Botón para mostrar/ocultar cards */}
              <div className="flex items-center justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProgramCards(!showProgramCards)}
                  className="gap-2"
                >
                  {showProgramCards ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar resumen por programa
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar resumen por programa
                    </>
                  )}
                </Button>
              </div>

              {/* Cards de resumen por programa (responsive) */}
              {showProgramCards && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-in fade-in duration-300">
                  {estadisticas.map((programa, index) => {
                    const { metricas } = programa;
                    const completadas = metricas.total_realizadas;
                  const total = metricas.total_evaluaciones;
                  const porcentajeCompletado = total > 0 ? Math.round((completadas / total) * 100) : 0;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                        programa.selected
                          ? "bg-blue-50/60 border-blue-300 shadow-sm"
                          : "bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                      }`}
                      onClick={() => handleBarClick(programa.nombre, "completadas")}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-medium text-gray-500 truncate">
                          {programa.nombre}
                        </span>
                        {programa.selected && (
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            Seleccionado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {porcentajeCompletado}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {completadas}/{total}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            porcentajeCompletado >= 80
                              ? "bg-green-100 text-green-700"
                              : porcentajeCompletado >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {porcentajeCompletado >= 80
                            ? "Alto"
                            : porcentajeCompletado >= 60
                            ? "Medio"
                            : "Bajo"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de detalle de docentes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-lg">Rendimiento de Docentes</span>
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {dialogData.programa}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Listado de docentes con su promedio de evaluación y estado de desempeño
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {dialogData.loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : dialogData.docentes && dialogData.docentes.length > 0 ? (
              <div className="space-y-3">
                {dialogData.docentes.map((docente, index) => {
                  const estadoInfo = getEstadoInfo(docente.estado);
                  const promedio = docente.promedio_general || docente.avg || docente.adjusted || 0;
                  const realizados = docente.total_realizadas;
                  const esperados = docente.total_evaluaciones;
                  const porcentaje = esperados > 0 ? Math.round((realizados / esperados) * 100) : 0;
                  
                  return (
                    <div
                      key={`${docente.docente}-${index}`}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md bg-gradient-to-r ${estadoInfo.bgGradient} cursor-pointer group`}
                    >
                      {/* Información general del docente */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${estadoInfo.color} border`}>
                              {estadoInfo.icon}
                              <span className="ml-1.5">{estadoInfo.label}</span>
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {docente.docente}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {realizados}/{esperados} evaluaciones
                            </span>
                            <span className="font-medium text-gray-700">
                              {porcentaje}% completado
                            </span>
                          </div>
                        </div>

                        {/* Promedio */}
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${getPromedioColor(promedio)}`}>
                            {promedio.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">/5.0</p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mb-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              promedio >= 4.0 ? 'bg-green-500' :
                              promedio >= 3.5 ? 'bg-blue-500' :
                              promedio >= 3.0 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(promedio / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDocenteClick(docente)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Book className="h-4 w-4" />
                          {materiasLoading[docente.docente] ? "Cargando..." : "Ver Materias"}
                          <ChevronRight className={`h-4 w-4 transition-transform ${
                            docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'materias' ? 'rotate-90' : ''
                          }`} />
                        </button>

                        <button
                          onClick={() => handleAspectosClick(docente)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          {aspectosLoading[docente.docente] ? "Cargando..." : "Ver Aspectos"}
                          <ChevronRight className={`h-4 w-4 transition-transform ${
                            docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'aspectos' ? 'rotate-90' : ''
                          }`} />
                        </button>
                      </div>

                      {/* Materias expandidas */}
                      {docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'materias' && docenteMaterias[docente.docente] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Book className="h-4 w-4" />
                            Materias ({docenteMaterias[docente.docente].length})
                          </h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {docenteMaterias[docente.docente].map((materia, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{materia.nombre_materia}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {materia.grupos && materia.grupos.length} grupo(s)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-lg font-bold ${getPromedioColor(materia.promedio_general || 0)}`}>
                                      {(materia.promedio_general || 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                {materia.grupos && materia.grupos.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {materia.grupos.map((grupo, gIdx) => (
                                      <div key={gIdx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                        <span className="text-gray-600">Grupo {grupo.grupo}</span>
                                        <span className="font-medium">{(grupo.promedio_general || 0).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Aspectos expandidos */}
                      {docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'aspectos' && docenteAspectos[docente.docente] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Aspectos Evaluados ({docenteAspectos[docente.docente].aspectos?.length || 0})
                          </h4>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs text-gray-600">Promedio General</p>
                              <p className={`text-xl font-bold ${getPromedioColor(docenteAspectos[docente.docente].promedio || 0)}`}>
                                {(docenteAspectos[docente.docente].promedio || 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs text-gray-600">Total Respuestas</p>
                              <p className="text-xl font-bold text-gray-900">
                                {docenteAspectos[docente.docente].total_respuestas}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {docenteAspectos[docente.docente].aspectos?.map((aspecto, idx) => {
                              const promedioAspecto = aspecto.suma && aspecto.total_respuestas 
                                ? aspecto.suma / aspecto.total_respuestas 
                                : 0;

                              return (
                                <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-900">{aspecto.nombre}</p>
                                    <p className={`text-lg font-bold ${getPromedioColor(promedioAspecto)}`}>
                                      {promedioAspecto.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>Suma: {aspecto.suma}</span>
                                    <span>Respuestas: {aspecto.total_respuestas}</span>
                                  </div>
                                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        promedioAspecto >= 4.0 ? 'bg-green-500' :
                                        promedioAspecto >= 3.5 ? 'bg-blue-500' :
                                        promedioAspecto >= 3.0 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${(promedioAspecto / 5) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium">
                  No hay docentes para mostrar
                </p>
                <p className="text-sm mt-1">
                  No se encontraron docentes evaluados en este programa
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer con resumen */}
          {!dialogData.loading && dialogData.docentes && dialogData.docentes.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Total: {dialogData.docentes.length} docente
                {dialogData.docentes.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'excelente').length} Excelente
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'bueno').length} Bueno
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'necesita_mejora').length} A mejorar
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
