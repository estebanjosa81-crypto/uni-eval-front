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
import { Hash, Edit3, Plus, AlertCircle, Star, Check, Database } from "lucide-react"
import { type Escala } from "@/src/api"
import { escalasValoracionService, categoriaEscalaMapService } from "@/src/api"
import { useToast } from "@/hooks/use-toast"
import { alphaNumericSpanish } from "@/src/api/validation/comment-rules"

interface ModalEscalaProps {
  isOpen: boolean
  onClose: () => void
  escala?: Escala
  categoryId?: number
  onSuccess: () => void | Promise<void>
  onEscalaCreated?: (escala: Escala) => void
  onEscalaUpdated?: (escala: Escala) => void
}

export function ModalEscala({ isOpen, onClose, escala, categoryId, onSuccess, onEscalaCreated, onEscalaUpdated }: ModalEscalaProps) {
  const { toast } = useToast()

  const [tabActiva, setTabActiva] = useState<"crear" | "banco">(escala ? "crear" : "crear");
  // Estado para el formulario
  const [formData, setFormData] = useState({
    sigla: "",
    nombre: "",
    descripcion: ""
  })
  const [escalasDisponibles, setEscalasDisponibles] = useState<Escala[]>([]);
  const [escalaSeleccionada, setEscalaSeleccionada] = useState<Escala | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEscalas, setIsLoadingEscalas] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con una nueva escala
  useEffect(() => {
    if (escala) {
      setFormData({
        sigla: escala.sigla,
        nombre: escala.nombre,
        descripcion: escala.descripcion || ""
      })
    } else {
      setFormData({ sigla: "", nombre: "", descripcion: "" })
      // Cargar escalas disponibles cuando se abre el modal para crear
      if (isOpen) {
        cargarEscalasDisponibles();
      }
    }
    setErrors({})
    setEscalaSeleccionada(null);
  }, [escala, isOpen])

  const cargarEscalasDisponibles = async () => {
    setIsLoadingEscalas(true);
    try {
      const response = await escalasValoracionService.getAll();
      if (response.success && response.data) {
        const escalas = Array.isArray(response.data) ? response.data : response.data.data || [];
        setEscalasDisponibles(escalas);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las escalas disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEscalas(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    const siglaTrim = formData.sigla.trim()
    const nombreTrim = formData.nombre.trim()
    const descripcionTrim = formData.descripcion.trim()

    if (!siglaTrim) {
      newErrors.sigla = "La sigla es obligatoria"
    } else if (siglaTrim.length < 1 || siglaTrim.length > 5) {
      newErrors.sigla = "La sigla debe tener entre 1 y 5 caracteres"
    } else {
      const siglaError = alphaNumericSpanish(siglaTrim)
      if (siglaError) newErrors.sigla = siglaError
    }

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

  // Manejador del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (escala) {
        // Actualizando una escala existente
        await escalasValoracionService.update(escala.id, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "La escala de valoración se actualizó correctamente"
        })
        onEscalaUpdated?.({ ...escala, ...formData } as Escala)
      } else if (escalaSeleccionada && categoryId) {
        // Asociar escala del banco a la categoría
        const response = await categoriaEscalaMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              id: escalaSeleccionada.id,
              sigla: escalaSeleccionada.sigla,
              nombre: escalaSeleccionada.nombre,
              descripcion: escalaSeleccionada.descripcion,
            }
          ]
        })
        toast({
          title: "¡Asociación exitosa!",
          description: "Escala asociada a la categoría correctamente"
        })
        if (response.success && response.data) {
          onEscalaCreated?.(escalaSeleccionada as Escala)
        }
      } else if (categoryId) {
        // Creando una nueva escala dentro de una categoría
        const response = await categoriaEscalaMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              sigla: formData.sigla,
              nombre: formData.nombre,
              descripcion: formData.descripcion
            }
          ]
        })
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva escala creada y asociada a la categoría"
        })
        if (response.success && response.data) {
          const nuevaEscala = response.data.mappings[0]
          onEscalaCreated?.(nuevaEscala as any)
        }
      } else {
        // Creando una nueva escala
        const response = await escalasValoracionService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva escala de valoración creada"
        })
        if (response.success && response.data) {
          const nuevaEscala = Array.isArray(response.data) ? response.data[0] : response.data
          onEscalaCreated?.(nuevaEscala as Escala)
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

  const handleSeleccionarDelBanco = (escalaId: string) => {
    const escalaEncontrada = escalasDisponibles.find(e => e.id === parseInt(escalaId));
    if (escalaEncontrada) {
      setEscalaSeleccionada(escalaEncontrada);
      setFormData({
        sigla: escalaEncontrada.sigla || "",
        nombre: escalaEncontrada.nombre || "",
        descripcion: escalaEncontrada.descripcion || "",
      });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={escala ? "edit" : "create"}
      title={escala ? "Editar Escala de Valoración" : "Nueva Escala de Valoración"}
      icon={escala ? Edit3 : Plus}
      size="2xl"
      isLoading={isLoading}
      loadingText={escala ? "Actualizando..." : "Guardando..."}
      submitText={escala ? "Actualizar" : "Guardar"}
      disableSubmit={!escala && tabActiva === "banco" && !escalaSeleccionada}
    >
        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            {escala ? (
              // Modo edición - solo una pestaña
              <div className="space-y-6">
                {/* Campo Sigla */}
                <div className="space-y-3">
                  <Label htmlFor="sigla" className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Sigla de la Escala
                  </Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => handleInputChange("sigla", e.target.value)}
                    placeholder="Ej. A, B, C..."
                    maxLength={10}
                    className={`transition-colors ${errors.sigla ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  {errors.sigla && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.sigla}
                    </div>
                  )}
                </div>

                {/* Campo Nombre */}
                <div className="space-y-3">
                  <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Nombre de la Escala
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej. Excelente, Bueno, Regular, Deficiente..."
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
                    Descripción de la Escala
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                    placeholder="Describe qué representa este nivel de valoración..."
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
                    {/* Campo Sigla */}
                    <div className="space-y-3">
                      <Label htmlFor="sigla" className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        Sigla de la Escala
                      </Label>
                      <Input
                        id="sigla"
                        value={formData.sigla}
                        onChange={(e) => handleInputChange("sigla", e.target.value)}
                        placeholder="Ej. A, B, C..."
                        maxLength={10}
                        className={`transition-colors ${errors.sigla ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        required
                      />
                      {errors.sigla && (
                        <div className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.sigla}
                        </div>
                      )}
                    </div>

                    {/* Campo Nombre */}
                    <div className="space-y-3">
                      <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        Nombre de la Escala
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange("nombre", e.target.value)}
                        placeholder="Ej. Excelente, Bueno, Regular, Deficiente..."
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
                        Descripción de la Escala
                      </Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange("descripcion", e.target.value)}
                        placeholder="Describe qué representa este nivel de valoración..."
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
                  {isLoadingEscalas ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando escalas disponibles...
                    </div>
                  ) : escalasDisponibles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay escalas disponibles en el banco
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Seleccionar Escala
                        </Label>
                        <Select onValueChange={handleSeleccionarDelBanco}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige una escala del banco..." />
                          </SelectTrigger>
                          <SelectContent>
                            {escalasDisponibles.map((e) => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.sigla} - {e.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {escalaSeleccionada && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              Escala seleccionada: {escalaSeleccionada.sigla} - {escalaSeleccionada.nombre}
                            </p>
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {escalaSeleccionada.descripcion}
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