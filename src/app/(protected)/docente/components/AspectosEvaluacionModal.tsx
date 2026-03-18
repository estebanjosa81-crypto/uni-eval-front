'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { metricService } from '@/src/api/services/metric/metric.service';
import type { DocenteAspectosMetrics } from '@/src/api/services/metric/metric.service';

interface AspectosEvaluacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  docente: string;
  cfgT: number;
  codigoMateria?: string; // Opcional: si se proporciona, filtra por materia específica
  materiaNombre?: string; // Solo para mostrar en la interfaz
}

export function AspectosEvaluacionModal({
  isOpen,
  onClose,
  title = 'Evaluación por Aspectos',
  description = 'Análisis detallado de cada aspecto evaluado',
  docente,
  cfgT,
  codigoMateria,
  materiaNombre,
}: AspectosEvaluacionModalProps) {
  const [aspectos, setAspectos] = useState<DocenteAspectosMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos cuando el modal se abre
  useEffect(() => {
    if (!isOpen || !docente) {
      setAspectos(null);
      setError(null);
      return;
    }

    const loadAspectos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await metricService.getDocenteAspectos({
          cfg_t: cfgT,
          docente: docente,
          codigo_materia: codigoMateria, // Será undefined si no se proporciona
        });
        
        setAspectos(data);
      } catch (err) {
        console.error('Error al cargar aspectos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadAspectos();
  }, [isOpen, docente, cfgT, codigoMateria]);


  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando datos...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!aspectos || !aspectos.aspectos || aspectos.aspectos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay evaluaciones registradas aún</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          {materiaNombre && (
            <p className="text-sm font-medium text-muted-foreground mt-2">
              Materia: {materiaNombre}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Aspectos individuales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Detalles por Aspecto</h3>
            {aspectos.aspectos.map((aspecto) => (
              <div key={aspecto.aspecto_id} className="space-y-2 pb-4 border-b last:border-b-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{aspecto.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suma: {aspecto.suma.toFixed(2)} • Respuestas: {aspecto.total_respuestas}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {((aspecto.suma / (aspecto.total_respuestas * 5)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress 
                  value={(aspecto.suma / (aspecto.total_respuestas * 5)) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>

          {/* Resumen estadístico */}
          <div className="pt-4 border-t space-y-4 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">Resumen Estadístico</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Promedio General</p>
                <p className="text-2xl font-bold">
                  {aspectos.promedio?.toFixed(2) ?? 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desviación Estándar</p>
                <p className="text-2xl font-bold">
                  {aspectos.desviacion?.toFixed(2) ?? 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Total de aspectos evaluados: {aspectos.aspectos.length}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
