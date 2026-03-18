'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { MateriaMetric } from '@/src/api/services/metric/metric.service';

interface PendientesPorMateriaChartProps {
  materias: MateriaMetric[];
}

export function PendientesPorMateriaChart({ materias }: PendientesPorMateriaChartProps) {
  // Preparar datos para la gráfica: solo materias con pendientes
  const chartData = materias
    .map((materia) => ({
      nombre: materia.nombre_materia,
      codigo: materia.codigo_materia,
      pendientes: materia.total_pendientes,
      realizadas: materia.total_realizadas,
      total: materia.total_evaluaciones,
    }))
    .sort((a, b) => b.pendientes - a.pendientes); // Ordenar por pendientes descendente

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pendientes por Materia</CardTitle>
          <CardDescription>Distribución de evaluaciones pendientes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay evaluaciones registradas</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalPendientes = chartData.reduce((sum, item) => sum + item.pendientes, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendientes por Materia</CardTitle>
        <CardDescription>
          Total pendiente: <span className="font-bold text-orange-600">{totalPendientes}</span> evaluaciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="nombre"
                type="category"
                width={190}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
                formatter={(value) => value}
                labelFormatter={(label) => `Materia: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="pendientes"
                name="Pendientes"
                fill="#f97316"
                radius={[0, 8, 8, 0]}
              />
              <Bar
                dataKey="realizadas"
                name="Realizadas"
                fill="#22c55e"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla resumen debajo de la gráfica */}
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-sm">Resumen por Materia</h3>
          <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {chartData.map((item) => (
              <div key={item.codigo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{item.nombre}</span>
                  <span className="text-xs text-muted-foreground ml-2">({item.codigo})</span>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <span className="text-orange-600 font-semibold">{item.pendientes}</span>
                    <span className="text-xs text-muted-foreground ml-1">pendientes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
