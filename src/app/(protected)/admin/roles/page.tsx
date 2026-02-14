"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { rolService, userRolService, userProgService, type Rol, type UserRol } from "@/src/api/services/app/rol.service";
import { RolesView } from "./components/views/RolesView";
import { UserRolesView } from "./components/views/UserRolesView";
import { UserProgView } from "./components/views/UserProgView";
import { ModalRol } from "./components/modals/ModalRol";
import { ModalUserRol } from "./components/modals/ModalUserRol";
import { ModalUserProg } from "./components/modals/ModalUserProg";
import { ModalConfirmacion } from "./components/modals/ModalConfirmacion";
import { tokenManager } from "@/src/api/utils/tokenManager";

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

export default function RolesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [userRoles, setUserRoles] = useState<UserRol[]>([]);
  const [userProgs, setUserProgs] = useState<UserProg[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para modales de Roles
  const [modalRol, setModalRol] = useState({
    isOpen: false,
    rol: undefined as Rol | undefined,
  });

  // Estados para modales de UserRoles
  const [modalUserRol, setModalUserRol] = useState({
    isOpen: false,
    userRol: undefined as UserRol | undefined,
  });

  // Estados para modales de UserProgs
  const [modalUserProg, setModalUserProg] = useState({
    isOpen: false,
    userProg: undefined as UserProg | undefined,
  });

  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  // Cargar datos iniciales - Solo ejecutar en cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = tokenManager.getAccessToken();
      console.log("🔍 Verificando token:", !!token);
      console.log("📋 Token encontrado:", token?.substring(0, 20) + "...");
      if (!token) {
        console.log("❌ No hay token, abortando carga de datos");
        setIsLoading(false);
        return;
      }
      console.log("✅ Token encontrado, iniciando carga de datos");
      cargarDatos();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      console.log("📤 Iniciando peticiones a rolService.getAll(), userRolService.getAllWithRoleName() y userProgs");
      
      const [rolesResponse, userRolesResponse, userProgsResponse] = await Promise.all([
        rolService.getAll(),
        userRolService.getUserRoles(),
        userProgService.getUserProgs()
      ]);
      
      console.log("📥 Respuesta de roles:", rolesResponse);
      console.log("📥 Respuesta de userRoles:", userRolesResponse);
      console.log("📥 Respuesta de userProgs:", userProgsResponse);
      
      // Extract data from API responses
      const rolesData = (rolesResponse as any)?.data?.data || [];
      const userRolesData = userRolesResponse?.data || [];
      const userProgsData = userProgsResponse?.data || [];
      
      console.log("✅ Roles extraídos:", rolesData);
      console.log("✅ UserRoles extraídos:", userRolesData);
      console.log("✅ UserProgs extraídos:", userProgsData);
      
      setRoles(rolesData);
      setUserRoles(userRolesData);
      setUserProgs(userProgsData);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const rolesResponse = await rolService.getAll();
      setRoles((rolesResponse as any)?.data?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
    }
  };

  const cargarUserRoles = async () => {
    try {
      const userRolesResponse = await userRolService.getUserRoles();
      setUserRoles(userRolesResponse?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles de usuario:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles de usuario",
        variant: "destructive",
      });
    }
  };

  const cargarUserProgs = async () => {
    try {
      const userProgsResponse = await userProgService.getUserProgs();
      setUserProgs(userProgsResponse?.data || []);
    } catch (error) {
      console.error("❌ Error al cargar programas de usuario:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los programas de usuario",
        variant: "destructive",
      });
    }
  };

  // Handlers para Roles
  const handleEliminarRol = async (rol: Rol) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Rol",
      description: `¿Está seguro de eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await rolService.delete(rol.id);
          await cargarRoles();
          toast({
            title: "¡Eliminación exitosa!",
            description: `El rol "${rol.nombre}" se eliminó correctamente`,
          });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || "No se pudo eliminar el rol";
          toast({
            title: "Error al eliminar",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        }
      },
    });
  };

  // Handlers para UserRoles
  const handleEliminarUserRol = async (userRol: UserRol) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Asignación de Rol",
      description: `¿Está seguro de eliminar la asignación del rol al usuario ID ${userRol.user_id}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await userRolService.delete(userRol.id);
          await cargarUserRoles();
          toast({
            title: "¡Eliminación exitosa!",
            description: `La asignación de rol se eliminó correctamente`,
          });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || "No se pudo eliminar la asignación";
          toast({
            title: "Error al eliminar",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        }
      },
    });
  };

  // Handlers para UserProgs
  const handleEliminarUserProg = async (userProg: UserProg) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Asignación de Programa",
      description: `¿Está seguro de eliminar la asignación del programa? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await userProgService.delete(userProg.id);
          await cargarUserProgs();
          toast({
            title: "¡Eliminación exitosa!",
            description: `La asignación de programa se eliminó correctamente`,
          });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || "No se pudo eliminar la asignación";
          toast({
            title: "Error al eliminar",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        }
      },
    });
  };

  const handleCerrarModalRol = () => {
    setModalRol({ isOpen: false, rol: undefined });
  };

  const handleCerrarModalUserRol = () => {
    setModalUserRol({ isOpen: false, userRol: undefined });
  };

  const handleCerrarModalUserProg = () => {
    setModalUserProg({ isOpen: false, userProg: undefined });
  };

  const handleCerrarModalConfirmacion = () => {
    setModalConfirmacion({
      ...modalConfirmacion,
      isOpen: false,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Protegido por admin/layout.tsx con useRequireRole(APP_ROLE_IDS.ADMIN) */}
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <p className="text-gray-600">Administre los roles del sistema y las asignaciones de usuarios</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "roles" ? "default" : "outline"}
            onClick={() => setActiveTab("roles")}
          >
            Roles del Sistema
          </Button>
          <Button
            variant={activeTab === "userRoles" ? "default" : "outline"}
            onClick={() => setActiveTab("userRoles")}
          >
            Asignaciones de Usuario
          </Button>
          <Button
            variant={activeTab === "userProgs" ? "default" : "outline"}
            onClick={() => setActiveTab("userProgs")}
          >
            Programas de Usuario
          </Button>
        </div>

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

        <ModalConfirmacion
          isOpen={modalConfirmacion.isOpen}
          onClose={handleCerrarModalConfirmacion}
          title={modalConfirmacion.title}
          description={modalConfirmacion.description}
          onConfirm={modalConfirmacion.onConfirm}
        />
      </div>
    </>
  );
}