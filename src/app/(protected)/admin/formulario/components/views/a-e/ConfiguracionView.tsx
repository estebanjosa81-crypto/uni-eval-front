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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  configuracionEvaluacionService,
  tipoService,
  categoriaTipoService,
  type ConfiguracionTipo,
  type Tipo,
  type Aspecto,
  type Escala,
  type AspectoConEscalas,
  type CfgAItem,
  type CfgEItem,
} from "@/src/api";
import type { PaginationMeta, PaginationParams } from "@/src/api/types/api.types";
import { ConfiguracionAspectoView } from "./ConfiguracionAspectoView";
import { ConfiguracionEscalaView } from "./ConfiguracionEscalaView";
import { AeView } from "./AeView";
import { RolesConfiguracionView } from "./RolesConfiguracionView";
import { ModalConfiguracionTipo } from "./ModalConfiguracionTipo";
import { PaginationControls } from "../../PaginationControls";
import { rolService, cfgTRolService, type RolMixto, type CfgTRol, type RolAsignado } from "@/src/api";

interface ConfiguracionViewProps {
  aspectos: Aspecto[];
  escalas: Escala[];
  setModalConfiguracionAspecto: (value: any) => void;
  setModalConfiguracionEscala: (value: any) => void;
  setModalAe: (value: any) => void;
  handleEliminarConfiguracion: (config: ConfiguracionTipo) => void;
  refreshData: () => void;
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
  const [tiposById, setTiposById] = useState<Map<number, Tipo>>(new Map());
  const [categoriasPorTipo, setCategoriaPorTipo] = useState<Map<number, string>>(new Map());
  const [configPagination, setConfigPagination] = useState<PaginationMeta | null>(null);
  const [configParams, setConfigParams] = useState<PaginationParams>({ page: 1, limit: 10 });
  
  // Estados para las configuraciones de aspectos y escalas
  const [aspectosConEscalas, setAspectosConEscalas] = useState<AspectoConEscalas[]>([]);
  const [configuracionAspectos, setConfiguracionAspectos] = useState<CfgAItem[]>([]);
  const [configuracionEscalas, setConfiguracionEscalas] = useState<CfgEItem[]>([]);
  
  // Estados para roles
  const [rolesAsignados, setRolesAsignados] = useState<RolAsignado[]>([]);
  const [rolesDispList, setRolesDispList] = useState<RolMixto[]>(rolesDisponibles);
  
  // Pasos del proceso
  const [steps, setSteps] = useState<ConfigurationStep[]>([
    { id: 1, title: "Crear Configuración", description: "Define tipo, fechas y opciones", completed: false },
    { id: 2, title: "Configurar Aspectos", description: "Selecciona y ordena los aspectos", completed: false },
    { id: 3, title: "Configurar Escalas", description: "Define puntajes y orden", completed: false },
    { id: 4, title: "Relación A/E", description: "Vincula aspectos con escalas", completed: false },
    { id: 5, title: "Asignar Roles", description: "Define qué roles pueden usar esta evaluación", completed: false },
  ]);

  useEffect(() => {
    loadData();
  }, [configParams.page, configParams.limit]);

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

  const extractPagination = (payload: any): PaginationMeta | null => {
    if (payload?.pagination) return payload.pagination as PaginationMeta;
    if (payload?.meta) {
      const meta = payload.meta;
      const totalPages = meta.pages ?? meta.totalPages ?? 1;
      const page = meta.page ?? 1;
      return {
        page,
        limit: meta.limit ?? 10,
        total: meta.total ?? 0,
        totalPages,
        hasNextPage: meta.hasNext ?? meta.hasNextPage ?? page < totalPages,
        hasPreviousPage: meta.hasPrev ?? meta.hasPreviousPage ?? page > 1,
      };
    }
    return null;
  };

