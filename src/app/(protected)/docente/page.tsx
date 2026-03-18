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
  MateriaGrupoMetric
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

export default function DocentePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Datos del docente
  const [dashboardData, setDashboardData] = useState<DocenteGeneralMetrics | null>(null);
  const [materiasData, setMateriasData] = useState<DocenteMateriasMetrics | null>(null);
  
  // Materia seleccionada para ver detalles
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<MateriaCompletionMetrics | null>(null);
  const [aspectosData, setAspectosData] = useState<DocenteAspectosMetrics | null>(null);

  // CFG_T (deberías obtenerlo de un contexto o estado global)
  const [cfgT] = useState(1); // TODO: Obtener dinámicamente

  // Obtener documento del usuario autenticado
  const docente = user?.user_username;

  // Cargar datos iniciales
  useEffect(() => {
    if (!docente || authLoading) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar dashboard del docente
        const dashboard = await metricService.getDocentes({
          cfg_t: cfgT,
          docente: docente
        });

        if (dashboard.data && dashboard.data.length > 0) {
          setDashboardData(dashboard.data[0]);
        }

        // Cargar materias del docente
        const materias = await metricService.getDocenteMaterias(docente, {
          cfg_t: cfgT
        });
        setMateriasData(materias);

      } catch (err) {
        console.error('Error al cargar datos:', err);
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
        setAspectosData(aspectos);

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Evaluaciones"
          value={dashboardData.total_evaluaciones}
          icon={<BookOpen className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Realizadas"
          value={dashboardData.total_realizadas}
          icon={<CheckCircle className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="Pendientes"
          value={dashboardData.total_pendientes}
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          title="Cumplimiento"
          value={`${dashboardData.porcentaje_cumplimiento}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="info"
          showProgress
          progress={dashboardData.porcentaje_cumplimiento}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="materias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materias">Mis Materias</TabsTrigger>
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
        </TabsList>

        <TabsContent value="materias" className="space-y-4">
          {materiasData && materiasData.materias.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materiasData.materias.map((materia) => (
                <MateriaCard
                  key={materia.codigo_materia}
                  materia={materia}
                  onClick={() => setSelectedMateria(materia.codigo_materia)}
                  isSelected={selectedMateria === materia.codigo_materia}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No se encontraron materias asignadas</AlertDescription>
            </Alert>
          )}

          {/* Detalles de materia seleccionada */}
          {selectedMateria && completionData && aspectosData && (
            <MateriaDetails
              materia={materiasData?.materias.find(m => m.codigo_materia === selectedMateria)}
              completion={completionData}
              aspectos={aspectosData}
              onClose={() => setSelectedMateria(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="general">
          <GeneralStats data={dashboardData} />
        </TabsContent>
      </Tabs>
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

interface MateriaCardProps {
  materia: MateriaMetric;
  onClick: () => void;
  isSelected: boolean;
}

function MateriaCard({ materia, onClick, isSelected }: MateriaCardProps) {
  const hasMultipleGroups = materia.grupos && materia.grupos.length > 0;

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

function MateriaDetails({ materia, completion, aspectos, onClose }: MateriaDetailsProps) {
  if (!materia) return null;

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{materia.nombre_materia}</CardTitle>
            <CardDescription>Detalles de evaluación</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aspectos de evaluación */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evaluación por Aspectos
          </h3>
          {aspectos.evaluacion_estudiantes.aspectos.length > 0 ? (
            <div className="space-y-3">
              {aspectos.evaluacion_estudiantes.aspectos.map((aspecto) => (
                <div key={aspecto.aspecto_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{aspecto.nombre}</span>
                    <span className="text-sm text-muted-foreground">
                      {aspecto.suma.toFixed(2)} ({aspecto.total_respuestas} respuestas)
                    </span>
                  </div>
                  <Progress 
                    value={(aspecto.suma / (aspecto.total_respuestas * 2)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              
              <div className="pt-4 border-t mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Promedio General:</span>
                    <p className="text-xl font-bold">{aspectos.evaluacion_estudiantes.promedio_general?.toFixed(2) ?? 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Desviación:</span>
                    <p className="text-xl font-bold">{aspectos.evaluacion_estudiantes.desviacion?.toFixed(2) ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hay evaluaciones registradas aún</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Estado de completitud por grupo */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estado de Evaluaciones por Estudiante
          </h3>
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
                          <Badge key={est.id} variant="default" className="bg-green-100 text-green-800">
                            {est.nombre}
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
                          <Badge key={est.id} variant="secondary" className="bg-orange-100 text-orange-800">
                            {est.nombre}
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
        </div>
      </CardContent>
    </Card>
  );
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
