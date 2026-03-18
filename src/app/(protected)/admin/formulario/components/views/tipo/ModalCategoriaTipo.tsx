import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormModal } from "@/components/modals";
import { FolderOpen, Edit3, Plus, AlertCircle } from "lucide-react";
import { type CategoriaTipo } from "@/src/api";
import { categoriaTipoService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { alphaNumericSpanish } from "@/src/api/validation/comment-rules";

interface ModalCategoriaTipoProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaTipo;
  onSuccess: () => void | Promise<void>;
  onCategoriaCreated?: (categoria: CategoriaTipo) => void;
  onCategoriaUpdated?: (categoria: CategoriaTipo) => void;
}

export function ModalCategoriaTipo({
  isOpen,
  onClose,
  categoria,
  onSuccess,
  onCategoriaCreated,
  onCategoriaUpdated,
}: ModalCategoriaTipoProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "" });
    }
    setErrors({});
  }, [categoria, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    const nombreTrim = formData.nombre.trim();
    const descripcionTrim = formData.descripcion.trim();

    if (!nombreTrim) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (nombreTrim.length < 1 || nombreTrim.length > 100) {
      newErrors.nombre = "El nombre debe tener entre 1 y 100 caracteres";
    } else {
      const nameError = alphaNumericSpanish(nombreTrim);
      if (nameError) newErrors.nombre = nameError;
    }

    if (!descripcionTrim) {
      newErrors.descripcion = "La descripcion es obligatoria";
    } else if (descripcionTrim.length < 1 || descripcionTrim.length > 500) {
      newErrors.descripcion = "La descripcion debe tener entre 1 y 500 caracteres";
    } else {
      const descError = alphaNumericSpanish(descripcionTrim);
      if (descError) newErrors.descripcion = descError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (categoria) {
        await categoriaTipoService.update(categoria.id, formData);
        toast({
          title: "¡Actualización exitosa!",
          description: "La categoría se actualizó correctamente",
        });
        onCategoriaUpdated?.({ ...categoria, ...formData } as CategoriaTipo);
      } else {
        const response = await categoriaTipoService.create(formData);
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva categoría creada",
        });
        if (response.success && response.data) {
          const nuevaCategoria = Array.isArray(response.data) ? response.data[0] : response.data;
          onCategoriaCreated?.(nuevaCategoria as CategoriaTipo);
        }
      }

      await Promise.resolve(onSuccess());
      onClose();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={categoria ? "edit" : "create"}
      title={categoria ? "Editar Categoría" : "Nueva Categoría"}
      icon={FolderOpen}
      isLoading={isLoading}
      size="lg"
    >
      {/* Ejemplos sugeridos - Solo mostrar al crear nueva */}
      {!categoria && (
        <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-[2rem] p-6 mb-6">
          <p className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            💡 Ejemplos de categorías:
          </p>
          <ul className="text-sm text-indigo-800 space-y-2 ml-4 list-disc">
            <li><strong>Docente:</strong> Evaluaciones del desempeño y actividad pedagógica</li>
            <li><strong>Encuesta de Satisfacción:</strong> Instrumentos de percepción y satisfacción</li>
            <li><strong>Estudiantil:</strong> Evaluaciones relacionadas con el estudiante</li>
            <li><strong>Institucional:</strong> Evaluaciones de procesos y servicios institucionales</li>
          </ul>
        </div>
      )}

      {/* Campo Nombre */}
      <div className="space-y-3 mb-6">
        <Label htmlFor="nombre" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-indigo-600" />
          Nombre de la Categoría
        </Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => handleInputChange("nombre", e.target.value)}
          placeholder="Ej. Docente"
          className={`h-12 rounded-2xl transition-all ${errors.nombre ? 'border-red-300 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
          required
        />
        {errors.nombre && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errors.nombre}
          </div>
        )}
      </div>

      {/* Campo Descripción */}
      <div className="space-y-3">
        <Label htmlFor="descripcion" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-indigo-600" />
          Descripción Detallada
        </Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Describe el propósito de esta categoría. Ej: Evaluaciones asociadas al desempeño y actividad pedagógica del docente..."
          rows={4}
          className={`resize-none rounded-2xl transition-all ${errors.descripcion ? 'border-red-300 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
          required
        />
        <div className="flex justify-between items-center px-2">
          {errors.descripcion ? (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.descripcion}
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Mínimo 10 caracteres
            </div>
          )}
          <div className="text-xs text-slate-400 font-mono">
            {formData.descripcion.length}/500
          </div>
        </div>
      </div>
    </FormModal>
  );
}
