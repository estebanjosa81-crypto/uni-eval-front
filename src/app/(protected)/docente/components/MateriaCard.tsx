'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users } from 'lucide-react';
import { CompletionStatusModal } from './CompletionStatusModal';
import { AspectosEvaluacionModal } from './AspectosEvaluacionModal';
import type { MateriaMetric } from '@/src/api/services/metric/metric.service';
import type { MateriaCompletionMetrics } from '@/src/api/services/metric/metric.service';

interface MateriaCardProps {
  materia: MateriaMetric;
  onClick?: () => void;
  isSelected?: boolean;
  completion?: MateriaCompletionMetrics | null;
  docente: string;
  cfgT: number;
}

export function MateriaCard({ 
  materia, 
  onClick, 
  isSelected,
  completion,
  docente,
  cfgT
}: MateriaCardProps) {
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isAspectosModalOpen, setIsAspectosModalOpen] = useState(false);
  const [pendingModalType, setPendingModalType] = useState<'aspectos' | 'completion' | null>(null);
  
  const hasMultipleGroups = materia.grupos && materia.grupos.length > 0;

  // Abre el modal apropiado cuando los datos están listos
  useEffect(() => {
    if (pendingModalType === 'aspectos') {
      setIsAspectosModalOpen(true);
      setPendingModalType(null);
    } else if (pendingModalType === 'completion' && completion) {
      setIsCompletionModalOpen(true);
      setPendingModalType(null);
    }
  }, [completion, pendingModalType]);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base">{materia.nombre_materia}</CardTitle>
            <CardDescription>{materia.nom_programa}</CardDescription>
            <CardDescription>{materia.semestre}</CardDescription>
            <CardDescription>Código: {materia.codigo_materia}</CardDescription>
          </div>
          {!hasMultipleGroups && materia.grupo && (
            <Badge variant="outline">{materia.grupo}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasMultipleGroups ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Grupos:</p>
            <div className="flex flex-wrap gap-2">
              {materia.grupos?.map((grupo) => (
                <Badge key={grupo.grupo} variant="secondary">
                  {grupo.grupo}: {grupo.total_realizadas}/{grupo.total_evaluaciones}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Evaluaciones:</span>
            <span className="font-medium">
              {materia.total_realizadas}/{materia.total_evaluaciones}
            </span>
          </div>
        )}
        
        <Progress 
          value={materia.porcentaje_cumplimiento} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{materia.porcentaje_cumplimiento}% completado</span>
          <span>{materia.total_pendientes} pendientes</span>
        </div>

        {materia.promedio_general !== null && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Promedio:</span>
              <span className="font-bold text-lg">{materia.promedio_general.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Botones de acceso a modales */}
        <div className="pt-3 border-t flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPendingModalType('aspectos');
              onClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Aspectos
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPendingModalType('completion');
              onClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
          >
            <Users className="h-4 w-4" />
            Estudiantes
          </button>
        </div>

        {/* Modales */}
        <AspectosEvaluacionModal
          isOpen={isAspectosModalOpen}
          onClose={() => setIsAspectosModalOpen(false)}
          docente={docente}
          cfgT={cfgT}
          codigoMateria={materia.codigo_materia}
          materiaNombre={materia.nombre_materia}
        />

        {completion && (
          <CompletionStatusModal
            isOpen={isCompletionModalOpen}
            onClose={() => setIsCompletionModalOpen(false)}
            completion={completion}
            materiaNombre={materia.nombre_materia}
          />
        )}
      </CardContent>
    </Card>
  );
}
