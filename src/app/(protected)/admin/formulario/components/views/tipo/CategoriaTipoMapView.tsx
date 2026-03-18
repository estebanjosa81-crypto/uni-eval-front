import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { type CategoriaTipo, type TipoMapItem } from "@/src/api";
import { categoriaTipoMapService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirmation } from "../../../hooks";
import { ConfirmDeleteDialog } from "../../../components/shared";

interface CategoriaTipoMapViewProps {
  categoria: CategoriaTipo;
  onBack: () => void;
  onAgregarTipos: (categoria: CategoriaTipo) => void;
}

export function CategoriaTipoMapView({
  categoria,
  onBack,
  onAgregarTipos,
}: CategoriaTipoMapViewProps) {
  const { toast } = useToast();
  const [tiposAsociados, setTiposAsociados] = useState<TipoMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { confirmationDialog, requestDeleteConfirmation } = useDeleteConfirmation({
    onSuccess: () => {
      cargarTipos();
      toast({
        title: "Tipo removido",
        description: "El tipo ha sido removido de la categoría",
      });
    },
  });

  useEffect(() => {
    cargarTipos();
  }, [categoria.id]);

  const cargarTipos = async () => {
    setIsLoading(true);
    try {
      const response = await categoriaTipoMapService.listTiposByCategoria(categoria.id);
      if (response.success && response.data) {
        setTiposAsociados(response.data.items || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos asociados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoverTipo = (tipo: TipoMapItem) => {
    requestDeleteConfirmation(
      "Remover Tipo de Categoría",
      `¿Está seguro de remover "${tipo.nombre}" de la categoría "${categoria.nombre}"?`,
      async () => {
        const response = await categoriaTipoMapService.removeTipoFromCategoria(
          categoria.id,
          tipo.id
        );
        
        if (!response.success) {
          throw new Error(response.error?.message || "No se pudo remover el tipo");
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle>Tipos de Evaluación - {categoria.nombre}</CardTitle>
            <CardDescription>{categoria.descripcion}</CardDescription>
          </div>
          <Button onClick={() => onAgregarTipos(categoria)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Tipos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando tipos...
          </div>
        ) : tiposAsociados.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                No hay tipos asociados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega tipos de evaluación a esta categoría
              </p>
              <Button onClick={() => onAgregarTipos(categoria)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Tipos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tiposAsociados.map((tipo) => (
              <Card
                key={tipo.map_id}
                className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{tipo.descripcion}</p>
                    </div>

                    <div className="flex gap-2 self-start items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverTipo(tipo)}
                        title="Remover de categoría"
                        className="hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmDeleteDialog {...confirmationDialog} />
    </Card>
  );
}
