import { useState } from "react";

export type ExpandedType = "materias" | "aspectos" | null;

interface DocenteExpandedState {
  id: string | null;
  tipo: ExpandedType;
}

export const useDocenteExpanded = () => {
  const [docenteExpandido, setDocenteExpandido] = useState<DocenteExpandedState>(
    { id: null, tipo: null }
  );
  const [materiasLoading, setMateriasLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [docenteMaterias, setDocenteMaterias] = useState<{
    [key: string]: any[];
  }>({});
  const [aspectosLoading, setAspectosLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [docenteAspectos, setDocenteAspectos] = useState<{
    [key: string]: any;
  }>({});

  const toggleDocente = (docenteId: string, tipo: ExpandedType) => {
    if (docenteExpandido.id === docenteId && docenteExpandido.tipo === tipo) {
      setDocenteExpandido({ id: null, tipo: null });
    } else {
      setDocenteExpandido({ id: docenteId, tipo });
    }
  };

  const isExpanded = (
    docenteId: string,
    tipo: ExpandedType
  ): boolean => {
    return docenteExpandido.id === docenteId && docenteExpandido.tipo === tipo;
  };

  return {
    docenteExpandido,
    setDocenteExpandido,
    materiasLoading,
    setMateriasLoading,
    docenteMaterias,
    setDocenteMaterias,
    aspectosLoading,
    setAspectosLoading,
    docenteAspectos,
    setDocenteAspectos,
    toggleDocente,
    isExpanded,
  };
};
