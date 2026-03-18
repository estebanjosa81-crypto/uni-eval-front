import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ShieldCheck, Users, Info, Activity } from "lucide-react";
import { useState } from "react";
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
  onRoleAdded: () => void | Promise<void>;
  onRoleRemoved: () => void | Promise<void>;
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
        await Promise.resolve(onRoleAdded());
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

  const handleEliminarRol = async (id: number) => {
    try {
      setLoading(true);
      const response = await cfgTRolService.deleteByConfigAndRole(id);

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol removido correctamente",
        });
        await Promise.resolve(onRoleRemoved());
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
        <div className="flex items-center gap-6">
           <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
              <ShieldCheck className="h-7 w-7 text-indigo-500" />
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-900">Acceso y Privilegios</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Configura qué roles institucionales tienen permiso para ejecutar esta evaluación.</p>
           </div>
        </div>
        <div className="flex gap-4">
           <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-xl px-4 py-2 text-xs font-semibold h-10 flex items-center gap-2">
             <Users className="h-3 w-3" />
             {rolesAsignados.length} Roles con Permiso
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Asignados Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 px-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-400 leading-none mt-0.5">Control de Autorización</span>
           </div>
           
           <div className="space-y-3">
             {rolesAsignados.length === 0 ? (
               <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] p-12 text-center">
                 <Info className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-xs italic">No hay roles autorizados para esta configuración.</p>
               </div>
             ) : (
               rolesAsignados.map((rolAsignado) => (
                 <Card
                   key={rolAsignado.rol_mix_id}
                   className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white group"
                 >
                   <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-5 w-5" />
                         </div>
                         <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{rolAsignado.nombre}</h4>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Sistema: {rolAsignado.origen}</p>
                         </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEliminarRol(rolAsignado.id)}
                        disabled={loading || loadingId === rolAsignado.id}
                        className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 opacity-0 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                 </Card>
               ))
             )}
           </div>
        </div>

        {/* Roles Disponibles Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 px-4">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-medium text-slate-400 leading-none mt-0.5">Roles del Directorio</span>
           </div>

           <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
             {rolesNoAsignados.length === 0 ? (
               <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] p-12 text-center">
                 <Activity className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-xs italic">Se han asignado todos los roles disponibles.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-2">
                 {rolesNoAsignados.map((rol) => (
                   <button
                     key={rol.id}
                     onClick={() => handleAgregarRol(rol.id)}
                     disabled={loading}
                     className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all duration-300 text-left disabled:opacity-50"
                   >
                     <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 border border-slate-200 group-hover:border-indigo-100 transition-colors">
                           <Plus className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                             <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600">{rol.nombre}</h4>
                             <span className="text-xs font-medium text-slate-400 mt-0.5 block">{rol.origen}</span>
                        </div>
                     </div>
                     <Badge className="bg-white text-slate-400 group-hover:bg-indigo-600 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 transition-all rounded-lg text-[8px] font-black h-5 px-2">
                        VINCULAR
                     </Badge>
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
