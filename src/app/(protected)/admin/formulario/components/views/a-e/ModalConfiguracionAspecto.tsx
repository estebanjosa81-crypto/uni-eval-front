import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { AlertCircle, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  configuracionAspectoService,
  categoriaAspectoService,
  categoriaAspectoMapService,
  type Aspecto,
  type CategoriaAspecto,
  type CfgABulkInput,
  type AspectoMapItem,
} from "@/src/api";

/**
 * Modal para CREAR configuraciones de aspectos en BULK (múltiples a la vez)
 * POST /cfg/a/bulk
 * 
 * Para EDITAR configuraciones individuales, usar ModalEditarConfiguracionAspecto
 */
interface ModalConfiguracionAspectoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  cfgTId?: number | null;
  aspectos: Aspecto[];
}

interface AspectoRow {
  aspecto_id: number;
  orden: number;
  es_activo: boolean;
  selected: boolean;
  nombre?: string;
  descripcion?: string | null;
}

export function ModalConfiguracionAspecto({
  isOpen,
  onClose,
  onSuccess,
  cfgTId,
  aspectos,
}: ModalConfiguracionAspectoProps) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoriaAspecto[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<number[]>([]);
  const [rowsByCategory, setRowsByCategory] = useState<Record<number, AspectoRow[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = Object.values(rowsByCategory)
    .flat()
    .filter((row) => row.selected).length;

  useEffect(() => {
    if (!isOpen) return;
    loadCategorias();
    setOpenCategoryIds([]);
    setRowsByCategory({});
    setError(null);
  }, [isOpen]);

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
      // Obtener aspectos de la categoría
      const response = await categoriaAspectoMapService.listAspectosByCategoria(categoria.id);
      if (response.success && response.data) {
        const items = response.data.items || [];
        const initialRows = items.map((aspecto: AspectoMapItem, index: number) => ({
          aspecto_id: aspecto.map_id, // Usar map_id en lugar de id
          orden: index + 1,
          es_activo: true,
          selected: false,
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

  const updateRow = (categoriaId: number, aspectoId: number, updates: Partial<AspectoRow>) => {
    setRowsByCategory((prev) => {
      const rows = prev[categoriaId] ?? [];
      return {
        ...prev,
        [categoriaId]: rows.map((row) =>
          row.aspecto_id === aspectoId ? { ...row, ...updates } : row
        ),
      };
    });
  };

  const validate = () => {
    if (!cfgTId) {
      setError("Selecciona una configuración válida antes de guardar");
      return false;
    }
    const selected = Object.values(rowsByCategory)
      .flat()
      .filter((row) => row.selected);
    if (selected.length === 0) {
      setError("Debes seleccionar al menos un aspecto");
      return false;
    }
    if (selected.some((row) => Number.isNaN(row.orden) || row.orden <= 0)) {
      setError("El orden debe ser un número mayor a 0");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const selectedItems = Object.values(rowsByCategory)
        .flat()
        .filter((row) => row.selected);
      const payload: CfgABulkInput = {
        cfg_t_id: cfgTId as number,
        items: selectedItems.map(({ aspecto_id, orden, es_activo }) => ({
          aspecto_id,
          orden,
          es_activo,
        })),
      };

      const response = await configuracionAspectoService.bulkCreateCfgA(payload);
      if (response.success) {
        toast({
          title: "Configuración guardada",
          description: "Los aspectos fueron configurados correctamente",
        });
        await Promise.resolve(onSuccess());
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Aspectos"
      description="Selecciona una categoría y configura los aspectos"
      icon={Settings}
      size="xl"
      closeOnOverlayClick={!isLoading}
      showCloseButton={!isLoading}
      footer={
        <div className="flex w-full gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || selectedCount === 0}
              className="flex-1 h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
          >
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      }
    >
      <Card className="border shadow-none bg-muted/20">
          <CardContent className="p-4 space-y-4">
            {categorias.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                No hay categorías disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {categorias.map((categoria) => {
                  const isOpen = openCategoryIds.includes(categoria.id);
                  const rows = rowsByCategory[categoria.id] ?? [];
                  const isLoadingRows = loadingCategoryId === categoria.id;
                  return (
                    <Card
                      key={categoria.id}
                      className="border bg-background"
                    >
                      <CardContent className="p-0">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/40"
                          onClick={() => handleSelectCategoria(categoria.id)}
                          disabled={isLoading}
                        >
                          <div>
                            <p className="font-semibold">{categoria.nombre}</p>
                            {categoria.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {categoria.descripcion}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {isOpen ? "Ocultar" : "Ver aspectos"}
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
                              <div className="rounded-md border bg-background overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[60px]">Sel.</TableHead>
                                      <TableHead>Aspecto</TableHead>
                                      <TableHead className="w-[140px]">Orden</TableHead>
                                      <TableHead className="w-[140px]">Activo</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {rows.map((row) => (
                                      <TableRow key={row.aspecto_id}>
                                        <TableCell>
                                          <Checkbox
                                            checked={row.selected}
                                            onCheckedChange={(value) =>
                                              updateRow(categoria.id, row.aspecto_id, {
                                                selected: Boolean(value),
                                              })
                                            }
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {row.nombre ?? `Aspecto #${row.aspecto_id}`}
                                        </TableCell>
                                        <TableCell>
                                          <Label
                                            className="sr-only"
                                            htmlFor={`orden-${row.aspecto_id}`}
                                          >
                                            Orden
                                          </Label>
                                          <Input
                                            id={`orden-${row.aspecto_id}`}
                                            type="number"
                                            min={1}
                                            value={row.orden}
                                            onChange={(e) =>
                                              updateRow(categoria.id, row.aspecto_id, {
                                                orden: Number(e.target.value),
                                              })
                                            }
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={row.es_activo}
                                              onCheckedChange={(value) =>
                                                updateRow(categoria.id, row.aspecto_id, {
                                                  es_activo: Boolean(value),
                                                })
                                              }
                                            />
                                            <span className="text-xs text-muted-foreground">
                                              {row.es_activo ? "Activo" : "Inactivo"}
                                            </span>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
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

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

    </BaseModal>
  );
}
