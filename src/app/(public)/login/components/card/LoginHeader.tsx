import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LOGOS } from '../../types/constants';
import type { VideoFormat } from '../../types/types';

interface LoginHeaderProps {
  videoFormat: VideoFormat;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ videoFormat }) => {
  const logoSize =
    videoFormat === "short"
      ? "h-74 w-auto sm:h-20 md:h-24 lg:h-74"
      : "h-74 w-auto sm:h-20 md:h-24 lg:h-44";

  return (
    <CardHeader className="text-center">
      <div className="flex justify-center">
        <img
          src={LOGOS.full}
          alt="Logo Institución Universitaria del Putumayo"
          className={`${logoSize} object-contain transform hover:scale-105 transition-transform duration-300`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      <CardTitle className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold text-gray-800 transform hover:scale-105 transition-transform duration-200 mt-4">
        Iniciar Sesión
      </CardTitle>

      <CardDescription className="text-base sm:text-lg text-gray-600 mt-2 px-2">
        Evaluaciones Académicas
      </CardDescription>
    </CardHeader>
  );
};
