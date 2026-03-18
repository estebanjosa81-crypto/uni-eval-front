import React from "react";
import { Badge } from "@/components/ui/badge";
import { Book, Users } from "lucide-react";
import {
  getEstadoInfo,
  getPromedioColor,
} from "../utils/estadoHelper";
import type { DocenteGeneralMetrics, MetricFilters } from "@/src/api/services/metric/metric.service";

export interface DocenteConMetricas extends DocenteGeneralMetrics {
  avg?: number;
  adjusted?: number;
  realizados?: number;
  universo?: number;
  aspectos?: any[];
  estado?: "excelente" | "bueno" | "regular" | "necesita_mejora" | "sin_evaluar";
}

interface DocenteCardProps {
  docente: DocenteConMetricas;
  filters: MetricFilters;
  programa: string;
  onOpenMateriasModal: (docente: DocenteConMetricas) => void;
}

export const DocenteCard: React.FC<DocenteCardProps> = ({
  docente,
  filters,
  programa,
  onOpenMateriasModal,
}) => {
  const estadoInfo = getEstadoInfo(docente.estado || "sin_evaluar");
  const promedio = docente.promedio_general || docente.avg || docente.adjusted || 0;
  const realizados = docente.total_realizadas;
  const esperados = docente.total_evaluaciones;
  const porcentaje = esperados > 0 ? Math.round((realizados / esperados) * 100) : 0;
  const IconComponent = estadoInfo.icon;

  return (
    <div
      className={`p-6 rounded-[2rem] border-2 border-slate-100 transition-all duration-300 hover:shadow-xl hover:border-indigo-100 bg-gradient-to-r ${estadoInfo.bgGradient} group`}
    >
      {/* Información general del docente */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${estadoInfo.color} border rounded-xl font-medium text-xs px-3 py-1`}>
              <IconComponent className="h-4 w-4" />
              <span className="ml-1.5">{estadoInfo.label}</span>
            </Badge>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight group-hover:text-indigo-600 transition-colors">
            {docente.nombre_docente || docente.docente}
          </h3>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {realizados}/{esperados} evaluaciones
            </span>
            <span className="font-medium text-slate-700">{porcentaje}% completado</span>
          </div>
        </div>

        {/* Promedio */}
        <div className="text-right">
          <p className={`text-4xl font-bold tracking-tight ${getPromedioColor(promedio)}`}>
            {promedio.toFixed(2)}
          </p>
          <p className="text-xs font-medium text-slate-400">/5.0</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-5">
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div
            className={`h-full transition-all ${
              promedio >= 4.0
                ? "bg-green-500"
                : promedio >= 3.5
                ? "bg-blue-500"
                : promedio >= 3.0
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${(promedio / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={() => onOpenMateriasModal(docente)}
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-[1rem] border border-indigo-100 transition-all"
        >
          <Book className="h-4 w-4" />
          Ver Materias
        </button>
      </div>
    </div>
  );
};
