"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FormularioProvider } from "@/hooks/FormularioProvider";
import { useFormularioRefresh } from "@/hooks/useFormularioContext";
import type { DataRefreshType } from "@/hooks/useFormularioContext";
import { 
  BookOpen, 
  Settings, 
  CheckCircle,
  LayoutDashboard,
  Layers,
  HelpCircle,
  Sliders,
  Settings2,
  Plus
} from "lucide-react";
import { 
  tiposEvaluacionService,
  configuracionEvaluacionService,
  aspectosEvaluacionService,
  escalasValoracionService,
  categoriaTipoService,
  categoriaAspectoService,
  categoriaEscalaService,
  categoriaTipoMapService,
  categoriaAspectoMapService,
  categoriaEscalaMapService,
  rolService,
  type Tipo,
  type Aspecto,
  type Escala,
  type ConfiguracionTipo,
  type CategoriaTipo,
  type CategoriaAspecto,
  type CategoriaEscala,
  type TipoMapItem,
  type AspectoMapItem,
  type EscalaMapItem,
  type CategoriaTipoItemsResponse,
  type CategoriaAspectoItemsResponse,
  type CategoriaEscalaItemsResponse,
  type RolMixto,
} from "@/src/api";
import type { PaginationMeta, PaginationParams } from "@/src/api/types/api.types";

import { ModalTipoEvaluacion } from "./components/views/tipo/ModalTipo";
import { ModalAspecto } from "./components/views/aspecto/ModalAspecto";
import { ModalEscala } from "./components/views/escala/ModalEscala";
import { ModalCategoriaTipo } from "./components/views/tipo/ModalCategoriaTipo";
import { ModalCategoriaAspecto } from "./components/views/aspecto/ModalCategoriaAspecto";
import { ModalCategoriaEscala } from "./components/views/escala/ModalCategoriaEscala";
import { AeView } from "./components/views/a-e/AeView";
import { ModalAe } from "./components/views/a-e/ModalAe";
import { ModalConfiguracionAspecto } from "./components/views/a-e/ModalConfiguracionAspecto";
import { ModalConfiguracionEscala } from "./components/views/a-e/ModalConfiguracionEscala";

// Nueva vista de categorías
import { CategoriesView } from "./components/views/CategoriesView";
import { ConfiguracionView } from "./components/views/a-e/ConfiguracionView";
import { useDeleteConfirmation } from "../hooks";
import { ConfirmDeleteDialog } from "../components/shared";

type ContentType = "tipo" | "aspecto" | "escala";

export default function FormularioPage() {
  // Callback que se ejecutará cuando el proveedor necesite refetchar datos
  const handleDataRefresh = useCallback(async (types: DataRefreshType[]) => {
    // El contenido actual usa cargarDatosIniciales que refetcha todo
    // Con el tipo 'all' refetcheamos todo, de lo contrario refetcheamos según el tipo
    // Por ahora, para mantener simplicidad, refetcheamos según lo que se solicite
    // Esto será manejado por el hook useFormularioRefresh en FormularioPageContent
  }, []);

  return (
    <FormularioProvider onDataRefresh={handleDataRefresh}>
      <FormularioPageContent />
    </FormularioProvider>
  );
}

function FormularioPageContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tipo" | "aspecto" | "escala" | "configuracion">("tipo");

  // Hook para confirmación de eliminación
  const { confirmationDialog, requestDeleteConfirmation } = useDeleteConfirmation({
    onSuccess: () => {
      cargarDatosIniciales();
    },
  });

  // Estados para categorías
  const [categoriasTipo, setCategoriasTipo] = useState<CategoriaTipo[]>([]);
  const [categoriasAspecto, setCategoriasAspecto] = useState<CategoriaAspecto[]>([]);
  const [categoriasEscala, setCategoriasEscala] = useState<CategoriaEscala[]>([]);

  // Estados para items mapeados a categorías
  const [categoryItemsMap, setCategoryItemsMap] = useState<{
    tipo: Map<number, TipoMapItem[]>;
    aspecto: Map<number, AspectoMapItem[]>;
    escala: Map<number, EscalaMapItem[]>;
  }>({
    tipo: new Map(),
    aspecto: new Map(),
    escala: new Map(),
  });

  // Estados de paginación
  const [categoriasTipoPagination, setCategoriasTipoPagination] = useState<PaginationMeta | null>(null);
  const [categoriasAspectoPagination, setCategoriasAspectoPagination] = useState<PaginationMeta | null>(null);
  const [categoriasEscalaPagination, setCategoriasEscalaPagination] = useState<PaginationMeta | null>(null);

  const [categoriasTipoParams, setCategoriasTipoParams] = useState<PaginationParams>({ page: 1, limit: 10 });
  const [categoriasAspectoParams, setCategoriasAspectoParams] = useState<PaginationParams>({ page: 1, limit: 10 });
  const [categoriasEscalaParams, setCategoriasEscalaParams] = useState<PaginationParams>({ page: 1, limit: 10 });

  // Estados para modales
  const [modalTipoEvaluacion, setModalTipoEvaluacion] = useState({
    isOpen: false,
    tipo: undefined as Tipo | undefined,
    categoryId: undefined as number | undefined,
  });

  const [modalAspecto, setModalAspecto] = useState({
    isOpen: false,
    aspecto: undefined as Aspecto | undefined,
    categoryId: undefined as number | undefined,
  });

  const [modalEscala, setModalEscala] = useState({
    isOpen: false,
    escala: undefined as Escala | undefined,
    categoryId: undefined as number | undefined,
  });

  const [modalCategoriaTipo, setModalCategoriaTipo] = useState<{ isOpen: boolean; categoria?: CategoriaTipo }>({
    isOpen: false,
    categoria: undefined,
  });

  const [modalCategoriaAspecto, setModalCategoriaAspecto] = useState<{ isOpen: boolean; categoria?: CategoriaAspecto }>({
    isOpen: false,
    categoria: undefined,
  });

  const [modalCategoriaEscala, setModalCategoriaEscala] = useState<{ isOpen: boolean; categoria?: CategoriaEscala }>({
    isOpen: false,
    categoria: undefined,
  });

  const [modalAe, setModalAe] = useState<{ isOpen: boolean; cfgTId?: number; onSuccess?: () => void | Promise<void> }>({
    isOpen: false,
    cfgTId: undefined,
    onSuccess: undefined,
  });

  const [modalConfiguracionAspecto, setModalConfiguracionAspecto] = useState<{ isOpen: boolean; configuracion?: ConfiguracionTipo; cfgTId?: number; aspectos?: Aspecto[]; onSuccess?: () => void }>({
    isOpen: false,
    configuracion: undefined,
    cfgTId: undefined,
    aspectos: undefined,
    onSuccess: undefined,
  });

  const [modalConfiguracionValoracion, setModalConfiguracionValoracion] = useState<{ isOpen: boolean; configuracion?: ConfiguracionTipo; cfgTId?: number; escalas?: Escala[]; onSuccess?: () => void }>({
    isOpen: false,
    configuracion: undefined,
    cfgTId: undefined,
    escalas: undefined,
    onSuccess: undefined,
  });

  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  // Data para configuración
  const [aspectos, setAspectos] = useState<Aspecto[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolMixto[]>([]);

  // Efectos
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      await Promise.all([
        loadCategoriasTipo(),
        loadCategoriasAspecto(),
        loadCategoriasEscala(),
        loadAspectos(),
        loadEscalas(),
        loadRolesDisponibles(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      });
    }
  };

  const extractItems = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    return [];
  };

  const extractPagination = (payload: any): PaginationMeta | null => {
    if (payload?.pagination) return payload.pagination as PaginationMeta;
    if (payload?.meta) {
      const meta = payload.meta;
      const totalPages = meta.pages ?? meta.totalPages ?? 1;
      const page = meta.page ?? 1;
      return {
        page,
        limit: meta.limit ?? 10,
        total: meta.total ?? 0,
        totalPages,
        hasNextPage: meta.hasNext ?? meta.hasNextPage ?? page < totalPages,
        hasPreviousPage: meta.hasPrev ?? meta.hasPreviousPage ?? page > 1,
      };
    }
    return null;
  };

  // Cargar categorías y sus items
  const loadCategoriasTipo = async (params: PaginationParams = categoriasTipoParams) => {
    try {
      const response = await categoriaTipoService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<CategoriaTipo>(response.data);
        setCategoriasTipo(items);
        setCategoriasTipoPagination(extractPagination(response.data));
        
        // Cargar items para cada categoría
        await loadItemsForCategories("tipo", items);
      } else {
        setCategoriasTipo([]);
        setCategoriasTipoPagination(null);
      }
    } catch (error) {
      console.error("Error cargando categorías tipo:", error);
      setCategoriasTipo([]);
      setCategoriasTipoPagination(null);
    }
  };

  const loadCategoriasAspecto = async (params: PaginationParams = categoriasAspectoParams) => {
    try {
      const response = await categoriaAspectoService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<CategoriaAspecto>(response.data);
        setCategoriasAspecto(items);
        setCategoriasAspectoPagination(extractPagination(response.data));
        
        // Cargar items para cada categoría
        await loadItemsForCategories("aspecto", items);
      } else {
        setCategoriasAspecto([]);
        setCategoriasAspectoPagination(null);
      }
    } catch (error) {
      console.error("Error cargando categorías aspecto:", error);
      setCategoriasAspecto([]);
      setCategoriasAspectoPagination(null);
    }
  };

  const loadCategoriasEscala = async (params: PaginationParams = categoriasEscalaParams) => {
    try {
      const response = await categoriaEscalaService.getAll(params);
      if (response.success && response.data) {
        const items = extractItems<CategoriaEscala>(response.data);
        setCategoriasEscala(items);
        setCategoriasEscalaPagination(extractPagination(response.data));
        
        // Cargar items para cada categoría
        await loadItemsForCategories("escala", items);
      } else {
        setCategoriasEscala([]);
        setCategoriasEscalaPagination(null);
      }
    } catch (error) {
      console.error("Error cargando categorías escala:", error);
      setCategoriasEscala([]);
      setCategoriasEscalaPagination(null);
    }
  };

  const loadItemsForCategories = async (type: ContentType, categories: any[]) => {
    try {
      if (type === "tipo") {
        const newMap = new Map<number, TipoMapItem[]>();
        for (const category of categories) {
          const response = await categoriaTipoMapService.listTiposByCategoria(category.id);
          newMap.set(category.id, response.success && response.data?.items ? response.data.items : []);
        }
        setCategoryItemsMap((prev) => ({
          ...prev,
          tipo: newMap,
        }));
      } else if (type === "aspecto") {
        const newMap = new Map<number, AspectoMapItem[]>();
        for (const category of categories) {
          const response = await categoriaAspectoMapService.listAspectosByCategoria(category.id);
          newMap.set(category.id, response.success && response.data?.items ? response.data.items : []);
        }
        setCategoryItemsMap((prev) => ({
          ...prev,
          aspecto: newMap,
        }));
      } else {
        const newMap = new Map<number, EscalaMapItem[]>();
        for (const category of categories) {
          const response = await categoriaEscalaMapService.listEscalasByCategoria(category.id);
          newMap.set(category.id, response.success && response.data?.items ? response.data.items : []);
        }
        setCategoryItemsMap((prev) => ({
          ...prev,
          escala: newMap,
        }));
      }
    } catch (error) {
      console.error(`Error cargando items para ${type}:`, error);
    }
  };

  const loadAspectos = async () => {
    try {
      const response = await aspectosEvaluacionService.getAll({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        const items = extractItems<Aspecto>(response.data);
        setAspectos(items);
      }
    } catch (error) {
      console.error("Error cargando aspectos:", error);
    }
  };

  const loadEscalas = async () => {
    try {
      const response = await escalasValoracionService.getAll({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        const items = extractItems<Escala>(response.data);
        setEscalas(items);
      }
    } catch (error) {
      console.error("Error cargando escalas:", error);
    }
  };

  const loadRolesDisponibles = async () => {
    try {
      const response = await rolService.getAllMix();
      if (response.success && response.data) {
        const items = extractItems<RolMixto>(response.data);
        setRolesDisponibles(items);
      }
    } catch (error) {
      console.error("Error cargando roles disponibles:", error);
    }
  };

  const handlePageChange = (
    setter: Dispatch<SetStateAction<PaginationParams>>,
    loader: (params: PaginationParams) => Promise<void>,
    current: PaginationParams,
    page: number
  ) => {
    const next = { ...current, page };
    setter(next);
    loader(next);
  };

  const handleLimitChange = (
    setter: Dispatch<SetStateAction<PaginationParams>>,
    loader: (params: PaginationParams) => Promise<void>,
    limit: number
  ) => {
    const next = { page: 1, limit };
    setter(next);
    loader(next);
  };

  // Handlers para Tipos
  const handleEliminarTipoEvaluacion = (tipo: Tipo) => {
    requestDeleteConfirmation(
      "Eliminar Tipo de Evaluación",
      `¿Está seguro de eliminar el tipo de evaluación "${tipo.nombre}"?`,
      () => tiposEvaluacionService.delete(tipo.id)
    );
  };

  const handleEliminarCategoriaTipo = (categoria: CategoriaTipo) => {
    requestDeleteConfirmation(
      "Eliminar Categoría",
      `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      () => categoriaTipoService.delete(categoria.id)
    );
  };

  // Handlers para Aspectos
  const handleEliminarAspecto = (aspecto: Aspecto) => {
    requestDeleteConfirmation(
      "Eliminar Aspecto",
      `¿Está seguro de eliminar el aspecto "${aspecto.nombre}"?`,
      () => aspectosEvaluacionService.delete(aspecto.id)
    );
  };

  const handleEliminarCategoriaAspecto = (categoria: CategoriaAspecto) => {
    requestDeleteConfirmation(
      "Eliminar Categoría de Aspecto",
      `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      () => categoriaAspectoService.delete(categoria.id)
    );
  };

  // Handlers para Escalas
  const handleEliminarEscala = (escala: Escala) => {
    requestDeleteConfirmation(
      "Eliminar Escala",
      `¿Está seguro de eliminar la escala "${escala.nombre}"?`,
      () => escalasValoracionService.delete(escala.id)
    );
  };

  const handleEliminarCategoriaEscala = (categoria: CategoriaEscala) => {
    requestDeleteConfirmation(
      "Eliminar Categoría de Escala",
      `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      () => categoriaEscalaService.delete(categoria.id)
    );
  };

  const handleEliminarConfiguracion = (config: ConfiguracionTipo, onSuccess?: () => void) => {
    requestDeleteConfirmation(
      "Eliminar Configuración",
      `¿Está seguro de eliminar la configuración del modelo de evaluación? Esta acción no se puede deshacer.`,
      () => configuracionEvaluacionService.delete(config.id),
      () => {
        toast({
          title: "Configuración eliminada",
          description: "La configuración ha sido eliminada correctamente.",
        });
        if (onSuccess) onSuccess();
      }
    );
  };

  const handleToggleItemStatus = async (type: ContentType, item: any) => {
    try {
      setLoadingItemId(item.id);
      const service =
        type === "tipo"
          ? tiposEvaluacionService
          : type === "aspecto"
            ? aspectosEvaluacionService
            : escalasValoracionService;

      if (service) {
        const isCurrentlyActive = Boolean(item.es_activo);
        await service.updateBooleanField(item.id, "es_activo", !isCurrentlyActive);
        toast({
          title: "Estado actualizado",
          description: `El item ha sido ${!isCurrentlyActive ? "activado" : "desactivado"}.`,
        });
        await cargarDatosIniciales();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado.",
        variant: "destructive",
      });
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleEliminarItemFromCategoria = (type: ContentType, item: any) => {
    const itemName = item.nombre || item.sigla || "este item";
    const typeLabel = type === "tipo" ? "tipo de evaluación" : type === "aspecto" ? "aspecto" : "escala";
    
    requestDeleteConfirmation(
      `Remover ${typeLabel} de categoría`,
      `¿Está seguro de remover "${itemName}" de esta categoría?`,
      async () => {
        setLoadingItemId(item.id);
        try {
          if (type === "tipo") {
            const categoria = categoriasTipo.find(c => 
              categoryItemsMap.tipo.get(c.id)?.some(i => i.id === item.id)
            );
            if (categoria) {
              await categoriaTipoMapService.removeTipoFromCategoria(categoria.id, item.id);
            }
          } else if (type === "aspecto") {
            const categoria = categoriasAspecto.find(c => 
              categoryItemsMap.aspecto.get(c.id)?.some(i => i.id === item.id)
            );
            if (categoria) {
              await categoriaAspectoMapService.removeAspectoFromCategoria(categoria.id, item.id);
            }
          } else if (type === "escala") {
            const categoria = categoriasEscala.find(c => 
              categoryItemsMap.escala.get(c.id)?.some(i => i.id === item.id)
            );
            if (categoria) {
              await categoriaEscalaMapService.removeEscalaFromCategoria(categoria.id, item.id);
            }
          }
          
          // Toast de éxito
          toast({
            title: "Éxito",
            description: "Item removido de la categoría",
          });
        } finally {
          setLoadingItemId(null);
        }
      }
      // Ya no se pasa customOnSuccess, se usa el onSuccess global del hook
      // que automáticamente llama cargarDatosIniciales()
    );
  };

  const navItems = [
    { id: "tipo" as const, label: "Evaluaciones", icon: BookOpen, description: "Nombres y modelos" },
    { id: "aspecto" as const, label: "Aspectos", icon: HelpCircle, description: "Preguntas y criterios" },
    { id: "escala" as const, label: "Escalas", icon: Sliders, description: "Opciones de respuesta" },
    { id: "configuracion" as const, label: "Dashboard", icon: LayoutDashboard, description: "Gestión y creación" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Premium - Light Style (Matching Dashboard) */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
              <Settings2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Arquitectura Educativa</h1>
              <p className="text-xs font-medium text-muted-foreground">Gestión de Instrumentos</p>
            </div>
          </div>

          <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 backdrop-blur-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200 animate-in fade-in scale-95"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
             <div className="h-4 w-[1px] bg-slate-200 mx-2" />
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">Live Editor</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-12">
        <div className="w-full">
           {/* Section Title & Description */}
           <div className="mb-10 flex justify-between items-end">
             <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                  {navItems.find(n => n.id === activeTab)?.label}
                </h2>
                <p className="text-sm font-medium text-slate-400 mt-2">
                  {navItems.find(n => n.id === activeTab)?.description}
                </p>
             </div>
           </div>

           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "tipo" && (
              <CategoriesView
                type="tipo"
                categories={categoriasTipo}
                items={[]}
                categoryItems={categoryItemsMap.tipo}
                onAddCategory={() => setModalCategoriaTipo({ isOpen: true, categoria: undefined })}
                onEditCategory={(cat) => setModalCategoriaTipo({ isOpen: true, categoria: cat })}
                onDeleteCategory={handleEliminarCategoriaTipo}
                onAddItem={(categoryId) => setModalTipoEvaluacion({ isOpen: true, tipo: undefined, categoryId })}
                onEditItem={(item) => setModalTipoEvaluacion({ isOpen: true, tipo: item as Tipo, categoryId: undefined })}
                onDeleteItem={(item) => handleEliminarItemFromCategoria("tipo", item)}
                onToggleItemStatus={(item) => handleToggleItemStatus("tipo", item)}
                pagination={categoriasTipoPagination}
                onPageChange={(page) =>
                  handlePageChange(setCategoriasTipoParams, loadCategoriasTipo, categoriasTipoParams, page)
                }
                onLimitChange={(limit) =>
                  handleLimitChange(setCategoriasTipoParams, loadCategoriasTipo, limit)
                }
                loadingId={loadingItemId}
              />
            )}

            {activeTab === "aspecto" && (
              <CategoriesView
                type="aspecto"
                categories={categoriasAspecto}
                items={[]}
                categoryItems={categoryItemsMap.aspecto}
                onAddCategory={() => setModalCategoriaAspecto({ isOpen: true, categoria: undefined })}
                onEditCategory={(cat) => setModalCategoriaAspecto({ isOpen: true, categoria: cat })}
                onDeleteCategory={handleEliminarCategoriaAspecto}
                onAddItem={(categoryId) => setModalAspecto({ isOpen: true, aspecto: undefined, categoryId })}
                onEditItem={(item) => setModalAspecto({ isOpen: true, aspecto: item as Aspecto, categoryId: undefined })}
                onDeleteItem={(item) => handleEliminarItemFromCategoria("aspecto", item)}
                onToggleItemStatus={(item) => handleToggleItemStatus("aspecto", item)}
                pagination={categoriasAspectoPagination}
                onPageChange={(page) =>
                  handlePageChange(setCategoriasAspectoParams, loadCategoriasAspecto, categoriasAspectoParams, page)
                }
                onLimitChange={(limit) =>
                  handleLimitChange(setCategoriasAspectoParams, loadCategoriasAspecto, limit)
                }
                loadingId={loadingItemId}
              />
            )}

            {activeTab === "escala" && (
              <CategoriesView
                type="escala"
                categories={categoriasEscala}
                items={[]}
                categoryItems={categoryItemsMap.escala}
                onAddCategory={() => setModalCategoriaEscala({ isOpen: true, categoria: undefined })}
                onEditCategory={(cat) => setModalCategoriaEscala({ isOpen: true, categoria: cat })}
                onDeleteCategory={handleEliminarCategoriaEscala}
                onAddItem={(categoryId) => setModalEscala({ isOpen: true, escala: undefined, categoryId })}
                onEditItem={(item) => setModalEscala({ isOpen: true, escala: item as Escala, categoryId: undefined })}
                onDeleteItem={(item) => handleEliminarItemFromCategoria("escala", item)}
                onToggleItemStatus={(item) => handleToggleItemStatus("escala", item)}
                pagination={categoriasEscalaPagination}
                onPageChange={(page) =>
                  handlePageChange(setCategoriasEscalaParams, loadCategoriasEscala, categoriasEscalaParams, page)
                }
                onLimitChange={(limit) =>
                  handleLimitChange(setCategoriasEscalaParams, loadCategoriasEscala, limit)
                }
                loadingId={loadingItemId}
              />
            )}

            {activeTab === "configuracion" && (
              <ConfiguracionView
                aspectos={aspectos}
                escalas={escalas}
                setModalConfiguracionAspecto={setModalConfiguracionAspecto}
                setModalConfiguracionEscala={setModalConfiguracionValoracion}
                setModalAe={setModalAe}
                handleEliminarConfiguracion={handleEliminarConfiguracion}
                refreshData={cargarDatosIniciales}
                rolesDisponibles={rolesDisponibles}
              />
            )}
           </div>
        </div>
      </main>

      {/* Modales */}
      <ModalTipoEvaluacion
        isOpen={modalTipoEvaluacion.isOpen}
        onClose={() => setModalTipoEvaluacion({ isOpen: false, tipo: undefined, categoryId: undefined })}
        tipo={modalTipoEvaluacion.tipo}
        categoryId={modalTipoEvaluacion.categoryId}
        onSuccess={cargarDatosIniciales}
      />

      <ModalAspecto
        isOpen={modalAspecto.isOpen}
        onClose={() => setModalAspecto({ isOpen: false, aspecto: undefined, categoryId: undefined })}
        aspecto={modalAspecto.aspecto}
        categoryId={modalAspecto.categoryId}
        onSuccess={cargarDatosIniciales}
      />

      <ModalEscala
        isOpen={modalEscala.isOpen}
        onClose={() => setModalEscala({ isOpen: false, escala: undefined, categoryId: undefined })}
        escala={modalEscala.escala}
        categoryId={modalEscala.categoryId}
        onSuccess={cargarDatosIniciales}
      />

      <ConfirmDeleteDialog {...confirmationDialog} />

      <ModalCategoriaTipo
        isOpen={modalCategoriaTipo.isOpen}
        onClose={() => setModalCategoriaTipo({ isOpen: false, categoria: undefined })}
        categoria={modalCategoriaTipo.categoria}
        onSuccess={cargarDatosIniciales}
      />

      <ModalCategoriaAspecto
        isOpen={modalCategoriaAspecto.isOpen}
        onClose={() => setModalCategoriaAspecto({ isOpen: false, categoria: undefined })}
        categoria={modalCategoriaAspecto.categoria}
        onSuccess={cargarDatosIniciales}
      />

      <ModalCategoriaEscala
        isOpen={modalCategoriaEscala.isOpen}
        onClose={() => setModalCategoriaEscala({ isOpen: false, categoria: undefined })}
        categoria={modalCategoriaEscala.categoria}
        onSuccess={cargarDatosIniciales}
      />

      <ModalAe
        isOpen={modalAe.isOpen}
        onClose={() => setModalAe({ isOpen: false, cfgTId: undefined, onSuccess: undefined })}
        onSuccess={async () => {
          if (modalAe.onSuccess) {
            await Promise.resolve(modalAe.onSuccess());
            return;
          }
          await cargarDatosIniciales();
        }}
        cfgTId={modalAe.cfgTId}
        aspectos={aspectos}
        escalas={escalas}
      />

      <ModalConfiguracionAspecto
        isOpen={modalConfiguracionAspecto.isOpen}
        onClose={() => setModalConfiguracionAspecto({ 
          isOpen: false, 
          configuracion: undefined,
          cfgTId: undefined,
          aspectos: undefined,
          onSuccess: undefined,
        })}
        onSuccess={() => {
          if (modalConfiguracionAspecto.onSuccess) {
            modalConfiguracionAspecto.onSuccess();
          }
          cargarDatosIniciales();
        }}
        cfgTId={modalConfiguracionAspecto.cfgTId}
        aspectos={modalConfiguracionAspecto.aspectos || aspectos}
      />

      <ModalConfiguracionEscala
        isOpen={modalConfiguracionValoracion.isOpen}
        onClose={() => setModalConfiguracionValoracion({ 
          isOpen: false, 
          configuracion: undefined,
          cfgTId: undefined,
          escalas: undefined,
          onSuccess: undefined,
        })}
        onSuccess={() => {
          if (modalConfiguracionValoracion.onSuccess) {
            modalConfiguracionValoracion.onSuccess();
          }
          cargarDatosIniciales();
        }}
        cfgTId={modalConfiguracionValoracion.cfgTId}
        escalas={modalConfiguracionValoracion.escalas || escalas}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}
