import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { BaseModal } from "@/components/modals";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { AlertCircle, Edit3, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  configuracionAspectoService,
  categoriaAspectoMapService,
  categoriaAspectoService,
  type CfgAItem,
  type CategoriaAspecto,
  type AspectoMapItem,
} from "@/src/api";

interface ModalEditarConfiguracionAspectoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  configuracion: CfgAItem | null;
}

interface FormData {
  cfg_t_id: number;
  aspecto_id: number;
  orden: number;
  es_activo: boolean;
}

interface AspectoRow {
  map_id: number;
  nombre?: string;
  descripcion?: string | null;
}

export function ModalEditarConfiguracionAspecto({
  isOpen,
  onClose,
  onSuccess,
  configuracion,
}: ModalEditarConfiguracionAspectoProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    cfg_t_id: 0,
    aspecto_id: 0,
    orden: 1,
    es_activo: true,
  });
  const [categorias, setCategorias] = useState<CategoriaAspecto[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<number[]>([]);
  const [rowsByCategory, setRowsByCategory] = useState<Record<number, AspectoRow[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && configuracion) {
      setFormData({
        cfg_t_id: configuracion.cfg_t_id,
        aspecto_id: configuracion.aspecto_id,
        orden: Number(configuracion.orden) || 1,
        es_activo: configuracion.es_activo,
      });
      loadCategorias();
      setError(null);
    }
  }, [isOpen, configuracion]);

  const loadCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await categoriaAspectoService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const cats = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setCategorias(cats);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategoria = async (categoriaId: number) => {
    const categoria = categorias.find((cat) => cat.id === categoriaId) || null;
    if (!categoria) return;

    const isOpen = openCategoryIds.includes(categoriaId);
    setOpenCategoryIds((prev) =>
      isOpen ? prev.filter((id) => id !== categoriaId) : [...prev, categoriaId]
    );

    if (rowsByCategory[categoriaId]) return;

    setLoadingCategoryId(categoriaId);
    try {
      const response = await categoriaAspectoMapService.listAspectosByCategoria(categoria.id);
      if (response.success && response.data) {
        const items = response.data.items || [];
        const initialRows = items.map((aspecto: AspectoMapItem) => ({
          map_id: aspecto.map_id,
          nombre: aspecto.nombre,
          descripcion: aspecto.descripcion,
        }));
        setRowsByCategory((prev) => ({
          ...prev,
          [categoriaId]: initialRows,
        }));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los aspectos de la categoría",
        variant: "destructive",
      });
    } finally {
      setLoadingCategoryId(null);
    }
  };

  const handleSelectAspecto = (mapId: number) => {
    setFormData((prev) => ({
      ...prev,
      aspecto_id: mapId,
    }));
  };

  const validate = () => {
    if (formData.orden <= 0) {
      setError("El orden debe ser mayor a 0");
      return false;
    }
    if (formData.aspecto_id <= 0) {
      setError("Debes seleccionar un aspecto");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !configuracion) return;

    setIsLoading(true);
    try {
      const payload = {
        cfg_t_id: formData.cfg_t_id,
        aspecto_id: formData.aspecto_id,
        orden: formData.orden,
        es_activo: formData.es_activo,
      };

      const response = await configuracionAspectoService.update(configuracion.id, payload);
      
      if (response.success) {
        toast({
          title: "Configuración actualizada",
          description: "Los cambios fueron guardados correctamente",
        });
        await Promise.resolve(onSuccess());
        onClose();
      } else {
        throw new Error(response.error?.message || "No se pudo actualizar la configuración");
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
      setOpenCategoryIds([]);
      setRowsByCategory({});
    }
  };

  if (!configuracion) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Configuración de Aspecto"
      description="Selecciona un aspecto diferente o actualiza el orden y estado"
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
            {/* Selección de Aspecto */}
            <div className="space-y-3">
              <Label className="font-semibold">Seleccionar Aspecto</Label>
              {categorias.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  No hay categorías disponibles
                </div>
              ) : (
                <div className="space-y-2">
                  {categorias.map((categoria) => {
                    const isOpen = openCategoryIds.includes(categoria.id);
                    const rows = rowsByCategory[categoria.id] ?? [];
                    const isLoadingRows = loadingCategoryId === categoria.id;
                    return (
                      <Card key={categoria.id} className="border bg-background">
                        <CardContent className="p-0">
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/40"
                            onClick={() => handleSelectCategoria(categoria.id)}
                            disabled={isLoading}
                          >
                            <div>
                              <p className="font-semibold text-sm">{categoria.nombre}</p>
                              {categoria.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {categoria.descripcion}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {isOpen ? "Ocultar" : "Ver"}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4">
                              {isLoadingRows ? (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  Cargando aspectos...
                                </div>
                              ) : rows.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  No hay aspectos en esta categoría.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {rows.map((row) => (
                                    <div
                                      key={row.map_id}
                                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        formData.aspecto_id === row.map_id
                                          ? "bg-primary/10 border-primary"
                                          : "bg-background hover:bg-muted/50"
                                      }`}
                                      onClick={() => handleSelectAspecto(row.map_id)}
                                    >
                                      <Checkbox
                                        checked={formData.aspecto_id === row.map_id}
                                        onCheckedChange={() =>
                                          handleSelectAspecto(row.map_id)
                                        }
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          {row.nombre ?? `Aspecto #${row.map_id}`}
                                        </p>
                                        {row.descripcion && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {row.descripcion}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="font-semibold">Configuración</Label>
            </div>

            {/* Campo Orden */}
            <div className="space-y-2">
              <Label htmlFor="orden">Orden *</Label>
              <Input
                id="orden"
                type="number"
                min={1}
                value={formData.orden}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orden: Number(e.target.value),
                  }))
                }
                placeholder="Ej: 1"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Define la posición en que aparecerá este aspecto
              </p>
            </div>

            {/* Campo Estado Activo */}
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="es_activo" className="cursor-pointer">
                  Estado del Aspecto
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.es_activo ? "El aspecto está activo" : "El aspecto está inactivo"}
                </p>
              </div>
              <Switch
                id="es_activo"
                checked={formData.es_activo}
                onCheckedChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    es_activo: Boolean(value),
                  }))
                }
                disabled={isLoading}
              />
            </div>

            {/* Mensaje de error */}
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
