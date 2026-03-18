import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, Loader2, Trash2, HelpCircle, Activity, ChevronRight, Hash } from "lucide-react";
import { type CfgAItem, configuracionAspectoService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ModalConfirmacion } from "@/src/app/(protected)/admin/formulario/components/ModalConfirmacion";
import { ModalEditarConfiguracionAspecto } from "./ModalEditarConfiguracionAspecto";

interface ConfiguracionAspectoViewProps {
  configuraciones: CfgAItem[];
  setModalConfiguracionAspecto: (value: any) => void;
  onConfigUpdated?: () => void | Promise<void>;
}

export function ConfiguracionAspectoView({
  configuraciones,
  setModalConfiguracionAspecto,
  onConfigUpdated,
}: ConfiguracionAspectoViewProps) {
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<CfgAItem | null>(null);
  const [editConfig, setEditConfig] = useState<CfgAItem | null>(null);

  const handleToggleActivo = async (config: CfgAItem) => {
    setTogglingId(config.id);
    try {
      const response = await configuracionAspectoService.toggleField(config.id, "es_activo");
      if (response.success) {
        toast({
          title: "Estado actualizado",
          description: `El aspecto "${config.aspecto?.nombre || ''}" fue ${!config.es_activo ? 'activado' : 'desactivado'}.`,
        });
        await Promise.resolve(onConfigUpdated?.());
      } else {
        throw new Error(response.error?.message || "Error al actualizar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (config: CfgAItem) => {
    setEditConfig(config);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    try {
      const response = await configuracionAspectoService.delete(deleteConfig.id);
      if (response.success) {
        toast({
          title: "Configuración eliminada",
          description: "El aspecto fue removido de esta configuración.",
        });
        await Promise.resolve(onConfigUpdated?.());
      } else {
        throw new Error(response.error?.message || "No se pudo eliminar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la configuración",
      });
    } finally {
      setDeleteConfig(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-4 text-left">
           <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
              <HelpCircle className="h-6 w-6 text-indigo-500" />
           </div>
           <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Inventario de Aspectos</h3>
              <p className="text-[11px] font-medium text-slate-400">Define qué preguntas o criterios forman parte de esta evaluación.</p>
           </div>
        </div>
        <Button 
          onClick={() => setModalConfiguracionAspecto({ isOpen: true })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-11 font-semibold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir Aspecto
        </Button>
      </div>

      <div className="grid gap-4">
        {configuraciones.length === 0 ? (
          <div className="bg-white border border-slate-100 border-dashed rounded-[2.5rem] p-12 text-center">
            <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 font-medium text-sm italic">No hay aspectos vinculados a esta configuración.</p>
          </div>
        ) : (
          configuraciones.sort((a, b) => a.orden - b.orden).map((config) => (
            <Card key={config.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] overflow-hidden bg-white group">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <span className="text-[10px] font-black leading-none mb-0.5">ORD</span>
                    <span className="text-xs font-black leading-none">{config.orden}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {config.aspecto?.nombre ?? `Aspecto #${config.aspecto_id}`}
                      </h4>
                      <Badge className={`border-none rounded-md text-xs font-semibold h-4 ${
                        config.es_activo 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {config.es_activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {config.aspecto?.descripcion && (
                      <p className="text-[11px] font-medium text-slate-400 italic truncate max-w-md">
                        {config.aspecto.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(config)}
                    className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleActivo(config)}
                    disabled={togglingId === config.id}
                    className={`h-9 w-9 rounded-xl transition-colors ${
                      config.es_activo 
                        ? 'hover:bg-amber-50 hover:text-amber-600' 
                        : 'hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {togglingId === config.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteConfig(config)}
                    className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ModalConfirmacion
        isOpen={Boolean(deleteConfig)}
        onClose={() => setDeleteConfig(null)}
        onConfirm={handleDelete}
        title="Desvincular Aspecto"
        description={`¿Estás seguro de remover "${deleteConfig?.aspecto?.nombre || 'este aspecto'}" de la configuración actual?`}
      />
      
      <ModalEditarConfiguracionAspecto
        isOpen={Boolean(editConfig)}
        onClose={() => setEditConfig(null)}
        onSuccess={() => {
          setEditConfig(null);
          onConfigUpdated?.();
        }}
        configuracion={editConfig}
      />
    </div>
  );
}
