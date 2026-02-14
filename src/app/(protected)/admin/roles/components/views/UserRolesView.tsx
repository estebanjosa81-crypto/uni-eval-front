import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, UserCheck, User, Shield, Users } from "lucide-react";

interface UserRolData {
  id: number;
  user_id: number;
  rol_id: number;
  rol_nombre?: string | null;
  datalogin?: {
    user_name: string;
    user_username: string;
    user_email: string;
    user_idrole: number;
    user_statusid: string;
    role_name: string;
  };
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

interface UserRolesViewProps {
  userRoles: UserRolData[];
  setModalUserRol: (value: any) => void;
  handleEliminarUserRol: (userRol: UserRolData) => void;
}

export function UserRolesView({
  userRoles,
  setModalUserRol,
  handleEliminarUserRol,
}: UserRolesViewProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Gestión de Roles de Usuario
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {userRoles.length} asignaciones
              </Badge>
            </CardTitle>
            <CardDescription>
              Administre las asignaciones de roles a usuarios del sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {userRoles.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay asignaciones de roles
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comience asignando roles a los usuarios del sistema
            </p>
            <Button
              onClick={() => setModalUserRol({ isOpen: true, userRol: undefined })}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Asignación
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {userRoles.map((userRol) => {
                const userData = userRol.datalogin;

                return (
                  <Card
                    key={userRol.id}
                    className="transition-all duration-200 hover:shadow-md border border-muted hover:border-primary/20"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <UserCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">
                              <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {userData?.user_name || `Usuario ${userRol.user_id}`}
                              </span>
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {userRol.rol_nombre}
                              </Badge>
                              {userData?.user_email && (
                                <span className="text-sm text-muted-foreground">
                                  {userData.user_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setModalUserRol({
                                isOpen: true,
                                userRol,
                              })
                            }
                            title="Editar asignación de rol"
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarUserRol(userRol)}
                            title="Eliminar asignación de rol"
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => setModalUserRol({ isOpen: true, userRol: undefined })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nueva Asignación de Rol
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}