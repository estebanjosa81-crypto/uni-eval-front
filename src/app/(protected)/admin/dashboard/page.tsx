"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Users, GraduationCap, ClipboardList, TrendingDown, User, Award, Star, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { metricService } from "@/src/api";
import type { MetricFilters, RankingItem, SummaryMetrics, ProgramaSummary } from "@/src/api/services/metric/metric.service";
import Filtros from "@/src/app/(protected)/admin/components/filters";
import EstadisticasPrograma, { DocenteConMetricas } from "@/src/app/(protected)/admin/components/estadisticas-programa";
import { apiClient } from "@/src/api/core/apiClient";

/**
 * Genera un nombre corto para el programa basado en su nombre completo
 * Ejemplo: "Ingeniería de Sistemas" -> "Ing. Sistemas"
 */
const generarNombreCorto = (nombreCompleto: string): string => {
  // Si el nombre es corto, devolverlo tal cual
  if (nombreCompleto.length <= 20) {
    return nombreCompleto;
  }

  // Abreviar "Ingeniería" a "Ing."
  let nombreCorto = nombreCompleto.replace(/Ingeniería/gi, 'Ing.');
  
  // Abreviar "Tecnología" a "Tec."
  nombreCorto = nombreCorto.replace(/Tecnología/gi, 'Tec.');
  
  // Abreviar "Licenciatura" a "Lic."
  nombreCorto = nombreCorto.replace(/Licenciatura/gi, 'Lic.');
  
  // Si sigue siendo largo, tomar las primeras palabras
  if (nombreCorto.length > 25) {
    const palabras = nombreCorto.split(' ');
    nombreCorto = palabras.slice(0, 3).join(' ');
    if (palabras.length > 3) {
      nombreCorto += '...';
    }
  }
  
  return nombreCorto;
};

// Memoizar el componente de Filtros para evitar re-renders innecesarios
const FiltersMemo = memo(Filtros);

interface DashboardDataState {
  // Métricas generales del summary
  resumenGenerales: SummaryMetrics['generales'];
  // Ranking completo de docentes
  docentesRanking: RankingItem[];
  // Resumen por programas académicos
  programas: ProgramaSummary[];
  // Estadísticas procesadas para componente de visualización
  estadisticasProgramas: ProgramaSummary[];
}

interface FiltrosState {
  configuracionSeleccionada: number | null;
  semestreSeleccionado: string;
  periodoSeleccionado: string;
  programaSeleccionado: string;
  grupoSeleccionado: string;
  sedeSeleccionada: string;
}

