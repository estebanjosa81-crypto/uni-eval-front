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
import { FolderPlus, Plus, Trash2, AlertCircle, Hash, Star } from "lucide-react";
import { type CategoriaEscala, type Escala, type CreateCategoriaEscalaMapInput } from "@/src/api";
import { categoriaEscalaMapService, escalasValoracionService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";

interface ModalCategoriaEscalaMapProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaEscala;
  onSuccess: () => void | Promise<void>;
}

export function ModalCategoriaEscalaMap({
  isOpen,
  onClose,
  categoria,
  onSuccess,
}: ModalCategoriaEscalaMapProps) {
  const { toast } = useToast();

  const [categoriaData, setCategoriaData] = useState({
    nombre: "",
    descripcion: "",
  });

  const [escalasDisponibles, setEscalasDisponibles] = useState<Escala[]>([]);
  const [escalasSeleccionadas, setEscalasSeleccionadas] = useState<Set<number>>(new Set());
  const [nuevasEscalas, setNuevasEscalas] = useState<Array<{sigla: string; nombre: string; descripcion: string}>>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isOpen) {
      cargarEscalasDisponibles();
      if (categoria) {
        setCategoriaData({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || "",
        });
      } else {
        setCategoriaData({ nombre: "", descripcion: "" });
      }
      setEscalasSeleccionadas(new Set());
      setNuevasEscalas([]);
      setErrors({});
    }
  }, [categoria, isOpen]);

  const cargarEscalasDisponibles = async () => {
    try {
      const response = await escalasValoracionService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const escalas = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setEscalasDisponibles(escalas);
      }
    } catch (error) {
      console.error("Error cargando escalas:", error);
    }
  };

  const handleToggleEscala = (escalaId: number) => {
    const newSet = new Set(escalasSeleccionadas);
    if (newSet.has(escalaId)) {
      newSet.delete(escalaId);
    } else {
      newSet.add(escalaId);
    }
    setEscalasSeleccionadas(newSet);
  };

  const handleAgregarNuevaEscala = () => {
    setNuevasEscalas([...nuevasEscalas, { sigla: "", nombre: "", descripcion: "" }]);
  };

  const handleRemoverNuevaEscala = (index: number) => {
    setNuevasEscalas(nuevasEscalas.filter((_, i) => i !== index));
  };

  const handleNuevaEscalaChange = (index: number, field: string, value: any) => {
    const updated = [...nuevasEscalas];
    updated[index] = { ...updated[index], [field]: value };
    setNuevasEscalas(updated);
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

    if (escalasSeleccionadas.size === 0 && nuevasEscalas.length === 0) {
      newErrors.escalas = "Debes seleccionar escalas existentes o crear nuevas";
    }

    nuevasEscalas.forEach((escala, idx) => {
      if (!escala.sigla.trim()) {
        newErrors[`nueva_escala_${idx}_sigla`] = "La sigla es obligatoria";
      }
      if (!escala.nombre.trim()) {
        newErrors[`nueva_escala_${idx}_nombre`] = "El nombre es obligatorio";
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

      // Agregar escalas seleccionadas existentes
      escalasSeleccionadas.forEach(escalaId => {
        itemData.push({ id: escalaId });
      });

      // Agregar nuevas escalas a crear
      nuevasEscalas.forEach(escala => {
        itemData.push({
          sigla: escala.sigla,
          nombre: escala.nombre,
          descripcion: escala.descripcion,
        });
      });

      const payload: CreateCategoriaEscalaMapInput = {
        categoryData: categoria ? { id: categoria.id } : {
          nombre: categoriaData.nombre,
          descripcion: categoriaData.descripcion,
        },
        itemData,
      };

      const response = await categoriaEscalaMapService.createCategoriaMap(payload);

      if (response.success) {
        toast({
          title: "¡Operación exitosa!",
          description: categoria 
            ? "Escalas asociadas correctamente a la categoría"
            : "Categoría creada con escalas asociadas",
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
                  ? `Asociar Escalas - ${categoria.nombre}`
                  : "Nueva Categoría con Escalas"
                }
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {categoria 
                  ? "Selecciona escalas existentes o crea nuevas para asociar"
                  : "Crea una categoría y asocia escalas en un solo paso"
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
                    placeholder="Ej. Cualitativa"
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

          {/* Escalas existentes */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Seleccionar Escalas Existentes</h3>
              {escalasDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay escalas disponibles</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {escalasDisponibles.map((escala) => (
                    <div
                      key={escala.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`escala-${escala.id}`}
                        checked={escalasSeleccionadas.has(escala.id)}
                        onCheckedChange={() => handleToggleEscala(escala.id)}
                      />
                      <label htmlFor={`escala-${escala.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{escala.sigla}</Badge>
                          <p className="font-medium text-sm">{escala.nombre}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{escala.descripcion}</p>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {errors.escalas && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.escalas}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nuevas escalas */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Crear Nuevas Escalas</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarNuevaEscala}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {nuevasEscalas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay escalas nuevas. Haz clic en "Agregar" para crear una.
                </p>
              ) : (
                <div className="space-y-3">
                  {nuevasEscalas.map((escala, idx) => (
                    <Card key={idx} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Nueva Escala {idx + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverNuevaEscala(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nueva-escala-sigla-${idx}`}>Sigla</Label>
                          <Input
                            id={`nueva-escala-sigla-${idx}`}
                            value={escala.sigla}
                            onChange={(e) => handleNuevaEscalaChange(idx, "sigla", e.target.value)}
                            placeholder="Ej. EXC"
                            maxLength={10}
                            className={errors[`nueva_escala_${idx}_sigla`] ? 'border-destructive' : ''}
                          />
                          {errors[`nueva_escala_${idx}_sigla`] && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>{errors[`nueva_escala_${idx}_sigla`]}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nueva-escala-nombre-${idx}`}>Nombre</Label>
                          <Input
                            id={`nueva-escala-nombre-${idx}`}
                            value={escala.nombre}
                            onChange={(e) => handleNuevaEscalaChange(idx, "nombre", e.target.value)}
                            placeholder="Ej. Excelente"
                            className={errors[`nueva_escala_${idx}_nombre`] ? 'border-destructive' : ''}
                          />
                          {errors[`nueva_escala_${idx}_nombre`] && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>{errors[`nueva_escala_${idx}_nombre`]}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nueva-escala-desc-${idx}`}>Descripción</Label>
                          <Textarea
                            id={`nueva-escala-desc-${idx}`}
                            value={escala.descripcion}
                            onChange={(e) => handleNuevaEscalaChange(idx, "descripcion", e.target.value)}
                            placeholder="Descripción de la escala"
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
                {categoria ? "Asociar Escalas" : "Crear Categoría"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
