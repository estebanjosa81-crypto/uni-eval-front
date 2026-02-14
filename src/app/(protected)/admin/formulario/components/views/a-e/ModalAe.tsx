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
import { AlertCircle, Plus, Settings, Trash2 } from "lucide-react";
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
  es_pregunta_abierta: boolean;
  escalaIds: number[];
  escalaOpen: { es_cmt: boolean; es_cmt_oblig: boolean };
  aspectos: AspectoState[];
}

const createAspectosState = (aspectos: AspectoEnriquecido[]): AspectoState[] =>
  aspectos.map((a) => ({
    id: a.id,
    selected: false,
    es_cmt: false,
    es_cmt_oblig: false,
  }));

const createItem = (aspectos: AspectoEnriquecido[], es_pregunta_abierta: boolean): AeItemState => ({
  id: `${Date.now()}-${Math.random()}`,
  es_pregunta_abierta,
  escalaIds: [],
  escalaOpen: { es_cmt: true, es_cmt_oblig: false },
  aspectos: createAspectosState(aspectos),
});

export function ModalAe({ isOpen, onClose, onSuccess, cfgTId, aspectos, escalas }: ModalAeProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<AeItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [aspectosConfigurados, setAspectosConfigurados] = useState<AspectoEnriquecido[]>([]);
  const [escalasConfiguradas, setEscalasConfiguradas] = useState<EscalaEnriquecida[]>([]);

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
        setItems([
          createItem(aspectosCfg, false),
          createItem(aspectosCfg, true),
        ]);

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

  const updateItem = (itemId: string, updates: Partial<AeItemState>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
  };

  const updateAspecto = (itemId: string, aspectoId: number, updates: Partial<AspectoState>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          aspectos: it.aspectos.map((a) =>
            a.id === aspectoId ? { ...a, ...updates } : a
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

  const addItem = (isOpenQuestion: boolean) => {
    setItems((prev) => [...prev, createItem(aspectosConfigurados, isOpenQuestion)]);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
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
      const selectedAspectos = item.aspectos.filter((a) => a.selected);
      if (selectedAspectos.length === 0) {
        setError("Cada bloque debe tener al menos un aspecto seleccionado");
        return false;
      }
      if (!item.es_pregunta_abierta && escalasConfiguradas.length === 0) {
        setError("No hay escalas configuradas para preguntas cerradas");
        return false;
      }
      if (!item.es_pregunta_abierta && item.escalaIds.length === 0) {
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
            ? [{ id: null, es_cmt: item.escalaOpen.es_cmt, es_cmt_oblig: item.escalaOpen.es_cmt_oblig }]
            : item.escalaIds,
          aspectos: item.aspectos
            .filter((a) => a.selected)
            .map((a) => ({
              id: a.id,
              es_cmt: a.es_cmt,
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                Configurar Aspectos y Escalas (A/E)
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define qué escalas aplican por aspecto y si la pregunta es abierta
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => addItem(false)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar pregunta cerrada
            </Button>
            <Button type="button" variant="outline" onClick={() => addItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar pregunta abierta
            </Button>
          </div>

          {items.map((item, index) => (
            <Card key={item.id} className="border shadow-none bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {item.es_pregunta_abierta ? "Pregunta abierta" : "Pregunta cerrada"} #{index + 1}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.es_pregunta_abierta
                        ? "Sin escalas numéricas"
                        : "Selecciona escalas aplicables"}
                    </p>
                  </div>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {!item.es_pregunta_abierta ? (
                  <div className="space-y-2">
                    <Label>Escalas</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {escalasConfiguradas.map((escala) => (
                        <label
                          key={escala.id}
                          className={`flex flex-col gap-1 rounded-md border p-2 text-sm cursor-pointer transition-colors ${
                            escala.es_configuracion_actual 
                              ? 'bg-primary/5 border-primary/40' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={item.escalaIds.includes(escala.id)}
                              onCheckedChange={() => toggleEscala(item.id, escala.id)}
                            />
                            <span className="font-medium">
                              {escala.sigla} - {escala.nombre}
                            </span>
                          </div>
                          <div className="ml-6 flex flex-wrap items-center gap-1">
                            {escala.es_configuracion_actual ? (
                              <Badge variant="default" className="text-xs">
                                Actual
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {escala.tipo_evaluacion}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Puntaje: {escala.puntaje}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Configuración de comentario (pregunta abierta)</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.escalaOpen.es_cmt}
                          onCheckedChange={(value) =>
                            updateItem(item.id, {
                              escalaOpen: {
                                ...item.escalaOpen,
                                es_cmt: Boolean(value),
                                es_cmt_oblig: item.escalaOpen.es_cmt_oblig && Boolean(value),
                              },
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">Permitir comentario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.escalaOpen.es_cmt_oblig}
                          onCheckedChange={(value) =>
                            updateItem(item.id, {
                              escalaOpen: {
                                ...item.escalaOpen,
                                es_cmt_oblig: Boolean(value),
                                es_cmt: item.escalaOpen.es_cmt || Boolean(value),
                              },
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">Comentario obligatorio</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Aspectos</Label>
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Sel.</TableHead>
                          <TableHead>Aspecto</TableHead>
                          <TableHead className="w-[160px]">Comentario</TableHead>
                          <TableHead className="w-[200px]">Comentario obligatorio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.aspectos.map((asp) => {
                          const aspecto = aspectosById.get(asp.id);
                          return (
                            <TableRow 
                              key={asp.id}
                              className={aspecto?.es_configuracion_actual ? 'bg-primary/5' : ''}
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
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {aspecto?.nombre ?? `Aspecto #${asp.id}`}
                                  </span>
                                  {aspecto && (
                                    aspecto.es_configuracion_actual ? (
                                      <Badge variant="default" className="text-xs w-fit">
                                        Actual
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs w-fit">
                                        {aspecto.tipo_evaluacion}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={asp.es_cmt}
                                    disabled={!asp.selected}
                                    onCheckedChange={(value) =>
                                      updateAspecto(item.id, asp.id, {
                                        es_cmt: Boolean(value),
                                        es_cmt_oblig: asp.es_cmt_oblig && Boolean(value),
                                      })
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {asp.es_cmt ? "Sí" : "No"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={asp.es_cmt_oblig}
                                    disabled={!asp.selected}
                                    onCheckedChange={(value) =>
                                      updateAspecto(item.id, asp.id, {
                                        es_cmt_oblig: Boolean(value),
                                        es_cmt: asp.es_cmt || Boolean(value),
                                      })
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {asp.es_cmt_oblig ? "Sí" : "No"}
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
              </CardContent>
            </Card>
          ))}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
