'use client';

import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { MateriaCompletionMetrics } from '@/src/api/services/metric/metric.service';

interface CompletionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  completion: MateriaCompletionMetrics | null;
  materiaNombre?: string;
}

export function CompletionStatusModal({
  isOpen,
  onClose,
  title = 'Estado de Evaluaciones por Estudiante',
  description = 'Lista de estudiantes que han completado o están pendientes',
  completion,
  materiaNombre,
}: CompletionStatusModalProps) {
  if (!completion || !completion.grupos || completion.grupos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay datos de evaluación disponibles</AlertDescription>
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
            <Users className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          {materiaNombre && (
            <p className="text-sm font-medium text-muted-foreground mt-2">
              Materia: {materiaNombre}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {completion.grupos.map((grupo) => (
            <Card key={grupo.grupo}>
              <CardHeader>
                <CardTitle className="text-base">Grupo {grupo.grupo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Completados */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">
                      Completados ({grupo.completados.length})
                    </span>
                  </div>
                  {grupo.completados.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {grupo.completados.map((est) => (
                        <Badge 
                          key={est.id} 
                          variant="default" 
                          className="bg-green-100 text-green-800"
                        >
                          {est.id} - {est.nombre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ninguno</p>
                  )}
                </div>

                {/* Pendientes */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">
                      Pendientes ({grupo.pendientes.length})
                    </span>
                  </div>
                  {grupo.pendientes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {grupo.pendientes.map((est) => (
                        <Badge 
                          key={est.id} 
                          variant="secondary" 
                          className="bg-orange-100 text-orange-800"
                        >
                          {est.id} - {est.nombre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ninguno</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
