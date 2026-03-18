import { ProgramaSummary } from "@/src/api/services/metric/metric.service";

export interface ChartDataItem {
  name: string;
  programaCompleto: string;
  completadas: number;
  pendientes: number;
  total: number;
  porcentaje: number;
  selected: boolean;
}

export const simplificarNombrePrograma = (nombre: string): string => {
  if (!nombre) return nombre;
  return nombre
    .replace(/TECNOLOGIA/gi, "TEC")
    .replace(/INGENIERIA/gi, "ING");
};

export const prepareChartData = (estadisticas: ProgramaSummary[]): ChartDataItem[] => {
  return estadisticas.map((item: ProgramaSummary) => {
    const { metricas } = item;
    const completadas = metricas.total_realizadas;
    const pendientes = metricas.total_pendientes;
    const total = metricas.total_evaluaciones;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
    const nombreSimplificado = simplificarNombrePrograma(item.nombre);

    return {
      name: nombreSimplificado,
      programaCompleto: item.nombre,
      completadas,
      pendientes,
      total,
      porcentaje,
      selected: item.selected ?? false,
    };
  });
};

export const calculateTotals = (estadisticas: ProgramaSummary[]) => {
  return estadisticas.reduce(
    (acc, item) => ({
      completadas: acc.completadas + item.metricas.total_realizadas,
      pendientes: acc.pendientes + item.metricas.total_pendientes,
      total: acc.total + item.metricas.total_evaluaciones,
    }),
    { completadas: 0, pendientes: 0, total: 0 }
  );
};
