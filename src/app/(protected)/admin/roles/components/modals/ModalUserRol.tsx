import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { UserCheck, Edit3, Plus, AlertCircle, User, Shield, Loader2, Search, X } from "lucide-react"
import { rolService, userRolService, type UserRol, type Rol } from "@/src/api/services/app/rol.service"
import { authService, type AuthUserLookup } from "@/src/api/services/auth/auth.service"
import { useToast } from "@/hooks/use-toast"

type User = AuthUserLookup

interface ModalUserRolProps {
  isOpen: boolean
  onClose: () => void
  userRol?: UserRol
  onSuccess: () => void
}

export function ModalUserRol({
  isOpen,
  onClose,
  userRol,
  onSuccess
}: ModalUserRolProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    userId: 0,
    roleId: 0
  })

  const [searchUsername, setSearchUsername] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [roles, setRoles] = useState<Rol[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Cargar roles disponibles
  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true)
    try {
      const response = await rolService.getAll({ page: 1, limit: 1000 })
      const rolesData = response.data?.data || []
      setRoles(rolesData)
    } catch (error: any) {
      const errorMessage = error?.message || "Error al cargar los roles"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoadingRoles(false)
    }
  }, [toast])

  // Buscar usuarios por username
  const searchUsers = async () => {
    const trimmedSearch = searchUsername.trim()
    
    if (!trimmedSearch) {
      toast({
        title: "Campo requerido",
        description: "Ingresa un nombre de usuario para buscar",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setHasSearched(false)
    setSearchResults([])

    try {
      // Usar el servicio de autenticación
      const response = await authService.getUserByUsername(trimmedSearch)
      
      if (!response.success || !response.data) {
        setSearchResults([])
        setHasSearched(true)
        toast({
          title: "Sin resultados",
          description: `No se encontró el usuario "${trimmedSearch}"`,
          variant: "destructive"
        })
        return
      }

      // Convertir la respuesta a la interfaz User
      const userData: User = {
        ...response.data,
        rolesAuth: response.data.rolesAuth || [],
        rolesAuthIds: response.data.rolesAuthIds || [],
        rolesApp: response.data.rolesApp || [],
        rolesAppIds: response.data.rolesAppIds || [],
        roles: response.data.roles || [],
        rolesIds: response.data.rolesIds || [],
      }
      
      setSearchResults([userData])
      setHasSearched(true)
      
      toast({
        title: "Usuario encontrado",
        description: `${userData.user_name}`,
        variant: "default"
      })
    } catch (error: any) {
      const errorMessage = error?.message || "Usuario no encontrado"
      toast({
        title: "Error en la búsqueda",
        description: errorMessage,
        variant: "destructive"
      })
      setSearchResults([])
      setHasSearched(true)
    } finally {
      setIsSearching(false)
    }
  }

  // Seleccionar usuario de los resultados
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, userId: user.user_id }))
    setSearchResults([])
    setSearchUsername("")
    setHasSearched(false)
    
    // Limpiar error de usuario si existe
    if (errors.userId) {
      setErrors(prev => ({ ...prev, userId: "" }))
    }
  }

  // Limpiar selección de usuario
  const clearUserSelection = () => {
    setSelectedUser(null)
    setFormData(prev => ({ ...prev, userId: 0 }))
  }

  // Cargar roles cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadRoles()
    }
  }, [isOpen, loadRoles])

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      if (userRol) {
        // Modo edición
        setFormData({
          userId: userRol.user_id,
          roleId: userRol.rol_id
        })
        setSelectedUser({
          user_id: userRol.user_id,
          user_name: "Usuario existente",
          user_username: "N/A",
          user_email: "N/A",
          rolesAuth: [],
          rolesAuthIds: [],
          rolesApp: [],
          rolesAppIds: [],
          roles: [],
          rolesIds: []
        })
      } else {
        // Modo creación
        setFormData({ userId: 0, roleId: 0 })
        setSelectedUser(null)
      }
    } else {
      // Limpiar todo al cerrar
      setFormData({ userId: 0, roleId: 0 })
      setSelectedUser(null)
      setSearchUsername("")
      setSearchResults([])
      setHasSearched(false)
    }
    setErrors({})
  }, [userRol, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (formData.userId === 0) {
      newErrors.userId = "Debe seleccionar un usuario"
    }

    if (formData.roleId === 0) {
      newErrors.roleId = "Debe seleccionar un rol"
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
        user_id: formData.userId,
        rol_id: formData.roleId
      }

      if (userRol) {
        // Actualizar asignación de rol existente: PUT /user/rol/{id}
        const response = await userRolService.update(userRol.id, dataToSend)
        if (!response.success) {
          throw new Error((response.error as any)?.message || "No se pudo actualizar el rol de usuario")
        }
        toast({
          title: "¡Actualización exitosa!",
          description: "El rol de usuario se actualizó correctamente"
        })
      } else {
        // Crear nueva asignación de rol: POST /user/rol
        const response = await userRolService.create(dataToSend)
        if (!response.success) {
          throw new Error((response.error as any)?.message || "No se pudo crear el rol de usuario")
        }
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo rol de usuario creado correctamente"
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

  const handleRoleSelect = (value: string) => {
    const selectedRole = roles.find(role => role.id.toString() === value)
    if (selectedRole) {
      setFormData(prev => ({ ...prev, roleId: selectedRole.id }))
      
      if (errors.roleId) {
        setErrors(prev => ({ ...prev, roleId: "" }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {userRol ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {userRol ? "Editar Rol de Usuario" : "Nuevo Rol de Usuario"}
                <UserCheck className="h-5 w-5 text-primary" />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {userRol 
                  ? "Modifica la asignación de rol del usuario"
                  : "Busca un usuario y asígnale un rol del sistema"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Buscador de Usuario (solo en modo creación) */}
              {!userRol && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Buscar Usuario
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      placeholder="Ingresa el nombre de usuario..."
                      className="flex-1"
                      disabled={isSearching}
                    />
                    <Button
                      type="button"
                      onClick={searchUsers}
                      disabled={isSearching || !searchUsername.trim()}
                      size="sm"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Resultados de búsqueda */}
              {!userRol && hasSearched && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Resultados de búsqueda ({searchResults.length})
                  </Label>
                  
                  {searchResults.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.user_id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{user.user_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  @{user.user_username}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {user.user_email}
                              </p>
                              {user.roles && user.roles.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground">Roles actuales:</span>
                                  {user.roles.map((role, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="outline">
                              Seleccionar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground border rounded-md">
                      <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No se encontraron usuarios</p>
                      <p className="text-xs">Intenta con otro término de búsqueda</p>
                    </div>
                  )}
                </div>
              )}

              {/* Usuario seleccionado */}
              {selectedUser && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Usuario Seleccionado
                  </Label>
                  <div className="p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedUser.user_name}</span>
                          <Badge variant="outline" className="text-xs">
                            ID: {selectedUser.user_id}
                          </Badge>
                          {selectedUser.user_username !== "N/A" && (
                            <Badge variant="outline" className="text-xs">
                              @{selectedUser.user_username}
                            </Badge>
                          )}
                        </div>
                        {selectedUser.user_email !== "N/A" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedUser.user_email}
                          </p>
                        )}
                      </div>
                      {!userRol && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={clearUserSelection}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.userId && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.userId}
                    </div>
                  )}
                </div>
              )}

              {/* Campo Rol - Select */}
              <div className="space-y-3">
                <Label htmlFor="roleId" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Rol del Usuario
                </Label>
                <Select 
                  value={formData.roleId.toString()} 
                  onValueChange={handleRoleSelect}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger 
                    className={`transition-colors ${errors.roleId ? 'border-destructive focus:ring-destructive' : ''}`}
                  >
                    <SelectValue placeholder={
                      isLoadingRoles ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando roles...
                        </div>
                      ) : "Selecciona un rol"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingRoles && roles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No hay roles disponibles
                      </div>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {role.nombre}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.roleId && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.roleId}
                  </div>
                )}
                {!isLoadingRoles && roles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {roles.length} rol{roles.length !== 1 ? 'es' : ''} disponible{roles.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Información adicional */}
              {userRol && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Información del Registro
                  </Label>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {userRol.id}
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
            disabled={isLoading || isLoadingRoles || (!selectedUser && !userRol)}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {userRol ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {userRol ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {userRol ? "Actualizar Asignación" : "Crear Asignación"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}