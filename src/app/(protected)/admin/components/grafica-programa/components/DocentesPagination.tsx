import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  TrendingUp,
  TrendingDown,
  GraduationCap,
} from "lucide-react";

interface DocentesPaginationProps {
  page: number;
  total: number;
  pages: number;
  docentes: any[];
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export const DocentesPagination: React.FC<DocentesPaginationProps> = ({
  page,
  total,
  pages,
  docentes,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Mostrando {docentes.length} de {total} docentes
        </span>

        {/* Paginación */}
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={onPreviousPage}
            className="h-9 w-9 p-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="px-4 h-9 flex items-center bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Página {page} de {pages}
            </span>
          </div>

          <button
            disabled={page === pages}
            onClick={onNextPage}
            className="h-9 w-9 p-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/40 font-semibold px-3 py-1 rounded-xl">
          <Star className="h-3 w-3 mr-1.5" />
          {docentes.filter((d) => d.estado === "excelente").length} Excelente
        </Badge>
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/40 font-semibold px-3 py-1 rounded-xl">
          <TrendingUp className="h-3 w-3 mr-1.5" />
          {docentes.filter((d) => d.estado === "bueno").length} Bueno
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50/40 font-semibold px-3 py-1 rounded-xl">
          <TrendingDown className="h-3 w-3 mr-1.5" />
          {docentes.filter((d) => d.estado === "necesita_mejora").length} A mejorar
        </Badge>
      </div>
    </div>
  );
};
