// roles/componentes/views/RolesView.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Rol } from "@/src/api/services/app/rol.service";
import { Edit, Trash2, Plus, Shield, Users } from "lucide-react";

interface RolesViewProps {
  roles: Rol[];
  setModalRol: (value: any) => void;
  handleEliminarRol: (rol: Rol) => void;
}

export function RolesView({
  roles,
  setModalRol,
  handleEliminarRol,
}: RolesViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Gestión de Roles
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {roles.length} roles
              </Badge>
            </CardTitle>
            <CardDescription>
              Administre los roles de usuario del sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {roles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay roles registrados
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comience creando el primer rol del sistema
            </p>
            <Button
              onClick={() => setModalRol({ isOpen: true, rol: undefined })}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Primer Rol
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {roles.map((rol) => (
                <Card
                  key={rol.id}
                  className="transition-all duration-200 hover:shadow-md border border-muted hover:border-primary/20"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {rol.nombre}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setModalRol({
                              isOpen: true,
                              rol,
                            })
                          }
                          title="Editar rol"
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarRol(rol)}
                          title="Eliminar rol"
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => setModalRol({ isOpen: true, rol: undefined })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nuevo Rol
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}