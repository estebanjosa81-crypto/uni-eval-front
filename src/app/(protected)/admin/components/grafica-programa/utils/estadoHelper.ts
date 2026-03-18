import {
  Star,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Clock,
  LucideIcon,
} from "lucide-react";

export type EstadoType =
  | "excelente"
  | "bueno"
  | "regular"
  | "necesita_mejora"
  | "sin_evaluar";

export interface EstadoInfo {
  color: string;
  icon: LucideIcon;
  label: string;
  bgGradient: string;
}

export const getEstadoInfo = (estado: EstadoType): EstadoInfo => {
  switch (estado) {
    case "excelente":
      return {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: Star,
        label: "Excelente",
        bgGradient: "from-green-50 to-green-100",
      };
    case "bueno":
      return {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: TrendingUp,
        label: "Bueno",
        bgGradient: "from-blue-50 to-blue-100",
      };
    case "regular":
      return {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: AlertTriangle,
        label: "Regular",
        bgGradient: "from-yellow-50 to-yellow-100",
      };
    case "necesita_mejora":
      return {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: TrendingDown,
        label: "Necesita Mejora",
        bgGradient: "from-red-50 to-red-100",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: Clock,
        label: "Sin Evaluar",
        bgGradient: "from-gray-50 to-gray-100",
      };
  }
};

export const getPromedioColor = (promedio: number): string => {
  if (promedio >= 4.0) return "text-green-600";
  if (promedio >= 3.5) return "text-blue-600";
  if (promedio >= 3.0) return "text-yellow-600";
  if (promedio > 0) return "text-red-600";
  return "text-gray-400";
};

export const getPromedioBarColor = (promedio: number): string => {
  if (promedio >= 4.0) return "bg-green-500";
  if (promedio >= 3.5) return "bg-blue-500";
  if (promedio >= 3.0) return "bg-yellow-500";
  return "bg-red-500";
};

export const calcularEstado = (promedio: number | null): EstadoType => {
  if (promedio === null) return "sin_evaluar";
  if (promedio >= 4.0) return "excelente";
  if (promedio >= 3.5) return "bueno";
  if (promedio >= 3.0) return "regular";
  return "necesita_mejora";
};
