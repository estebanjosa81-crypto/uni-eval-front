"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Plus, 
  GraduationCap, 
  User, 
  BookOpen, 
  Users, 
  Search, 
  School, 
  Calendar, 
  Globe, 
  Bookmark, 
  ArrowUpRight,
  Library
} from "lucide-react";
import type { UserProgWithDatalogin } from "@/src/api/services/app/rol.service";

interface UserProgViewProps {
  userProgs: UserProgWithDatalogin[];
  setModalUserProg: (value: any) => void;
  handleEliminarUserProg: (userProg: UserProgWithDatalogin) => void;
}

export function UserProgView({
  userProgs,
  setModalUserProg,
  handleEliminarUserProg,
}: UserProgViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUserProgs = userProgs.filter(up => {
    const searchLow = searchTerm.toLowerCase();
    return (
      up.datalogin?.user_name?.toLowerCase().includes(searchLow) ||
      up.prog_nombre?.toLowerCase().includes(searchLow) ||
      up.datalogin?.user_email?.toLowerCase().includes(searchLow)
    );
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-10 bg-indigo-600 rounded-full" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Vinculación Académica</h2>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-13">Asignación de responsabilidad institucional por programa</p>
        </div>
        <Button
          onClick={() => setModalUserProg({ isOpen: true, userProg: undefined })}
          className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-8 py-7 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 text-sm gap-3"
        >
          <Plus className="h-5 w-5" />
          Nueva Conexión de Programa
        </Button>
      </div>

      {/* Modern Search & Layout View Options */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <Input
          type="text"
          placeholder="Rastrear programa o responsable académico..."
          className="pl-14 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] text-sm font-semibold focus-visible:ring-indigo-600/5 focus-visible:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:text-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
           <Badge className="bg-white border-2 border-slate-100 text-slate-400 font-medium text-xs px-4 py-2 rounded-xl">
             MODO GALERÍA ACTIVE
           </Badge>
        </div>
      </div>

      {/* High-Fidelity Grid Display */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredUserProgs.length === 0 ? (
          <div className="xl:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] p-24 text-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-slate-100 text-slate-200">
              <Library className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Archivo Académico sin Registros</h3>
            <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto leading-relaxed">
               No hay asociaciones activas detectadas en este segmento de la red.
            </p>
          </div>
        ) : (
          filteredUserProgs.map((userProg) => {
            const userData = userProg.datalogin;
            const programName = userProg.prog_nombre;

            return (
              <div
                key={userProg.id}
                className="group relative bg-white border-2 border-slate-100 rounded-[3rem] p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-200/30 hover:border-indigo-600/20 flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.06] transition-all duration-1000">
                   <Library className="w-48 h-48 text-indigo-900" />
                </div>

                <div>
                  <div className="flex items-start justify-between mb-10 relative z-10">
                    <div className="h-18 w-18 rounded-[1.6rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <School className="w-8 h-8" />
                    </div>
                    <div className="flex gap-3">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setModalUserProg({ isOpen: true, userProg })}
                        className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminarUserProg(userProg)}
                        className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <Badge className="bg-indigo-600 text-white font-medium text-xs px-3 py-1 rounded-lg">
                           <Bookmark className="w-3 h-3 mr-1.5 fill-current" />
                           Programa Académico
                         </Badge>
                         <div className="h-px w-20 bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight line-clamp-2 min-h-[64px] group-hover:text-indigo-600 transition-colors">
                        {programName || `IDENTIFICADOR: ${userProg.prog_id}`}
                      </h3>
                    </div>

                    <div className="bg-slate-50 group-hover:bg-indigo-50/50 rounded-[2rem] p-6 flex items-center gap-5 border border-slate-100 transition-all duration-500 hover:border-indigo-100">
                       <div className="relative">
                          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-50">
                             <User className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                             <ArrowUpRight className="w-3 h-3 text-white" />
                          </div>
                       </div>
                       <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-400 leading-none mb-1.5">Responsable del Registro</p>
                          <p className="text-base font-bold text-slate-900 truncate">{userData?.user_name || "Personal No Identificado"}</p>
                          <p className="text-xs font-medium text-slate-500 truncate opacity-70">{userData?.user_email}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t-2 border-slate-50 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                         <p className="text-xs font-medium text-slate-300 mb-1 leading-none">Fecha Vinculación</p>
                         <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-semibold">{userProg.fecha_creacion ? new Date(userProg.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'S/I'}</span>
                         </div>
                      </div>
                   </div>
                   <Badge variant="outline" className="text-xs font-medium bg-white border-2 border-slate-100 px-4 py-1.5 rounded-xl shadow-sm text-slate-400">
                      ID Conexión: {userProg.id}
                   </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
