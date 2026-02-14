"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { configuracionEvaluacionService } from "@/src/api/services/app/cfg-t.service";
import { evaluacionDetalleService } from "@/src/api/services/app/eval-det.service";
import { ChevronDown, ChevronUp, ClipboardList, BookOpen, User, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

import type { ConfiguracionAspectosEscalasResponse } from "@/src/api/services/app/cfg-t.service";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{description}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default function EvaluarDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [config, setConfig] = useState<ConfiguracionAspectosEscalasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAspecto, setOpenAspecto] = useState<number | null>(null);

  const [selecciones, setSelecciones] = useState<Record<number, number>>({});
  const [comentariosAspecto, setComentariosAspecto] = useState<Record<number, string>>({});
  const [comentarioGeneral, setComentarioGeneral] = useState("");

  const [evalId, setEvalId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [docente, setDocente] = useState<string>("");
  const [materia, setMateria] = useState<string>("");

  const unwrappedParams = React.use(params);
  const configId = Number(unwrappedParams.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docenteParam = searchParams.get("docente");
        const materiaParam = searchParams.get("materia");

        if (docenteParam) setDocente(decodeURIComponent(docenteParam));
        if (materiaParam) setMateria(decodeURIComponent(materiaParam));

        let currentEvalId = searchParams.get("evalId");

        if (!currentEvalId) {
          const evals = await configuracionEvaluacionService.getEvaluacionesByCfgT(configId);
          if (evals.success && evals.data?.length) {
            currentEvalId = String(evals.data[0].id);
          }
        }

        setEvalId(Number(currentEvalId));

        const response = await configuracionEvaluacionService.getAspectosConEscalas(configId);
        if (response.success && response.data) {
          setConfig(response.data);
        }
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar la evaluación",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [configId, searchParams, toast]);

  const totalAspectos = config?.aspectos.length || 0;
  const respondidos = useMemo(() => Object.keys(selecciones).length, [selecciones]);
  const progreso = totalAspectos ? Math.round((respondidos / totalAspectos) * 100) : 0;

  const handleSeleccion = (aspectoId: number, opcionId: number) => {
    setSelecciones((prev) => ({ ...prev, [aspectoId]: opcionId }));
  };

  const validar = () => {
    if (!config) return false;

    const todosEvaluados = config.aspectos.every((a) => selecciones[a.id]);
    if (!todosEvaluados) {
      toast({
        title: "Evaluación incompleta",
        description: "Debes responder todos los aspectos",
        variant: "destructive",
      });
      return false;
    }

    if (config.es_cmt_gen_oblig && !comentarioGeneral.trim()) {
      toast({
        title: "Comentario requerido",
        description: "Debes escribir un comentario general",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setShowConfirm(true);
  };

  const enviar = async () => {
    if (!config || !evalId) return;

    setIsSubmitting(true);

    try {
      // Construir los items para el bulk save
      const items = config.aspectos.map((aspecto) => {
        const opcionSeleccionadaId = selecciones[aspecto.id];
        const opcionSeleccionada = aspecto.opciones.find((op) => op.id === opcionSeleccionadaId);

        return {
          a_e_id: opcionSeleccionada?.a_e_id || 0,
          cmt: comentariosAspecto[aspecto.id] || null,
        };
      });

      // Llamar al endpoint bulk
      const response = await evaluacionDetalleService.bulkSave({
        eval_id: evalId,
        items,
        cmt_gen: comentarioGeneral || null,
      });

      if (response.success) {
        toast({ title: "Evaluación enviada" });
        router.push(`/estudiante/dashboard/${configId}`);
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "No se pudo enviar la evaluación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la evaluación",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ClipboardList className="animate-pulse h-12 w-12 text-gray-400" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="py-8 px-3">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER PRINCIPAL */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-3xl shadow-xl border-0">
            <CardContent className="p-6 md:p-8">

                {/* INFO IZQUIERDA */}
                <div className="space-y-4">

                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {config?.tipo_evaluacion?.tipo?.nombre || "Evaluación docente"}
                  </h1>

                  <div className="flex items-center gap-2 text-gray-600 font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span>{materia || "Materia no disponible"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 font-medium">
                    <User className="w-4 h-4" />
                    <span>{docente || "Docente no disponible"}</span>
                  </div>

              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.aspectos.map((aspecto, index) => {
            const abierto = openAspecto === aspecto.id;

            return (
              <motion.div
                key={aspecto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">

                  <button
                    type="button"
                    className="w-full text-left p-5 flex justify-between items-start"
                    onClick={() => setOpenAspecto(abierto ? null : aspecto.id)}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{aspecto.nombre}</h3>
                      <p className="text-sm text-gray-500">{aspecto.descripcion}</p>
                    </div>

                    {abierto ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {abierto && (
                    <CardContent className="border-t space-y-6">

                      <RadioGroup
                        value={selecciones[aspecto.id]?.toString() || ""}
                        onValueChange={(v) => handleSeleccion(aspecto.id, Number(v))}
                      >
                        {aspecto.opciones.map((op) => (
                          <Label
                            key={op.id}
                            htmlFor={`op-${op.id}`}
                            className="flex items-center justify-between border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition"
                          >
                            <div>
                              <p className="font-medium">
                                {op.sigla} - {op.nombre}
                              </p>
                              <p className="text-xs text-gray-500">{op.descripcion}</p>
                            </div>

                            <RadioGroupItem value={String(op.id)} id={`op-${op.id}`} />
                          </Label>
                        ))}
                      </RadioGroup>

                      {aspecto.es_cmt && (
                        <Textarea
                          placeholder="Comentario del aspecto..."
                          value={comentariosAspecto[aspecto.id] || ""}
                          onChange={(e) =>
                            setComentariosAspecto((p) => ({ ...p, [aspecto.id]: e.target.value }))
                          }
                        />
                      )}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}

          {/* COMENTARIO GENERAL */}
          {config.es_cmt_gen && (
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold">Comentario general</h3>
                <Textarea
                  value={comentarioGeneral}
                  onChange={(e) => setComentarioGeneral(e.target.value)}
                  placeholder="Escribe un comentario general"
                />
              </CardContent>
            </Card>
          )}

          {/* FOOTER */}
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Enviando..." : "Enviar evaluación"}
            </Button>
          </CardFooter>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={enviar}
        title="Confirmar evaluación"
        description="¿Seguro que deseas enviar la evaluación?"
      />
    </div>
  );
}
