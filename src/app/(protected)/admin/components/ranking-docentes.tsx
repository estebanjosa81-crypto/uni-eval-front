"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { RankingItem, DocenteGeneralMetrics } from "@/src/api/services/metric/metric.service";
import MateriasModal from "./MateriasModal";
import type { FiltrosState } from "../types";

interface RankingDocentesProps {
  docentes: RankingItem[];
  loading?: boolean;
  filtros: FiltrosState;
}

const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return "0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (!isFinite(numValue)) return "0.00";
  return numValue.toFixed(2);
};

export default function RankingDocentes({ docentes, loading, filtros }: RankingDocentesProps) {
  const [selectedDocente, setSelectedDocente] = useState<DocenteGeneralMetrics | null>(null);
  const [showMateriasModal, setShowMateriasModal] = useState(false);

  const docentesOrdenados = [...docentes].sort((a, b) => {
    const scoreA = a.adjusted || 0;
    const scoreB = b.adjusted || 0;
    return scoreB - scoreA;
  });

  const handleDocenteClick = (docente: RankingItem) => {
    // Transformar RankingItem a DocenteGeneralMetrics
    const docenteMetrics: DocenteGeneralMetrics = {
      docente: docente.docente,
      nombre_docente: docente.nombre_docente,
      promedio_general: docente.avg || null,
      desviacion_general: null,
      total_evaluaciones: docente.universo || 0,
      total_realizadas: docente.realizados || 0,
      total_pendientes: (docente.universo || 0) - (docente.realizados || 0),
      total_aspectos: 0,
      porcentaje_cumplimiento: docente.universo > 0 ? (docente.realizados / docente.universo) * 100 : 0,
      suma: 0,
    };
    setSelectedDocente(docenteMetrics);
    setShowMateriasModal(true);
  };

  const top3Mejores = docentesOrdenados.slice(0, 3);
  const top3Peores = docentesOrdenados
    .slice()
    .reverse()
    .slice(0, 3)
    .reverse();

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-[1fr_380px] gap-8">
            <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm">
                <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                  <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm">
                <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
              <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm">
                <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-semibold text-gray-900 tracking-tight">
          Ranking de Docentes
        </h1>
        <p className="text-gray-600 text-base mt-2">
          Puntaje ajustado por desempeño y participación
        </p>
      </div>

      {/* Main Grid: 65% | 35% */}
      <div className="grid grid-cols-[1fr_450px] gap-8">
        {/* Left: Ranking Table */}
        <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Ranking General
              </CardTitle>
              <Badge className="bg-slate-100 text-slate-700 border-none font-medium text-base">
                {docentes.length} docentes
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {docentesOrdenados.length === 0 ? (
              <div className="flex items-center justify-center py-16 px-6">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">
                    No hay datos de docentes disponibles
                  </p>
                  <p className="text-gray-400 text-xs">
                    El ranking se actualizará cuando haya evaluaciones
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ height: 'calc(100vh - 320px)' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 w-12 text-base">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700 text-base">
                        Docente
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700 w-24 text-base">
                        Puntaje
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700 w-28 text-base">
                        Participación
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700 w-32 text-base">
                        Rendimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docentesOrdenados.map((docente, index) => {
                      const score = docente.adjusted || 0;
                      const participationPercent = Math.round(
                        ((docente.realizados || 0) / (docente.universo || 1)) * 100
                      );
                      const isTop1 = index === 0;

                      return (
                        <tr
                          key={`ranking-${docente.docente || index}`}
                          className={`transition-colors ${
                            isTop1
                              ? "bg-indigo-50/30 hover:bg-indigo-50/50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 w-6 text-right">
                                {index + 1}
                              </span>
                              {isTop1 && (
                                <Badge className="bg-indigo-600 text-white border-none text-sm font-medium">
                                  Top
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <button
                                onClick={() => handleDocenteClick(docente)}
                                className="font-medium text-gray-900 text-base hover:text-indigo-600 transition-colors text-left cursor-pointer underline decoration-transparent hover:decoration-indigo-600"
                              >
                                {docente.nombre_docente}
                              </button>
                              <p className="text-sm text-gray-500">
                                ID: {docente.docente}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-gray-900 text-base">
                              {formatNumber(score)}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">/ 5.00</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900 text-base">
                                {docente.realizados}/{docente.universo}
                              </p>
                              <p className="text-sm text-gray-500">
                                {participationPercent}%
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                                  style={{ width: `${(score / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 font-medium w-8 text-right">
                                {Math.round((score / 5) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Top 3 Panels */}
        <div className="space-y-6">
          {/* Top 3 Mejores */}
          <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Top 3 Mejores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {top3Mejores.length === 0 ? (
                <div className="flex items-center justify-center py-8 px-6">
                  <p className="text-gray-500 text-sm text-center">
                    Sin datos disponibles
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {top3Mejores.map((docente, index) => {
                    const score = docente.adjusted || 0;
                    const participationPercent = Math.round(
                      ((docente.realizados || 0) / (docente.universo || 1)) * 100
                    );

                    return (
                      <div key={`top3-best-${index}`} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleDocenteClick(docente)}
                                className="font-medium text-gray-900 text-base truncate text-left cursor-pointer underline decoration-transparent hover:decoration-indigo-600 hover:text-indigo-600 transition-colors"
                              >
                                {docente.nombre_docente}
                              </button>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {docente.realizados}/{docente.universo} evals
                              </p>
                            </div>
                            <span className="font-semibold text-gray-900 text-base whitespace-nowrap">
                              {formatNumber(score)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-10 text-right">
                              {participationPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 3 Peores */}
          <Card className="border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 px-6 py-4 bg-slate-50">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Últimos 3
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {top3Peores.length === 0 ? (
                <div className="flex items-center justify-center py-8 px-6">
                  <p className="text-gray-500 text-sm text-center">
                    Sin datos disponibles
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {top3Peores.map((docente, index) => {
                    const score = docente.adjusted || 0;
                    const participationPercent = Math.round(
                      ((docente.realizados || 0) / (docente.universo || 1)) * 100
                    );

                    return (
                      <div key={`top3-worst-${index}`} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleDocenteClick(docente)}
                                className="font-medium text-gray-900 text-base truncate text-left cursor-pointer underline decoration-transparent hover:decoration-indigo-600 hover:text-indigo-600 transition-colors"
                              >
                                {docente.nombre_docente}
                              </button>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {docente.realizados}/{docente.universo} evals
                              </p>
                            </div>
                            <span className="font-semibold text-gray-900 text-base whitespace-nowrap">
                              {formatNumber(score)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-10 text-right">
                              {participationPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>

      {/* Modal de Materias */}
      {showMateriasModal && selectedDocente && (
        <MateriasModal
          docente={selectedDocente}
          filtros={filtros}
          onClose={() => {
            setShowMateriasModal(false);
            setSelectedDocente(null);
          }}
        />
      )}
    </div>
  );
}
