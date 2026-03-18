'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DocenteAspectosMetrics } from '@/src/api/services/metric/metric.service';

interface AspectosEvaluacionChartProps {
  aspectos: DocenteAspectosMetrics | null;
}

export function AspectosEvaluacionChart({ aspectos }: AspectosEvaluacionChartProps) {
  if (!aspectos || !aspectos.aspectos || aspectos.aspectos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluación por Aspectos</CardTitle>
          <CardDescription>Desempeño en cada dimensión evaluada</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay evaluaciones registradas aún</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para la gráfica
  // Escala de evaluación: 0-5
  const chartData = aspectos.aspectos.map((aspecto) => ({
    nombre: aspecto.nombre,
    aspecto_id: aspecto.aspecto_id,
    porcentaje: (aspecto.suma / (aspecto.total_respuestas * 5)) * 100,
    suma: aspecto.suma,
    total_respuestas: aspecto.total_respuestas,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluación por Aspectos</CardTitle>
        <CardDescription>
          Promedio General: <span className="font-bold text-blue-600">{aspectos.promedio?.toFixed(2) ?? 'N/A'}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfica de barras */}
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nombre"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  formatter={(value) => `${(value as number).toFixed(1)}%`}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar
                  dataKey="porcentaje"
                  name="Calificación"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de detalles */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">Detalles por Aspecto</h3>
            <div className="space-y-2">
              {chartData.map((item) => (
                <div
                  key={item.aspecto_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.total_respuestas} respuesta{item.total_respuestas !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{item.porcentaje.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {item.suma.toFixed(2)}/{(item.total_respuestas * 5).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen estadístico */}
          <div className="pt-4 border-t space-y-3 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">Resumen Estadístico</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {aspectos.promedio?.toFixed(2) ?? 'N/A'}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desviación</p>
                <p className="text-2xl font-bold">
                  {aspectos.desviacion?.toFixed(2) ?? 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aspectos</p>
                <p className="text-2xl font-bold">{aspectos.aspectos.length}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
