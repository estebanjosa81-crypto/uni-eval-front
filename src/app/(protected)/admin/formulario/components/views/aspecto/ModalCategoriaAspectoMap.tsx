import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, Plus, Trash2, AlertCircle, Tag } from "lucide-react";
import { type CategoriaAspecto, type Aspecto, type CreateCategoriaAspectoMapInput } from "@/src/api";
import { categoriaAspectoMapService, aspectosEvaluacionService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";

interface ModalCategoriaAspectoMapProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaAspecto;
  onSuccess: () => void | Promise<void>;
}

export function ModalCategoriaAspectoMap({
  isOpen,
  onClose,
  categoria,
  onSuccess,
}: ModalCategoriaAspectoMapProps) {
  const { toast } = useToast();

  const [categoriaData, setCategoriaData] = useState({
    nombre: "",
    descripcion: "",
  });

  const [aspectosDisponibles, setAspectosDisponibles] = useState<Aspecto[]>([]);
  const [aspectosSeleccionados, setAspectosSeleccionados] = useState<Set<number>>(new Set());
  const [nuevosAspectos, setNuevosAspectos] = useState<Array<{nombre: string; descripcion: string}>>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isOpen) {
      cargarAspectosDisponibles();
      if (categoria) {
        setCategoriaData({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || "",
        });
      } else {
        setCategoriaData({ nombre: "", descripcion: "" });
      }
      setAspectosSeleccionados(new Set());
      setNuevosAspectos([]);
      setErrors({});
    }
  }, [categoria, isOpen]);

  const cargarAspectosDisponibles = async () => {
    try {
      const response = await aspectosEvaluacionService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const aspectos = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setAspectosDisponibles(aspectos);
      }
    } catch (error) {
      console.error("Error cargando aspectos:", error);
    }
  };

  const handleToggleAspecto = (aspectoId: number) => {
    const newSet = new Set(aspectosSeleccionados);
    if (newSet.has(aspectoId)) {
      newSet.delete(aspectoId);
    } else {
      newSet.add(aspectoId);
    }
    setAspectosSeleccionados(newSet);
  };

  const handleAgregarNuevoAspecto = () => {
    setNuevosAspectos([...nuevosAspectos, { nombre: "", descripcion: "" }]);
  };

  const handleRemoverNuevoAspecto = (index: number) => {
    setNuevosAspectos(nuevosAspectos.filter((_, i) => i !== index));
  };

  const handleNuevoAspectoChange = (index: number, field: string, value: any) => {
    const updated = [...nuevosAspectos];
    updated[index] = { ...updated[index], [field]: value };
    setNuevosAspectos(updated);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!categoria) {
      if (!categoriaData.nombre.trim()) {
        newErrors.categoria_nombre = "El nombre de la categoría es obligatorio";
      }
      if (!categoriaData.descripcion.trim()) {
        newErrors.categoria_descripcion = "La descripción de la categoría es obligatoria";
      }
    }

    if (aspectosSeleccionados.size === 0 && nuevosAspectos.length === 0) {
      newErrors.aspectos = "Debes seleccionar aspectos existentes o crear nuevos";
    }

    nuevosAspectos.forEach((aspecto, idx) => {
      if (!aspecto.nombre.trim()) {
        newErrors[`nuevo_aspecto_${idx}_nombre`] = "El nombre es obligatorio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const itemData: any[] = [];

      // Agregar aspectos seleccionados existentes
      aspectosSeleccionados.forEach(aspectoId => {
        itemData.push({ id: aspectoId });
      });

      // Agregar nuevos aspectos a crear
      nuevosAspectos.forEach(aspecto => {
        itemData.push({
          nombre: aspecto.nombre,
          descripcion: aspecto.descripcion,
        });
      });

      const payload: CreateCategoriaAspectoMapInput = {
        categoryData: categoria ? { id: categoria.id } : {
          nombre: categoriaData.nombre,
          descripcion: categoriaData.descripcion,
        },
        itemData,
      };

      const response = await categoriaAspectoMapService.createCategoriaMap(payload);

      if (response.success) {
        toast({
          title: "¡Operación exitosa!",
          description: categoria 
            ? "Aspectos asociados correctamente a la categoría"
            : "Categoría creada con aspectos asociados",
        });
        await Promise.resolve(onSuccess());
        onClose();
      }
    } catch (error) {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.2rem] border-slate-100 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 px-8 py-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black italic tracking-tight text-slate-900">
                {categoria 
                  ? `Asociar Aspectos - ${categoria.nombre}`
                  : "Nueva Categoría con Aspectos"
                }
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {categoria 
                  ? "Selecciona aspectos existentes o crea nuevos para asociar"
                  : "Crea una categoría y asocia aspectos en un solo paso"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos de categoría - solo si es nueva */}
          {!categoria && (
            <Card className="border shadow-none bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">Datos de la Categoría</h3>
                <div className="space-y-3">
                  <Label htmlFor="cat-nombre">Nombre</Label>
                  <Input
                    id="cat-nombre"
                    value={categoriaData.nombre}
                    onChange={(e) => setCategoriaData({...categoriaData, nombre: e.target.value})}
                    placeholder="Ej. Pedagógico"
                    className={errors.categoria_nombre ? 'border-destructive' : ''}
                  />
                  {errors.categoria_nombre && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.categoria_nombre}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="cat-desc">Descripción</Label>
                  <Textarea
                    id="cat-desc"
                    value={categoriaData.descripcion}
                    onChange={(e) => setCategoriaData({...categoriaData, descripcion: e.target.value})}
                    placeholder="Describe la categoría..."
                    rows={3}
                    className={errors.categoria_descripcion ? 'border-destructive' : ''}
                  />
                  {errors.categoria_descripcion && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.categoria_descripcion}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aspectos existentes */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Seleccionar Aspectos Existentes</h3>
              {aspectosDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay aspectos disponibles</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aspectosDisponibles.map((aspecto) => (
                    <div
                      key={aspecto.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`aspecto-${aspecto.id}`}
                        checked={aspectosSeleccionados.has(aspecto.id)}
                        onCheckedChange={() => handleToggleAspecto(aspecto.id)}
                      />
                      <label htmlFor={`aspecto-${aspecto.id}`} className="flex-1 cursor-pointer">
                        <p className="font-medium text-sm">{aspecto.nombre}</p>
                        <p className="text-xs text-muted-foreground">{aspecto.descripcion}</p>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {errors.aspectos && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.aspectos}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nuevos aspectos */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Crear Nuevos Aspectos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarNuevoAspecto}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {nuevosAspectos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay aspectos nuevos. Haz clic en "Agregar" para crear uno.
                </p>
              ) : (
                <div className="space-y-3">
                  {nuevosAspectos.map((aspecto, idx) => (
                    <Card key={idx} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Nuevo Aspecto {idx + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverNuevoAspecto(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nuevo-aspecto-nombre-${idx}`}>Nombre</Label>
                          <Input
                            id={`nuevo-aspecto-nombre-${idx}`}
                            value={aspecto.nombre}
                            onChange={(e) => handleNuevoAspectoChange(idx, "nombre", e.target.value)}
                            placeholder="Nombre del aspecto"
                            className={errors[`nuevo_aspecto_${idx}_nombre`] ? 'border-destructive' : ''}
                          />
                          {errors[`nuevo_aspecto_${idx}_nombre`] && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>{errors[`nuevo_aspecto_${idx}_nombre`]}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nuevo-aspecto-desc-${idx}`}>Descripción</Label>
                          <Textarea
                            id={`nuevo-aspecto-desc-${idx}`}
                            value={aspecto.descripcion}
                            onChange={(e) => handleNuevoAspectoChange(idx, "descripcion", e.target.value)}
                            placeholder="Descripción del aspecto"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="border-t border-slate-100 bg-slate-50/30 px-8 py-5 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4 mr-2" />
                {categoria ? "Asociar Aspectos" : "Crear Categoría"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
