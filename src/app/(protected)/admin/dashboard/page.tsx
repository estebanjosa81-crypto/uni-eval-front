"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  LayoutDashboard, 
  Database, 
  Settings2, 
  Loader2, 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Settings
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { metricService } from "@/src/api";
import type { MetricFilters, RankingItem, SummaryMetrics, ProgramaSummary } from "@/src/api/services/metric/metric.service";
import Filtros from "@/src/app/(protected)/admin/components/filters";
import GraficaPrograma from "@/src/app/(protected)/admin/components/grafica-programa";
import AnalisisAspectos from "@/src/app/(protected)/admin/components/analisis-aspectos";
import MetricCards from "@/src/app/(protected)/admin/components/metric-cards";
import RankingDocentes from "@/src/app/(protected)/admin/components/ranking-docentes";
import { apiClient } from "@/src/api/core/apiClient";
import type { FiltrosState } from "../types";

// Memoizar el componente de Filtros para evitar re-renders innecesarios
const FiltersMemo = memo(Filtros);

interface DashboardDataState {
  resumenGenerales: SummaryMetrics['generales'];
  docentesRanking: RankingItem[];
  programas: ProgramaSummary[];
  estadisticasProgramas: ProgramaSummary[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loadingBackup, setLoadingBackup] = useState(false);

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
      const fileName = `backup_${new Date().toISOString().split('T')[0]}.sql`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Respaldo Exitoso",
        description: "La base de datos ha sido exportada correctamente.",
      });
    } catch (error) {
      console.error("Error al generar el backup:", error);
      toast({
        title: "Error de Respaldo",
        description: "No se pudo generar la copia de seguridad en este momento.",
        variant: "destructive",
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: "",
    periodoSeleccionado: "",
    programaSeleccionado: "",
    grupoSeleccionado: "",
    sedeSeleccionada: "",
  });

  const [dashboardData, setDashboardData] = useState<DashboardDataState | null>(null);
  const [loading, setLoading] = useState(false);

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

        // Parámetros sin programa, semestre, grupo para la gráfica de programas
        const metricParamsGrafica: MetricFilters = {
          cfg_t: filtros.configuracionSeleccionada,
          ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
          ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
        };

        const [summaryResponse, rankingResponse, programasResponse] = await Promise.all([
          metricService.getSummary(metricParams),
          metricService.getRanking(metricParams),
          metricService.getSummaryByPrograms(metricParamsGrafica),
        ]);

        setDashboardData({
          resumenGenerales: summaryResponse.generales,
          docentesRanking: rankingResponse.ranking || [],
          programas: programasResponse.programas || [],
          estadisticasProgramas: programasResponse.programas || [],
        });
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        toast({
          title: "Sincronización Fallida",
          description: error instanceof Error ? error.message : "Error al recuperar datos del servidor",
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

  const handleProgramaFilterChange = useCallback((programa: string) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      programaSeleccionado: programa,
      semestreSeleccionado: "",
      grupoSeleccionado: "",
    }));
  }, []);

  const metricFilters: MetricFilters = {
    cfg_t: filtros.configuracionSeleccionada || 0,
    ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
    ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
    ...(filtros.programaSeleccionado && { programa: filtros.programaSeleccionado }),
    ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
    ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
  };

  // Filtros específicos para la gráfica de programas (sin programa, semestre, grupo)
  const graficaProgramaFilters: MetricFilters = {
    cfg_t: filtros.configuracionSeleccionada || 0,
    ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
    ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Premium - Light Style */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Panel de Inteligencia</h1>
              <p className="text-xs font-medium text-muted-foreground">Monitoreo Institucional</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm px-4 h-9 shadow-sm"
              onClick={handleBackup}
              disabled={loadingBackup}
            >
              {loadingBackup ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Database className="h-3.5 w-3.5 mr-2 text-blue-600" />
              )}
              {loadingBackup ? "Exportando..." : "Backup Estructural"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-12">
        {/* Componente de Filtros estilizado */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative">
            <FiltersMemo
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              loading={loading}
            />
          </div>
        </div>

        {/* Contenido Dinámico */}
        {!filtros.configuracionSeleccionada ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-[3rem] p-16 shadow-inner text-center max-w-2xl mx-auto my-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
              <Settings2 className="h-12 w-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tight">Configuración Necesaria</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Para visualizar la arquitectura de datos, por favor seleccione un modelo de evaluación en el panel de filtros superior.
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50 animate-pulse"></div>
                Esperando Input
              </div>
            </div>
          </div>
        ) : (loading && !dashboardData) || (loading && dashboardData) ? (
          <div className="space-y-16 pb-20">
            {/* Skeletons para Métricas */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
                ))}
              </div>
            </section>

            {/* Skeletons para Gráfica de Programas */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-[500px] rounded-[2.5rem]" />
            </section>

            {/* Skeleton para Análisis de Aspectos */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-[500px] rounded-[2.5rem]" />
            </section>

            {/* Skeleton para Ranking */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-[600px] rounded-[2.5rem]" />
            </section>
          </div>
        ) : !dashboardData ? (
          <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-16 text-center max-w-xl mx-auto my-20">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
              <AlertCircle className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 italic">Sin Conexión con Datos</h2>
            <p className="text-sm font-medium text-slate-400">
              La consulta actual no ha retornado registros. Verifique los parámetros de filtrado seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-16 pb-20 animate-in fade-in duration-1000">
            {/* Métricas e Indicadores Clave */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-medium text-muted-foreground leading-none">Puntos de Control Estratégicos</h3>
              </div>
              <MetricCards data={dashboardData.resumenGenerales} />
            </section>

            {/* Visualizaciones de Programas y Aspectos */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-medium text-muted-foreground leading-none">Distribución por Programas</h3>
                </div>
                <GraficaPrograma
                  datos={dashboardData.estadisticasProgramas.length > 0 ? dashboardData.estadisticasProgramas : undefined}
                  filters={graficaProgramaFilters}
                  loading={loading}
                  onProgramaFilterChange={handleProgramaFilterChange}
                  programaSeleccionado={filtros.programaSeleccionado}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-medium text-muted-foreground leading-none">Análisis de Atributos Críticos</h3>
                </div>
                <AnalisisAspectos filters={metricFilters} loading={loading} />
              </div>
            </div>

            {/* Ranking Docente de Excelencia */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Clock className="h-4 w-4 text-slate-900" />
                <h3 className="text-xs font-medium text-muted-foreground leading-none">Liderazgo y Proyección Académica</h3>
              </div>
              <RankingDocentes docentes={dashboardData.docentesRanking} loading={loading} filtros={filtros} />
            </section>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}
