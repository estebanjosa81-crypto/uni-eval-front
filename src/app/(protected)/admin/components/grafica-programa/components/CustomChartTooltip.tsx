import React from "react";
import { ChartTooltip } from "@/components/ui/chart";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
          {data?.programaCompleto || label}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Completadas</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data?.completadas}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-600">Pendientes</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data?.pendientes}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">
                {data?.total}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Progreso</span>
              <span className="font-semibold text-blue-600">
                {data?.porcentaje}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
