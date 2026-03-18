import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { type CategoriaAspecto, type AspectoMapItem } from "@/src/api";
import { categoriaAspectoMapService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirmation } from "../../../hooks";
import { ConfirmDeleteDialog } from "../../../components/shared";

interface CategoriaAspectoMapViewProps {
  categoria: CategoriaAspecto;
  onBack: () => void;
  onAgregarAspectos: (categoria: CategoriaAspecto) => void;
}

export function CategoriaAspectoMapView({
  categoria,
  onBack,
  onAgregarAspectos,
}: CategoriaAspectoMapViewProps) {
  const { toast } = useToast();
  const [aspectosAsociados, setAspectosAsociados] = useState<AspectoMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { confirmationDialog, requestDeleteConfirmation } = useDeleteConfirmation({
    onSuccess: () => {
      cargarAspectos();
      toast({
        title: "Aspecto removido",
        description: "El aspecto ha sido removido de la categoría",
      });
    },
  });

  useEffect(() => {
    cargarAspectos();
  }, [categoria.id]);

  const cargarAspectos = async () => {
    setIsLoading(true);
    try {
      const response = await categoriaAspectoMapService.listAspectosByCategoria(categoria.id);
      if (response.success && response.data) {
        setAspectosAsociados(response.data.items || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los aspectos asociados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoverAspecto = (aspecto: AspectoMapItem) => {
    requestDeleteConfirmation(
      "Remover Aspecto de Categoría",
      `¿Está seguro de remover "${aspecto.nombre}" de la categoría "${categoria.nombre}"?`,
      async () => {
        const response = await categoriaAspectoMapService.removeAspectoFromCategoria(
          categoria.id,
          aspecto.id
        );
        
        if (!response.success) {
          throw new Error(response.error?.message || "No se pudo remover el aspecto");
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
            <CardTitle>Aspectos de Evaluación - {categoria.nombre}</CardTitle>
            <CardDescription>{categoria.descripcion}</CardDescription>
          </div>
          <Button onClick={() => onAgregarAspectos(categoria)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Aspectos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando aspectos...
          </div>
        ) : aspectosAsociados.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                No hay aspectos asociados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega aspectos de evaluación a esta categoría
              </p>
              <Button onClick={() => onAgregarAspectos(categoria)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Aspectos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {aspectosAsociados.map((aspecto) => (
              <Card
                key={aspecto.map_id}
                className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{aspecto.nombre}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{aspecto.descripcion}</p>
                    </div>

                    <div className="flex gap-2 self-start items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverAspecto(aspecto)}
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
