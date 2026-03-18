import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormModal } from "@/components/modals"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tag, Edit3, Plus, AlertCircle, Check, Database } from "lucide-react"
import { type Aspecto } from "@/src/api"
import { aspectosEvaluacionService, categoriaAspectoMapService } from "@/src/api"
import { useToast } from "@/hooks/use-toast"
import { alphaNumericSpanish } from "@/src/api/validation/comment-rules"

interface ModalAspectoProps {
  isOpen: boolean
  onClose: () => void
  aspecto?: Aspecto
  categoryId?: number
  onSuccess: () => void | Promise<void>
  onAspectoCreated?: (aspecto: Aspecto) => void
  onAspectoUpdated?: (aspecto: Aspecto) => void
}

export function ModalAspecto({
  isOpen,
  onClose,
  aspecto,
  categoryId,
  onSuccess,
  onAspectoCreated,
  onAspectoUpdated
}: ModalAspectoProps) {
  const { toast } = useToast();

  const [tabActiva, setTabActiva] = useState<"crear" | "banco">(aspecto ? "crear" : "crear");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: ""
  })
  const [aspectosDisponibles, setAspectosDisponibles] = useState<Aspecto[]>([]);
  const [aspectoSeleccionado, setAspectoSeleccionado] = useState<Aspecto | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAspectos, setIsLoadingAspectos] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con un nuevo aspecto
  useEffect(() => {
    if (aspecto) {
      setFormData({
        nombre: aspecto.nombre,
        descripcion: aspecto.descripcion || ""
      })
    } else {
      setFormData({ nombre: "", descripcion: "" })
      // Cargar aspectos disponibles cuando se abre el modal para crear
      if (isOpen) {
        cargarAspectosDisponibles();
      }
    }
    setErrors({})
    setAspectoSeleccionado(null);
  }, [aspecto, isOpen])

  const cargarAspectosDisponibles = async () => {
    setIsLoadingAspectos(true);
    try {
      const response = await aspectosEvaluacionService.getAll();
      if (response.success && response.data) {
        const aspectos = Array.isArray(response.data) ? response.data : response.data.data || [];
        setAspectosDisponibles(aspectos);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los aspectos disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAspectos(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    const nombreTrim = formData.nombre.trim()
    const descripcionTrim = formData.descripcion.trim()

    if (!nombreTrim) {
      newErrors.nombre = "El nombre es obligatorio"
    } else if (nombreTrim.length < 1 || nombreTrim.length > 100) {
      newErrors.nombre = "El nombre debe tener entre 1 y 100 caracteres"
    } else {
      const nameError = alphaNumericSpanish(nombreTrim)
      if (nameError) newErrors.nombre = nameError
    }

    if (!descripcionTrim) {
      newErrors.descripcion = "La descripcion es obligatoria"
    } else if (descripcionTrim.length < 1 || descripcionTrim.length > 500) {
      newErrors.descripcion = "La descripcion debe tener entre 1 y 500 caracteres"
    } else {
      const descError = alphaNumericSpanish(descripcionTrim)
      if (descError) newErrors.descripcion = descError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (aspecto) {
        // Actualizando un aspecto existente
        await aspectosEvaluacionService.update(aspecto.id, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "El aspecto de evaluación se actualizó correctamente"
        })
        onAspectoUpdated?.({ ...aspecto, ...formData } as Aspecto)
      } else if (aspectoSeleccionado && categoryId) {
        // Asociar aspecto del banco a la categoría
        const response = await categoriaAspectoMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              id: aspectoSeleccionado.id,
              nombre: aspectoSeleccionado.nombre,
              descripcion: aspectoSeleccionado.descripcion,
            }
          ]
        })
        toast({
          title: "¡Asociación exitosa!",
          description: "Aspecto asociado a la categoría correctamente"
        })
        if (response.success && response.data) {
          onAspectoCreated?.(aspectoSeleccionado as Aspecto)
        }
      } else if (categoryId) {
        // Creando un nuevo aspecto desde cero dentro de una categoría
        const response = await categoriaAspectoMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              nombre: formData.nombre,
              descripcion: formData.descripcion
            }
          ]
        })
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo aspecto creado y asociado a la categoría"
        })
        if (response.success && response.data) {
          const nuevoAspecto = response.data.mappings[0]
          onAspectoCreated?.(nuevoAspecto as any)
        }
      } else {
        // Creando un nuevo aspecto sin categoría
        const response = await aspectosEvaluacionService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo aspecto de evaluación creado"
        })
        if (response.success && response.data) {
          const nuevoAspecto = Array.isArray(response.data) ? response.data[0] : response.data
          onAspectoCreated?.(nuevoAspecto as Aspecto)
        }
      }

      // Esperar a que onSuccess se complete (si es una promesa) antes de cerrar
      await Promise.resolve(onSuccess())
      onClose()
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleSeleccionarDelBanco = (aspectoId: string) => {
    const aspectoEncontrado = aspectosDisponibles.find(a => a.id === parseInt(aspectoId));
    if (aspectoEncontrado) {
      setAspectoSeleccionado(aspectoEncontrado);
      setFormData({
        nombre: aspectoEncontrado.nombre || "",
        descripcion: aspectoEncontrado.descripcion || "",
      });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={aspecto ? "edit" : "create"}
      title={aspecto ? "Editar Aspecto de Evaluación" : "Nuevo Aspecto de Evaluación"}
      icon={aspecto ? Edit3 : Plus}
      size="2xl"
      isLoading={isLoading}
      loadingText={aspecto ? "Actualizando..." : "Guardando..."}
      submitText={aspecto ? "Actualizar" : "Guardar"}
      disableSubmit={!aspecto && tabActiva === "banco" && !aspectoSeleccionado}
    >
        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            {aspecto ? (
              // Modo edición - solo una pestaña
              <div className="space-y-6">
                {/* Campo Nombre */}
                <div className="space-y-3">
                  <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Nombre del Aspecto
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej. Infraestructura, Documentación, Procesos..."
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
                    Descripción del Aspecto
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                    placeholder="Describe qué se evaluará en este aspecto..."
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
                  <div className="space-y-6">
                    {/* Campo Nombre */}
                    <div className="space-y-3">
                      <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        Nombre del Aspecto
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange("nombre", e.target.value)}
                        placeholder="Ej. Infraestructura, Documentación, Procesos..."
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
                        Descripción del Aspecto
                      </Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange("descripcion", e.target.value)}
                        placeholder="Describe qué se evaluará en este aspecto..."
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
                  {isLoadingAspectos ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando aspectos disponibles...
                    </div>
                  ) : aspectosDisponibles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay aspectos disponibles en el banco
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Seleccionar Aspecto
                        </Label>
                        <Select onValueChange={handleSeleccionarDelBanco}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige un aspecto del banco..." />
                          </SelectTrigger>
                          <SelectContent>
                            {aspectosDisponibles.map((a) => (
                              <SelectItem key={a.id} value={a.id.toString()}>
                                {a.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {aspectoSeleccionado && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              Aspecto seleccionado: {aspectoSeleccionado.nombre}
                            </p>
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {aspectoSeleccionado.descripcion}
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
  )
}