export default function AdminDashboard() {
  // Protegido por admin/layout.tsx con useRequireRole(APP_ROLE_IDS.ADMIN)
  const { toast } = useToast();
  const [loadingBackup, setLoadingBackup] = useState(false);

  const handleBackup = async () => {
    try {
      setLoadingBackup(true);

      // Usar el nuevo método downloadFile
      const response = await apiClient.downloadFile(
        "/backup",
        {},
        { showMessage: false }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;

      // Usar un nombre de archivo por defecto
      const fileName = "backup.sql";

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup generado",
        description: "El archivo de backup se ha descargado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error("Error al generar el backup:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el backup",
        variant: "destructive",
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: "",
    periodoSeleccionado: "",
    programaSeleccionado: "",
    grupoSeleccionado: "",
    sedeSeleccionada: "",
  });

  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState<DashboardDataState | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Cargar datos del dashboard cuando cambian los filtros
  useEffect(() => {
    const cargarDashboard = async () => {
      if (!filtros.configuracionSeleccionada) {
        setDashboardData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const metricParams: MetricFilters = {
          cfg_t: filtros.configuracionSeleccionada,
          ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
          ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
          ...(filtros.programaSeleccionado && { programa: filtros.programaSeleccionado }),
          ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
          ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
        };

        // Obtener datos de los 3 endpoints
        const [summaryResponse, rankingResponse, programasResponse] = await Promise.all([
          metricService.getSummary(metricParams),
          metricService.getRanking(metricParams),
          metricService.getSummaryByPrograms(metricParams),
        ]);

        // Extraer datos directamente de las respuestas
        const resumenGenerales = summaryResponse.generales;
        const docentesRanking = rankingResponse.ranking || [];
        const programas = programasResponse.programas || [];

        // Los datos ya están en el formato correcto (ProgramaSummary)
        const estadisticasProgramas: ProgramaSummary[] = programas;

        setDashboardData({
          resumenGenerales,
          docentesRanking,
          programas,
          estadisticasProgramas,
        });
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        console.error("Detalles del error:", {
          message: error instanceof Error ? error.message : 'Error desconocido',
          filtros,
          stack: error instanceof Error ? error.stack : undefined
        });
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        });
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [
    filtros.configuracionSeleccionada,
    filtros.sedeSeleccionada,
    filtros.periodoSeleccionado,
    filtros.programaSeleccionado,
    filtros.semestreSeleccionado,
    filtros.grupoSeleccionado,
    toast,
  ]);

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({
      ...filtros,
      semestreSeleccionado: "",
      periodoSeleccionado: "",
      programaSeleccionado: "",
      grupoSeleccionado: "",
      sedeSeleccionada: "",
    });
  }, [filtros]);

  // Handler para clic en barras del gráfico de estadísticas por programa
  const handleEstadisticasProgramaClick = useCallback((
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => {
    console.log(`Clic en ${programa} - ${tipo}`);
    // Aquí puedes agregar lógica adicional como navegar a una vista de detalle
  }, []);

  // Handler para obtener docentes de un programa
  const handleObtenerDocentesPrograma = useCallback(async (
    programa: string
  ): Promise<DocenteConMetricas[]> => {
    if (!filtros.configuracionSeleccionada) {
      return [];
    }

    try {
      // Obtener el ranking de docentes filtrado por programa
      const response = await metricService.getRanking({
        cfg_t: filtros.configuracionSeleccionada,
        ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
        ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
        ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
        programa: programa, // Filtrar por el programa específico
      });

      // Transformar RankingItem[] a DocenteConMetricas[]
      const docentes: DocenteConMetricas[] = response.ranking.map((item) => {
        const promedio = item.adjusted;
        
        // Determinar estado basado en el promedio ajustado bayesiano
        let estado: DocenteConMetricas['estado'];
        if (item.realizados === 0) {
          estado = 'sin_evaluar';
        } else if (promedio >= 4.5) {
          estado = 'excelente';
        } else if (promedio >= 4.0) {
          estado = 'bueno';
        } else if (promedio >= 3.5) {
          estado = 'regular';
        } else {
          estado = 'necesita_mejora';
        }

        return {
          docente: item.docente,
          promedio_general: promedio,
          desviacion_general: null,
          total_evaluaciones: item.universo,
          total_realizadas: item.realizados,
          total_pendientes: item.universo - item.realizados,
          total_aspectos: 0,
          porcentaje_cumplimiento: ((item.realizados || 0) / (item.universo || 1)) * 100,
          suma: item.avg,
          avg: item.avg,
          adjusted: item.adjusted,
          realizados: item.realizados,
          universo: item.universo,
          estado,
          // Opcionalmente puedes enriquecer con más datos:
          // metricas: await metricService.getDocenteMetrics(item.docente, filters),
          // aspectos: await metricService.getDocenteAspectos(item.docente, filters).then(r => r.aspectos),
        };
      });

      return docentes;
    } catch (error) {
      console.error("Error al obtener docentes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los docentes del programa",
        variant: "destructive",
      });
      return [];
    }
  }, [filtros, toast]);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatNumber = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return "0.0";
    
    let numValue: number;
    if (typeof value === "string") {
      numValue = parseFloat(value);
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      return "0.0";
    }
    
    if (!isFinite(numValue)) {
      console.warn('Valor inválido para formatNumber:', value);
      return "0.0";
    }
    return numValue.toFixed(1);
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Preparar datos para mostrar con nombres descriptivos
  const resumenGenerales = dashboardData?.resumenGenerales;
  const docentesRanking = dashboardData?.docentesRanking || [];
  const estadisticasProgramas = dashboardData?.estadisticasProgramas || [];

  // Ordenar docentes por promedio ajustado (de mayor a menor)
  const docentesOrdenados = [...docentesRanking].sort((a, b) => {
    const promedioA = a.adjusted || 0;
    const promedioB = b.adjusted || 0;
    return promedioB - promedioA;
  });

  // Obtener mejores 3 y peores 3 docentes
  const mejoresDocentes = docentesOrdenados.slice(0, 3);
  const peoresDocentes = [...docentesOrdenados].reverse().slice(0, 3);

  return (
    <>
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-900 text-gray-900 hover:bg-gray-100"
            onClick={handleBackup}
            disabled={loadingBackup}
          >
            <Download className="h-4 w-4 mr-2" />
            {loadingBackup ? "Generando backup..." : "Backup"}
          </Button>
        </div>
      </header>

      <main className="p-6">
        {/* Componente de Filtros */}
        <FiltersMemo
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          loading={loading}
        />

        {/* Contenido del Dashboard */}
        {!filtros.configuracionSeleccionada ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Selecciona una configuración
              </h2>
              <p className="text-gray-600">
                Elige una configuración de evaluación para ver los datos del
                dashboard
              </p>
            </div>
          </div>
        ) : !dashboardData ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No hay datos disponibles
              </h2>
              <p className="text-gray-600">
                No se encontraron datos para los filtros seleccionados
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards - 3 Tarjetas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Estudiantes */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <Users className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Estudiantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {resumenGenerales?.total_estudiantes || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Han Participado</span>
                      <span>
                        {(resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)} /{" "}
                        {resumenGenerales?.total_estudiantes || 0}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          (((resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)) /
                            (resumenGenerales?.total_estudiantes || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            (((resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)) /
                              (resumenGenerales?.total_estudiantes || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          (((resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)) /
                            (resumenGenerales?.total_estudiantes || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Docentes */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <GraduationCap className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Docentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {resumenGenerales?.total_docentes || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Docentes Evaluados</span>
                      <span>
                        {(resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)} /{" "}
                        {resumenGenerales?.total_docentes || 0}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          (((resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)) /
                            (resumenGenerales?.total_docentes || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            (((resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)) /
                              (resumenGenerales?.total_docentes || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          (((resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)) /
                            (resumenGenerales?.total_docentes || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluaciones */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <ClipboardList className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Evaluaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {resumenGenerales?.total_evaluaciones || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Realizadas / Pendientes</span>
                      <span>
                        <span className="font-semibold">{resumenGenerales?.total_realizadas || 0}</span> /{" "}
                        <span className="font-semibold">{resumenGenerales?.total_pendientes || 0}</span>
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          ((resumenGenerales?.total_realizadas || 0) /
                            (resumenGenerales?.total_evaluaciones || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            ((resumenGenerales?.total_realizadas || 0) /
                              (resumenGenerales?.total_evaluaciones || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          ((resumenGenerales?.total_realizadas || 0) /
                            (resumenGenerales?.total_evaluaciones || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas por Programa */}
            <div className="mb-10">
              <EstadisticasPrograma
                datos={estadisticasProgramas.length > 0 ? estadisticasProgramas : undefined}
                filters={{
                  cfg_t: filtros.configuracionSeleccionada || 0,
                  ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
                  ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
                  ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
                  ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
                }}
                loading={loading}
              />
            </div>

            {/* Ranking y Mejores/Peores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Ranking Global - Tamaño Aumentado */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Ranking Global de Docentes
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-base mt-1">
                        Evaluación integral del cuerpo docente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
                    {docentesOrdenados.map((docente, index) => (
                      <div
                        key={`ranking-${
                          docente.docente || "no-docente"
                        }-${index}`}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        {/* Posición */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold 
              ${
                index < 3
                  ? "bg-blue-100 text-blue-800 shadow-md"
                  : "bg-gray-100 text-gray-600"
              }`}
                        >
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-inner
              ${
                index < 3
                  ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
                        >
                          <User className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-800 truncate">
                              {docente.nombre_docente}
                            </h3>
                            <span className="text-base font-bold text-gray-700 ml-2 px-3 py-1 bg-gray-100 rounded-full">
                              {formatNumber(docente.adjusted || 0)}/5
                            </span>
                          </div>

                          {/* Barra de progreso mejorada */}
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700
                  ${
                    index < 3
                      ? "bg-gradient-to-r from-blue-400 to-blue-600"
                      : "bg-gradient-to-r from-gray-300 to-gray-400"
                  }`}
                              style={{
                                width: `${
                                  ((docente.adjusted || 0) / 5) * 100
                                }%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                              {docente.realizados || 0}/
                              {docente.universo || 0} evaluaciones
                            </span>
                            <span className="px-2 py-1 bg-gray-50 rounded-full text-xs font-medium">
                              {Math.round(
                                ((docente.realizados || 0) /
                                  (docente.universo || 1)) *
                                  100
                              )}
                              % completado
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {docentesOrdenados.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-base font-medium">
                          No hay datos disponibles
                        </p>
                        <p className="text-sm mt-2">
                          Los resultados aparecerán después del proceso de
                          evaluación
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mejores y Peores - Tamaño Aumentado */}
              <div className="space-y-6">
                {/* Mejores */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                        <Award className="h-6 w-6 text-green-700" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Excelencia Docente
                        </CardTitle>
                        <CardDescription className="text-green-600 text-base mt-1">
                          Top 3 con mejor desempeño académico
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {mejoresDocentes.map((docente, index) => (
                        <div
                          key={`mejor-${
                            docente.docente || "no-docente"
                          }-${index}`}
                          className="group relative flex items-center gap-4 p-4 rounded-xl bg-white border border-green-50 hover:border-green-200 hover:bg-green-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          {/* Medalla de posición */}
                          <div
                            className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg
                ${
                  index === 0
                    ? "bg-yellow-500"
                    : index === 1
                    ? "bg-gray-400"
                    : "bg-amber-600"
                }`}
                          >
                            {index + 1}
                          </div>

                          {/* Avatar con efecto premium */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                            {index === 0 ? (
                              <Award className="h-6 w-6" />
                            ) : (
                              <Star className="h-5 w-5 fill-green-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold text-gray-800 truncate">
                                {docente.nombre_docente}
                              </h3>
                              <span className="text-base font-bold text-green-700 px-3 py-1 bg-green-100 rounded-full">
                                {formatNumber(docente.adjusted || 0)}/5
                              </span>
                            </div>

                            {/* Indicador de calidad */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {docente.realizados || 0}/{" "}
                                {docente.universo || 0} evaluaciones
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(docente.adjusted || 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {mejoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-base font-medium">
                            No hay datos disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Peores */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Oportunidades de Mejora
                        </CardTitle>
                        <CardDescription className="text-orange-600 text-base mt-1">
                          Docentes que requieren apoyo adicional
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {peoresDocentes.map((docente, index) => (
                        <div
                          key={`peor-${docente.docente || "no-docente"}-${index}`}
                          className="group relative flex items-center gap-4 p-4 rounded-xl bg-white border border-orange-50 hover:border-orange-200 hover:bg-orange-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          {/* Indicador de prioridad */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

                          {/* Avatar con indicador */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 shadow-inner">
                            <AlertTriangle className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold text-gray-800 truncate">
                                {docente.nombre_docente}
                              </h3>
                              <span className="text-base font-bold text-orange-700 px-3 py-1 bg-orange-100 rounded-full">
                                {formatNumber(docente.adjusted || 0)}/5
                              </span>
                            </div>

                            {/* Indicador de progreso */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {docente.realizados || 0}{" "}
                                evaluaciones
                              </div>
                              <div className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                <AlertCircle className="h-4 w-4" />
                                <span>Necesita refuerzo</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {peoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-base font-medium">
                            No hay datos disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
