"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, UserCheck, User, Shield, Users, Search, Mail, Fingerprint, ShieldCheck, Database, CheckCircle2 } from "lucide-react";
import type { UserRolWithDatalogin } from "@/src/api/services/app/rol.service";

interface UserRolesViewProps {
  userRoles: UserRolWithDatalogin[];
  setModalUserRol: (value: any) => void;
  handleEliminarUserRol: (userRol: UserRolWithDatalogin) => void;
}

export function UserRolesView({
  userRoles,
  setModalUserRol,
  handleEliminarUserRol,
}: UserRolesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUserRoles = userRoles.filter(ur => {
    const searchLow = searchTerm.toLowerCase();
    return (
      ur.datalogin?.user_name.toLowerCase().includes(searchLow) ||
      ur.datalogin?.user_email.toLowerCase().includes(searchLow) ||
      ur.rol_nombre?.toLowerCase().includes(searchLow)
    );
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-10 bg-emerald-600 rounded-full" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Matriz de Asignación</h2>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-13">Vincule identidades corporativas con niveles de privilegio</p>
        </div>
        <Button
          onClick={() => setModalUserRol({ isOpen: true, userRol: undefined })}
          className="bg-emerald-950 hover:bg-emerald-900 text-white font-semibold px-8 py-7 rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95 text-sm gap-3"
        >
          <Plus className="h-5 w-5" />
          Nueva Asignación de Rol
        </Button>
      </div>

      {/* Experimental Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
        </div>
        <Input
          type="text"
          placeholder="Rastrear identidad por nombre, email o cargo..."
          className="pl-14 py-8 bg-white border-2 border-slate-100 rounded-[2.2rem] text-sm font-semibold focus-visible:ring-emerald-600/5 focus-visible:border-emerald-600 transition-all shadow-sm placeholder:text-slate-300 placeholder:text-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <div className="h-10 w-px bg-slate-100 mx-2" />
           <Badge variant="outline" className="h-10 px-6 border-slate-100 text-slate-400 font-medium text-xs bg-slate-50/50 rounded-2xl hidden md:flex items-center">
              Total: {filteredUserRoles.length} Usuarios
           </Badge>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredUserRoles.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] p-24 text-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-slate-100">
              <UserCheck className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Repositorio Libre de Asignaciones</h3>
            <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto leading-relaxed">
               {searchTerm ? `No se encontraron coincidencias para "${searchTerm}" en el registro activo.` : "Inicie la vinculación de personal usando el comando de acción superior."}
            </p>
          </div>
        ) : (
          filteredUserRoles.map((userRol) => {
            const userData = userRol.datalogin;
            return (
              <div
                key={userRol.id}
                className="group relative bg-white border-2 border-slate-100 rounded-[3rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-200/20 hover:border-emerald-600/30 overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500/0 group-hover:bg-emerald-500 transition-all duration-500" />
                
                <div className="flex items-center gap-8 flex-1 min-w-0 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="h-20 w-20 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-500 border-2 border-slate-100 group-hover:border-emerald-100 shadow-inner">
                       <User className="w-10 h-10" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white p-1 rounded-[1rem] shadow-lg border-2 border-slate-50 flex items-center justify-center">
                       <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-4">
                       <h3 className="font-bold text-slate-900 text-2xl group-hover:text-emerald-900 transition-colors leading-none truncate">
                         {userData?.user_name || `ID Sistema: ${userRol.user_id}`}
                       </h3>
                       <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                         <Shield className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                         <span className="text-xs font-semibold">{userRol.rol_nombre}</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-8">
                      <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold tracking-tight lowercase">{userData?.user_email || 'identidad_protegida@edu.co'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Fingerprint className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium">UID-X: {userRol.user_id}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Database className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-nowrap">Ref: #{userRol.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 self-end lg:self-center">
                  <div className="h-12 w-px bg-slate-100 hidden lg:block mx-4" />
                  <Button
                    variant="outline"
                    onClick={() => setModalUserRol({ isOpen: true, userRol })}
                    className="h-14 w-14 rounded-[1.3rem] border-2 border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-90"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEliminarUserRol(userRol)}
                    className="h-14 w-14 rounded-[1.3rem] border-2 border-slate-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-90"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
