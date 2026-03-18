import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormModal } from "@/components/modals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  categoriaTipoService,
  categoriaTipoMapService,
  tipoFormService,
  type CategoriaTipo,
  type TipoForm,
  type TipoMapItem,
} from "@/src/api";
import {
  configuracionEvaluacionService,
  type ConfiguracionTipo,
  type CreateConfiguracionTipoInput,
} from "@/src/api/services/app/cfg-t.service";

interface ModalConfiguracionTipoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (config: ConfiguracionTipo) => void | Promise<void>;
  configuracion?: ConfiguracionTipo;
}

export function ModalConfiguracionTipo({
  isOpen,
  onClose,
  onSuccess,
  configuracion,
}: ModalConfiguracionTipoProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Categorías y tipos
  const [categorias, setCategorias] = useState<CategoriaTipo[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [tipos, setTipos] = useState<TipoMapItem[]>([]);
  const [tipoForms, setTipoForms] = useState<TipoForm[]>([]);
  
  // Formulario
  const [formData, setFormData] = useState<CreateConfiguracionTipoInput>({
    tipo_id: 0,
    tipo_form_id: 1,
    fecha_inicio: "",
    fecha_fin: "",
    es_cmt_gen: true,
    es_cmt_gen_oblig: true,
    es_activo: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // Limpiar formulario
    if (configuracion) {
      setFormData({
        tipo_id: configuracion.tipo_id ?? 0,
        tipo_form_id: configuracion.tipo_form_id ?? 1,
        fecha_inicio: configuracion.fecha_inicio?.split('T')[0] || "",
        fecha_fin: configuracion.fecha_fin?.split('T')[0] || "",
        es_cmt_gen: configuracion.es_cmt_gen ?? true,
        es_cmt_gen_oblig: configuracion.es_cmt_gen_oblig ?? true,
        es_activo: configuracion.es_activo ?? true,
      });
    } else {
      setFormData({
        tipo_id: 0,
        tipo_form_id: 1,
        fecha_inicio: "",
        fecha_fin: "",
        es_cmt_gen: true,
        es_cmt_gen_oblig: true,
        es_activo: true,
      });
    }
    
    setError(null);
    loadCategorias();
    loadTipoForms();
  }, [isOpen, configuracion]);

  useEffect(() => {
    if (selectedCategoria) {
      loadTiposByCategoria(parseInt(selectedCategoria));
    } else {
      setTipos([]);
    }
  }, [selectedCategoria]);

  const loadCategorias = async () => {
    try {
      const response = await categoriaTipoService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setCategorias(items);
        
        // Si estamos editando, buscar la categoría del tipo actual
        if (configuracion && configuracion.tipo_id) {
          await findAndSetCategoriaForTipo(items, configuracion.tipo_id);
        }
      }
    } catch (err) {
      console.error("Error loading categorias:", err);
    }
  };

  const loadTipoForms = async () => {
    try {
      const response = await tipoFormService.getAll({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setTipoForms(items);
      } else {
        setTipoForms([]);
      }
    } catch (err) {
      console.error("Error loading tipo_form:", err);
      setTipoForms([]);
    }
  };

  const findAndSetCategoriaForTipo = async (cats: CategoriaTipo[], mapId: number) => {
    try {
      // Buscar en todas las categorías cuál contiene este map_id
      for (const cat of cats) {
        const response = await categoriaTipoMapService.listTiposByCategoria(cat.id);
        if (response.success && response.data?.items) {
          const tipoExiste = response.data.items.some((t) => t.map_id === mapId);
          if (tipoExiste) {
            setSelectedCategoria(cat.id.toString());
            // No necesitamos cargar tipos aquí, el useEffect lo hará
            return;
          }
        }
      }
    } catch (err) {
      console.error("Error finding categoria for tipo:", err);
    }
  };

  const loadTiposByCategoria = async (categoriaId: number) => {
    try {
      const response = await categoriaTipoMapService.listTiposByCategoria(categoriaId);
      if (response.success && response.data?.items) {
        setTipos(response.data.items);
      }
    } catch (err) {
      console.error("Error loading tipos:", err);
      setTipos([]);
    }
  };

  const validate = () => {
    if (!formData.tipo_id || formData.tipo_id === 0) {
      setError("Debes seleccionar un tipo de evaluación");
      return false;
    }
    if (!formData.fecha_inicio) {
      setError("Debes ingresar una fecha de inicio");
      return false;
    }
    if (!formData.fecha_fin) {
      setError("Debes ingresar una fecha de fin");
      return false;
    }
    if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      let response;
      
      if (configuracion) {
        response = await configuracionEvaluacionService.update(configuracion.id, formData);
      } else {
        response = await configuracionEvaluacionService.create(formData);
      }
      
      if (response.success && response.data) {
        toast({
          title: configuracion ? "Configuración actualizada" : "Configuración creada",
          description: `La configuración fue ${configuracion ? 'actualizada' : 'creada'} correctamente`,
        });
        await Promise.resolve(onSuccess(response.data));
        onClose();
      } else {
        throw new Error("No se pudo guardar la configuración");
      }
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault();
        await handleSubmit();
      }}
      mode={configuracion ? "edit" : "create"}
      title={`${configuracion ? "Editar" : "Nueva"} Configuración de Evaluación`}
      icon={Settings}
      size="xl"
      isLoading={isLoading}
      loadingText="Guardando..."
      submitText={configuracion ? "Actualizar" : "Crear"}
    >
      <Card className="border shadow-none bg-muted/20">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría de Tipo</Label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_id">Tipo de Evaluación/Encuesta *</Label>
              <Select
                value={formData.tipo_id ? formData.tipo_id.toString() : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_id: parseInt(value) })
                }
                disabled={!selectedCategoria || tipos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.map_id} value={tipo.map_id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_inicio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_fin: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">Tipo de formulario</h4>
              <Select
                value={formData.tipo_form_id ? formData.tipo_form_id.toString() : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_form_id: parseInt(value) })
                }
                disabled={tipoForms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipoForms.map((tipoForm) => (
                    <SelectItem key={tipoForm.id} value={tipoForm.id.toString()}>
                      {tipoForm.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">Opciones de comentarios</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="es_cmt_gen" className="cursor-pointer">
                  Permitir comentario general
                </Label>
                <Switch
                  id="es_cmt_gen"
                  checked={formData.es_cmt_gen}
                  onCheckedChange={(value) =>
                    setFormData({
                      ...formData,
                      es_cmt_gen: value,
                      // Si desactivamos es_cmt_gen, también desactivamos es_cmt_gen_oblig
                      es_cmt_gen_oblig: value ? formData.es_cmt_gen_oblig : false,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="es_cmt_gen_oblig" className="cursor-pointer">
                  Comentario general obligatorio
                </Label>
                <Switch
                  id="es_cmt_gen_oblig"
                  checked={formData.es_cmt_gen_oblig}
                  disabled={!formData.es_cmt_gen}
                  onCheckedChange={(value) =>
                    setFormData({
                      ...formData,
                      es_cmt_gen_oblig: value,
                      // Si activamos es_cmt_gen_oblig, también activamos es_cmt_gen
                      es_cmt_gen: value ? true : formData.es_cmt_gen,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="es_activo" className="cursor-pointer">
                  Configuración activa
                </Label>
                <Switch
                  id="es_activo"
                  checked={formData.es_activo}
                  onCheckedChange={(value) =>
                    setFormData({ ...formData, es_activo: value })
                  }
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

    </FormModal>
  );
}
