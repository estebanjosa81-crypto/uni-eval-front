import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Hash,
} from "lucide-react";
import { type CategoriaEscala, type EscalaMapItem } from "@/src/api";
import { categoriaEscalaMapService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirmation } from "../../../hooks";
import { ConfirmDeleteDialog } from "../../../components/shared";

interface CategoriaEscalaMapViewProps {
  categoria: CategoriaEscala;
  onBack: () => void;
  onAgregarEscalas: (categoria: CategoriaEscala) => void;
}

export function CategoriaEscalaMapView({
  categoria,
  onBack,
  onAgregarEscalas,
}: CategoriaEscalaMapViewProps) {
  const { toast } = useToast();
  const [escalasAsociadas, setEscalasAsociadas] = useState<EscalaMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { confirmationDialog, requestDeleteConfirmation } = useDeleteConfirmation({
    onSuccess: () => {
      cargarEscalas();
      toast({
        title: "Escala removida",
        description: "La escala ha sido removida de la categoría",
      });
    },
  });

  useEffect(() => {
    cargarEscalas();
  }, [categoria.id]);

  const cargarEscalas = async () => {
    setIsLoading(true);
    try {
      const response = await categoriaEscalaMapService.listEscalasByCategoria(categoria.id);
      if (response.success && response.data) {
        setEscalasAsociadas(response.data.items || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las escalas asociadas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoverEscala = (escala: EscalaMapItem) => {
    requestDeleteConfirmation(
      "Remover Escala de Categoría",
      `¿Está seguro de remover "${escala.nombre}" de la categoría "${categoria.nombre}"?`,
      async () => {
        const response = await categoriaEscalaMapService.removeEscalaFromCategoria(
          categoria.id,
          escala.id
        );
        
        if (!response.success) {
          throw new Error(response.error?.message || "No se pudo remover la escala");
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
            <CardTitle>Escalas de Valoración - {categoria.nombre}</CardTitle>
            <CardDescription>{categoria.descripcion}</CardDescription>
          </div>
          <Button onClick={() => onAgregarEscalas(categoria)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Escalas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando escalas...
          </div>
        ) : escalasAsociadas.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                No hay escalas asociadas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega escalas de valoración a esta categoría
              </p>
              <Button onClick={() => onAgregarEscalas(categoria)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Escalas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {escalasAsociadas.map((escala) => (
              <Card
                key={escala.map_id}
                className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {escala.sigla}
                        </Badge>
                        <h3 className="font-semibold text-lg">{escala.nombre}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{escala.descripcion}</p>
                    </div>

                    <div className="flex gap-2 self-start items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverEscala(escala)}
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
