"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authService, configuracionEvaluacionService, evalService } from "@/src/api"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import type { ConfiguracionTipo, EvalByUserItem, EvalGeneradaItem, UserProfile } from "@/src/api";
import { FileText, AlertCircle } from "lucide-react"
import { ModalEvaluacionesCreadas } from "../components/ModalEvaluacionesCreadas"
import { Header } from "../components/Header"
import EvaluacionCard from "../components/CfgEvaluacionCard"
import Image from "next/image"

export default function EstudianteBienvenida() {
  const router = useRouter()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<UserProfile | null>(null)
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [modalEvaluacionesOpen, setModalEvaluacionesOpen] = useState(false)
  const [evaluacionesCreadas, setEvaluacionesCreadas] = useState<EvalGeneradaItem[]>([]);
  const [evaluacionesPorConfiguracion, setEvaluacionesPorConfiguracion] = useState<Record<number, EvalByUserItem[]>>({})
  const [isCreatingEvaluaciones, setIsCreatingEvaluaciones] = useState(false)

  // Actualizar el tiempo cada minuto para mantener el contador actualizado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        
        // Verificar token primero
        const token = authService.getToken();
        if (!token) {
          setProfileError("No hay sesión activa");
          toast({
            title: "Sesión no encontrada",
            description: "Por favor, inicia sesión nuevamente",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        const response = await authService.getProfile();
        
        if (response.success && response.data) {
          setPerfil(response.data as UserProfile);
          setProfileError(null);
        } else {
          setProfileError("Perfil inválido");
          toast({
            title: "Perfil inválido",
            description: "No se pudo validar el perfil del usuario",
            variant: "destructive",
          });
          setTimeout(() => {
            authService.logout();
            window.location.href = '/login';
          }, 2000);
        }
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        
        // Mostrar mensaje específico del error
        const errorMessage = error?.message || "No se pudo cargar el perfil del estudiante";
        setProfileError(errorMessage);
        
        toast({
          title: "Error al cargar perfil",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Si es error de autenticación, redirigir al login
        if (error?.status === 401 || error?.error === 'UNAUTHENTICATED') {
          setTimeout(() => {
            authService.logout();
            window.location.href = '/login';
          }, 2000);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    cargarPerfil();
  }, [toast])

  useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setLoading(true)
        const configResponse = await configuracionEvaluacionService.getAllByRole()
        const responseData = configResponse?.data as
          | ConfiguracionTipo[]
          | { data?: ConfiguracionTipo[] }
          | undefined

        const configuracionesData = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data)
            ? responseData.data
            : []

        // Filtrar solo configuraciones activas
        const configuracionesActivas = configuracionesData.filter((config: ConfiguracionTipo) => config.es_activo)
        setConfiguraciones(configuracionesActivas)
      } catch (error) {
        console.error("Error al cargar configuraciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las evaluaciones disponibles",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    cargarConfiguraciones()
  }, [toast])

  useEffect(() => {
    const cargarEvaluacionesPorConfiguracion = async () => {
      if (configuraciones.length === 0) return;

      try {
        const responses = await Promise.all(
          configuraciones.map((config) => configuracionEvaluacionService.getEvaluacionesByCfgT(config.id))
        );

        const evaluacionesMap = configuraciones.reduce<Record<number, EvalByUserItem[]>>(
          (acc, config, index) => {
            const response = responses[index];
            acc[config.id] = response?.data || [];
            return acc;
          },
          {}
        );

        setEvaluacionesPorConfiguracion(evaluacionesMap);
      } catch (error) {
        console.error('Error al cargar evaluaciones por configuración:', error);
      }
    };

    cargarEvaluacionesPorConfiguracion();
  }, [configuraciones])

  const handleLogout = () => {
    // Limpiar datos locales si es necesario
    router.push("/")
  }

  const handleIniciarEvaluacion = async (configuracion: ConfiguracionTipo) => {
    if (!perfil) {
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del estudiante",
        variant: "destructive",
      })
      return
    }

    const configId = configuracion.id

    try {
      const evaluacionesResponse = await configuracionEvaluacionService.getEvaluacionesByCfgT(configId)
      const evaluacionesExistentes = evaluacionesResponse?.data || []

      setEvaluacionesPorConfiguracion((prev) => ({
        ...prev,
        [configId]: evaluacionesExistentes,
      }))

      if (evaluacionesExistentes.length > 0) {
        toast({
          title: "Evaluaciones encontradas",
          description: "Redirigiendo a tus evaluaciones pendientes...",
          variant: "default",
        })

        const tipoFormId = configuracion.tipo_form?.id ?? configuracion.tipo_form_id ?? 1
        
        // Tipos 1 y 4 (Evaluación y Autoevaluación por Materia): Ir al dashboard
        // Tipos 2 y 3 (Encuesta y Autoevaluación): Ir directo a evaluar
        if (tipoFormId === 1 || tipoFormId === 4) {
          router.push(`/estudiante/dashboard/${configId}`)
        } else {
          const firstEvalId = evaluacionesExistentes[0]?.id
          const query = firstEvalId ? `?evalId=${firstEvalId}` : ""
          router.push(`/estudiante/evaluar/${configId}${query}`)
        }
        return
      }

      setIsCreatingEvaluaciones(true)
      setEvaluacionesCreadas([])
      setModalEvaluacionesOpen(true)

      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await evalService.generar(configId)

      if (!response.success || response.data.length === 0) {
        throw new Error(response.error?.message || "No se pudieron generar evaluaciones")
      }

      setEvaluacionesCreadas(response.data)

      const evalsAfterResponse = await configuracionEvaluacionService.getEvaluacionesByCfgT(configId)
      setEvaluacionesPorConfiguracion((prev) => ({
        ...prev,
        [configId]: evalsAfterResponse?.data || [],
      }))

      toast({
        title: "¡Evaluaciones creadas!",
        description: `Se crearon ${response.data.length} evaluaciones correctamente.`,
        variant: "default",
      })

      const tipoFormId = configuracion.tipo_form?.id ?? configuracion.tipo_form_id ?? 1
      
      // Tipos 2 y 3 (Encuesta y Autoevaluación): Redirigir directo a evaluar
      if (tipoFormId === 2 || tipoFormId === 3) {
        const firstEvalId = evalsAfterResponse?.data?.[0]?.id
        const query = firstEvalId ? `?evalId=${firstEvalId}` : ""
        setIsCreatingEvaluaciones(false)
        setModalEvaluacionesOpen(false)
        router.push(`/estudiante/evaluar/${configId}${query}`)
        return
      }

      // Tipos 1 y 4 (Evaluación y Autoevaluación por Materia): Mostrar modal y ir al dashboard
      await new Promise(resolve => setTimeout(resolve, 1200))
      setIsCreatingEvaluaciones(false)
    } catch (error) {
      console.error("❌ Error al generar evaluaciones:", error)
      setIsCreatingEvaluaciones(false)
      setModalEvaluacionesOpen(false)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron generar evaluaciones",
        variant: "destructive",
      })
    }
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Error de conexión</h3>
            <p className="text-gray-600 mb-6">{profileError}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                Reintentar
              </Button>
              <Button 
                onClick={() => {
                  authService.logout();
                  window.location.href = '/login';
                }} 
                variant="outline"
                className="w-full"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="container mx-auto p-6 max-w-6xl">
        {/* Evaluaciones Disponibles */}
        <div className="mb-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Evaluaciones Disponibles
            </h2>
            <p className="text-gray-600 text-lg">Selecciona una evaluación para completar</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mt-4 rounded-full"></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
                <div className="animate-ping absolute top-2 left-2 h-12 w-12 rounded-full bg-gray-200 opacity-75"></div>
              </div>
            </div>
          ) : configuraciones.length === 0 ? (
            <Card className="max-w-md mx-auto animate-fade-in-up shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">No hay evaluaciones disponibles</h4>
                <p className="text-gray-500 text-lg">
                  No tienes evaluaciones pendientes en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {configuraciones.map((configuracion, index) => (
                <EvaluacionCard
                  key={configuracion.id}
                  configuracion={configuracion}
                  evaluaciones={evaluacionesPorConfiguracion[configuracion.id] || []}
                  index={index}
                  onIniciar={handleIniciarEvaluacion}
                />
              ))}
            </div>
          )}
        </div>

        
        <ModalEvaluacionesCreadas
          isOpen={modalEvaluacionesOpen}
          onClose={() => {
            if (!isCreatingEvaluaciones) {
              setModalEvaluacionesOpen(false);
              setEvaluacionesCreadas([]);
            }
          }}
          evaluaciones={evaluacionesCreadas.map((item) => ({
            materia: { nombre: item.nombre_materia || 'Materia' },
            docente: { nombre: item.nombre_docente || 'Docente' },
          }))}
          isLoading={isCreatingEvaluaciones}
        />
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </>
  )
}