import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormModal } from "@/components/modals";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Edit3, Plus, Check, AlertCircle, Database } from "lucide-react";
import { type Tipo } from "@/src/api";
import { tiposEvaluacionService, categoriaTipoMapService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { alphaNumericSpanish } from "@/src/api/validation/comment-rules";

interface ModalTipoEvaluacionProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: Tipo;
  categoryId?: number;
  onSuccess: () => void | Promise<void>;
  onTipoCreated?: (tipo: Tipo) => void;
  onTipoUpdated?: (tipo: Tipo) => void;
}

export function ModalTipoEvaluacion({
  isOpen,
  onClose,
  tipo,
  categoryId,
  onSuccess,
  onTipoCreated,
  onTipoUpdated,
}: ModalTipoEvaluacionProps) {
  const { toast } = useToast();

  const [tabActiva, setTabActiva] = useState<"crear" | "banco">(tipo ? "crear" : "crear");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });
  const [tiposDisponibles, setTiposDisponibles] = useState<Tipo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<Tipo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (tipo) {
      setFormData({
        nombre: tipo.nombre || "",
        descripcion: tipo.descripcion || "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "" });
      // Cargar tipos disponibles cuando se abre el modal para crear
      if (isOpen) {
        cargarTiposDisponibles();
      }
    }
    setErrors({});
    setTipoSeleccionado(null);
  }, [tipo, isOpen]);

  const cargarTiposDisponibles = async () => {
    setIsLoadingTipos(true);
    try {
      const response = await tiposEvaluacionService.getAll();
      if (response.success && response.data) {
        const tipos = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTiposDisponibles(tipos);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTipos(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    const nombreTrim = formData.nombre.trim();
    const descripcionTrim = formData.descripcion.trim();

    if (!nombreTrim) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (nombreTrim.length < 1 || nombreTrim.length > 100) {
      newErrors.nombre = "El nombre debe tener entre 1 y 100 caracteres";
    } else {
      const nameError = alphaNumericSpanish(nombreTrim);
      if (nameError) newErrors.nombre = nameError;
    }

    if (!descripcionTrim) {
      newErrors.descripcion = "La descripcion es obligatoria";
    } else if (descripcionTrim.length < 1 || descripcionTrim.length > 500) {
      newErrors.descripcion = "La descripcion debe tener entre 1 y 500 caracteres";
    } else {
      const descError = alphaNumericSpanish(descripcionTrim);
      if (descError) newErrors.descripcion = descError;
    }

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
      if (tipo) {
        // Editar tipo existente
        await tiposEvaluacionService.update(tipo.id, formData);
        toast({
          title: "¡Actualización exitosa!",
          description: "El tipo de evaluación se actualizó correctamente",
        });
        onTipoUpdated?.({ ...tipo, ...formData} as Tipo);
      } else if (tipoSeleccionado && categoryId) {
        // Asociar tipo del banco a la categoría
        const response = await categoriaTipoMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              id: tipoSeleccionado.id,
              nombre: tipoSeleccionado.nombre,
              descripcion: tipoSeleccionado.descripcion,
            }
          ]
        });
        toast({
          title: "¡Asociación exitosa!",
          description: "Tipo asociado a la categoría correctamente",
        });
        if (response.success && response.data) {
          const tipoAsociado = response.data.mappings[0];
          onTipoCreated?.(tipoSeleccionado as Tipo);
        }
      } else if (categoryId) {
        // Creando un nuevo tipo desde cero dentro de una categoría
        const response = await categoriaTipoMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              nombre: formData.nombre,
              descripcion: formData.descripcion,
            }
          ]
        });
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo tipo creado y asociado a la categoría",
        });
        if (response.success && response.data) {
          const nuevoTipo = response.data.mappings[0];
          onTipoCreated?.(nuevoTipo as any);
        }
      } else {
        // Creando nuevo tipo sin categoría
        const response = await tiposEvaluacionService.create(formData);
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo tipo de evaluación creado",
        });
        if (response.success && response.data) {
          const nuevoTipo = Array.isArray(response.data) ? response.data[0] : response.data;
          onTipoCreated?.(nuevoTipo as Tipo);
        }
      }

      // Esperar a que onSuccess se complete (si es una promesa) antes de cerrar
      await Promise.resolve(onSuccess());
      onClose();
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

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSeleccionarDelBanco = (tipoId: string) => {
    const tipoEncontrado = tiposDisponibles.find(t => t.id === parseInt(tipoId));
    if (tipoEncontrado) {
      setTipoSeleccionado(tipoEncontrado);
      setFormData({
        nombre: tipoEncontrado.nombre || "",
        descripcion: tipoEncontrado.descripcion || "",
      });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={tipo ? "edit" : "create"}
      title={tipo ? "Editar Tipo de Evaluación" : "Nuevo Tipo de Evaluación"}
      icon={tipo ? Edit3 : Plus}
      size="2xl"
      isLoading={isLoading}
      loadingText={tipo ? "Actualizando..." : "Guardando..."}
      submitText={tipo ? "Actualizar" : "Guardar"}
      disableSubmit={!tipo && tabActiva === "banco" && !tipoSeleccionado}
    >
        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            {tipo ? (
              // Modo edición - solo una pestaña
              <div className="space-y-6">
                {/* Campo Nombre */}
                <div className="space-y-3">
                  <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Nombre del Tipo de Evaluación
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej. Evaluación de Satisfacción Estudiantil"
                    className={`transition-colors ${errors.nombre ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  {errors.nombre && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.nombre}
                    </div>
                  )}
                </div>

                {/* Campo Descripción */}
                <div className="space-y-3">
                  <Label htmlFor="descripcion" className="text-sm font-medium flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-primary" />
                    Descripción Detallada
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                    placeholder="Describe el propósito y características de este tipo de evaluación..."
                    rows={4}
                    className={`resize-none transition-colors ${errors.descripcion ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  <div className="flex justify-between items-center">
                    {errors.descripcion ? (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.descripcion}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Mínimo 10 caracteres
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formData.descripcion.length}/500
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Modo creación - dos pestañas
              <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as "crear" | "banco")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="crear">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear desde Cero
                  </TabsTrigger>
                  <TabsTrigger value="banco">
                    <Database className="h-4 w-4 mr-2" />
                    Del Banco
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña: Crear desde Cero */}
                <TabsContent value="crear" className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      💡 Ejemplos de tipos de evaluación:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                      <li><strong>Evaluación In Situ:</strong> Evaluación del desempeño docente en el aula</li>
                      <li><strong>Satisfacción Estudiantil:</strong> Encuesta de satisfacción con los servicios académicos</li>
                      <li><strong>Evaluación 360°:</strong> Evaluación integral desde múltiples perspectivas</li>
                      <li><strong>Autoevaluación Docente:</strong> Reflexión del docente sobre su práctica pedagógica</li>
                      <li><strong>Evaluación de Infraestructura:</strong> Valoración de instalaciones y recursos</li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {/* Campo Nombre */}
                    <div className="space-y-3">
                      <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Nombre del Tipo de Evaluación
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange("nombre", e.target.value)}
                        placeholder="Ej. Evaluación de Satisfacción Estudiantil"
                        className={`transition-colors ${errors.nombre ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        required
                      />
                      {errors.nombre && (
                        <div className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nombre}
                        </div>
                      )}
                    </div>

                    {/* Campo Descripción */}
                    <div className="space-y-3">
                      <Label htmlFor="descripcion" className="text-sm font-medium flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-primary" />
                        Descripción Detallada
                      </Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange("descripcion", e.target.value)}
                        placeholder="Describe el propósito y características de este tipo de evaluación..."
                        rows={4}
                        className={`resize-none transition-colors ${errors.descripcion ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        required
                      />
                      <div className="flex justify-between items-center">
                        {errors.descripcion ? (
                          <div className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.descripcion}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Mínimo 10 caracteres
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formData.descripcion.length}/500
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña: Del Banco */}
                <TabsContent value="banco" className="space-y-6">
                  {isLoadingTipos ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando tipos disponibles...
                    </div>
                  ) : tiposDisponibles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay tipos disponibles en el banco
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Seleccionar Tipo
                        </Label>
                        <Select onValueChange={handleSeleccionarDelBanco}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige un tipo del banco..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposDisponibles.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {tipoSeleccionado && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              Tipo seleccionado: {tipoSeleccionado.nombre}
                            </p>
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {tipoSeleccionado.descripcion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
    </FormModal>
  );
}