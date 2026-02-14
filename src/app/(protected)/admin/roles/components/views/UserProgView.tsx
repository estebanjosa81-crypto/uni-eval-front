import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, GraduationCap, User, BookOpen, Users } from "lucide-react";

// Interfaz para UserProg
interface UserProg {
  id: number;
  user_rol_id: number;
  prog_id: number;
  prog_nombre?: string;
  datalogin?: {
    user_name: string;
    user_username: string;
    user_email: string;
    user_idrole: number;
    user_statusid: string;
    role_name: string;
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface UserProgViewProps {
  userProgs: UserProg[];
  setModalUserProg: (value: any) => void;
  handleEliminarUserProg: (userProg: UserProg) => void;
}

export function UserProgView({
  userProgs,
  setModalUserProg,
  handleEliminarUserProg,
}: UserProgViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Gestión de Programas por Usuario
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {userProgs.length} asignaciones
              </Badge>
            </CardTitle>
            <CardDescription>
              Administre la asignación de programas académicos a usuarios del sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {userProgs.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay programas asignados
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comience asignando programas académicos a los usuarios
            </p>
            <Button
              onClick={() => setModalUserProg({ isOpen: true, userProg: undefined })}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Asignación
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {userProgs.map((userProg) => {
                const userData = userProg.datalogin;
                const programName = userProg.prog_nombre;

                return (
                  <Card
                    key={userProg.id}
                    className="transition-all duration-200 hover:shadow-md border border-muted hover:border-primary/20"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Icono y datos del usuario */}
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Nombre del usuario */}
                            <h3 className="font-semibold text-lg mb-2">
                              {userData?.user_name || `Usuario ${userProg.user_rol_id}`}
                            </h3>
                            
                            {/* Información del usuario */}
                            <div className="space-y-2">
                              {/* Rol del usuario */}
                              {userData?.role_name && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-muted-foreground">Rol:</span>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    {userData.role_name}
                                  </Badge>
                                  {userData.user_username && (
                                    <Badge variant="secondary" className="text-xs">
                                      @{userData.user_username}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Programa asignado */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {programName || `Programa ID: ${userProg.prog_id}`}
                                </span>
                              </div>

                              {/* Email del usuario */}
                              {userData?.user_email && (
                                <div className="text-sm text-muted-foreground">
                                  {userData.user_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 self-start sm:self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setModalUserProg({
                                isOpen: true,
                                userProg,
                              })
                            }
                            title="Editar asignación de programa"
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarUserProg(userProg)}
                            title="Eliminar asignación de programa"
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
                onClick={() => setModalUserProg({ isOpen: true, userProg: undefined })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nueva Asignación de Programa
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
