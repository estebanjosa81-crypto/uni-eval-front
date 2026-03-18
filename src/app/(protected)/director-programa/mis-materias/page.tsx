'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { metricService } from '@/src/api/services/metric/metric.service';
import type { 
  DocenteMateriasMetrics, 
  MateriaCompletionMetrics,
  DocenteAspectosMetrics,
} from '@/src/api/services/metric/metric.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen } from 'lucide-react';
import { MateriaCard } from '../../docente/components/MateriaCard';
import Filtro from '../../docente/components/Filter';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Error al cargar datos';
}

export default function MisMateriasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [materiasData, setMateriasData] = useState<DocenteMateriasMetrics | null>(null);
  
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<MateriaCompletionMetrics | null>(null);
  const [aspectosData, setAspectosData] = useState<DocenteAspectosMetrics | null>(null);

  // Filtro y CFG_T dinámico
  const [filtro, setFiltro] = useState({ configuracionSeleccionada: null as number | null });
  const [cfgT, setCfgT] = useState<number>(1);
  const docente = user?.user_username;

  // Sincronizar cfgT cuando cambia la configuración seleccionada en el filtro
  useEffect(() => {
    if (filtro.configuracionSeleccionada) {
      setCfgT(filtro.configuracionSeleccionada);
    }
  }, [filtro.configuracionSeleccionada]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!docente || authLoading) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Cargando materias del docente:', docente);
        const materias = await metricService.getDocenteMaterias(docente, {
          cfg_t: cfgT
        });
        console.log('✅ Materias response:', materias);
        setMateriasData(materias);

      } catch (err) {
        const message = getErrorMessage(err);
        console.error('❌ Error al cargar datos:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [docente, authLoading, cfgT]);

  // Cargar detalles de materia seleccionada
  useEffect(() => {
    if (!selectedMateria || !docente) return;

    const loadMateriaDetails = async () => {
      try {
        const completion = await metricService.getMateriaCompletion(
          docente,
          selectedMateria,
          { cfg_t: cfgT }
        );
        setCompletionData(completion);

        const aspectos = await metricService.getDocenteAspectos({
          cfg_t: cfgT,
          docente: docente,
          codigo_materia: selectedMateria
        });
        setAspectosData(aspectos);

      } catch (err) {
        const message = getErrorMessage(err);
        console.error('Error al cargar detalles de materia:', message);
      }
    };

    loadMateriaDetails();
  }, [selectedMateria, docente, cfgT]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se encontraron datos del usuario</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Mis Materias
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.user_name}
          </p>
        </div>
      </div>

      {/* Filtro de Evaluación */}
      <Filtro
        filtro={filtro}
        onFiltroChange={setFiltro}
        onLimpiarFiltro={() => setFiltro({ configuracionSeleccionada: null })}
        loading={loading}
      />

      {/* Grid de materias */}
      {materiasData && materiasData.materias.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materiasData.materias.map((materia) => (
            <MateriaCard
              key={materia.codigo_materia}
              materia={materia}
              completion={
                selectedMateria === materia.codigo_materia ? completionData : null
              }
              docente={docente}
              cfgT={cfgT}
              onClick={() => setSelectedMateria(materia.codigo_materia)}
            />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se encontraron materias asignadas</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    </div>
  );
}
