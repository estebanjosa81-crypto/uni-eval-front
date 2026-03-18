import React, { useState } from "react";
import { InfoModal } from "@/components/modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, TrendingUp } from "lucide-react";
import { DocenteCard } from "./DocenteCard";
import { DocentesPagination } from "./DocentesPagination";
import MateriasModal from "@/src/app/(protected)/admin/components/MateriasModal";
import { calcularEstado } from "../utils/estadoHelper";
import { MetricFilters } from "@/src/api/services/metric/metric.service";
import type { DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service";

interface DialogDocentesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programa: string;
  tipo: "completadas" | "pendientes";
  docentes: DocenteGeneralMetrics[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onLoadMoreDocentes: (programa: string, tipo: "completadas" | "pendientes", page: number) => void;
  filters: MetricFilters;
}

export const DialogDocentes: React.FC<DialogDocentesProps> = ({
  open,
  onOpenChange,
  programa,
  tipo,
  docentes,
  isLoading,
  pagination,
  onLoadMoreDocentes,
  filters,
}) => {
  const [selectedDocente, setSelectedDocente] = useState<any>(null);
  const [showMateriasModal, setShowMateriasModal] = useState(false);

  const handleOpenMateriasModal = (docente: any) => {
    setSelectedDocente(docente);
    setShowMateriasModal(true);
    // Cerrar el Dialog después de un pequeño delay para que la animación sea suave
    setTimeout(() => {
      onOpenChange(false);
    }, 50);
  };

  const handleCloseMateriasModal = () => {
    setShowMateriasModal(false);
    setSelectedDocente(null);
    // Reabrir el Dialog después de un pequeño delay
    setTimeout(() => {
      onOpenChange(true);
    }, 50);
  };

  const enriquecerDocente = (docente: DocenteGeneralMetrics) => {
    return {
      ...docente,
      estado: calcularEstado(docente.promedio_general),
      avg: docente.promedio_general || 0,
      adjusted: docente.promedio_general || 0,
      realizados: docente.total_realizadas,
      universo: docente.total_evaluaciones,
      aspectos: [],
    };
  };

  const docentesEnriquecidos = docentes.map(enriquecerDocente);

  const modalFooter = !isLoading && docentesEnriquecidos && docentesEnriquecidos.length > 0 ? (
    <div className="w-full flex flex-col gap-6">
      <DocentesPagination
        page={pagination.page}
        total={pagination.total}
        pages={pagination.pages}
        docentes={docentesEnriquecidos}
        onPreviousPage={() =>
          onLoadMoreDocentes(programa, tipo, pagination.page - 1)
        }
        onNextPage={() =>
          onLoadMoreDocentes(programa, tipo, pagination.page + 1)
        }
      />

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4 bg-slate-50/70 px-4 py-2.5 rounded-2xl border border-slate-100">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs font-medium text-slate-400 leading-none mb-1">Cobertura del Programa</p>
            <p className="text-sm font-semibold text-slate-900">
              {docentesEnriquecidos.length} docentes visibles de {pagination.total}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="px-8 rounded-2xl h-12 font-medium text-sm text-slate-500 border-2 border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
        >
          Cerrar Panel
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <InfoModal
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Rendimiento de Docentes"
        description="Detalles de docentes por programa"
        icon={GraduationCap}
        variant="info"
        size="full"
        className="max-w-5xl"
        contentClassName="p-10 bg-slate-50/30 custom-scrollbar"
        footer={modalFooter}
      >
          <div className="mb-6 flex flex-wrap items-center gap-2 text-slate-400 font-medium text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Programa:</span>
            <Badge variant="outline" className="rounded-lg bg-indigo-50 border-indigo-100 text-indigo-600 font-medium text-xs px-2 py-0.5">
              {programa}
            </Badge>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>
              Segmento: {tipo === "completadas" ? "Completadas" : "Pendientes"}
            </span>
          </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
                </div>
                <p className="mt-6 text-slate-500 font-medium text-xs animate-pulse">
                  Cargando docentes...
                </p>
              </div>
            ) : docentesEnriquecidos && docentesEnriquecidos.length > 0 ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {docentesEnriquecidos.map((docente, index) => (
                  <DocenteCard
                    key={`${docente.docente}-${index}`}
                    docente={{
                      ...docente,
                      estado: docente.estado as any,
                    }}
                    filters={filters}
                    programa={programa}
                    onOpenMateriasModal={handleOpenMateriasModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="h-16 w-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center shadow-inner mb-4">
                  <GraduationCap className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-lg font-bold">Sin registros</p>
                <p className="font-medium text-sm mt-2">No se encontraron docentes evaluados en este programa</p>
              </div>
            )}
      </InfoModal>

      {/* Modales fuera del Dialog para que ocupen su tamaño completo */}
      {showMateriasModal && selectedDocente && (
        <MateriasModal
          docente={selectedDocente}
          filtros={{
            configuracionSeleccionada: filters.cfg_t,
            semestreSeleccionado: filters.semestre || '',
            periodoSeleccionado: filters.periodo || '',
            programaSeleccionado: programa,
            grupoSeleccionado: filters.grupo || '',
            sedeSeleccionada: filters.sede || '',
          }}
          onClose={handleCloseMateriasModal}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </>
  );
};
