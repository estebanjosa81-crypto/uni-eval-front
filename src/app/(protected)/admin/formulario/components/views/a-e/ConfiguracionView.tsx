import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Plus,
  Settings,
  Edit,
  Trash2,
  ChevronRight,
  AlertCircle,
  FileText,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Settings2,
  Trophy,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  configuracionEvaluacionService,
  type ConfiguracionTipo,
  type Aspecto,
  type Escala,
  type AspectoConEscalas,
  type CfgAItem,
  type CfgEItem,
} from "@/src/api";
import { ConfiguracionAspectoView } from "./ConfiguracionAspectoView";
import { ConfiguracionEscalaView } from "./ConfiguracionEscalaView";
import { AeView } from "./AeView";
import { RolesConfiguracionView } from "./RolesConfiguracionView";
import { ModalConfiguracionTipo } from "./ModalConfiguracionTipo";
import { rolService, cfgTRolService, type RolMixto, type CfgTRol, type RolAsignado } from "@/src/api";

interface ConfiguracionViewProps {
  aspectos: Aspecto[];
  escalas: Escala[];
  setModalConfiguracionAspecto: (value: any) => void;
  setModalConfiguracionEscala: (value: any) => void;
  setModalAe: (value: any) => void;
  handleEliminarConfiguracion: (config: ConfiguracionTipo, onSuccess?: () => void) => void;
  refreshData: () => void | Promise<void>;
  rolesDisponibles?: RolMixto[];
}

