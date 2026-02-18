import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertCircle, Plus, Settings, Trash2, ChevronDown, ChevronRight, CheckCircle2, Info, ChevronLeft, ChevronRightIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  aEService,
  configuracionEvaluacionService,
  type Aspecto,
  type Escala,
  type AspectoEscalaBulkInput,
} from "@/src/api";

interface ModalAeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cfgTId?: number | null;
  aspectos: Aspecto[];
  escalas: Escala[];
}

interface AspectoEnriquecido extends Aspecto {
  cfg_t_id: number;
  tipo_evaluacion: string;
  es_configuracion_actual: boolean;
}

interface EscalaEnriquecida extends Escala {
  cfg_t_id: number;
  tipo_evaluacion: string;
  puntaje: number;
  es_configuracion_actual: boolean;
}

interface AspectoState {
  id: number;
  selected: boolean;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

interface AeItemState {
  id: string;
  tipoConfiguracion: 'conEscalas' | 'sinEscalas' | null; // null = sin seleccionar tipo
  es_pregunta_abierta: boolean; // Deprecated, usar tipoConfiguracion
  escalaIds: number[];
  escalaOpen: { es_cmt: boolean; es_cmt_oblig: boolean };
  aspectos: AspectoState[];
  currentStep: number;
}

const createAspectosState = (aspectos: AspectoEnriquecido[], es_pregunta_abierta: boolean): AspectoState[] =>
  aspectos.map((a) => ({
    id: a.id,
    selected: false,
    es_cmt: es_pregunta_abierta, // Para preguntas abiertas, el comentario siempre está activo
    es_cmt_oblig: false,
  }));

const createItem = (aspectos: AspectoEnriquecido[]): AeItemState => ({
  id: `${Date.now()}-${Math.random()}`,
  tipoConfiguracion: null, // Sin tipo asignado, el usuario debe seleccionar
  es_pregunta_abierta: false, // Se asignará cuando se seleccione tipo
  escalaIds: [],
  escalaOpen: { es_cmt: true, es_cmt_oblig: false },
  aspectos: createAspectosState(aspectos, false), // Por defecto false
  currentStep: 1, // Step 1 es seleccionar tipo
});

export function ModalAe({ isOpen, onClose, onSuccess, cfgTId, aspectos, escalas }: ModalAeProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<AeItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<Set<'conEscalas' | 'sinEscalas'>>(new Set());
  const [aspectosConfigurados, setAspectosConfigurados] = useState<AspectoEnriquecido[]>([]);
  const [escalasConfiguradas, setEscalasConfiguradas] = useState<EscalaEnriquecida[]>([]);
  const [aspectosExpandidos, setAspectosExpandidos] = useState<Record<string, boolean>>({});
  const [escalasExpandidas, setEscalasExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;

    const loadConfiguracion = async () => {
      setIsLoadingConfig(true);
      setError(null);

      if (!cfgTId) {
        setAspectosConfigurados([]);
        setEscalasConfiguradas([]);
        setItems([]);
        setError("Selecciona una configuración válida antes de continuar");
        setIsLoadingConfig(false);
        return;
      }

      // Obtener el banco global de cfg_a y cfg_e (sin id)
      const response = await configuracionEvaluacionService.getCfgACfgE();
      if (response.success && response.data && Array.isArray(response.data)) {
        // Consolidar todos los aspectos y escalas únicos de todas las configuraciones
        const aspectosMap = new Map<number, AspectoEnriquecido>();
        const escalasMap = new Map<number, EscalaEnriquecida>();

        response.data.forEach((config) => {
          const tipoEvalNombre = config.tipo_evaluacion?.tipo?.nombre || 'Sin tipo';
          const categoriaNombre = config.tipo_evaluacion?.categoria?.nombre || '';
          const tipoCompleto = categoriaNombre ? `${categoriaNombre} - ${tipoEvalNombre}` : tipoEvalNombre;

          // Agregar aspectos únicos
          config.cfg_a
            .filter((a) => a.es_activo)
            .forEach((a) => {
              if (!aspectosMap.has(a.id)) {
                aspectosMap.set(a.id, {
                  id: a.id,
                  nombre: a.aspecto.nombre,
                  descripcion: a.aspecto.descripcion,
                  cfg_t_id: a.cfg_t_id,
                  tipo_evaluacion: tipoCompleto,
                  es_configuracion_actual: a.cfg_t_id === cfgTId,
                });
              }
            });

          // Agregar escalas únicas
          config.cfg_e
            .filter((e) => e.es_activo)
            .forEach((e) => {
              if (!escalasMap.has(e.id)) {
                escalasMap.set(e.id, {
                  id: e.id,
                  sigla: e.escala.sigla,
                  nombre: e.escala.nombre,
                  descripcion: e.escala.descripcion,
                  cfg_t_id: e.cfg_t_id,
                  tipo_evaluacion: tipoCompleto,
                  puntaje: e.puntaje,
                  es_configuracion_actual: e.cfg_t_id === cfgTId,
                });
              }
            });
        });

        const aspectosCfg = Array.from(aspectosMap.values()).sort((a, b) => {
          // Primero los de la configuración actual, luego por nombre
          if (a.es_configuracion_actual !== b.es_configuracion_actual) {
            return a.es_configuracion_actual ? -1 : 1;
          }
          return a.nombre.localeCompare(b.nombre);
        });
        const escalasCfg = Array.from(escalasMap.values()).sort((a, b) => {
          // Primero los de la configuración actual, luego por nombre
          if (a.es_configuracion_actual !== b.es_configuracion_actual) {
            return a.es_configuracion_actual ? -1 : 1;
          }
          return a.nombre.localeCompare(b.nombre);
        });

        setAspectosConfigurados(aspectosCfg);
        setEscalasConfiguradas(escalasCfg);
        setItems([]);
        setTiposSeleccionados(new Set());

        // Expandir automáticamente la configuración actual
        const tiposUnicos = new Set<string>();
        aspectosCfg.forEach(a => tiposUnicos.add(a.tipo_evaluacion));
        escalasCfg.forEach(e => tiposUnicos.add(e.tipo_evaluacion));
        
        const aspectosExp: Record<string, boolean> = {};
        const escalasExp: Record<string, boolean> = {};
        tiposUnicos.forEach(tipo => {
          const esActual = aspectosCfg.some(a => a.tipo_evaluacion === tipo && a.es_configuracion_actual) ||
                          escalasCfg.some(e => e.tipo_evaluacion === tipo && e.es_configuracion_actual);
          aspectosExp[tipo] = esActual;
          escalasExp[tipo] = esActual;
        });
        
        setAspectosExpandidos(aspectosExp);
        setEscalasExpandidas(escalasExp);

        if (aspectosCfg.length === 0 && escalasCfg.length === 0) {
          setError("No hay aspectos o escalas configurados");
        }
      } else {
        setAspectosConfigurados([]);
        setEscalasConfiguradas([]);
        setItems([]);
        setError("No se pudo cargar el banco de aspectos y escalas");
      }

      setIsLoadingConfig(false);
    };

    loadConfiguracion();
  }, [isOpen, cfgTId]);

