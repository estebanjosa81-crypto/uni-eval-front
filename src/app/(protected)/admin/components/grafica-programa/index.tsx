"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { ChartSection } from "./components/ChartSection";
import { ProgramasSummaryCards } from "./components/ProgramasSummaryCards";
import { DialogDocentes } from "./components/DialogDocentes";
import {
  prepareChartData,
  calculateTotals,
} from "./utils/chartDataHelper";
import {
  ProgramaSummary,
  DocenteGeneralMetrics,
  metricService,
  MetricFilters,
} from "@/src/api/services/metric/metric.service";

interface GraficaProgramaProps {
  datos?: ProgramaSummary[];
  filters: MetricFilters;
  loading?: boolean;
  onProgramaFilterChange?: (programa: string) => void;
  programaSeleccionado?: string;
}

interface DialogState {
  programa: string;
  tipo: "completadas" | "pendientes";
  docentes: DocenteGeneralMetrics[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function GraficaPrograma({
  datos,
  filters,
  loading = false,
  onProgramaFilterChange,
  programaSeleccionado,
}: GraficaProgramaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dialogData, setDialogData] = useState<DialogState>({
    programa: "",
    tipo: "completadas",
    docentes: [],
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    },
  });

  const estadisticas: ProgramaSummary[] =
    datos && datos.length > 0 ? datos : [];

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    return prepareChartData(estadisticas);
  }, [estadisticas]);

  const hasSelected = useMemo(
    () => estadisticas.some((item) => item.selected),
    [estadisticas]
  );

  // Calcular totales
  const totales = useMemo(() => {
    return calculateTotals(estadisticas);
  }, [estadisticas]);

  // Handler para clic en barras
  const handleBarClick = async (
    programa: string,
    tipo: "completadas" | "pendientes",
    page: number = 1
  ) => {
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setDialogData((prev) => ({
      ...prev,
      programa,
      tipo,
      loading: true,
      pagination: { ...prev.pagination, page },
    }));
    setDialogOpen(true);

    try {
      const response = await metricService.getDocentes({
        ...filters,
        programa,
        page,
        limit: 10,
        sortBy: "promedio_general",
        sortOrder: "desc",
      });

      setDialogData((prev) => ({
        ...prev,
        docentes: response.data,
        loading: false,
        pagination: response.pagination,
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

  if (loading) {
    return (
      <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl bg-blue-100/50" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Skeleton className="h-[400px] w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-[2.5rem] border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                  Estadísticas por Programa
                </CardTitle>
                <CardDescription className="text-slate-500 text-sm font-medium mt-0.5">
                  {estadisticas.length > 0
                    ? "Detalle operativo de cumplimiento por facultad"
                    : "Seleccione una configuración para visualizar métricas"}
                </CardDescription>
              </div>
            </div>

            {/* Resumen rápido */}
            {estadisticas.length > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1 bg-slate-50/50 border-slate-200 text-slate-600 font-bold gap-1.5 rounded-xl">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {totales.completadas} Realizadas
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-slate-50/50 border-slate-200 text-slate-500 font-bold gap-1.5 rounded-xl">
                  <Clock className="h-3.5 w-3.5" />
                  {totales.pendientes} En Espera
                </Badge>
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
              <ChartSection
                chartData={chartData}
                hasSelected={hasSelected}
                onBarClick={handleBarClick}
                onProgramaClick={onProgramaFilterChange}
                programaSeleccionado={programaSeleccionado}
              />

              {/* Botón Toggle para Resumen Analítico */}
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSummary(!showSummary)}
                  className="gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-all"
                >
                  <span>Resumen Analítico por Programa</span>
                  {showSummary ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Resumen - Mostrar/Ocultar */}
              {showSummary && (
                <ProgramasSummaryCards
                  estadisticas={estadisticas}
                  onProgramaClick={(programa) =>
                    handleBarClick(programa, "completadas")
                  }
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de detalle de docentes */}
      <DialogDocentes
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programa={dialogData.programa}
        tipo={dialogData.tipo}
        docentes={dialogData.docentes}
        isLoading={dialogData.loading}
        pagination={dialogData.pagination}
        onLoadMoreDocentes={handleBarClick}
        filters={filters}
      />
    </>
  );
}
