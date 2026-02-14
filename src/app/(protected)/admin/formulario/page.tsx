// app/admin/formulario/page.tsx
"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Settings, 
  CheckCircle
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
  type CategoriaTipoItemsResponse,
  type CategoriaAspectoItemsResponse,
  type CategoriaEscalaItemsResponse,
  type RolMixto,
} from "@/src/api";
import type { PaginationMeta, PaginationParams } from "@/src/api/types/api.types";

// Importar modales
import { ModalTipoEvaluacion } from "./components/views/tipo/ModalTipo";
import { ModalAspecto } from "./components/views/aspecto/ModalAspecto";
import { ModalEscala } from "./components/views/escala/ModalEscala";
import { ModalConfirmacion } from "./components/ModalConfirmacion";
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

type ContentType = "tipo" | "aspecto" | "escala";

interface CategoryItemsMap {
  tipo: Map<number, (Tipo & { map_id?: number })[]>;
  aspecto: Map<number, (Aspecto & { map_id?: number })[]>;
  escala: Map<number, (Escala & { map_id?: number })[]>;
}

export default function FormularioPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tipo" | "aspecto" | "escala" | "configuracion">("tipo");

  // Estados para categorías
  const [categoriasTipo, setCategoriasTipo] = useState<CategoriaTipo[]>([]);
  const [categoriasAspecto, setCategoriasAspecto] = useState<any[]>([]);
  const [categoriasEscala, setCategoriasEscala] = useState<any[]>([]);

  // Estados para items mapeados a categorías
  const [categoryItemsMap, setCategoryItemsMap] = useState<CategoryItemsMap>({
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

  const [modalCategoriaTipo, setModalCategoriaTipo] = useState({
    isOpen: false,
    categoria: undefined as CategoriaTipo | undefined,
  });

  const [modalCategoriaAspecto, setModalCategoriaAspecto] = useState({
    isOpen: false,
    categoria: undefined as any | undefined,
  });

  const [modalCategoriaEscala, setModalCategoriaEscala] = useState({
    isOpen: false,
    categoria: undefined as any | undefined,
  });

  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const [modalAe, setModalAe] = useState({
    isOpen: false,
    cfgTId: undefined as number | undefined,
  });

  const [modalConfiguracionAspecto, setModalConfiguracionAspecto] = useState({
    isOpen: false,
    configuracion: undefined as any | undefined,
    cfgTId: undefined as number | undefined,
    aspectos: undefined as Aspecto[] | undefined,
    onSuccess: undefined as (() => void) | undefined,
  });

  const [modalConfiguracionValoracion, setModalConfiguracionValoracion] = useState({
    isOpen: false,
    configuracion: undefined as any | undefined,
    cfgTId: undefined as number | undefined,
    escalas: undefined as Escala[] | undefined,
    onSuccess: undefined as (() => void) | undefined,
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
        const items = extractItems<any>(response.data);
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
        const items = extractItems<any>(response.data);
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
      let mapService: any;
      let method: string;

      if (type === "tipo") {
        mapService = categoriaTipoMapService;
        method = "listTiposByCategoria";
      } else if (type === "aspecto") {
        mapService = categoriaAspectoMapService;
        method = "listAspectosByCategoria";
      } else {
        mapService = categoriaEscalaMapService;
        method = "listEscalasByCategoria";
      }

      const newMap = new Map<number, any[]>();
      
      for (const category of categories) {
        const response = await (mapService[method](category.id) as Promise<any>);
        
        if (response?.success && response.data?.items) {
          newMap.set(category.id, response.data.items);
        } else {
          newMap.set(category.id, []);
        }
      }

      setCategoryItemsMap(prev => ({
        ...prev,
        [type]: newMap,
      }));
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
  const handleEliminarTipoEvaluacion = async (tipo: Tipo) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Tipo de Evaluación",
      description: `¿Está seguro de eliminar el tipo de evaluación "${tipo.nombre}"?`,
      onConfirm: async () => {
        await tiposEvaluacionService.delete(tipo.id);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarCategoriaTipo = async (categoria: CategoriaTipo) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Categoría",
      description: `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      onConfirm: async () => {
        await categoriaTipoService.delete(categoria.id);
        await cargarDatosIniciales();
      },
    });
  };

  // Handlers para Aspectos
  const handleEliminarAspecto = async (aspecto: Aspecto) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Aspecto",
      description: `¿Está seguro de eliminar el aspecto "${aspecto.nombre}"?`,
      onConfirm: async () => {
        await aspectosEvaluacionService.delete(aspecto.id);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarCategoriaAspecto = async (categoria: any) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Categoría de Aspecto",
      description: `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      onConfirm: async () => {
        await categoriaAspectoService.delete(categoria.id);
        await cargarDatosIniciales();
      },
    });
  };

  // Handlers para Escalas
  const handleEliminarEscala = async (escala: Escala) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Escala",
      description: `¿Está seguro de eliminar la escala "${escala.nombre}"?`,
      onConfirm: async () => {
        await escalasValoracionService.delete(escala.id);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarCategoriaEscala = async (categoria: any) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Categoría de Escala",
      description: `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
      onConfirm: async () => {
        await categoriaEscalaService.delete(categoria.id);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarItem = async (type: ContentType, item: any) => {
    if (type === "tipo") {
      await handleEliminarTipoEvaluacion(item);
    } else if (type === "aspecto") {
      await handleEliminarAspecto(item);
    } else if (type === "escala") {
      await handleEliminarEscala(item);
    }
  };

  const handleEliminarItemFromCategoria = async (type: ContentType, item: any) => {
    try {
      setLoadingItemId(item.id);
      
      if (type === "tipo") {
        // Obtener la categoría del item
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
      
      toast({
        title: "Éxito",
        description: "Item removido de la categoría",
        variant: "default",
      });
      
      await cargarDatosIniciales();
    } catch (error) {
      console.error("Error eliminando item:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el item",
        variant: "destructive",
      });
    } finally {
      setLoadingItemId(null);
    }
  };

  const navItems = [
    { id: "tipo", label: "Tipos de Evaluación", icon: BookOpen },
    { id: "aspecto", label: "Aspectos", icon: BookOpen },
    { id: "escala", label: "Escalas", icon: BookOpen },
    { id: "configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <>
      {/* Protegido por admin/layout.tsx con useRequireRole(APP_ROLE_IDS.ADMIN) */}
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Gestión de Evaluaciones</h2>
            <p className="text-xs text-gray-500 mt-1">Administre las configuraciones</p>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === "tipo" && (
              <CategoriesView
                type="tipo"
                categories={categoriasTipo}
                items={[]}
                categoryItems={categoryItemsMap.tipo}
                onAddCategory={() => setModalCategoriaTipo({ isOpen: true, categoria: undefined })}
                onEditCategory={(cat) => setModalCategoriaTipo({ isOpen: true, categoria: cat as any })}
                onDeleteCategory={handleEliminarCategoriaTipo}
                onAddItem={(categoryId) => setModalTipoEvaluacion({ isOpen: true, tipo: undefined, categoryId })}
                onEditItem={(item) => setModalTipoEvaluacion({ isOpen: true, tipo: item as Tipo, categoryId: undefined })}
                onDeleteItem={(item) => handleEliminarItemFromCategoria("tipo", item)}
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
                handleEliminarConfiguracion={async () => {}}
                refreshData={cargarDatosIniciales}
                rolesDisponibles={rolesDisponibles}
              />
            )}
          </div>
        </main>
      </div>

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

      <ModalConfirmacion
        isOpen={modalConfirmacion.isOpen}
        onClose={() => setModalConfirmacion({ ...modalConfirmacion, isOpen: false })}
        title={modalConfirmacion.title}
        description={modalConfirmacion.description}
        onConfirm={modalConfirmacion.onConfirm}
      />

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
        onClose={() => setModalAe({ isOpen: false, cfgTId: undefined })}
        onSuccess={cargarDatosIniciales}
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
    </>
  );
}
