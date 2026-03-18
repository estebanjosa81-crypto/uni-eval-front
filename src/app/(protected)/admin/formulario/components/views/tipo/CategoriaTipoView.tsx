import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  List,
} from "lucide-react";
import { type CategoriaTipo } from "@/src/api";
import { categoriaTipoService } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../../PaginationControls";

interface CategoriaTipoViewProps {
  categorias: CategoriaTipo[];
  setModalCategoriaTipo: (value: any) => void;
  handleEliminarCategoriaTipo: (categoria: CategoriaTipo) => void;
  onVerTipos: (categoria: CategoriaTipo) => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function CategoriaTipoView({
  categorias,
  setModalCategoriaTipo,
  handleEliminarCategoriaTipo,
  onVerTipos,
  pagination,
  onPageChange,
  onLimitChange,
}: CategoriaTipoViewProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Gestión de Categorías de Tipos de Evaluación</CardTitle>
            <CardDescription>
              Organiza los tipos de evaluación en categorías temáticas como "Docente", "Estudiantil", "Institucional", etc.
            </CardDescription>
          </div>
          <Button onClick={() => setModalCategoriaTipo({ isOpen: true, categoria: undefined })}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mensaje informativo si no hay categorías */}
          {categorias.length === 0 && (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">
                  No hay categorías registradas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primera categoría para organizar los tipos de evaluación
                </p>
              </CardContent>
            </Card>
          )}

          {categorias.map((categoria) => (
            <Card
              key={categoria.id}
              className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{categoria.nombre}</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        Categoría
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{categoria.descripcion}</p>
                  </div>

                  <div className="flex gap-2 self-start items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onVerTipos(categoria)}
                      title="Ver tipos asociados"
                      className="hover:bg-muted hover:text-primary"
                    >
                      <List className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalCategoriaTipo({
                          isOpen: true,
                          categoria,
                        })
                      }
                      title="Editar"
                      className="hover:bg-muted hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEliminarCategoriaTipo(categoria)}
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
        </div>
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </CardContent>
    </Card>
  );
}
