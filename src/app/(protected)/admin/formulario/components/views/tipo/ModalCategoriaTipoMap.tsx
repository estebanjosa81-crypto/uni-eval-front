import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import { FolderPlus, Plus, X, AlertCircle } from "lucide-react";
import { type CategoriaTipo, type Tipo, type CreateCategoriaTipoMapInput } from "@/src/api";
import { categoriaTipoMapService, tiposEvaluacionService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";

interface ModalCategoriaTipoMapProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaTipo;
  onSuccess: () => void | Promise<void>;
}

export function ModalCategoriaTipoMap({
  isOpen,
  onClose,
  categoria,
  onSuccess,
}: ModalCategoriaTipoMapProps) {
  const { toast } = useToast();

  const [categoriaData, setCategoriaData] = useState({
    nombre: "",
    descripcion: "",
  });

  const [tiposDisponibles, setTiposDisponibles] = useState<Tipo[]>([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<Set<number>>(new Set());
  const [nuevosTipos, setNuevosTipos] = useState<Array<{nombre: string; descripcion: string; es_evaluacion: boolean; es_activo: boolean}>>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isOpen) {
      cargarTiposDisponibles();
      if (categoria) {
        setCategoriaData({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || "",
        });
      } else {
        setCategoriaData({ nombre: "", descripcion: "" });
      }
      setTiposSeleccionados(new Set());
      setNuevosTipos([]);
      setErrors({});
    }
  }, [categoria, isOpen]);

  const cargarTiposDisponibles = async () => {
    try {
      const response = await tiposEvaluacionService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const tipos = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setTiposDisponibles(tipos);
      }
    } catch (error) {
      console.error("Error cargando tipos:", error);
    }
  };

  const handleToggleTipo = (tipoId: number) => {
    const newSet = new Set(tiposSeleccionados);
    if (newSet.has(tipoId)) {
      newSet.delete(tipoId);
    } else {
      newSet.add(tipoId);
    }
    setTiposSeleccionados(newSet);
  };

  const handleAgregarNuevoTipo = () => {
    setNuevosTipos([...nuevosTipos, { nombre: "", descripcion: "", es_evaluacion: true, es_activo: true }]);
  };

  const handleRemoverNuevoTipo = (index: number) => {
    setNuevosTipos(nuevosTipos.filter((_, i) => i !== index));
  };

  const handleNuevoTipoChange = (index: number, field: string, value: any) => {
    const updated = [...nuevosTipos];
    updated[index] = { ...updated[index], [field]: value };
    setNuevosTipos(updated);
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

    if (tiposSeleccionados.size === 0 && nuevosTipos.length === 0) {
      newErrors.tipos = "Debes seleccionar tipos existentes o crear nuevos";
    }

    nuevosTipos.forEach((tipo, idx) => {
      if (!tipo.nombre.trim()) {
        newErrors[`nuevo_tipo_${idx}_nombre`] = "El nombre es obligatorio";
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

      // Agregar tipos seleccionados existentes
      tiposSeleccionados.forEach(tipoId => {
        itemData.push({ id: tipoId });
      });

      // Agregar nuevos tipos a crear
      nuevosTipos.forEach(tipo => {
        itemData.push({
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          es_evaluacion: tipo.es_evaluacion,
          es_activo: tipo.es_activo,
        });
      });

      const payload: CreateCategoriaTipoMapInput = {
        categoryData: categoria ? { id: categoria.id } : {
          nombre: categoriaData.nombre,
          descripcion: categoriaData.descripcion,
        },
        itemData,
      };

      const response = await categoriaTipoMapService.createCategoriaMap(payload);

      if (response.success) {
        toast({
          title: "¡Operación exitosa!",
          description: categoria 
            ? "Tipos asociados correctamente a la categoría"
            : "Categoría creada con tipos asociados",
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
                  ? `Agregar Tipos a "${categoria.nombre}"`
                  : "Crear Categoría con Tipos"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {categoria
                  ? "Selecciona tipos existentes o crea nuevos"
                  : "Crea una categoría y asocia tipos de evaluación"
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
                  <div>
                    <Label htmlFor="cat_nombre">Nombre</Label>
                    <Input
                      id="cat_nombre"
                      value={categoriaData.nombre}
                      onChange={(e) => setCategoriaData({...categoriaData, nombre: e.target.value})}
                      placeholder="Ej. Docente"
                      className={errors.categoria_nombre ? 'border-destructive' : ''}
                    />
                    {errors.categoria_nombre && (
                      <p className="text-sm text-destructive mt-1">{errors.categoria_nombre}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cat_desc">Descripción</Label>
                    <Textarea
                      id="cat_desc"
                      value={categoriaData.descripcion}
                      onChange={(e) => setCategoriaData({...categoriaData, descripcion: e.target.value})}
                      placeholder="Describe el propósito de esta categoría"
                      rows={2}
                      className={errors.categoria_descripcion ? 'border-destructive' : ''}
                    />
                    {errors.categoria_descripcion && (
                      <p className="text-sm text-destructive mt-1">{errors.categoria_descripcion}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tipos existentes */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Seleccionar Tipos Existentes</h3>
              {tiposDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tipos disponibles</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tiposDisponibles.map((tipo) => (
                    <div key={tipo.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                      <Checkbox
                        id={`tipo-${tipo.id}`}
                        checked={tiposSeleccionados.has(tipo.id)}
                        onCheckedChange={() => handleToggleTipo(tipo.id)}
                      />
                      <Label
                        htmlFor={`tipo-${tipo.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <p className="text-xs text-muted-foreground">{tipo.descripcion}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {errors.tipos && (
                <p className="text-sm text-destructive">{errors.tipos}</p>
              )}
            </CardContent>
          </Card>

          {/* Nuevos tipos */}
          <Card className="border shadow-none bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Crear Nuevos Tipos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarNuevoTipo}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>

              {nuevosTipos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay nuevos tipos. Haz clic en "Agregar" para crear uno.
                </p>
              ) : (
                <div className="space-y-4">
                  {nuevosTipos.map((tipo, idx) => (
                    <Card key={idx} className="border">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Tipo #{idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverNuevoTipo(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Nombre</Label>
                            <Input
                              value={tipo.nombre}
                              onChange={(e) => handleNuevoTipoChange(idx, 'nombre', e.target.value)}
                              placeholder="Nombre del tipo"
                              className={`text-sm ${errors[`nuevo_tipo_${idx}_nombre`] ? 'border-destructive' : ''}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descripción</Label>
                            <Textarea
                              value={tipo.descripcion}
                              onChange={(e) => handleNuevoTipoChange(idx, 'descripcion', e.target.value)}
                              placeholder="Descripción del tipo"
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={tipo.es_evaluacion}
                                onCheckedChange={(checked) => handleNuevoTipoChange(idx, 'es_evaluacion', checked)}
                              />
                              <Label className="text-xs">Es Evaluación</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={tipo.es_activo}
                                onCheckedChange={(checked) => handleNuevoTipoChange(idx, 'es_activo', checked)}
                              />
                              <Label className="text-xs">Activo</Label>
                            </div>
                          </div>
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
                {categoria ? "Asociar Tipos" : "Crear Categoría"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
