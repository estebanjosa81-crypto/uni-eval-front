"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Settings2,
  Loader2,
  LayoutDashboard,
  Plus,
  ArrowRight,
  Shield,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import {
  rolService,
  userRolService,
  userProgService,
  type Rol,
  type UserRol,
  type UserRolWithDatalogin,
  type UserProgWithDatalogin,
} from "@/src/api/services/app/rol.service";
import { RolesView } from "./components/views/RolesView";
import { UserRolesView } from "./components/views/UserRolesView";
import { UserProgView } from "./components/views/UserProgView";
import { ModalRol } from "./components/modals/ModalRol";
import { ModalUserRol } from "./components/modals/ModalUserRol";
import { ModalUserProg } from "./components/modals/ModalUserProg";
import { tokenManager } from "@/src/api/utils/tokenManager";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteConfirmation } from "../hooks";
import { ConfirmDeleteDialog } from "../components/shared";

export default function RolesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [userRoles, setUserRoles] = useState<UserRolWithDatalogin[]>([]);
  const [userProgs, setUserProgs] = useState<UserProgWithDatalogin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hook para confirmación de eliminación
  const { confirmationDialog, requestDeleteConfirmation } = useDeleteConfirmation({
    onSuccess: () => {
      // Se ejecutará después de la eliminación exitosa
      toast({
        title: "Eliminado",
        description: "El elemento ha sido eliminado correctamente.",
      });
    },
  });

  // Estados para modales
  const [modalRol, setModalRol] = useState({
    isOpen: false,
    rol: undefined as Rol | undefined,
  });

  const [modalUserRol, setModalUserRol] = useState({
    isOpen: false,
    userRol: undefined as UserRol | undefined,
  });

  const [modalUserProg, setModalUserProg] = useState({
    isOpen: false,
    userProg: undefined as UserProgWithDatalogin | undefined,
  });

  // Cargar datos iniciales
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      cargarDatos();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [rolesResponse, userRolesResponse, userProgsResponse] = await Promise.all([
        rolService.getAll(),
        userRolService.getUserRoles(),
        userProgService.getUserProgs()
      ]);

      const rolesData = rolesResponse.data?.data || [];
      const userRolesData = userRolesResponse?.data || [];
      const userProgsData = userProgsResponse?.data || [];

      setRoles(rolesData);
      setUserRoles(userRolesData);
      setUserProgs(userProgsData);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron recuperar las configuraciones de seguridad.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const rolesResponse = await rolService.getAll();
      setRoles(rolesResponse.data?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles:", error);
    }
  };

  const cargarUserRoles = async () => {
    try {
      const userRolesResponse = await userRolService.getUserRoles();
      setUserRoles(userRolesResponse?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles de usuario:", error);
    }
  };

  const cargarUserProgs = async () => {
    try {
      const userProgsResponse = await userProgService.getUserProgs();
      setUserProgs(userProgsResponse?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar programas de usuario:", error);
    }
  };

  // Handlers
  const handleEliminarRol = (rol: Rol) => {
    requestDeleteConfirmation(
      "Eliminar Rol de Seguridad",
      `¿Está seguro de eliminar el rol "${rol.nombre}"? Esta acción afectará los permisos de los usuarios asignados.`,
      () => rolService.delete(rol.id),
      () => cargarRoles()
    );
  };

  const handleEliminarUserRol = (userRol: UserRol) => {
    requestDeleteConfirmation(
      "Revocar Asignación de Rol",
      `¿Revocar privilegios para el usuario con ID ${userRol.user_id}?`,
      () => userRolService.delete(userRol.id),
      () => cargarUserRoles()
    );
  };

  const handleEliminarUserProg = (userProg: UserProgWithDatalogin) => {
    requestDeleteConfirmation(
      "Desvincular Programa Académico",
      `¿Eliminar la asociación de este programa para el usuario?`,
      () => userProgService.delete(userProg.id),
      () => cargarUserProgs()
    );
  };

  const handleCerrarModalRol = () => setModalRol({ isOpen: false, rol: undefined });
  const handleCerrarModalUserRol = () => setModalUserRol({ isOpen: false, userRol: undefined });
  const handleCerrarModalUserProg = () => setModalUserProg({ isOpen: false, userProg: undefined });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-20 flex items-center">
          <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex items-center gap-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-[2.5rem] bg-white border border-slate-100" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-2">
               <Skeleton className="h-[500px] rounded-[2.5rem] bg-white border border-slate-100" />
            </div>
            <div className="lg:col-span-10">
               <Skeleton className="h-[700px] rounded-[3.5rem] bg-white border border-slate-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: "roles", label: "Definición de Roles", description: "Configura la jerarquía y permisos", icon: Shield, color: "blue", count: roles.length },
    { id: "userRoles", label: "Asignación de Usuarios", description: "Vincula roles a cuentas activas", icon: Users, color: "emerald", count: userRoles.length },
    { id: "userProgs", label: "Programas Académicos", description: "Gestión de facultades y programas", icon: GraduationCap, color: "indigo", count: userProgs.length },
  ];

  const activeTabColor = tabs.find(t => t.id === activeTab)?.color || "blue";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Dynamic Header - Ultra Clean */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/80">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Security Console</h1>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-medium text-xs px-2 py-0.5 rounded-md">Live</Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-1.5">Control de Accesos e Identidades</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={cargarDatos}
               className="h-10 px-4 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 gap-2 transition-all"
             >
                <div className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isLoading ? 'animate-ping' : ''}`} />
                <span className="text-xs font-medium">Sincronizar Repositorio</span>
             </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-12">
        
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tabs.map((tab) => (
            <div 
              key={`stat-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group cursor-pointer p-6 rounded-[2rem] border transition-all duration-500
                ${activeTab === tab.id 
                  ? `bg-white border-${tab.color}-100 shadow-xl shadow-${tab.color}-100/40 ring-1 ring-${tab.color}-500/10` 
                  : 'bg-white/50 border-white hover:bg-white hover:border-slate-200 hover:shadow-lg'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className={`
                  p-3 rounded-2xl transition-colors duration-500
                  ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-200` : `bg-${tab.color}-50 text-${tab.color}-600 group-hover:bg-${tab.color}-600 group-hover:text-white`}
                `}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{tab.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{tab.count}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div>
                   <p className="text-xs font-medium text-slate-500 leading-tight">{tab.description}</p>
                </div>
                <div className={`
                  p-1.5 rounded-full transition-all duration-500
                  ${activeTab === tab.id ? `bg-${tab.color}-50 text-${tab.color}-600 scale-110 rotate-45` : 'bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100'}
                `}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area - Wide Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Selective Navigation Sidebar - Slimmer */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-3 shadow-sm sticky top-32">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 group
                      ${activeTab === tab.id 
                        ? `bg-${tab.color}-50 text-${tab.color}-700 shadow-inner` 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-xl transition-all
                      ${activeTab === tab.id ? `bg-white shadow-sm text-${tab.color}-600` : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}
                    `}>
                      <tab.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xs leading-none">{tab.label}</p>
                    </div>
                    {activeTab === tab.id && (
                      <div className={`h-1.5 w-1.5 rounded-full bg-${tab.color}-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Dynamic Content Display - Massive Area */}
          <div className="lg:col-span-10">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden min-h-[750px] flex flex-col transition-all duration-700">
              {/* Header de la vista activa */}
              <div className={`h-2 w-full bg-${activeTabColor}-500`} />
              
              <div className="flex-1 p-8 lg:p-12">
                {activeTab === "roles" && (
                  <RolesView
                    roles={roles}
                    setModalRol={setModalRol}
                    handleEliminarRol={handleEliminarRol}
                  />
                )}

                {activeTab === "userRoles" && (
                  <UserRolesView
                    userRoles={userRoles}
                    setModalUserRol={setModalUserRol}
                    handleEliminarUserRol={handleEliminarUserRol}
                  />
                )}

                {activeTab === "userProgs" && (
                  <UserProgView
                    userProgs={userProgs}
                    setModalUserProg={setModalUserProg}
                    handleEliminarUserProg={handleEliminarUserProg}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        <ModalRol
          isOpen={modalRol.isOpen}
          onClose={handleCerrarModalRol}
          rol={modalRol.rol}
          onSuccess={cargarRoles}
        />

        <ModalUserRol
          isOpen={modalUserRol.isOpen}
          onClose={handleCerrarModalUserRol}
          userRol={modalUserRol.userRol}
          onSuccess={cargarUserRoles}
        />

        <ModalUserProg
          isOpen={modalUserProg.isOpen}
          onClose={handleCerrarModalUserProg}
          userProg={modalUserProg.userProg}
          onSuccess={cargarUserProgs}
        />

        <ConfirmDeleteDialog {...confirmationDialog} />
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
