"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Filtros from "../admin/components/filters";
import { apiClient } from "@/src/api/core/HttpClient";
import { metricService } from "@/src/api/services/metric/metric.service";
import type { SummaryMetrics, RankingItem, ProgramaSummary, MetricFilters } from "@/src/api/services/metric/metric.service";
import {
  Users,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

interface FiltrosState {
  configuracionSeleccionada: number | null;
  semestreSeleccionado: string;
  periodoSeleccionado: string;
  programaSeleccionado: string;
  grupoSeleccionado: string;
  sedeSeleccionada: string;
}

interface DashboardDataState {
  resumenGenerales: SummaryMetrics["generales"];
  docentesRanking: RankingItem[];
  programas: ProgramaSummary[];
  estadisticasProgramas: ProgramaSummary[];
}

interface Programa {
  id: number;
  nombre: string;
}

const FiltersMemo = memo(Filtros);

export default function DirectorProgramaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Obtener programas del usuario
  const [programasDirector, setProgramasDirector] = useState<Programa[]>([]);
  const [programaSeleccionadoId, setProgramaSeleccionadoId] = useState<number | null>(null);

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
  const [dashboardData, setDashboardData] = useState<DashboardDataState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);

  // Verificar rol y obtener programas
  useEffect(() => {
    if (authLoading || !user) return;

    // Verificar si el usuario tiene el rol de Director de Programa
    const rolesApp = user.rolesApp || [];
    const isDirector = rolesApp.some((role: any) => role.name === "Director de Programa");

    if (!isDirector) {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive",
      });
      router.replace("/");
      return;
    }

    // Obtener programas del usuario
    const programs = user.programs || [];
    setProgramasDirector(programs);

    // Si hay solo un programa, seleccionarlo automáticamente
    if (programs.length === 1) {
      setProgramaSeleccionadoId(programs[0].id);
    }
  }, [user, authLoading, router, toast]);

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
          programa: filtros.programaSeleccionado,
          ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
          ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
          ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
          ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
        };

        // Obtener datos de los 3 endpoints
        const [summaryResponse, rankingResponse, programasResponse] = await Promise.all([
          metricService.getSummary(metricParams),
          metricService.getRanking(metricParams),
          metricService.getSummaryByPrograms(metricParams),
        ]);

        const resumenGenerales = summaryResponse.generales;
        const docentesRanking = rankingResponse.ranking || [];
        const programas = programasResponse.programas || [];
        const estadisticasProgramas: ProgramaSummary[] = programas;

        setDashboardData({
          resumenGenerales,
          docentesRanking,
          programas,
          estadisticasProgramas,
        });
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
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
      grupoSeleccionado: "",
      sedeSeleccionada: "",
      programaSeleccionado: "",
    });
  }, [filtros]);

  const handleBackup = async () => {
    try {
      setLoadingBackup(true);
      const response = await apiClient.downloadFile(
        "/backup",
        {},
        { showMessage: false }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
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

  const handleProgramaChange = (programaId: number) => {
    setProgramaSeleccionadoId(programaId);
    const programa = programasDirector.find((p) => p.id === programaId);
    setFiltros((prev) => ({
      ...prev,
      programaSeleccionado: programa?.nombre || "",
    }));
  };

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
      return "0.0";
    }
    return numValue.toFixed(1);
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const resumenGenerales = dashboardData?.resumenGenerales;
  const docentesRanking = dashboardData?.docentesRanking || [];

  const docentesOrdenados = [...docentesRanking].sort((a, b) => {
    const promedioA = a.adjusted || 0;
    const promedioB = b.adjusted || 0;
    return promedioB - promedioA;
  });

  const mejoresDocentes = docentesOrdenados.slice(0, 3);
  const peoresDocentes = [...docentesOrdenados].reverse().slice(0, 3);

  return (
    <>
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Director de Programa</h1>
          {programaSeleccionadoId && (
            <p className="text-sm text-gray-600 mt-1">
              {programasDirector.find((p) => p.id === programaSeleccionadoId)?.nombre}
            </p>
          )}
        </div>
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
        {/* Selector de Programa - Solo si hay múltiples programas */}
        {programasDirector.length > 1 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Selecciona un programa
            </label>
            <div className="flex flex-wrap gap-2">
              {programasDirector.map((programa) => (
                <Button
                  key={programa.id}
                  variant={
                    programaSeleccionadoId === programa.id ? "default" : "outline"
                  }
                  onClick={() => handleProgramaChange(programa.id)}
                >
                  {programa.nombre}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Componente de Filtros */}
        <Filtros
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
                Elige una configuración de evaluación para ver los datos
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
            {/* Stats Cards */}
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
                      <span>Evaluados</span>
                      <span className="font-medium text-gray-700">
                        {(resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)}
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
                    <div className="text-xs mt-1 text-right text-gray-600">
                      {formatNumber(
                        (((resumenGenerales?.total_estudiantes || 0) - (resumenGenerales?.total_estudiantes_pendientes || 0)) /
                          (resumenGenerales?.total_estudiantes || 1)) *
                          100
                      )}
                      % completado
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
                      <span>Evaluados</span>
                      <span className="font-medium text-gray-700">
                        {(resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)}
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
                    <div className="text-xs mt-1 text-right text-gray-600">
                      {formatNumber(
                        (((resumenGenerales?.total_docentes || 0) - (resumenGenerales?.total_docentes_pendientes || 0)) /
                          (resumenGenerales?.total_docentes || 1)) *
                          100
                      )}
                      % completado
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
                      <span>Completadas</span>
                      <span className="font-medium text-gray-700">
                        {resumenGenerales?.total_realizadas || 0}
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
                    <div className="text-xs mt-1 text-right text-gray-600">
                      {formatNumber(
                        ((resumenGenerales?.total_realizadas || 0) /
                          (resumenGenerales?.total_evaluaciones || 1)) *
                          100
                      )}
                      % completado
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking de Docentes */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 mb-10">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <GraduationCap className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Ranking de Docentes
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-base mt-1">
                      Top docentes por calificación promedio
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {docentesOrdenados.length > 0 ? (
                    docentesOrdenados.map((docente, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <div className="text-lg font-bold text-gray-400 w-8">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{docente.docente}</p>
                          <p className="text-xs text-gray-500">
                            {docente.realizados}/{docente.universo} evaluaciones
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-blue-600">{docente.adjusted?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos de docentes disponibles
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