  const aspectosById = useMemo(
    () => new Map(aspectosConfigurados.map((a) => [a.id, a])),
    [aspectosConfigurados]
  );

  const aspectosPorTipo = useMemo(() => {
    const grupos: Record<string, AspectoEnriquecido[]> = {};
    aspectosConfigurados.forEach((aspecto) => {
      if (!grupos[aspecto.tipo_evaluacion]) {
        grupos[aspecto.tipo_evaluacion] = [];
      }
      grupos[aspecto.tipo_evaluacion].push(aspecto);
    });
    return grupos;
  }, [aspectosConfigurados]);

  const escalasPorTipo = useMemo(() => {
    const grupos: Record<string, EscalaEnriquecida[]> = {};
    escalasConfiguradas.forEach((escala) => {
      if (!grupos[escala.tipo_evaluacion]) {
        grupos[escala.tipo_evaluacion] = [];
      }
      grupos[escala.tipo_evaluacion].push(escala);
    });
    return grupos;
  }, [escalasConfiguradas]);

  const updateItem = (itemId: string, updates: Partial<AeItemState>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
  };

  const updateAspecto = (itemId: string, aspectoId: number, updates: Partial<AspectoState>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        // Si es pregunta abierta, siempre mantener es_cmt en true
        const finalUpdates = it.es_pregunta_abierta && 'es_cmt' in updates
          ? { ...updates, es_cmt: true }
          : updates;
        return {
          ...it,
          aspectos: it.aspectos.map((a) =>
            a.id === aspectoId ? { ...a, ...finalUpdates } : a
          ),
        };
      })
    );
  };

  const toggleEscala = (itemId: string, escalaId: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.escalaIds.includes(escalaId);
        return {
          ...it,
          escalaIds: exists
            ? it.escalaIds.filter((id) => id !== escalaId)
            : [...it.escalaIds, escalaId],
        };
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createItem(aspectosConfigurados)]);
  };

  const toggleTipoSeleccion = (tipo: 'conEscalas' | 'sinEscalas') => {
    const newSet = new Set(tiposSeleccionados);
    if (newSet.has(tipo)) {
      newSet.delete(tipo);
    } else {
      newSet.add(tipo);
    }
    setTiposSeleccionados(newSet);
  };

  const continuarConTiposSeleccionados = () => {
    if (tiposSeleccionados.size === 0) {
      setError("Debes seleccionar al menos un tipo");
      return;
    }
    
    // Crear bloques para cada tipo seleccionado
    const nuevosItems: AeItemState[] = [];
    tiposSeleccionados.forEach(tipo => {
      const item = createItem(aspectosConfigurados);
      item.tipoConfiguracion = tipo;
      item.es_pregunta_abierta = tipo === 'sinEscalas';
      item.aspectos = createAspectosState(aspectosConfigurados, tipo === 'sinEscalas');
      item.currentStep = 2; // Avanzar al paso 2
      nuevosItems.push(item);
    });
    
    setItems(nuevosItems);
    setTiposSeleccionados(new Set());
    setError(null);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const getMaxStep = (item: AeItemState): number => {
    if (!item.tipoConfiguracion) return 1; // Solo seleccionar tipo
    return item.tipoConfiguracion === 'sinEscalas' ? 2 : 4;
  };

  const validateStep = (item: AeItemState, step: number): boolean => {
    if (step === 1) {
      if (!item.tipoConfiguracion) {
        setError("Debes seleccionar un tipo de configuración");
        return false;
      }
    }
    if (step === 2 && item.tipoConfiguracion === 'conEscalas') {
      if (item.escalaIds.length === 0) {
        setError("Debes seleccionar al menos una escala");
        return false;
      }
    }
    if ((step === 2 && item.tipoConfiguracion === 'sinEscalas') || (step === 3 && item.tipoConfiguracion === 'conEscalas')) {
      const selectedAspectos = item.aspectos.filter((a) => a.selected);
      if (selectedAspectos.length === 0) {
        setError("Debes seleccionar al menos un aspecto");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const goToNext = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const maxStep = getMaxStep(item);
    if (!validateStep(item, item.currentStep)) return;

    if (item.currentStep < maxStep) {
      updateItem(itemId, { currentStep: item.currentStep + 1 });
    }
  };

  const goToPrev = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    if (item.currentStep > 1) {
      setError(null);
      updateItem(itemId, { currentStep: item.currentStep - 1 });
    }
  };

  const allItemsCompleted = (): boolean => {
    return items.length > 0 && items.every(item => item.currentStep === getMaxStep(item));
  };

  const validate = () => {
    if (aspectosConfigurados.length === 0) {
      setError("No hay aspectos configurados para esta evaluación");
      return false;
    }

    if (items.length === 0) {
      setError("Agrega al menos un bloque de configuración");
      return false;
    }

    for (const item of items) {
      if (!item.tipoConfiguracion) {
        setError("Los bloques deben tener un tipo de configuración seleccionado");
        return false;
      }
      const selectedAspectos = item.aspectos.filter((a) => a.selected);
      if (selectedAspectos.length === 0) {
        setError("Cada bloque debe tener al menos un aspecto seleccionado");
        return false;
      }
      if (item.tipoConfiguracion === 'conEscalas' && escalasConfiguradas.length === 0) {
        setError("No hay escalas configuradas para preguntas cerradas");
        return false;
      }
      if (item.tipoConfiguracion === 'conEscalas' && item.escalaIds.length === 0) {
        setError("Las preguntas cerradas deben tener al menos una escala");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: AspectoEscalaBulkInput = {
        items: items.map((item) => ({
          es_pregunta_abierta: item.es_pregunta_abierta,
          escalas: item.es_pregunta_abierta
            ? [{ id: null, es_cmt: true, es_cmt_oblig: item.escalaOpen.es_cmt_oblig }]
            : item.escalaIds,
          aspectos: item.aspectos
            .filter((a) => a.selected)
            .map((a) => ({
              id: a.id,
              es_cmt: item.es_pregunta_abierta ? true : a.es_cmt,
              es_cmt_oblig: a.es_cmt_oblig,
            })),
        })),
      };

      console.log("📤 ModalAe payload:", JSON.stringify(payload, null, 2));

      const response = await aEService.bulkCreateAE(payload);
      if (response.success) {
        toast({
          title: "Configuración guardada",
          description: response.data?.message || "Bulk A/E procesado correctamente",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error("No se pudo guardar la configuración");
      }
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Componer Aspectos y Escalas
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1.5">
                ⚙️ Configura paso a paso cómo se evaluarán los aspectos
              </p>
            </div>
          </div>
        </DialogHeader>

        {isLoadingConfig ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Formulario inicial de selección de tipos */}
            {items.length === 0 && (
              <Card className="border-2">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold">🎯 Selecciona los tipos de configuración</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes seleccionar uno o ambos tipos. Se crearán bloques separados para cada uno.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Opción 1: Con escalas */}
                    <label
                      className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        tiposSeleccionados.has('conEscalas')
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={tiposSeleccionados.has('conEscalas')}
                        onCheckedChange={() => toggleTipoSeleccion('conEscalas')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          📊 Con escalas numéricas
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Los evaluadores calificarán usando una escala numérica y podrán dejar comentarios opcionales
                        </p>
                      </div>
                    </label>

                    {/* Opción 2: Sin escalas */}
                    <label
                      className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        tiposSeleccionados.has('sinEscalas')
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={tiposSeleccionados.has('sinEscalas')}
                        onCheckedChange={() => toggleTipoSeleccion('sinEscalas')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          📝 Sin escalas (comentarios)
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Los evaluadores escribirán comentarios obligatorios sin asignar una puntuación numérica
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 text-destructive bg-destructive/10 border-2 border-destructive/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {/* Botón Continuar */}
                  <Button
                    onClick={() => continuarConTiposSeleccionados()}
                    className="w-full gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Continuar con {tiposSeleccionados.size > 0 ? (tiposSeleccionados.size === 1 ? 'este tipo' : 'estos tipos') : 'un tipo'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {items.map((item, itemIndex) => {
              const maxStep = getMaxStep(item);
              const progress = (item.currentStep / maxStep) * 100;

              const STEPS: Record<number, {title: string; description: string; icon: string}> = {
                1: item.tipoConfiguracion === null
                  ? { title: "Selecciona tipo de configuración", description: "¿Deseas usar aspectos con escalas numéricas o sin escalas?", icon: "🔍" }
                  : { title: "Selecciona tipo de configuración", description: "Tipo seleccionado", icon: "✅" },
                2: item.tipoConfiguracion === 'sinEscalas'
                  ? { title: "Selecciona aspectos", description: "Elige los aspectos que se evaluarán (comentarios siempre activos)", icon: "🎯" }
                  : { title: "Selecciona escalas", description: "Elige las escalas de calificación para esta pregunta", icon: "📊" },
                3: { title: "Selecciona aspectos", description: "Elige los aspectos que se evaluarán y configura comentarios", icon: "🎯" },
                4: { title: "Resumen", description: "Revisa tu configuración antes de guardar", icon: "✅" },
              };

              return (
                <Card key={item.id} className="border-2 overflow-hidden">
                  {/* Header del wizard */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Bloque #{itemIndex + 1}
                          </Badge>
                          {item.tipoConfiguracion && (
                            <span className="text-sm font-semibold text-muted-foreground">
                              {item.tipoConfiguracion === 'sinEscalas' ? "📝 Sin escalas" : "📊 Con escalas"}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold">
                          {STEPS[item.currentStep].icon} {STEPS[item.currentStep].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {STEPS[item.currentStep].description}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        Paso {item.currentStep} de {maxStep}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* PASO 1: Seleccionar tipo de configuración */}
                    {item.currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                          <p className="text-sm font-medium">
                            ✅ Tipo: {item.tipoConfiguracion === 'sinEscalas' ? "Sin escalas (comentarios siempre activos)" : "Con escalas numéricas"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PASO 2: Escalas (solo para con escalas) */}
                    {item.currentStep === 2 && item.tipoConfiguracion === 'conEscalas' && (
                      <div className="space-y-4">
                        {Object.entries(escalasPorTipo).map(([tipo, escalasGrupo]) => {
                          const esActual = escalasGrupo[0]?.es_configuracion_actual;
                          return (
                            <Collapsible
                              key={tipo}
                              open={escalasExpandidas[tipo]}
                              onOpenChange={(open) => setEscalasExpandidas(prev => ({ ...prev, [tipo]: open }))}
                            >
                              <Card className={`transition-all ${esActual ? 'border-primary/50 shadow-sm bg-primary/5' : 'border-muted'}`}>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {escalasExpandidas[tipo] ? 
                                        <ChevronDown className="h-5 w-5 text-primary" /> : 
                                        <ChevronRight className="h-5 w-5" />
                                      }
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">{tipo}</span>
                                          {esActual && <Badge variant="default" className="text-xs">Actual</Badge>}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {escalasGrupo.length} escala{escalasGrupo.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    {(() => {
                                      const seleccionadas = escalasGrupo.filter(e => item.escalaIds.includes(e.id)).length;
                                      return seleccionadas > 0 ? (
                                        <Badge variant="default" className="gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {seleccionadas}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20">
                                    {escalasGrupo.map((escala) => {
                                      const isSelected = item.escalaIds.includes(escala.id);
                                      return (
                                        <label
                                          key={escala.id}
                                          className={`flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                                            isSelected 
                                              ? 'border-primary bg-primary/10 shadow-sm' 
                                              : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                          }`}
                                        >
                                          <div className="flex items-start gap-2">
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => toggleEscala(item.id, escala.id)}
                                              className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                              <div className="font-semibold text-sm">
                                                {escala.nombre}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {escala.sigla}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="ml-6">
                                            <Badge variant="secondary" className="text-xs">
                                              {escala.puntaje} pts
                                            </Badge>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}

                    {/* PASO 2: Aspectos (solo para sin escalas) */}
                    {item.currentStep === 2 && item.tipoConfiguracion === 'sinEscalas' && (
                      <div className="space-y-4">
                        {Object.entries(aspectosPorTipo).map(([tipo, aspectosGrupo]) => {
                          const esActual = aspectosGrupo[0]?.es_configuracion_actual;
                          const aspectosDelItem = item.aspectos.filter(a => aspectosGrupo.some(ag => ag.id === a.id));
                          
                          return (
                            <Collapsible
                              key={tipo}
                              open={aspectosExpandidos[tipo]}
                              onOpenChange={(open) => setAspectosExpandidos(prev => ({ ...prev, [tipo]: open }))}
                            >
                              <Card className={`transition-all ${esActual ? 'border-primary/50 shadow-sm bg-primary/5' : 'border-muted'}`}>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {aspectosExpandidos[tipo] ? 
                                        <ChevronDown className="h-5 w-5 text-primary" /> : 
                                        <ChevronRight className="h-5 w-5" />
                                      }
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">{tipo}</span>
                                          {esActual && <Badge variant="default" className="text-xs">Actual</Badge>}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {aspectosGrupo.length} aspecto{aspectosGrupo.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    {(() => {
                                      const seleccionados = aspectosDelItem.filter(a => a.selected).length;
                                      return seleccionados > 0 ? (
                                        <Badge variant="default" className="gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {seleccionados}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 pt-2 bg-muted/20">
                                    <div className="rounded-lg border-2 border-muted bg-background overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-primary/10">
                                            <TableHead className="w-[60px] font-bold">✓</TableHead>
                                            <TableHead className="font-bold">Aspecto</TableHead>
                                            <TableHead className="w-[150px] font-bold text-center">⚠️ Obligatorio</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {aspectosDelItem.map((asp) => {
                                            const aspecto = aspectosById.get(asp.id);
                                            return (
                                              <TableRow 
                                                key={asp.id}
                                                className={asp.selected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50'}
                                              >
                                                <TableCell>
                                                  <Checkbox
                                                    checked={asp.selected}
                                                    onCheckedChange={(value) =>
                                                      updateAspecto(item.id, asp.id, {
                                                        selected: Boolean(value),
                                                      })
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex flex-col gap-1.5">
                                                    <span className="font-semibold text-sm">
                                                      {aspecto?.nombre ?? `Aspecto #${asp.id}`}
                                                    </span>
                                                    {aspecto?.descripcion && (
                                                      <span className="text-xs text-muted-foreground line-clamp-2">
                                                        {aspecto.descripcion}
                                                      </span>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                      checked={asp.es_cmt_oblig}
                                                      disabled={!asp.selected}
                                                      onCheckedChange={(value) =>
                                                        updateAspecto(item.id, asp.id, {
                                                          es_cmt_oblig: Boolean(value),
                                                        })
                                                      }
                                                    />
                                                    <span className="text-sm font-medium">
                                                      {asp.es_cmt_oblig ? "✓" : "✗"}
                                                    </span>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}

                    {/* PASO 3: Aspectos */}
                    {item.currentStep === 3 && item.tipoConfiguracion === 'conEscalas' && (
                      <div className="space-y-4">
                        {Object.entries(aspectosPorTipo).map(([tipo, aspectosGrupo]) => {
                          const esActual = aspectosGrupo[0]?.es_configuracion_actual;
                          const aspectosDelItem = item.aspectos.filter(a => aspectosGrupo.some(ag => ag.id === a.id));
                          
                          return (
                            <Collapsible
                              key={tipo}
                              open={aspectosExpandidos[tipo]}
                              onOpenChange={(open) => setAspectosExpandidos(prev => ({ ...prev, [tipo]: open }))}
                            >
                              <Card className={`transition-all ${esActual ? 'border-primary/50 shadow-sm bg-primary/5' : 'border-muted'}`}>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {aspectosExpandidos[tipo] ? 
                                        <ChevronDown className="h-5 w-5 text-primary" /> : 
                                        <ChevronRight className="h-5 w-5" />
                                      }
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">{tipo}</span>
                                          {esActual && <Badge variant="default" className="text-xs">Actual</Badge>}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {aspectosGrupo.length} aspecto{aspectosGrupo.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    {(() => {
                                      const seleccionados = aspectosDelItem.filter(a => a.selected).length;
                                      return seleccionados > 0 ? (
                                        <Badge variant="default" className="gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {seleccionados}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 pt-2 bg-muted/20">
                                    <div className="rounded-lg border-2 border-muted bg-background overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-primary/10">
                                            <TableHead className="w-[60px] font-bold">✓</TableHead>
                                            <TableHead className="font-bold">Aspecto</TableHead>
                                            {!item.es_pregunta_abierta && (
                                              <>
                                                <TableHead className="w-[150px] font-bold text-center">💬 Comentario</TableHead>
                                                <TableHead className="w-[150px] font-bold text-center">⚠️ Obligatorio</TableHead>
                                              </>
                                            )}
                                            {item.es_pregunta_abierta && (
                                              <TableHead className="w-[150px] font-bold text-center">⚠️ Comentario obligatorio</TableHead>
                                            )}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {aspectosDelItem.map((asp) => {
                                            const aspecto = aspectosById.get(asp.id);
                                            return (
                                              <TableRow 
                                                key={asp.id}
                                                className={asp.selected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50'}
                                              >
                                                <TableCell>
                                                  <Checkbox
                                                    checked={asp.selected}
                                                    onCheckedChange={(value) =>
                                                      updateAspecto(item.id, asp.id, {
                                                        selected: Boolean(value),
                                                      })
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex flex-col gap-1.5">
                                                    <span className="font-semibold text-sm">
                                                      {aspecto?.nombre ?? `Aspecto #${asp.id}`}
                                                    </span>
                                                    {aspecto?.descripcion && (
                                                      <span className="text-xs text-muted-foreground line-clamp-2">
                                                        {aspecto.descripcion}
                                                      </span>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                {!item.es_pregunta_abierta && (
                                                  <>
                                                    <TableCell className="text-center">
                                                      <div className="flex items-center justify-center gap-2">
                                                        <Switch
                                                          checked={asp.es_cmt}
                                                          disabled={!asp.selected}
                                                          onCheckedChange={(value) =>
                                                            updateAspecto(item.id, asp.id, {
                                                              es_cmt: Boolean(value),
                                                              es_cmt_oblig: Boolean(value) && asp.es_cmt_oblig,
                                                            })
                                                          }
                                                        />
                                                        <span className="text-sm font-medium">
                                                          {asp.es_cmt ? "✓" : "✗"}
                                                        </span>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                      <div className="flex items-center justify-center gap-2">
                                                        <Switch
                                                          checked={asp.es_cmt_oblig}
                                                          disabled={!asp.selected || !asp.es_cmt}
                                                          onCheckedChange={(value) =>
                                                            updateAspecto(item.id, asp.id, {
                                                              es_cmt_oblig: Boolean(value),
                                                              es_cmt: true,
                                                            })
                                                          }
                                                        />
                                                        <span className="text-sm font-medium">
                                                          {asp.es_cmt_oblig ? "✓" : "✗"}
                                                        </span>
                                                      </div>
                                                    </TableCell>
                                                  </>
                                                )}
                                                {item.es_pregunta_abierta && (
                                                  <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                      <Switch
                                                        checked={asp.es_cmt_oblig}
                                                        disabled={!asp.selected}
                                                        onCheckedChange={(value) =>
                                                          updateAspecto(item.id, asp.id, {
                                                            es_cmt_oblig: Boolean(value),
                                                          })
                                                        }
                                                      />
                                                      <span className="text-sm font-medium">
                                                        {asp.es_cmt_oblig ? "✓" : "✗"}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                )}
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}



                    {/* PASO 4: Resumen (solo para con escalas) */}
                    {item.currentStep === 4 && item.tipoConfiguracion === 'conEscalas' && (
                      <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg space-y-3">
                          <h4 className="font-semibold text-green-900 dark:text-green-100">✅ Resumen de configuración</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                {item.escalaIds.length} escala{item.escalaIds.length !== 1 ? 's' : ''}
                              </Badge>
                              <span className="text-muted-foreground">
                                {escalasConfiguradas
                                  .filter(e => item.escalaIds.includes(e.id))
                                  .map(e => e.sigla)
                                  .join(", ")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                {item.aspectos.filter(a => a.selected).length} aspecto{item.aspectos.filter(a => a.selected).length !== 1 ? 's' : ''}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.aspectos.some(a => a.es_cmt) ? (
                                <>
                                  <Badge variant="secondary" className="text-xs">Comentarios activos</Badge>
                                  {item.aspectos.some(a => a.es_cmt_oblig) && (
                                    <span className="text-muted-foreground text-xs">Obligatorios</span>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs">Sin comentarios</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 text-destructive bg-destructive/10 border-2 border-destructive/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Error</p>
                          <p className="text-sm">{error}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Footer con botones de navegación */}
                  <div className="border-t-2 bg-muted/30 p-4 flex items-center justify-between gap-3">
                    {/* Mostrar Atrás solo si no está en Step 1 */}
                    {!(item.currentStep === 1 && item.tipoConfiguracion === null) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToPrev(item.id)}
                        disabled={item.currentStep === 1}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Atrás
                      </Button>
                    )}

                    {item.currentStep === maxStep ? (
                      <div className="text-xs text-muted-foreground">
                        ✅ Configuración completada
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Paso {item.currentStep} de {maxStep}
                      </div>
                    )}

                    {/* Mostrar Siguiente solo si tipo está seleccionado y no es el último paso */}
                    {!(item.currentStep === 1 && item.tipoConfiguracion === null) && item.currentStep < maxStep && (
                      <Button
                        type="button"
                        onClick={() => goToNext(item.id)}
                        className="gap-2"
                      >
                        Siguiente
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isLoadingConfig}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingConfig || !allItemsCompleted()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Guardar configuración
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
