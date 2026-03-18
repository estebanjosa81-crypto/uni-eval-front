import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Edit3, Plus, AlertCircle, User, Loader2, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  progService,
  userProgService,
  userRolService,
  type Prog,
  type UserProg,
  type UserRolWithDatalogin,
} from "@/src/api/services/app/rol.service"

type EditableUserProg = Partial<UserProg> & Pick<UserProg, "user_rol_id" | "prog_id">

interface ModalUserProgProps {
  isOpen: boolean
  onClose: () => void
  userProg?: EditableUserProg
  onSuccess: () => void
}

export function ModalUserProg({
  isOpen,
  onClose,
  userProg,
  onSuccess
}: ModalUserProgProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    userRolId: 0,
    progId: 0
  })

  const [userRoles, setUserRoles] = useState<UserRolWithDatalogin[]>([])
  const [programas, setProgramas] = useState<Prog[]>([])
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(false)
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Cargar usuarios con roles
  const loadUserRoles = useCallback(async () => {
    setIsLoadingUserRoles(true)
    try {
      const response = await userRolService.getUserRoles()
      const userRolesData = response.data || []
      setUserRoles(userRolesData)
    } catch (error: any) {
      const errorMessage = error?.message || "Error al cargar los usuarios"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setUserRoles([])
    } finally {
      setIsLoadingUserRoles(false)
    }
  }, [toast])

  // Cargar programas
  const loadProgramas = useCallback(async () => {
    setIsLoadingProgramas(true)
    try {
      const response = await progService.getAll({ page: 1, limit: 1000 })
      const programasData = response.data?.data || []
      setProgramas(programasData)
    } catch (error: any) {
      const errorMessage = error?.message || "Error al cargar los programas"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setProgramas([])
    } finally {
      setIsLoadingProgramas(false)
    }
  }, [toast])

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadUserRoles()
      loadProgramas()
    }
  }, [isOpen, loadUserRoles, loadProgramas])

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      if (userProg) {
        // Modo edición
        setFormData({
          userRolId: userProg.user_rol_id,
          progId: userProg.prog_id
        })
      } else {
        // Modo creación
        setFormData({ userRolId: 0, progId: 0 })
      }
    } else {
      // Limpiar todo al cerrar
      setFormData({ userRolId: 0, progId: 0 })
    }
    setErrors({})
  }, [userProg, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (formData.userRolId === 0) {
      newErrors.userRolId = "Debe seleccionar un usuario"
    }

    if (formData.progId === 0) {
      newErrors.progId = "Debe seleccionar un programa"
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
        user_rol_id: formData.userRolId,
        prog_id: formData.progId
      }

      if (userProg?.id) {
        // Actualizar asignación existente: PUT /user/prog/{id}
        const response = await userProgService.update(userProg.id, dataToSend)
        if (!response.success) {
          throw new Error((response.error as any)?.message || "No se pudo actualizar la asignación")
        }
        toast({
          title: "¡Actualización exitosa!",
          description: "La asignación de programa se actualizó correctamente"
        })
      } else {
        // Crear nueva asignación: POST /user/prog
        const response = await userProgService.create(dataToSend)
        if (!response.success) {
          throw new Error((response.error as any)?.message || "No se pudo crear la asignación")
        }
        toast({
          title: "¡Creación exitosa!",
          description: "Programa asignado correctamente al usuario"
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

  const handleUserRolSelect = (value: string) => {
    const selectedUserRol = userRoles.find(ur => ur.id.toString() === value)
    if (selectedUserRol) {
      setFormData(prev => ({ ...prev, userRolId: selectedUserRol.id }))
      
      if (errors.userRolId) {
        setErrors(prev => ({ ...prev, userRolId: "" }))
      }
    }
  }

  const handleProgramaSelect = (value: string) => {
    const selectedPrograma = programas.find(p => p.id.toString() === value)
    if (selectedPrograma) {
      setFormData(prev => ({ ...prev, progId: selectedPrograma.id }))
      
      if (errors.progId) {
        setErrors(prev => ({ ...prev, progId: "" }))
      }
    }
  }

  const selectedUserRol = userRoles.find(ur => ur.id === formData.userRolId)
  const selectedPrograma = programas.find(p => p.id === formData.progId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {userProg?.id ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {userProg?.id ? "Editar Asignación de Programa" : "Nueva Asignación de Programa"}
                <GraduationCap className="h-5 w-5 text-primary" />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {userProg?.id 
                  ? "Modifica la asignación de programa del usuario"
                  : "Asigna un programa académico a un usuario con rol"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo Usuario con Rol - Select */}
              <div className="space-y-3">
                <Label htmlFor="userRolId" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Usuario con Rol
                </Label>
                <Select 
                  value={formData.userRolId.toString()} 
                  onValueChange={handleUserRolSelect}
                  disabled={isLoadingUserRoles || !!userProg?.id}
                >
                  <SelectTrigger 
                    className={`transition-colors ${errors.userRolId ? 'border-destructive focus:ring-destructive' : ''}`}
                  >
                    <SelectValue placeholder={
                      isLoadingUserRoles ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando usuarios...
                        </div>
                      ) : "Selecciona un usuario"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingUserRoles && userRoles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No hay usuarios con roles asignados
                      </div>
                    ) : (
                      userRoles.map((userRol) => (
                        <SelectItem key={userRol.id} value={userRol.id.toString()}>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{userRol.datalogin.user_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {userRol.rol_nombre}
                              </Badge>
                              <span>@{userRol.datalogin.user_username}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.userRolId && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.userRolId}
                  </div>
                )}
                {!isLoadingUserRoles && userRoles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {userRoles.length} usuario{userRoles.length !== 1 ? 's' : ''} con rol{userRoles.length !== 1 ? 'es' : ''} disponible{userRoles.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Usuario seleccionado preview */}
              {selectedUserRol && (
                <div className="p-3 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedUserRol.datalogin.user_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedUserRol.rol_nombre}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUserRol.datalogin.user_email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo Programa - Select */}
              <div className="space-y-3">
                <Label htmlFor="progId" className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Programa Académico
                </Label>
                <Select 
                  value={formData.progId.toString()} 
                  onValueChange={handleProgramaSelect}
                  disabled={isLoadingProgramas}
                >
                  <SelectTrigger 
                    className={`transition-colors ${errors.progId ? 'border-destructive focus:ring-destructive' : ''}`}
                  >
                    <SelectValue placeholder={
                      isLoadingProgramas ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando programas...
                        </div>
                      ) : "Selecciona un programa"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingProgramas && programas.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No hay programas disponibles
                      </div>
                    ) : (
                      programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id.toString()}>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            {programa.nombre}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.progId && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.progId}
                  </div>
                )}
                {!isLoadingProgramas && programas.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {programas.length} programa{programas.length !== 1 ? 's' : ''} disponible{programas.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Programa seleccionado preview */}
              {selectedPrograma && (
                <div className="p-3 border rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{selectedPrograma.nombre}</div>
                      <div className="text-xs text-muted-foreground">ID: {selectedPrograma.id}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              {userProg?.id && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Información del Registro
                  </Label>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {userProg.id}
                    </Badge>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isLoading || isLoadingUserRoles || isLoadingProgramas}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {userProg?.id ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {userProg?.id ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {userProg?.id ? "Actualizar Asignación" : "Crear Asignación"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
