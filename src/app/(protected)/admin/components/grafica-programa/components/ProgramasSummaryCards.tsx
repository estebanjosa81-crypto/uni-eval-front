import React from "react";
import { GraduationCap } from "lucide-react";
import type { ProgramaSummary } from "@/src/api/services/metric/metric.service";

interface ProgramasSummaryCardsProps {
  estadisticas: ProgramaSummary[];
  onProgramaClick: (programa: string) => void;
}

export const ProgramasSummaryCards: React.FC<ProgramasSummaryCardsProps> = ({
  estadisticas,
  onProgramaClick,
}) => {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
        <h4 className="text-xs font-medium text-gray-400">
          Resumen Analítico por Programa
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
        {estadisticas.map((programa, index) => {
          const { metricas } = programa;
          const completadas = metricas.total_realizadas;
          const total = metricas.total_evaluaciones;
          const porcentajeCompletado =
            total > 0 ? Math.round((completadas / total) * 100) : 0;

          return (
            <div
              key={index}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                programa.selected
                  ? "bg-blue-50/60 border-blue-300 shadow-sm"
                  : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md hover:bg-slate-50/50"
              }`}
              onClick={() => onProgramaClick(programa.nombre)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    programa.selected
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                  } transition-colors`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors truncate">
                  {programa.nombre}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    {porcentajeCompletado}%
                  </p>
                  <p className="text-xs items-center flex gap-1 font-medium text-gray-400 mt-1">
                    {completadas} / {total} <span className="text-[8px] opacity-50">Eval</span>
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    porcentajeCompletado >= 80
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : porcentajeCompletado >= 60
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}
                >
                  {porcentajeCompletado >= 80
                    ? "Óptimo"
                    : porcentajeCompletado >= 60
                    ? "Medio"
                    : "Crítico"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
