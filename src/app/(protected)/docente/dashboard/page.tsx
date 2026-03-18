'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { metricService } from '@/src/api/services/metric/metric.service';
import type { 
  DocenteGeneralMetrics, 
  DocenteMateriasMetrics, 
  MateriaCompletionMetrics,
  DocenteAspectosMetrics,
  MateriaMetric,
} from '@/src/api/services/metric/metric.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  BookOpen, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { MateriaCard } from '../components/MateriaCard';
import { DocenteKPIIndicators } from '../components/DocenteKPIIndicators';
import { PendientesPorMateriaChart } from '../components/PendientesPorMateriaChart';
import { AspectosEvaluacionChart } from '../components/AspectosEvaluacionChart';
import Filtro from '../components/Filter';

export default function DocenteDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Datos del docente
  const [dashboardData, setDashboardData] = useState<DocenteGeneralMetrics | null>(null);
  const [materiasData, setMateriasData] = useState<DocenteMateriasMetrics | null>(null);
  const [aspectosData, setAspectosData] = useState<DocenteAspectosMetrics | null>(null);
  
  // Materia seleccionada para ver detalles
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<MateriaCompletionMetrics | null>(null);
  const [selectedMateriaAspectosData, setSelectedMateriaAspectosData] = useState<DocenteAspectosMetrics | null>(null);

  // Filtro y CFG_T dinámico
  const [filtro, setFiltro] = useState({ configuracionSeleccionada: null as number | null });
  const [cfgT, setCfgT] = useState<number>(1);

  // Obtener documento del usuario autenticado
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

        // Cargar dashboard del docente
        console.log('🔍 Cargando dashboard del docente:', { cfg_t: cfgT, docente });
        const dashboard = await metricService.getDocentes({
          cfg_t: cfgT,
          docente: docente
        });
        console.log('✅ Dashboard response:', dashboard);

        // La respuesta puede venir directamente como objeto o en un array data
        let dashboardMetrics: DocenteGeneralMetrics | null = null;
        
        if (dashboard.data && Array.isArray(dashboard.data) && dashboard.data.length > 0) {
          // Si viene como array en data (formato estándar DocenteListResponse)
          dashboardMetrics = dashboard.data[0];
        } else if ('docente' in dashboard && typeof (dashboard as any).docente === 'string') {
          // Si viene directamente como objeto DocenteGeneralMetrics
          dashboardMetrics = dashboard as unknown as DocenteGeneralMetrics;
        }

        if (dashboardMetrics && dashboardMetrics.docente) {
          console.log('✅ Seteando dashboard data:', dashboardMetrics);
          setDashboardData(dashboardMetrics);
        } else {
          console.warn('⚠️ Dashboard sin datos válidos:', dashboard);
        }

        // Cargar materias del docente
        console.log('🔍 Cargando materias del docente...');
        const materias = await metricService.getDocenteMaterias(docente, {
          cfg_t: cfgT
        });
        console.log('✅ Materias response:', materias);
        setMateriasData(materias);

        // Cargar aspectos del docente (sin codigo_materia para obtener todos)
        console.log('🔍 Cargando aspectos del docente...');
        const aspectos = await metricService.getDocenteAspectos({
          cfg_t: cfgT,
          docente: docente
        });
        console.log('✅ Aspectos response:', aspectos);
        setAspectosData(aspectos);

      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
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
        // Cargar completitud de estudiantes
        const completion = await metricService.getMateriaCompletion(
          docente,
          selectedMateria,
          { cfg_t: cfgT }
        );
        setCompletionData(completion);

        // Cargar aspectos de evaluación
        const aspectos = await metricService.getDocenteAspectos({
          cfg_t: cfgT,
          docente: docente,
          codigo_materia: selectedMateria
        });
        setSelectedMateriaAspectosData(aspectos);

      } catch (err) {
        console.error('Error al cargar detalles de materia:', err);
      }
    };

    loadMateriaDetails();
  }, [selectedMateria, docente, cfgT]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData || !user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se encontraron datos del docente</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {user.user_name}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <User className="mr-2 h-4 w-4" />
          Docente
        </Badge>
      </div>

      {/* Filtro de Evaluación */}
      <Filtro
        filtro={filtro}
        onFiltroChange={setFiltro}
        onLimpiarFiltro={() => setFiltro({ configuracionSeleccionada: null })}
        loading={loading}
      />

      {/* Stats Cards */}
      <DocenteKPIIndicators
        totalEvaluaciones={dashboardData.total_evaluaciones}
        totalRealizadas={dashboardData.total_realizadas}
        totalPendientes={dashboardData.total_pendientes}
        porcentajeCumplimiento={dashboardData.porcentaje_cumplimiento}
      />

      {/* Gráfica Principal: Pendientes por Materia */}
      {materiasData && materiasData.materias.length > 0 && (
        <PendientesPorMateriaChart materias={materiasData.materias} />
      )}

      {/* Gráfica de Aspectos de Evaluación */}
      {aspectosData && (
        <AspectosEvaluacionChart aspectos={aspectosData} />
      )}
    </div>
  );
}

// ==================== COMPONENTES ====================

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'warning' | 'info';
  showProgress?: boolean;
  progress?: number;
}

function StatCard({ title, value, icon, variant, showProgress, progress }: StatCardProps) {
  const variantStyles = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {showProgress && typeof progress === 'number' && (
          <Progress value={progress} className="mt-2" />
        )}
      </CardContent>
    </Card>
  );
}

interface MateriaDetailsProps {
  materia?: MateriaMetric;
  completion: MateriaCompletionMetrics;
  aspectos: DocenteAspectosMetrics;
  onClose: () => void;
}

function MateriaDetails(): null {
  return null;
}

function GeneralStats({ data }: { data: DocenteGeneralMetrics }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Docente:</span>
              <span className="font-medium">{data.nombre_docente}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documento:</span>
              <span className="font-medium">{data.docente}</span>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Evaluaciones:</span>
              <span className="font-bold">{data.total_evaluaciones}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Realizadas:</span>
              <span className="font-bold text-green-600">{data.total_realizadas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendientes:</span>
              <span className="font-bold text-orange-600">{data.total_pendientes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métricas de Evaluación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Promedio General:</span>
              <span className="font-bold text-xl">
                {data.promedio_general?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desviación:</span>
              <span className="font-bold text-xl">
                {data.desviacion_general?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estudiantes Registrados:</span>
              <span className="font-bold">{data.total_estudiantes_registrados ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aspectos Evaluados:</span>
              <span className="font-bold">{data.total_aspectos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">% Cumplimiento:</span>
              <span className="font-bold">{data.porcentaje_cumplimiento}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
