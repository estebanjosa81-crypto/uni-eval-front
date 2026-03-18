"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Filtros from "../components/filters";
import GraficaPrograma from "../../admin/components/grafica-programa";
import EstadisticasPrograma from "../../admin/components/analisis-aspectos";
import MetricCards from "../../admin/components/metric-cards";
import RankingDocentes from "../../admin/components/ranking-docentes";
import { apiClient } from "@/src/api/core/HttpClient";
import { metricService } from "@/src/api/services/metric/metric.service";
import type { SummaryMetrics, RankingItem, ProgramaSummary, MetricFilters } from "@/src/api/services/metric/metric.service";

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

export default function DirectorProgramaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Obtener programas del usuario
  const [programasDirector, setProgramasDirector] = useState<{ id: number; nombre: string }[]>([]);

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
      setFiltros((prev) => ({
        ...prev,
        programaSeleccionado: programs[0].nombre || "",
      }));
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

  const resumenGenerales = dashboardData?.resumenGenerales;
  const docentesRanking = dashboardData?.docentesRanking || [];
  const estadisticasProgramas = dashboardData?.estadisticasProgramas || [];

  const metricFilters: MetricFilters = {
    cfg_t: filtros.configuracionSeleccionada || 0,
    programa: filtros.programaSeleccionado,
    ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
    ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
    ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
    ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
  };

  return (
    <>
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Director de Programa</h1>
          {programasDirector.length === 1 && (
            <p className="text-sm text-gray-600 mt-1">
              {programasDirector[0]?.nombre}
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
        {/* Componente de Filtros */}
        <Filtros
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          loading={loading}
          programaFijoNombre={programasDirector.length === 1 ? programasDirector[0]?.nombre : undefined}
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
            {/* Métricas Generales */}
            <MetricCards data={resumenGenerales} />
            
            <GraficaPrograma
              datos={estadisticasProgramas}
              filters={metricFilters}
              loading={loading}
            />

            <EstadisticasPrograma
              filters={metricFilters}
              loading={loading}
            />

            <RankingDocentes docentes={docentesRanking} loading={loading} />

          </>
        )}
      </main>
    </>
  );
}