interface ConfigurationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export function ConfiguracionView({
  aspectos,
  escalas,
  setModalConfiguracionAspecto,
  setModalConfiguracionEscala,
  setModalAe,
  handleEliminarConfiguracion,
  refreshData,
  rolesDisponibles = [],
}: ConfiguracionViewProps) {
  const { toast } = useToast();
  const [modalConfiguracionTipo, setModalConfiguracionTipo] = useState({
    isOpen: false,
    configuracion: undefined as ConfiguracionTipo | undefined,
  });
  
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionTipo[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ConfiguracionTipo | null>(null);
  
  // Estados para las configuraciones de aspectos y escalas
  const [aspectosConEscalas, setAspectosConEscalas] = useState<AspectoConEscalas[]>([]);
  const [configuracionAspectos, setConfiguracionAspectos] = useState<CfgAItem[]>([]);
  const [configuracionEscalas, setConfiguracionEscalas] = useState<CfgEItem[]>([]);
  
  // Estados para roles
  const [rolesAsignados, setRolesAsignados] = useState<RolAsignado[]>([]);
  const [rolesDispList, setRolesDispList] = useState<RolMixto[]>(rolesDisponibles);
  
  // Pasos del proceso
  const [steps, setSteps] = useState<ConfigurationStep[]>([
    { id: 1, title: "Base", description: "Definición inicial", completed: false },
    { id: 2, title: "Aspectos", description: "Criterios evaluación", completed: false },
    { id: 3, title: "Escalas", description: "Rangos de valor", completed: false },
    { id: 4, title: "Relación", description: "Vinculación A/E", completed: false },
    { id: 5, title: "Roles", description: "Permisos acceso", completed: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConfig) {
      loadConfigDetails(selectedConfig.id);
    }
  }, [selectedConfig]);

  useEffect(() => {
    if (rolesDisponibles.length > 0) {
      setRolesDispList(rolesDisponibles);
    }
  }, [rolesDisponibles]);

  const extractItems = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    return [];
  };

  const loadData = async () => {
    try {
      const configResponse = await configuracionEvaluacionService.getAllByRole();
      if (configResponse.success && configResponse.data) {
        const configs = extractItems<ConfiguracionTipo>(configResponse.data);
        setConfiguraciones(configs);
        
        if (configs.length > 0 && !selectedConfig) {
          setSelectedConfig(configs[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadConfigDetails = async (configId: number) => {
    try {
      const [cfgResponse, aeResponse] = await Promise.all([
        configuracionEvaluacionService.getCfgACfgE(configId),
        configuracionEvaluacionService.getAspectosConEscalas(configId),
      ]);

      const cfgData = cfgResponse.success && cfgResponse.data && !Array.isArray(cfgResponse.data) 
        ? cfgResponse.data 
        : null;
      
      const cfgA = cfgData ? cfgData.cfg_a : [];
      const cfgE = cfgData ? cfgData.cfg_e : [];

      setConfiguracionAspectos(cfgA);
      setConfiguracionEscalas(cfgE);

      if (aeResponse.success && aeResponse.data) {
        setAspectosConEscalas(aeResponse.data.aspectos);
      } else {
        setAspectosConEscalas([]);
      }

      const hasAE = aeResponse.success && aeResponse.data
        ? aeResponse.data.aspectos.some((a: AspectoConEscalas) => a.opciones.length > 0)
        : false;

      const rolesResponse = await cfgTRolService.getRolesByConfiguracion(configId);
      const hasRoles = rolesResponse.success && rolesResponse.data && rolesResponse.data.length > 0;
      if (hasRoles) {
        setRolesAsignados(rolesResponse.data);
      } else {
        setRolesAsignados([]);
      }

      updateSteps(
        true,
        cfgA.length > 0,
        cfgE.length > 0,
        hasAE,
        hasRoles
      );
    } catch (error) {
      console.error("Error loading config details:", error);
      setAspectosConEscalas([]);
      setConfiguracionAspectos([]);
      setConfiguracionEscalas([]);
    }
  };

  const updateSteps = (hasConfig: boolean, hasAspectos: boolean, hasEscalas: boolean, hasAE: boolean, hasRoles: boolean = false) => {
    setSteps([
      { id: 1, title: "Base", description: "Definición inicial", completed: hasConfig },
      { id: 2, title: "Aspectos", description: "Criterios evaluación", completed: hasAspectos },
      { id: 3, title: "Escalas", description: "Rangos de valor", completed: hasEscalas },
      { id: 4, title: "Relación", description: "Vinculación A/E", completed: hasAE },
      { id: 5, title: "Roles", description: "Permisos acceso", completed: hasRoles },
    ]);
  };

  const handleConfigCreated = async (newConfig: ConfiguracionTipo) => {
    await loadData();
    setSelectedConfig(newConfig);
    await refreshData();
  };

  const handleSelectConfig = (config: ConfiguracionTipo) => {
    setSelectedConfig(config);
  };

  const handleDeleteConfig = (config: ConfiguracionTipo) => {
    handleEliminarConfiguracion(config, async () => {
      if (selectedConfig?.id === config.id) {
        setSelectedConfig(null);
      }
      await loadData();
    });
  };

  const handleToggleField = async (configId: number, field: "es_cmt_gen" | "es_cmt_gen_oblig" | "es_activo") => {
    try {
      const response = await configuracionEvaluacionService.toggleField(configId, field);
      if (response.success) {
        toast({
          title: "Actualización Exitosa",
          description: "La configuración ha sido modificada correctamente.",
        });
        await loadData();
        await refreshData();
      }
    } catch (error) {
      console.error("Error toggling field:", error);
    }
  };

  const handleAspectosConfigured = async () => {
    if (selectedConfig) {
      await loadConfigDetails(selectedConfig.id);
    }
    await refreshData();
  };

  const handleEscalasConfigured = async () => {
    if (selectedConfig) {
      await loadConfigDetails(selectedConfig.id);
    }
    await refreshData();
  };

  const handleRolesUpdated = async () => {
    if (selectedConfig) {
      await loadConfigDetails(selectedConfig.id);
    }
    await refreshData();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Progress Monitor */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-semibold text-slate-400 leading-none">Workflow de Configuración</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative group">
              <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${
                step.completed
                  ? 'border-emerald-100 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-100 bg-white'
              }`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    step.completed
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-50 text-slate-300'
                  }`}>
                    {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-black">{step.id}</span>}
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${step.completed ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                   <ChevronRight className={`h-4 w-4 ${steps[index].completed && steps[index+1].completed ? 'text-emerald-500' : 'text-slate-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Inventory Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Settings2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-semibold text-slate-400 leading-none">Inventario</h3>
            </div>
            <Button
              size="sm"
              onClick={() => setModalConfiguracionTipo({ isOpen: true, configuracion: undefined })}
              className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 shadow-lg shadow-indigo-100"
            >
              <Plus className="h-3 w-3 mr-2" />
              Nuevo
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-450px)] pr-4">
            <div className="space-y-4">
              {configuraciones.length === 0 ? (
                <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[2.5rem] p-12 text-center">
                  <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-medium text-slate-400">Sin Registros</p>
                </div>
              ) : (
                configuraciones.map((config) => {
                  const isSelected = selectedConfig?.id === config.id;
                  return (
                    <div
                      key={config.id}
                      onClick={() => handleSelectConfig(config)}
                      className={`group cursor-pointer p-6 rounded-[2.5rem] border transition-all duration-500 ${
                        isSelected
                          ? 'border-indigo-200 bg-indigo-50/30 shadow-xl shadow-indigo-100/20'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {config.tipo_evaluacion?.tipo?.nombre || `Config #${config.id}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge className="bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold px-2 h-5">
                                 {config.tipo_form?.nombre || "General"}
                               </Badge>
                               <span className="text-xs font-medium text-slate-300">ID: {config.id}</span>
                            </div>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full shadow-sm transition-all duration-500 ${config.es_activo ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white/50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-300">Apertura</span>
                            <div className="flex items-center gap-1.5 text-slate-600">
                               <Calendar className="h-3 w-3" />
                               <span className="text-[10px] font-bold">{new Date(config.fecha_inicio).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-300">Cierre</span>
                            <div className="flex items-center gap-1.5 text-slate-600">
                               <Clock className="h-3 w-3" />
                               <span className="text-[10px] font-bold">{new Date(config.fecha_fin).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalConfiguracionTipo({ isOpen: true, configuracion: config });
                            }}
                            className="flex-1 h-9 rounded-xl hover:bg-white hover:text-indigo-600 font-semibold text-sm shadow-sm border border-transparent hover:border-slate-100"
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfig(config);
                            }}
                            className="flex-1 h-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 font-semibold text-sm"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Workspace Panel */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedConfig ? (
            <div className="h-full flex items-center justify-center p-10 bg-slate-50/50 border border-slate-100 border-dashed rounded-[3rem]">
              <div className="text-center max-w-sm">
                 <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                    <Settings className="h-10 w-10 text-slate-100" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Entorno Vacío</h3>
                 <p className="text-slate-400 font-medium text-sm">
                   Selecciona un modelo del inventario para iniciar la orquestación de componentes y reglas de negocio.
                 </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
              {/* Feature Toggles Card */}
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-lg font-bold tracking-tight leading-none">Centro de Comando</h3>
                       <p className="text-indigo-100 text-sm font-medium mt-2">Parámetros de ejecución en tiempo real</p>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-xl px-4 py-1.5 font-semibold text-sm backdrop-blur-md">
                       Estado: {selectedConfig.es_activo ? "OPERATIVO" : "EN PAUSA"}
                    </Badge>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleToggleField(selectedConfig.id, "es_activo")}
                      className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-500 border backdrop-blur-sm ${
                        selectedConfig.es_activo 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                          : 'bg-black/10 border-white/10 text-white/50'
                      }`}
                    >
                       <span className="text-sm font-semibold">Disponibilidad</span>
                       <div className={`h-4 w-4 rounded-full border-2 border-current flex items-center justify-center transition-all ${
                         selectedConfig.es_activo ? 'bg-emerald-400 border-emerald-400' : ''
                       }`}>
                          {selectedConfig.es_activo && <CheckCircle2 className="h-3 w-3 text-indigo-900" />}
                       </div>
                    </button>

                    <button 
                      onClick={() => handleToggleField(selectedConfig.id, "es_cmt_gen")}
                      className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-500 border backdrop-blur-sm ${
                        selectedConfig.es_cmt_gen 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                          : 'bg-black/10 border-white/10 text-white/50'
                      }`}
                    >
                       <span className="text-sm font-semibold">Feedback Libre</span>
                       <div className={`h-4 w-4 rounded-full border-2 border-current flex items-center justify-center transition-all ${
                         selectedConfig.es_cmt_gen ? 'bg-indigo-300 border-indigo-300' : ''
                       }`}>
                          {selectedConfig.es_cmt_gen && <MessageSquare className="h-2.5 w-2.5 text-indigo-900" />}
                       </div>
                    </button>

                    <button 
                      onClick={() => handleToggleField(selectedConfig.id, "es_cmt_gen_oblig")}
                      className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-500 border backdrop-blur-sm ${
                        selectedConfig.es_cmt_gen_oblig 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                          : 'bg-black/10 border-white/10 text-white/50'
                      }`}
                    >
                       <span className="text-xs font-semibold">Feedback Forzado</span>
                       <div className={`h-4 w-4 rounded-full border-2 border-current flex items-center justify-center transition-all ${
                         selectedConfig.es_cmt_gen_oblig ? 'bg-rose-300 border-rose-300' : ''
                       }`}>
                          {selectedConfig.es_cmt_gen_oblig && <ShieldCheck className="h-2.5 w-2.5 text-rose-900" />}
                       </div>
                    </button>
                 </div>
              </div>

              {/* Functional Tabs */}
              <Tabs defaultValue="aspectos" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200/50 grid grid-cols-4 h-14">
                  <TabsTrigger 
                    value="aspectos" 
                      className="rounded-[1.5rem] font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                  >
                    Aspectos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="escalas" 
                      className="rounded-[1.5rem] font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                  >
                    Escalas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="a-e" 
                      className="rounded-[1.5rem] font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                  >
                    Matriz A/E
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roles" 
                      className="rounded-[1.5rem] font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                  >
                    Permisos
                  </TabsTrigger>
                </TabsList>

                <div className="mt-8 bg-white border border-slate-100 rounded-[2.5rem] p-8 min-h-[500px] shadow-sm">
                  <TabsContent value="aspectos" className="m-0 focus-visible:ring-0">
                    <ConfiguracionAspectoView
                      configuraciones={configuracionAspectos}
                      setModalConfiguracionAspecto={() => {
                        setModalConfiguracionAspecto({
                          isOpen: true,
                          cfgTId: selectedConfig.id,
                          aspectos: aspectos,
                          onSuccess: handleAspectosConfigured,
                        });
                      }}
                      onConfigUpdated={handleAspectosConfigured}
                    />
                  </TabsContent>

                  <TabsContent value="escalas" className="m-0 focus-visible:ring-0">
                    <ConfiguracionEscalaView
                      configuraciones={configuracionEscalas}
                      setModalConfiguracionEscala={() => {
                        setModalConfiguracionEscala({
                          isOpen: true,
                          cfgTId: selectedConfig.id,
                          escalas: escalas,
                          onSuccess: handleEscalasConfigured,
                        });
                      }}
                      onConfigUpdated={handleEscalasConfigured}
                    />
                  </TabsContent>

                  <TabsContent value="a-e" className="m-0 focus-visible:ring-0">
                    <AeView
                      aspectosConEscalas={aspectosConEscalas}
                      configuracionAspectos={configuracionAspectos}
                      cfgTId={selectedConfig.id}
                      setModalAe={() => setModalAe({
                        isOpen: true,
                        cfgTId: selectedConfig.id,
                        onSuccess: handleAspectosConfigured,
                      })}
                      onConfigUpdated={handleAspectosConfigured}
                    />
                  </TabsContent>

                  <TabsContent value="roles" className="m-0 focus-visible:ring-0">
                    <RolesConfiguracionView
                      cfgTId={selectedConfig.id}
                      rolesAsignados={rolesAsignados}
                      rolesDisponibles={rolesDispList}
                      onRoleAdded={handleRolesUpdated}
                      onRoleRemoved={handleRolesUpdated}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <ModalConfiguracionTipo
        isOpen={modalConfiguracionTipo.isOpen}
        onClose={() => setModalConfiguracionTipo({ isOpen: false, configuracion: undefined })}
        onSuccess={handleConfigCreated}
        configuracion={modalConfiguracionTipo.configuracion}
      />
    </div>
  );
}

// Added ScrollArea mock if not imported
function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-y-auto custom-scrollbar ${className}`}>{children}</div>;
}
