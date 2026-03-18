import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../PaginationControls";

interface Category {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

interface CategoryItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  sigla?: string;
  es_activo?: boolean | null;
}

interface CategoriesViewProps {
  type: "tipo" | "aspecto" | "escala";
  categories: Category[];
  items: CategoryItem[];
  categoryItems: Map<number, CategoryItem[]>;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddItem: (categoryId: number) => void;
  onEditItem: (item: CategoryItem) => void;
  onDeleteItem: (item: CategoryItem) => void;
  onToggleItemStatus?: (item: CategoryItem) => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loadingId?: number | null;
}

export function CategoriesView({
  type,
  categories,
  items,
  categoryItems,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItemStatus,
  pagination,
  onPageChange,
  onLimitChange,
  loadingId,
}: CategoriesViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getTypeLabel = () => {
    switch (type) {
      case "tipo":
        return "Modelos de Evaluación";
      case "aspecto":
        return "Aspectos y Preguntas";
      case "escala":
        return "Escalas de Valoración";
      default:
        return "";
    }
  };

  const getItemLabel = () => {
    switch (type) {
      case "tipo":
        return "Evaluación";
      case "aspecto":
        return "Pregunta";
      case "escala":
        return "Escala";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section for the list */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
        <div>
           <h3 className="text-sm font-semibold text-slate-400 mb-1">Estructura de Datos</h3>
           <p className="text-xs font-medium text-slate-400">Organiza y gestiona los componentes esenciales de tus evaluaciones.</p>
        </div>
        <Button 
          onClick={onAddCategory}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12 font-semibold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="grid gap-6">
        {categories.length === 0 ? (
          <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[3rem] p-20 text-center">
            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Layers className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sin categorías registradas</h3>
            <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto mb-8">
              No hemos encontrado categorías para {getTypeLabel().toLowerCase()}. Comienza creando una nueva.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="group relative"
            >
              {/* Decorative side line */}
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-indigo-500/0 group-hover:bg-indigo-500/100 rounded-full transition-all duration-500" />
              
              <Card className="border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                <Collapsible
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-6">
                        <CollapsibleTrigger className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-500 ${
                              expandedCategories.has(category.id) ? "rotate-180" : ""
                            }`}
                          />
                        </CollapsibleTrigger>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-bold text-slate-900 truncate">
                              {category.nombre}
                            </h4>
                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none rounded-lg font-semibold text-xs px-2">
                               {categoryItems.get(category.id)?.length || 0} {getItemLabel()}(s)
                            </Badge>
                          </div>
                          {category.descripcion && (
                            <p className="text-sm font-medium text-slate-400 line-clamp-1 italic">
                              {category.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditCategory(category)}
                          className="h-10 w-10 rounded-xl border-slate-100 hover:bg-slate-50 hover:text-indigo-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDeleteCategory(category)}
                          className="h-10 w-10 rounded-xl border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-500">
                        <div className="bg-slate-50/50 rounded-[2rem] p-6 space-y-4 border border-slate-100 shadow-inner">
                          <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                               <span className="text-xs font-medium text-slate-400 leading-none mt-0.5">
                                 {getTypeLabel()} Registrados
                               </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onAddItem(category.id)}
                              className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 font-semibold text-sm shadow-sm transition-all"
                            >
                              <Plus className="h-3.5 w-3.5 mr-2" />
                              Vincular {getItemLabel()}
                            </Button>
                          </div>

                          {!categoryItems.get(category.id) ||
                          categoryItems.get(category.id)!.length === 0 ? (
                            <div className="text-center py-10">
                               <p className="text-xs font-medium text-slate-300">Ningún {getItemLabel().toLowerCase()} vinculado</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {categoryItems.get(category.id)!.map((item) => (
                                <div
                                  key={item.id}
                                  className="group/item flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all duration-300"
                                >
                                  <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-3 mb-1">
                                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                                         <FileText className="h-4 w-4" />
                                      </div>
                                      <p className="font-semibold text-slate-900 text-sm truncate">
                                        {item.sigla && (
                                          <span className="text-indigo-500/50 mr-2">
                                            [{item.sigla}]
                                          </span>
                                        )}
                                        {item.nombre}
                                      </p>
                                    </div>
                                    {item.descripcion && (
                                      <p className="text-[11px] font-medium text-slate-400 pl-11 line-clamp-1 italic">
                                        {item.descripcion}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {item.es_activo !== undefined && (
                                      <Badge
                                        variant="outline"
                                        className={`rounded-lg font-semibold text-xs mr-2 border-none ${
                                          item.es_activo
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-rose-50 text-rose-600"
                                        }`}
                                      >
                                        {item.es_activo ? "Activo" : "Inactivo"}
                                      </Badge>
                                    )}
                                    
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEditItem(item)}
                                        className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDeleteItem(item)}
                                        className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                      {onToggleItemStatus && item.es_activo !== undefined && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          disabled={loadingId === item.id}
                                          onClick={() => onToggleItemStatus(item)}
                                          className="h-8 w-8 rounded-lg hover:bg-slate-100"
                                        >
                                          {loadingId === item.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <div className={`h-2 w-2 rounded-full ${item.es_activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          ))
        )}
      </div>

      {categories.length > 0 && (
        <div className="pt-6">
           <PaginationControls
             pagination={pagination}
             onPageChange={onPageChange}
             onLimitChange={onLimitChange}
           />
        </div>
      )}
    </div>
  );
}
