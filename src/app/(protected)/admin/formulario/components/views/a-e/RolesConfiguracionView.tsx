import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cfgTRolService, type RolAsignado } from "@/src/api";

interface RolesConfiguracionViewProps {
  cfgTId: number;
  rolesAsignados: RolAsignado[];
  rolesDisponibles: Array<{
    id: number;
    nombre: string;
    origen: string;
  }>;
  onRoleAdded: () => void;
  onRoleRemoved: () => void;
  loadingId?: number | null;
}

export function RolesConfiguracionView({
  cfgTId,
  rolesAsignados,
  rolesDisponibles,
  onRoleAdded,
  onRoleRemoved,
  loadingId,
}: RolesConfiguracionViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Roles que aún no están asignados
  const rolesNoAsignados = rolesDisponibles.filter(
    rol => !rolesAsignados.some(cfgRol => cfgRol.rol_mix_id === rol.id)
  );

  const handleAgregarRol = async (rolMixId: number) => {
    try {
      setLoading(true);
      const response = await cfgTRolService.create({
        cfg_t_id: cfgTId,
        rol_mix_id: rolMixId,
      });

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol asignado correctamente",
        });
        onRoleAdded();
      } else {
        toast({
          title: "Error",
          description: "No se pudo asignar el rol",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al asignar rol:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarRol = async (rolMixId: number) => {
    try {
      setLoading(true);
      // Buscar la relación a eliminar - necesitamos obtener el ID de la relación
      // Para esto, debemos hacer una consulta previa o mantener un mapeo
      // Por ahora, usamos el endpoint de eliminación por query params
      const response = await cfgTRolService.deleteByConfigAndRole(cfgTId, rolMixId);

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol removido correctamente",
        });
        onRoleRemoved();
      } else {
        toast({
          title: "Error",
          description: "No se pudo remover el rol",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al remover el rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Roles Asignados */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Asignados</CardTitle>
          <CardDescription>
            Roles que pueden realizar esta evaluación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesAsignados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">No hay roles asignados</div>
              <div className="text-xs mt-1">Asigna al menos un rol para habilitar esta evaluación</div>
            </div>
          ) : (
            <div className="space-y-2">
              {rolesAsignados.map((rolAsignado) => (
                <div
                  key={rolAsignado.rol_mix_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{rolAsignado.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        Origen: <Badge variant="outline" className="ml-1">{rolAsignado.origen}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEliminarRol(rolAsignado.rol_mix_id)}
                    disabled={loading || loadingId === rolAsignado.rol_mix_id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Disponibles para Agregar */}
      {rolesNoAsignados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Roles Disponibles</CardTitle>
            <CardDescription>
              Agregar nuevos roles a esta evaluación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rolesNoAsignados.map((rol) => (
                <div
                  key={rol.id}
                  className="relative"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-2"
                    onClick={() => handleAgregarRol(rol.id)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-left overflow-hidden">
                      <div className="font-medium text-sm">{rol.nombre}</div>
                      <div className="text-xs text-muted-foreground">{rol.origen}</div>
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
