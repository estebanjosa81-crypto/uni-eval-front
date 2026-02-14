import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { type AspectoConEscalas, type CfgAItem, aEService, configuracionEvaluacionService, type ConfiguracionCfgACfgEResponse } from "@/src/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ModalConfirmacion } from "@/src/app/(protected)/admin/formulario/components/ModalConfirmacion";
import { ModalEditarAspectoEscala } from "./ModalEditarAspectoEscala";

interface CfgAItemEnriquecido extends CfgAItem {
  tipo_evaluacion?: string;
  es_configuracion_actual?: boolean;
}

interface AeViewProps {
  aspectosConEscalas: AspectoConEscalas[];
  configuracionAspectos: CfgAItem[];
  cfgTId: number;
  setModalAe: (value: any) => void;
  onConfigUpdated?: () => void;
}

export function AeView({
  aspectosConEscalas,
  configuracionAspectos,
  cfgTId,
  setModalAe,
  onConfigUpdated,
}: AeViewProps) {
  const { toast } = useToast();
  const [expandedAspecto, setExpandedAspecto] = useState<number | null>(
    aspectosConEscalas.length > 0 ? aspectosConEscalas[0].id : null
  );
  const [deleteOpcionId, setDeleteOpcionId] = useState<number | null>(null);
  const [deleteAspectoCfgAId, setDeleteAspectoCfgAId] = useState<number | null>(null);
  const [deleteAspectoNombre, setDeleteAspectoNombre] = useState<string>("");
  const [editOpcionId, setEditOpcionId] = useState<number | null>(null);
  const [editAspecto, setEditAspecto] = useState<AspectoConEscalas | null>(null);
  const [newAspectoCfgAId, setNewAspectoCfgAId] = useState<string>("");
  const [isUpdatingAspecto, setIsUpdatingAspecto] = useState(false);
  const [aspectosGlobales, setAspectosGlobales] = useState<CfgAItemEnriquecido[]>([]);
  const [isLoadingAspectos, setIsLoadingAspectos] = useState(false);

  useEffect(() => {
    loadAspectosGlobales();
  }, []);

  const loadAspectosGlobales = async () => {
    setIsLoadingAspectos(true);
    try {
      const response = await configuracionEvaluacionService.getCfgACfgE();
      if (response.success && response.data && Array.isArray(response.data)) {
        // Consolidar todos los cfg_a únicos de todas las configuraciones
        const aspectosMap = new Map<number, CfgAItemEnriquecido>();
        response.data.forEach((config: ConfiguracionCfgACfgEResponse) => {
          const tipoEvalNombre = config.tipo_evaluacion?.tipo?.nombre || 'Sin tipo';
          const categoriaNombre = config.tipo_evaluacion?.categoria?.nombre || '';
          const tipoCompleto = categoriaNombre ? `${categoriaNombre} - ${tipoEvalNombre}` : tipoEvalNombre;
          
          config.cfg_a
            .filter((a) => a.es_activo)
            .forEach((a) => {
              if (!aspectosMap.has(a.id)) {
                aspectosMap.set(a.id, {
                  ...a,
                  tipo_evaluacion: tipoCompleto,
                  es_configuracion_actual: a.cfg_t_id === cfgTId,
                });
              }
            });
        });
        const aspectosArray = Array.from(aspectosMap.values()).sort((a, b) => {
          // Primero los de la configuración actual
          if (a.es_configuracion_actual !== b.es_configuracion_actual) {
            return a.es_configuracion_actual ? -1 : 1;
          }
          return (a.aspecto?.nombre || '').localeCompare(b.aspecto?.nombre || '');
        });
        setAspectosGlobales(aspectosArray);
      }
    } catch (error) {
      console.error("Error loading aspectos globales:", error);
    } finally {
      setIsLoadingAspectos(false);
    }
  };

  const totalOpciones = aspectosConEscalas.reduce(
    (sum, aspecto) => sum + aspecto.opciones.length,
    0
  );

  const toggleAspecto = (id: number) => {
    setExpandedAspecto(expandedAspecto === id ? null : id);
  };

  const handleDeleteOpcion = async () => {
    if (!deleteOpcionId) return;
    try {
      const response = await aEService.delete(deleteOpcionId);
      if (response.success) {
        toast({
          title: "Opción eliminada",
          description: "La relación aspecto-escala fue eliminada correctamente",
        });
        onConfigUpdated?.();
      } else {
        throw new Error(response.error?.message || "No se pudo eliminar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la opción",
      });
    } finally {
      setDeleteOpcionId(null);
    }
  };

  const handleDeleteAspecto = async () => {
    if (!deleteAspectoCfgAId) return;
    try {
      const response = await aEService.deleteAspecto(deleteAspectoCfgAId, cfgTId);
      if (response.success) {
        toast({
          title: "Aspecto eliminado",
          description: "El aspecto y sus escalas fueron eliminados correctamente",
        });
        onConfigUpdated?.();
      } else {
        throw new Error(response.error?.message || "No se pudo eliminar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el aspecto",
      });
    } finally {
      setDeleteAspectoCfgAId(null);
      setDeleteAspectoNombre("");
    }
  };

  const openEditAspecto = (aspecto: AspectoConEscalas) => {
    const candidates = aspectosGlobales.filter((item) => item.id !== aspecto.cfg_a_id);
    setNewAspectoCfgAId(candidates.length > 0 ? String(candidates[0].id) : "");
    setEditAspecto(aspecto);
  };

  const handleUpdateAspecto = async () => {
    if (!editAspecto) return;
    if (!newAspectoCfgAId) {
      toast({
        variant: "destructive",
        title: "Falta seleccionar",
        description: "Debes seleccionar un nuevo aspecto",
      });
      return;
    }

    const newId = parseInt(newAspectoCfgAId, 10);
    if (newId === editAspecto.cfg_a_id) {
      toast({
        variant: "destructive",
        title: "Selección inválida",
        description: "El nuevo aspecto debe ser diferente al actual",
      });
      return;
    }

    setIsUpdatingAspecto(true);
    try {
      const response = await aEService.updateAspecto({
        oldAspectoId: editAspecto.cfg_a_id,
        newAspectoId: newId,
        cfgTId,
      });

      if (response.success) {
        toast({
          title: "Aspecto actualizado",
          description: "La relación fue actualizada correctamente",
        });
        onConfigUpdated?.();
        setEditAspecto(null);
        setNewAspectoCfgAId("");
      } else {
        throw new Error(response.error?.message || "No se pudo actualizar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el aspecto",
      });
    } finally {
      setIsUpdatingAspecto(false);
    }
  };

  const findOpcionByAeId = (aeId: number) => {
    for (const aspecto of aspectosConEscalas) {
      const opcion = aspecto.opciones.find((opt) => opt.a_e_id === aeId);
      if (opcion) return opcion;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Relación Aspecto - Escala</CardTitle>
              <CardDescription>
                Aspectos configurados con sus escalas de evaluación
              </CardDescription>
            </div>
            <Button onClick={() => setModalAe({ isOpen: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Configurar A/E
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">
              Aspectos: {aspectosConEscalas.length}
            </Badge>
            <Badge variant="outline">
              Opciones: {totalOpciones}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {aspectosConEscalas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay aspectos configurados</p>
            <Button onClick={() => setModalAe({ isOpen: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Configurar Primer Aspecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {aspectosConEscalas.map((aspecto) => (
            <Card key={aspecto.id} className="overflow-hidden">
              <div
                onClick={() => toggleAspecto(aspecto.id)}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{aspecto.nombre}</h3>
                    {aspecto.es_activo && (
                      <Badge variant="default" className="text-xs">
                        Activo
                      </Badge>
                    )}
                    {aspecto.es_cmt && (
                      <Badge variant="secondary" className="text-xs">
                        Comentario
                      </Badge>
                    )}
                    {aspecto.es_cmt_oblig && (
                      <Badge variant="destructive" className="text-xs">
                        Comentario Obligatorio
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {aspecto.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orden: {aspecto.orden} • Opciones: {aspecto.opciones.length}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditAspecto(aspecto);
                    }}
                    disabled={aspectosGlobales.length <= 1 || isLoadingAspectos}
                    title="Editar aspecto"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteAspectoCfgAId(aspecto.cfg_a_id);
                      setDeleteAspectoNombre(aspecto.nombre);
                    }}
                    title="Eliminar aspecto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {expandedAspecto === aspecto.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedAspecto === aspecto.id && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Escalas de Evaluación
                    </p>
                    {aspecto.opciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No hay opciones configuradas
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {aspecto.opciones.map((opcion) => (
                          <div
                            key={opcion.id}
                            className="p-3 rounded-lg border border-muted-foreground/20 bg-background"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {opcion.sigla}
                                </Badge>
                                <h4 className="font-semibold text-sm">
                                  {opcion.nombre}
                                </h4>
                                {opcion.puntaje && (
                                  <Badge variant="secondary" className="text-xs">
                                    {opcion.puntaje} pts
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground mr-2">
                                  Orden: {opcion.orden}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditOpcionId(opcion.a_e_id);
                                  }}
                                  title="Editar opción"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteOpcionId(opcion.a_e_id);
                                  }}
                                  title="Eliminar opción"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {opcion.descripcion && (
                              <p className="text-xs text-muted-foreground">
                                {opcion.descripcion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ModalConfirmacion
        isOpen={Boolean(deleteOpcionId)}
        onClose={() => setDeleteOpcionId(null)}
        onConfirm={handleDeleteOpcion}
        title="Eliminar opción aspecto-escala"
        description="¿Estás seguro de eliminar esta relación? Esta acción no se puede deshacer."
      />

      <ModalConfirmacion
        isOpen={Boolean(deleteAspectoCfgAId)}
        onClose={() => {
          setDeleteAspectoCfgAId(null);
          setDeleteAspectoNombre("");
        }}
        onConfirm={handleDeleteAspecto}
        title="Eliminar aspecto"
        description={
          deleteAspectoNombre
            ? `¿Eliminar el aspecto "${deleteAspectoNombre}" y todas sus escalas?`
            : "¿Eliminar el aspecto y todas sus escalas?"
        }
      />

      <Dialog
        open={Boolean(editAspecto)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingAspecto) {
            setEditAspecto(null);
            setNewAspectoCfgAId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar aspecto</DialogTitle>
            <DialogDescription>
              Selecciona un nuevo aspecto para reemplazar el actual en esta configuración.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Nuevo aspecto</Label>
            <Select value={newAspectoCfgAId} onValueChange={setNewAspectoCfgAId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un aspecto" />
              </SelectTrigger>
              <SelectContent>
                {aspectosGlobales
                  .filter((item) => item.id !== editAspecto?.cfg_a_id)
                  .map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      <div className="flex items-center gap-2">
                        <span>{item.aspecto?.nombre ?? `Aspecto #${item.aspecto_id}`}</span>
                        {item.es_configuracion_actual ? (
                          <Badge variant="default" className="text-xs ml-2">
                            Actual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {item.tipo_evaluacion}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isLoadingAspectos && (
              <p className="text-xs text-muted-foreground">Cargando aspectos disponibles...</p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!isUpdatingAspecto) {
                  setEditAspecto(null);
                  setNewAspectoCfgAId("");
                }
              }}
              disabled={isUpdatingAspecto}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateAspecto} disabled={isUpdatingAspecto}>
              {isUpdatingAspecto ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalEditarAspectoEscala
        isOpen={Boolean(editOpcionId)}
        onClose={() => setEditOpcionId(null)}
        onSuccess={() => {
          setEditOpcionId(null);
          onConfigUpdated?.();
        }}
        opcion={findOpcionByAeId(editOpcionId || 0)}
        cfgTId={cfgTId}
      />
    </div>
  );
}
