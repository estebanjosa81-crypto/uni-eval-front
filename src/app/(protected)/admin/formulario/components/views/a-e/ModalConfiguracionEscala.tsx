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
  configuracionValoracionService,
  categoriaEscalaService,
  categoriaEscalaMapService,
  type Escala,
  type CategoriaEscala,
  type CfgEBulkInput,
  type EscalaMapItem,
} from "@/src/api";

interface ModalConfiguracionEscalaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  cfgTId?: number | null;
  escalas: Escala[];
}

interface EscalaRow {
  escala_id: number;
  puntaje: number;
  orden: number;
  es_activo: boolean;
  selected: boolean;
  sigla?: string;
  nombre?: string;
  descripcion?: string | null;
}

/**
 * Modal para CREAR configuraciones de escalas en BULK (múltiples a la vez)
 * POST /cfg/e/bulk
 *
 * Para EDITAR configuraciones individuales, usar ModalEditarConfiguracionEscala
 */
export function ModalConfiguracionEscala({
  isOpen,
  onClose,
  onSuccess,
  cfgTId,
  escalas,
}: ModalConfiguracionEscalaProps) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoriaEscala[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<number[]>([]);
  const [rowsByCategory, setRowsByCategory] = useState<Record<number, EscalaRow[]>>({});
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
      const response = await categoriaEscalaService.getAll({ page: 1, limit: 100 });
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
      // Obtener escalas de la categoría
      const response = await categoriaEscalaMapService.listEscalasByCategoria(categoria.id);
      if (response.success && response.data) {
        const items = response.data.items || [];
        const initialRows = items.map((escala: EscalaMapItem, index: number) => ({
          escala_id: escala.map_id, // Usar map_id en lugar de id
          puntaje: 0,
          orden: index + 1,
          es_activo: true,
          selected: false,
          sigla: escala.sigla,
          nombre: escala.nombre,
          descripcion: escala.descripcion,
        }));
        setRowsByCategory((prev) => ({
          ...prev,
          [categoriaId]: initialRows,
        }));
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las escalas de la categoría",
        variant: "destructive",
      });
    } finally {
      setLoadingCategoryId(null);
    }
  };

  /**
   * Calcula los puntajes automáticamente basado en el orden
   * Fórmula: Valor = (posición - 1) × (5 / (N - 1))
   * Donde N es el número de escalas seleccionadas
   */
  const calculateScoresByOrder = (rows: EscalaRow[]): EscalaRow[] => {
    const selectedRows = rows.filter((row) => row.selected);

    if (selectedRows.length === 0) {
      return rows.map((row) => ({ ...row, puntaje: 0 }));
    }

    if (selectedRows.length === 1) {
      return rows.map((row) =>
        row.selected ? { ...row, puntaje: 5 } : row
      );
    }

    // Ordenar por el campo orden
    const sortedSelected = [...selectedRows].sort((a, b) => a.orden - b.orden);

    // Calcular puntajes
    const N = selectedRows.length;
    const scoreMap = new Map<number, number>();

    sortedSelected.forEach((row, index) => {
      const posicion = index + 1; // 1-indexed
      const puntaje = (posicion - 1) * (5 / (N - 1));
      scoreMap.set(row.escala_id, Math.round(puntaje * 100) / 100); // Redondear a 2 decimales
    });

    // Aplicar los puntajes calculados a todas las filas
    return rows.map((row) => ({
      ...row,
      puntaje: scoreMap.has(row.escala_id) ? scoreMap.get(row.escala_id)! : row.puntaje,
    }));
  };

  const updateRow = (categoriaId: number, escalaId: number, updates: Partial<EscalaRow>) => {
    setRowsByCategory((prev) => {
      const rows = prev[categoriaId] ?? [];
      
      // Si se está seleccionando una escala, asignar el siguiente orden
      if (updates.selected === true) {
        const maxOrden = rows
          .filter((row) => row.selected)
          .reduce((max, row) => Math.max(max, row.orden), 0);
        
        const updatedRows = rows.map((row) =>
          row.escala_id === escalaId ? { ...row, ...updates, orden: maxOrden + 1 } : row
        );
        
        return {
          ...prev,
          [categoriaId]: calculateScoresByOrder(updatedRows),
        };
      }
      
      // Para otros cambios
      const updatedRows = rows.map((row) =>
        row.escala_id === escalaId ? { ...row, ...updates } : row
      );

      if (updates.orden !== undefined || updates.selected === false) {
        return {
          ...prev,
          [categoriaId]: calculateScoresByOrder(updatedRows),
        };
      }

      return {
        ...prev,
        [categoriaId]: updatedRows,
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
      setError("Debes seleccionar al menos una escala");
      return false;
    }
    if (selected.some((row) => Number.isNaN(row.orden) || row.orden <= 0)) {
      setError("El orden debe ser un número mayor a 0");
      return false;
    }
    if (selected.some((row) => Number.isNaN(row.puntaje))) {
      setError("El puntaje debe ser un número válido");
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
      const payload: CfgEBulkInput = {
        cfg_t_id: cfgTId as number,
        items: selectedItems.map(({ escala_id, puntaje, orden, es_activo }) => ({
          escala_id,
          puntaje,
          orden,
          es_activo,
        })),
      };

      const response = await configuracionValoracionService.bulkCreateCfgE(payload);
      if (response.success) {
        toast({
          title: "Configuración guardada",
          description: "Las escalas fueron configuradas correctamente",
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
      title="Configurar Escalas"
      description="Selecciona categorías y configura sus escalas"
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
                    <Card key={categoria.id} className="border bg-background">
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
                            {isOpen ? "Ocultar" : "Ver escalas"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            {isLoadingRows ? (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                Cargando escalas...
                              </div>
                            ) : rows.length === 0 ? (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                No hay escalas en esta categoría.
                              </div>
                            ) : (
                              <div className="rounded-md border bg-background overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[60px]">Sel.</TableHead>
                                      <TableHead>Escala</TableHead>
                                      <TableHead className="w-[140px]">Puntaje</TableHead>
                                      <TableHead className="w-[120px]">Orden</TableHead>
                                      <TableHead className="w-[140px]">Activo</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {rows.map((row) => (
                                      <TableRow key={row.escala_id}>
                                        <TableCell>
                                          <Checkbox
                                            checked={row.selected}
                                            onCheckedChange={(value) =>
                                              updateRow(categoria.id, row.escala_id, {
                                                selected: Boolean(value),
                                              })
                                            }
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {row.sigla && row.nombre
                                            ? `${row.sigla} - ${row.nombre}`
                                            : `Escala #${row.escala_id}`}
                                        </TableCell>
                                        <TableCell>
                                          <Label
                                            className="sr-only"
                                            htmlFor={`puntaje-${row.escala_id}`}
                                          >
                                            Puntaje
                                          </Label>
                                          <Input
                                            id={`puntaje-${row.escala_id}`}
                                            type="number"
                                            step="0.1"
                                            value={row.puntaje}
                                            readOnly
                                            className="bg-muted cursor-not-allowed"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Label
                                            className="sr-only"
                                            htmlFor={`orden-${row.escala_id}`}
                                          >
                                            Orden
                                          </Label>
                                          <Input
                                            id={`orden-${row.escala_id}`}
                                            type="number"
                                            value={row.orden}
                                            readOnly
                                            className="bg-muted cursor-not-allowed"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={row.es_activo}
                                              onCheckedChange={(value) =>
                                                updateRow(categoria.id, row.escala_id, {
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