  const loadData = async () => {
    try {
      // Cargar configuraciones
      const configResponse = await configuracionEvaluacionService.getAll(configParams);
      if (configResponse.success && configResponse.data) {
        const configs = extractItems<ConfiguracionTipo>(configResponse.data);
        setConfigPagination(extractPagination(configResponse.data));
        setConfiguraciones(configs);
        
        // Seleccionar la primera configuración si existe
        if (configs.length > 0 && !selectedConfig) {
          setSelectedConfig(configs[0]);
        }
      }
      
      // Cargar tipos para mostrar nombres
      const tipos = await fetchAllTipos();
      const tiposMap = new Map(tipos.map(t => [t.id, t]));
      setTiposById(tiposMap);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const fetchAllTipos = async (): Promise<Tipo[]> => {
    const all: Tipo[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await tipoService.getAll({ page, limit });
      if (!response.success || !response.data) {
        break;
      }

      const batch = extractItems<Tipo>(response.data);
      all.push(...batch);

      const pagination = extractPagination(response.data);
      if (!pagination || !pagination.hasNextPage) {
        break;
      }
      page += 1;
      if (page > (pagination.totalPages || page)) {
        break;
      }
    }

    return all;
  };

  const fetchAllCategorias = async (): Promise<Map<number, string>> => {
    const categoriasMap = new Map<number, string>();
    try {
      const response = await categoriaTipoService.getAll();
      if (response.success && response.data) {
        const categorias = extractItems(response.data);
        categorias.forEach((cat: any) => {
          if (cat.id && cat.nombre) {
            categoriasMap.set(cat.id, cat.nombre);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
    return categoriasMap;
  };

  const getTipoCategoria = async (tipoId: number): Promise<string> => {
    try {
      const response = await categoriaTipoService.getTiposByCategoria(tipoId);
      if (response.success && response.data) {
        return response.data.categoria_id?.toString() || "Sin categoría";
      }
    } catch (error) {
      console.error("Error fetching tipo categoria:", error);
    }
    return "Sin categoría";
  };

  const handleConfigPageChange = (page: number) => {
    setConfigParams((prev) => ({ ...prev, page }));
  };

  const handleConfigLimitChange = (limit: number) => {
    setConfigParams({ page: 1, limit });
  };

  const loadConfigDetails = async (configId: number) => {
    try {
      const [cfgResponse, aeResponse] = await Promise.all([
        configuracionEvaluacionService.getCfgACfgE(configId),
        configuracionEvaluacionService.getAspectosConEscalas(configId),
      ]);

      const cfgA = cfgResponse.success && cfgResponse.data ? cfgResponse.data.cfg_a : [];
      const cfgE = cfgResponse.success && cfgResponse.data ? cfgResponse.data.cfg_e : [];

      // Ya no necesitamos mapear, usamos los datos directamente del API
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

      // Cargar roles asignados
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
      { id: 1, title: "Crear Configuración", description: "Define tipo, fechas y opciones", completed: hasConfig },
      { id: 2, title: "Configurar Aspectos", description: "Selecciona y ordena los aspectos", completed: hasAspectos },
      { id: 3, title: "Configurar Escalas", description: "Define puntajes y orden", completed: hasEscalas },
      { id: 4, title: "Relación A/E", description: "Vincula aspectos con escalas", completed: hasAE },
      { id: 5, title: "Asignar Roles", description: "Define qué roles pueden usar esta evaluación", completed: hasRoles },
    ]);
  };

  const handleConfigCreated = (newConfig: ConfiguracionTipo) => {
    loadData();
    setSelectedConfig(newConfig);
    refreshData();
  };

  const handleSelectConfig = (config: ConfiguracionTipo) => {
    setSelectedConfig(config);
  };

  const handleDeleteConfig = (config: ConfiguracionTipo) => {
    handleEliminarConfiguracion(config);
    if (selectedConfig?.id === config.id) {
      setSelectedConfig(null);
    }
    loadData();
  };

  const handleToggleField = async (configId: number, field: "es_cmt_gen" | "es_cmt_gen_oblig" | "es_activo") => {
    try {
      const response = await configuracionEvaluacionService.toggleField(configId, field);
      if (response.success) {
        toast({
          title: "Éxito",
          description: `${field} actualizado correctamente`,
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el campo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling field:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar",
        variant: "destructive",
      });
    }
  };

  const handleAspectosConfigured = () => {
    if (selectedConfig) {
      loadConfigDetails(selectedConfig.id);
    }
    refreshData();
  };

  const handleEscalasConfigured = () => {
    if (selectedConfig) {
      loadConfigDetails(selectedConfig.id);
    }
    refreshData();
  };

  const handleRolesUpdated = () => {
    if (selectedConfig) {
      loadConfigDetails(selectedConfig.id);
    }
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Evaluación</h1>
        <p className="text-muted-foreground mt-2">
          Sigue el proceso completo para configurar una evaluación
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Configuración</CardTitle>
          <CardDescription>
            Completa todos los pasos para tener una evaluación lista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  step.completed
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-gray-300 bg-white dark:bg-gray-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-5 transform -translate-y-1/2 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configurations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Configuraciones</CardTitle>
                <CardDescription>Selecciona una para configurar</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setModalConfiguracionTipo({ isOpen: true, configuracion: undefined })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {configuraciones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay configuraciones</p>
                <p className="text-xs mt-1">Crea una nueva para comenzar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {configuraciones.map((config) => {
                  const tipo = tiposById.get(config.tipo_evaluacion_id);
                  const isSelected = selectedConfig?.id === config.id;
                  
                  return (
                    <div
                      key={config.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
                      }`}
                      onClick={() => handleSelectConfig(config)}
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {tipo?.nombre || `Tipo #${config.tipo_evaluacion_id}`}
                            </h4>
                            <p className="text-xs text-muted-foreground">ID: {config.id}</p>
                          </div>
                          <Badge variant={config.es_activo ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                            {config.es_activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Inicio:</span>
                            <p className="font-mono text-xs">
                              {new Date(config.fecha_inicio).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fin:</span>
                            <p className="font-mono text-xs">
                              {new Date(config.fecha_fin).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-1 text-xs">
                          <div 
                            className="flex items-center justify-between p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleField(config.id, "es_cmt_gen");
                            }}
                          >
                            <span className="text-muted-foreground">Comentario General:</span>
                            <Badge variant={config.es_cmt_gen ? "default" : "outline"}>
                              {config.es_cmt_gen ? "Sí" : "No"}
                            </Badge>
                          </div>

                          <div 
                            className="flex items-center justify-between p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleField(config.id, "es_cmt_gen_oblig");
                            }}
                          >
                            <span className="text-muted-foreground">Obligatorio:</span>
                            <Badge variant={config.es_cmt_gen_oblig ? "default" : "outline"}>
                              {config.es_cmt_gen_oblig ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 mt-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalConfiguracionTipo({ isOpen: true, configuracion: config });
                            }}
                            className="flex-1 h-8"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfig(config);
                            }}
                            className="flex-1 h-8"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <PaginationControls
                  pagination={configPagination}
                  onPageChange={handleConfigPageChange}
                  onLimitChange={handleConfigLimitChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Configuration Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedConfig ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay configuración seleccionada</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Selecciona una configuración existente de la lista o crea una nueva para comenzar
                  a configurar los aspectos y escalas
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="aspectos" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="aspectos">Aspectos</TabsTrigger>
                <TabsTrigger value="escalas">Escalas</TabsTrigger>
                <TabsTrigger value="a-e">Relación A/E</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
              </TabsList>

              <TabsContent value="aspectos" className="mt-6">
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

              <TabsContent value="escalas" className="mt-6">
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

              <TabsContent value="a-e" className="mt-6">
                <AeView
                  aspectosConEscalas={aspectosConEscalas}
                  configuracionAspectos={configuracionAspectos}
                  cfgTId={selectedConfig.id}
                  setModalAe={() => setModalAe({ isOpen: true, cfgTId: selectedConfig.id })}
                  onConfigUpdated={handleAspectosConfigured}
                />
              </TabsContent>

              <TabsContent value="roles" className="mt-6">
                <RolesConfiguracionView
                  cfgTId={selectedConfig.id}
                  rolesAsignados={rolesAsignados}
                  rolesDisponibles={rolesDispList}
                  onRoleAdded={handleRolesUpdated}
                  onRoleRemoved={handleRolesUpdated}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Modal */}
      <ModalConfiguracionTipo
        isOpen={modalConfiguracionTipo.isOpen}
        onClose={() => setModalConfiguracionTipo({ isOpen: false, configuracion: undefined })}
        onSuccess={handleConfigCreated}
        configuracion={modalConfiguracionTipo.configuracion}
      />
    </div>
  );
}
