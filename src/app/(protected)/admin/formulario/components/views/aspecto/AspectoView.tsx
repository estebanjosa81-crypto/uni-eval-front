import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Aspecto } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../../PaginationControls";
import { Edit, Trash2, Plus } from "lucide-react";

interface AspectosViewProps {
  aspectos: Aspecto[];
  setModalAspecto: (value: any) => void;
  handleEliminarAspecto: (aspecto: Aspecto) => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function AspectosView({
  aspectos,
  setModalAspecto,
  handleEliminarAspecto,
  pagination,
  onPageChange,
  onLimitChange,
}: AspectosViewProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Gestión de Aspectos</CardTitle>
            <CardDescription>Administre los aspectos a evaluar</CardDescription>
          </div>
          <Button onClick={() => setModalAspecto({ isOpen: true, aspecto: undefined })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Aspecto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {aspectos.map((aspecto) => (
          <Card
            key={aspecto.id}
            className="transition-all duration-200 hover:shadow-md border border-muted"
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{aspecto.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{aspecto.descripcion}</p>
                </div>
                <div className="flex gap-2 self-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalAspecto({
                        isOpen: true,
                        aspecto,
                      })
                    }
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEliminarAspecto(aspecto)}
                    title="Eliminar"
                    className="hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {pagination && (
          <PaginationControls
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
