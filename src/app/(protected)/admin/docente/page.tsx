"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Settings2, 
  Search, 
  BarChart3, 
  LayoutDashboard,
  Filter,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  TrendingUp
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { memo } from "react"
const FiltersMemo = memo(Filtros)
import Filtros from "../components/filters"
import DocentesList from "./components/DocentesList"
import DocentesCumplimientoBarChart from "./components/DocentesCumplimientoBarChart"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"
import type { FiltrosState } from "../types"

const logger = {
  debug: (module: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${module}] ${message}`, data ?? '')
    }
  },
  error: (module: string, message: string, error?: unknown) => {
    console.error(`[${module}] ${message}`, error ?? '')
  },
}

export default function DocenteAdminPage() {
  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: '',
    periodoSeleccionado: '',
    programaSeleccionado: '',
    grupoSeleccionado: '',
    sedeSeleccionada: '',
  });

  const [docentes, setDocentes] = useState<DocenteGeneralMetrics[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('promedio_general');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const cargarDocentes = useCallback(async (page: number = 1) => {
    if (!filtros.configuracionSeleccionada) return;
    try {
      setLoading(true);
      const response = await metricService.getDocentes({
        cfg_t: filtros.configuracionSeleccionada,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        sede: filtros.sedeSeleccionada || undefined,
        periodo: filtros.periodoSeleccionado || undefined,
        programa: filtros.programaSeleccionado || undefined,
        semestre: filtros.semestreSeleccionado || undefined,
        grupo: filtros.grupoSeleccionado || undefined,
        page,
        limit: 10,
      });
      setDocentes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      logger.error('DocenteAdmin', 'Error cargando docentes', error);
    } finally {
      setLoading(false);
    }
  }, [
    filtros.configuracionSeleccionada,
    filtros.sedeSeleccionada,
    filtros.periodoSeleccionado,
    filtros.programaSeleccionado,
    filtros.semestreSeleccionado,
    filtros.grupoSeleccionado,
    searchTerm,
    sortBy,
    sortOrder
  ]);

  // Cargar docentes cuando cambian los filtros (reset a página 1)
  useEffect(() => {
    if (!filtros.configuracionSeleccionada) return;

    const timeoutId = window.setTimeout(() => {
      cargarDocentes(1);
    }, searchTerm ? 400 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [filtros.configuracionSeleccionada, cargarDocentes]);

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
    setSearchTerm('');
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({
      configuracionSeleccionada: null,
      semestreSeleccionado: '',
      periodoSeleccionado: '',
      programaSeleccionado: '',
      grupoSeleccionado: '',
      sedeSeleccionada: '',
    });
    setSearchTerm('');
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    cargarDocentes(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cargarDocentes]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Premium */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión Docente</h1>
              <p className="text-xs font-medium text-muted-foreground">Analítica Institucional</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Badge variant="outline" className="px-3 py-1 bg-emerald-50/50 border-emerald-100 text-emerald-700 font-medium text-xs gap-1.5 rounded-xl">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sincronizado
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Sección de Filtros */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative">
            <FiltersMemo
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              loading={loading}
            />
          </div>
        </div>

        {/* Contenido Principal */}
        {!filtros.configuracionSeleccionada ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-[3rem] p-16 shadow-inner text-center max-w-2xl mx-auto my-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
              <Settings2 className="h-12 w-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Configuración Necesaria</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Para visualizar la arquitectura de datos docente, por favor seleccione un modelo de evaluación en el panel de filtros.
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500/50 animate-pulse"></div>
                Esperando Input
              </div>
            </div>
          </div>
        ) : loading && docentes.length === 0 ? (
          <div className="space-y-12 pb-20">
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-[600px] rounded-[2.5rem]" />
            </section>
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-[500px] rounded-[2.5rem]" />
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Listado de Docentes */}
            <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-md bg-white hover:shadow-xl transition-all duration-500 overflow-hidden">
              <CardHeader className="p-10 pb-6 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Cuadro de Mando Docente
                      </CardTitle>
                      <CardDescription className="text-slate-500 text-sm font-medium mt-0.5">
                        Monitorización institucional y gestión de calidad educativa
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <DocentesList
                  docentes={docentes}
                  pagination={pagination}
                  loading={loading}
                  filtros={filtros}
                  onPageChange={handlePageChange}
                  onSearch={handleSearch}
                  searchTerm={searchTerm}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-8">
              <Card className="rounded-[2.5rem] border-2 border-indigo-100 shadow-md bg-white hover:shadow-xl transition-all duration-500 overflow-hidden">
                <CardHeader className="p-10 pb-6 border-b border-indigo-50 bg-indigo-50/30">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-indigo-200 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Mapa de Cumplimiento Estratégico</CardTitle>
                      <CardDescription className="text-slate-500 text-sm font-medium">Analítica avanzada de participación y calidad académica</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <DocentesCumplimientoBarChart
                    filters={{
                      cfg_t: filtros.configuracionSeleccionada,
                      sede: filtros.sedeSeleccionada || undefined,
                      periodo: filtros.periodoSeleccionado || undefined,
                      programa: filtros.programaSeleccionado || undefined,
                      semestre: filtros.semestreSeleccionado || undefined,
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
