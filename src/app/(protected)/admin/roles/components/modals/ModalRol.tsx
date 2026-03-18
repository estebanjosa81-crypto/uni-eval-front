// roles/componentes/modals/ModalRol.tsx
import { useEffect, useState } from "react"
import { FormModal } from "@/components/modals"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertCircle, Users } from "lucide-react"
import { rolService, type Rol } from "@/src/api/services/app/rol.service"
import { useToast } from "@/hooks/use-toast"

interface ModalRolProps {
  isOpen: boolean
  onClose: () => void
  rol?: Rol
  onSuccess: () => void
}

export function ModalRol({
  isOpen,
  onClose,
  rol,
  onSuccess
}: ModalRolProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con un nuevo rol
  useEffect(() => {
    if (rol) {
      setFormData({
        nombre: rol.nombre
      })
    } else {
      setFormData({ nombre: "" })
    }
    setErrors({})
  }, [rol, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del rol es obligatorio"
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre del rol debe tener al menos 3 caracteres"
    } else if (formData.nombre.trim().length > 50) {
      newErrors.nombre = "El nombre del rol no puede exceder 50 caracteres"
    } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(formData.nombre.trim())) {
      newErrors.nombre = "El nombre del rol solo puede contener letras y espacios"
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
      const dataToSend = {
        nombre: formData.nombre.trim()
      }

      if (rol) {
        // Actualizando un rol existente
        await rolService.update(rol.id, dataToSend)
        toast({
          title: "¡Actualización exitosa!",
          description: "El rol se actualizó correctamente"
        })
      } else {
        // Creando un nuevo rol
        await rolService.create(dataToSend)
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo rol creado correctamente"
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "No se pudo completar la operación"
      toast({
        title: "Error al guardar",
        description: errorMessage,
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={rol ? "edit" : "create"}
      title={rol ? "Editar Rol" : "Nuevo Rol"}
      icon={Shield}
      size="md"
      isLoading={isLoading}
      disableSubmit={!formData.nombre.trim()}
    >
      <Card className="border-0 shadow-none bg-muted/20">
        <CardContent className="p-5">
          {/* Campo Nombre del Rol */}
          <div className="space-y-3">
            <Label htmlFor="nombre_rol" className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Nombre del Rol
            </Label>
            <Input
              id="nombre_rol"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej. Administrador, Editor, Usuario, Supervisor..."
              className={`transition-colors ${errors.nombre ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              maxLength={50}
              required
            />
            <div className="flex justify-between items-center">
              {errors.nombre ? (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nombre}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Solo letras y espacios, mínimo 3 caracteres
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formData.nombre.length}/50
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {rol && (
            <div className="space-y-2 mt-6">
              <Label className="text-sm font-medium text-muted-foreground">
                Información del Rol
              </Label>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  ID: {rol.id}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </FormModal>
  )
}