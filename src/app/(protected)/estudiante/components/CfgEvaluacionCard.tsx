"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Star,
  Timer,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ConfiguracionTipo, EvalByUserItem } from "@/src/api";

interface EvaluacionCardProps {
  configuracion: ConfiguracionTipo;
  evaluaciones: EvalByUserItem[];
  index: number;
  onIniciar: (configuracion: ConfiguracionTipo) => void;
}

// ---------- Utils ----------
const parseFechaLocal = (fechaString: string): Date => {
  const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(fechaString);
};

const isEvaluacionVigente = (inicio: string, fin: string) => {
  const now = new Date();
  const fInicio = parseFechaLocal(inicio);
  const fFin = parseFechaLocal(fin);
  fFin.setHours(23, 59, 59, 999);

  return now >= fInicio && now <= fFin;
};

const getTiempoRestante = (fin: string) => {
  const now = new Date();
  const fechaFin = parseFechaLocal(fin);
  fechaFin.setHours(23, 59, 59, 999);

  const diff = fechaFin.getTime() - now.getTime();

  if (diff <= 0)
    return { dias: 0, horas: 0, minutos: 0, texto: "Finalizada" };

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (dias > 0)
    return {
      dias,
      horas,
      minutos,
      texto: `${dias} día${dias > 1 ? "s" : ""} · ${horas}h`,
    };

  if (horas > 0)
    return {
      dias,
      horas,
      minutos,
      texto: `${horas}h · ${minutos}m`,
    };

  return { dias, horas, minutos, texto: `${minutos} min` };
};

const getProgress = (inicio: string, fin: string) => {
  const now = new Date();
  const i = parseFechaLocal(inicio);
  const f = parseFechaLocal(fin);
  f.setHours(23, 59, 59, 999);

  const total = f.getTime() - i.getTime();
  const passed = now.getTime() - i.getTime();

  return Math.max(0, Math.min(100, (passed / total) * 100));
};

// ---------- Component ----------
export default function EvaluacionCard({
  configuracion,
  evaluaciones,
  index,
  onIniciar,
}: EvaluacionCardProps) {
  const vigente = isEvaluacionVigente(
    configuracion.fecha_inicio,
    configuracion.fecha_fin
  );

  const tiempo = getTiempoRestante(configuracion.fecha_fin);
  const progreso = getProgress(
    configuracion.fecha_inicio,
    configuracion.fecha_fin
  );

  const tieneEvaluaciones = evaluaciones.length > 0;

  const titulo =
    configuracion.tipo_evaluacion?.tipo.nombre ||
    `Evaluación #${configuracion.id}`;

  const status = tieneEvaluaciones
    ? "completada"
    : vigente
    ? "activa"
    : "cerrada";

  const statusUI = {
    activa: {
      label: "Disponible",
      color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      icon: <Clock className="w-4 h-4" />,
    },
    completada: {
      label: "Completada",
      color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    cerrada: {
      label: "Cerrada",
      color: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="relative h-full rounded-3xl border-2 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* ---------- Header ---------- */}
        <CardHeader className="space-y-4 pb-4">
          {/* Título */}
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <CardTitle className="text-lg md:text-2xl font-bold leading-tight break-words">
              {titulo}
            </CardTitle>
          </div>
        </CardHeader>

        {/* ---------- Body ---------- */}
        <CardContent className="space-y-5 px-4 md:px-6">
          {/* Fechas (VERTICALES) */}
          <div className="grid grid-cols-1 gap-3 text-sm md:text-base">
            <InfoItem
              icon={<Calendar className="w-5 h-5" />}
              label="Inicio"
              value={parseFechaLocal(
                configuracion.fecha_inicio
              ).toLocaleDateString("es-CO")}
            />

            <InfoItem
              icon={<Clock className="w-5 h-5" />}
              label="Finaliza"
              value={`${parseFechaLocal(
                configuracion.fecha_fin
              ).toLocaleDateString("es-CO")} · 23:59`}
            />
          </div>

          {/* Progreso */}
          {vigente && (
            <div className="space-y-2 bg-muted/30 p-4 rounded-2xl">
              <div className="flex justify-between text-sm md:text-base font-semibold">
                <span className="text-muted-foreground">Tiempo transcurrido</span>
                <span className="text-primary">{Math.round(progreso)}%</span>
              </div>

              <Progress value={progreso} className="h-2.5" />
            </div>
          )}

          {/* Tiempo restante */}
          {vigente && tiempo.texto !== "Finalizada" && (
            <div className="flex items-center gap-3 rounded-2xl border-2 p-4 bg-gradient-to-r from-muted/40 to-muted/20">
              {tiempo.dias === 0 && tiempo.horas < 24 ? (
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-primary/10">
                  <Timer className="text-primary w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  Tiempo restante
                </p>
                <p className="font-bold text-base md:text-lg truncate">{tiempo.texto}</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            size="lg"
            className="w-full rounded-2xl text-base md:text-lg font-bold py-6 md:py-7 shadow-lg hover:shadow-xl transition-all"
            disabled={!vigente && !tieneEvaluaciones}
            onClick={() => onIniciar(configuracion)}
          >
            {tieneEvaluaciones ? (
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                <span>Iniciar evaluación</span>
              </div>
            ) : vigente ? (
              "Generar evaluación"
            ) : (
              "No disponible"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------- Sub Components ----------
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-center rounded-xl border-2 bg-gradient-to-r from-muted/40 to-muted/20 p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="text-muted-foreground flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-muted-foreground font-medium">{label}</p>
        <p className="font-bold text-sm md:text-base truncate">{value}</p>
      </div>
    </div>
  );
}
