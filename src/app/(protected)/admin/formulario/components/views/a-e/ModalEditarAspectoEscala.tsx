import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { BaseModal } from "@/components/modals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit3, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  aEService,
  configuracionEvaluacionService,
  type AspectoEscalaOpcion,
  type CfgEItem,
  type ConfiguracionCfgACfgEResponse,
} from "@/src/api";

interface ModalEditarAspectoEscalaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  opcion: AspectoEscalaOpcion | null;
  cfgTId?: number; // ID de la configuración actual para resaltar escalas
}

interface FormData {
  escala_id: number;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

interface CfgEItemEnriquecido extends CfgEItem {
  tipo_evaluacion?: string;
  es_configuracion_actual?: boolean;
}

export function ModalEditarAspectoEscala({
  isOpen,
  onClose,
  onSuccess,
  opcion,
  cfgTId,
}: ModalEditarAspectoEscalaProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    escala_id: 0,
    es_cmt: false,
    es_cmt_oblig: false,
  });
  const [escalasGlobales, setEscalasGlobales] = useState<CfgEItemEnriquecido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && opcion) {
      setFormData({
        escala_id: 0, // Se seleccionará desde las escalas globales
        es_cmt: false,
        es_cmt_oblig: false,
      });
      loadEscalasGlobales();
      setError(null);
    }
  }, [isOpen, opcion]);

  const loadEscalasGlobales = async () => {
    setIsLoading(true);
    try {
      const response = await configuracionEvaluacionService.getCfgACfgE();
      if (response.success && response.data && Array.isArray(response.data)) {
        // Consolidar todas las escalas únicas de todas las configuraciones
        const escalasMap = new Map<number, CfgEItemEnriquecido>();
        response.data.forEach((config: ConfiguracionCfgACfgEResponse) => {
          const tipoEvalNombre = config.tipo_evaluacion?.tipo?.nombre || 'Sin tipo';
          const categoriaNombre = config.tipo_evaluacion?.categoria?.nombre || '';
          const tipoCompleto = categoriaNombre ? `${categoriaNombre} - ${tipoEvalNombre}` : tipoEvalNombre;
          
          config.cfg_e
            .filter((e) => e.es_activo)
            .forEach((e) => {
              if (!escalasMap.has(e.id)) {
                escalasMap.set(e.id, {
                  ...e,
                  tipo_evaluacion: tipoCompleto,
                  es_configuracion_actual: cfgTId ? e.cfg_t_id === cfgTId : false,
                });
              }
            });
        });
        setEscalasGlobales(Array.from(escalasMap.values()).sort((a, b) => {
          // Primero las de la configuración actual
          if (a.es_configuracion_actual !== b.es_configuracion_actual) {
            return a.es_configuracion_actual ? -1 : 1;
          }
          return (a.escala?.nombre ?? '').localeCompare(b.escala?.nombre ?? '');
        }));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las escalas disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEscala = (cfgEId: number) => {
    setFormData((prev) => ({
      ...prev,
      escala_id: cfgEId,
    }));
  };

  const validate = () => {
    if (formData.escala_id <= 0) {
      setError("Debes seleccionar una escala");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !opcion || !opcion.a_e_id) return;

    setIsLoading(true);
    try {
      const payload = {
        escala_id: formData.escala_id,
        es_cmt: formData.es_cmt,
        es_cmt_oblig: formData.es_cmt_oblig,
      };

      const response = await aEService.update(opcion.a_e_id, payload);

      if (response.success) {
        toast({
          title: "Opción actualizada",
          description: "Los cambios fueron guardados correctamente",
        });
        await Promise.resolve(onSuccess());
        onClose();
      } else {
        throw new Error(response.error?.message || "No se pudo actualizar la opción");
      }
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err.message || "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError(null);
    }
  };

  if (!opcion) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Opción Aspecto-Escala"
      description="Selecciona una escala diferente o actualiza las opciones de comentario"
      icon={Edit3}
      size="xl"
      closeOnOverlayClick={!isLoading}
      showCloseButton={!isLoading}
      footer={
        <div className="flex w-full gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      <Card className="border shadow-none bg-muted/20">
          <CardContent className="p-4 space-y-4">
            {/* Información del aspecto y escala actual */}
            <div className="space-y-2">
              <div className="p-3 bg-background rounded-lg border">
                <Label className="text-xs text-muted-foreground">Escala Actual</Label>
                <p className="font-semibold mt-1">
                  {opcion.sigla && opcion.nombre
                    ? `${opcion.sigla} - ${opcion.nombre}`
                    : `Escala #${opcion.id}`}
                </p>
                {opcion.descripcion && (
                  <p className="text-sm text-muted-foreground mt-1">{opcion.descripcion}</p>
                )}
              </div>
            </div>

            {/* Selección de Escala */}
            <div className="space-y-3">
              <Label className="font-semibold">Seleccionar Escala</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cargando escalas disponibles...
                </div>
              ) : escalasGlobales.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  No hay escalas disponibles
                </div>
              ) : (
                <div className="space-y-2">
                  {escalasGlobales.map((cfgE) => (
                    <div
                      key={cfgE.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.escala_id === cfgE.id
                          ? "bg-primary/10 border-primary"
                          : cfgE.es_configuracion_actual
                          ? "bg-primary/5 border-primary/40 hover:bg-primary/10"
                          : "bg-background hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectEscala(cfgE.id)}
                    >
                      <Checkbox
                        checked={formData.escala_id === cfgE.id}
                        onCheckedChange={() => handleSelectEscala(cfgE.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">
                            {cfgE.escala?.sigla && cfgE.escala?.nombre
                              ? `${cfgE.escala.sigla} - ${cfgE.escala.nombre}`
                              : `Escala #${cfgE.escala_id}`}
                          </p>
                          {cfgE.es_configuracion_actual ? (
                            <Badge variant="default" className="text-xs">
                              Actual
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {cfgE.tipo_evaluacion}
                            </Badge>
                          )}
                        </div>
                        {cfgE.escala?.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {cfgE.escala.descripcion}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Puntaje: {cfgE.puntaje}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Orden: {cfgE.orden}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

    </BaseModal>
  );
}
