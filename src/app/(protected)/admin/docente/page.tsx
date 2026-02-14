"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Filtros from "../components/filters"
import DocentesList from "./components/DocentesList"
import DocentesCumplimientoBarChart from "./components/DocentesCumplimientoBarChart"
import { metricService } from "@/src/api/services/metric/metric.service"
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

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

  // Cargar docentes cuando cambien los filtros o la página
  useEffect(() => {
    cargarDocentes(1);
  }, [
    filtros.configuracionSeleccionada,
    filtros.sedeSeleccionada,
    filtros.periodoSeleccionado,
    filtros.programaSeleccionado,
    filtros.semestreSeleccionado,
    filtros.grupoSeleccionado,
  ]);

  useEffect(() => {
    if (!filtros.configuracionSeleccionada) return;
    const timeoutId = window.setTimeout(() => {
      cargarDocentes(1);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, filtros.configuracionSeleccionada]);

  const cargarDocentes = async (page: number = 1) => {
    if (!filtros.configuracionSeleccionada) {
      logger.debug('DocenteAdmin', 'Falta configuración seleccionada');
      return;
    }
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
      logger.debug('DocenteAdmin', 'Docentes cargados', {
        total: response.pagination.total,
        page: response.pagination.page,
      });
    } catch (error) {
      logger.error('DocenteAdmin', 'Error cargando docentes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
    setSearchTerm('');
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      configuracionSeleccionada: null,
      semestreSeleccionado: '',
      periodoSeleccionado: '',
      programaSeleccionado: '',
      grupoSeleccionado: '',
      sedeSeleccionada: '',
    });
    setSearchTerm('');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePageChange = (newPage: number) => {
    cargarDocentes(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Administración de Docentes</h1>
        {/* Aquí podrías agregar botones de acción si lo deseas */}
      </header>

      <main className="p-6">
        {/* Componente de Filtros */}
        <Filtros
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          loading={loading}
        />

        {/* Contenido */}
        {!filtros.configuracionSeleccionada ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Selecciona una configuración
              </h2>
              <p className="text-gray-600">
                Elige una configuración de evaluación para ver el listado de docentes
              </p>
            </div>
          </div>
        ) : (
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 mt-6">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3.934a3 3 0 01-2.868-4.06m17.868 0a9.003 9.003 0 01-5.909 3.042M15 21H9m6 0h6a3 3 0 01-2.868-4.06m-11.868 0a9.003 9.003 0 015.909-3.042m0 0A9 9 0 0127 12c0-4.978-4.029-9-9-9s-9 4.022-9 9" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Listado de Docentes
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-base mt-1">
                    Consulta y gestiona el desempeño docente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
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
        )}

        {/* Gráfica de Cumplimiento */}
        {filtros.configuracionSeleccionada && (
          <DocentesCumplimientoBarChart
            filters={{
              cfg_t: filtros.configuracionSeleccionada,
              sede: filtros.sedeSeleccionada || undefined,
              periodo: filtros.periodoSeleccionado || undefined,
              programa: filtros.programaSeleccionado || undefined,
              semestre: filtros.semestreSeleccionado || undefined,
            }}
          />
        )}
      </main>
    </>
  );
}
