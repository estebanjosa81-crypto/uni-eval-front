import React from "react";
import { CardFooter } from "@/components/ui/card";
import type { VideoFormat } from "../../types/types";
import { DevelopersButton } from "./DevelopersButton";

interface LoginFooterProps {
  videoFormat: VideoFormat;
  children: React.ReactNode;
}

export const LoginFooter: React.FC<LoginFooterProps> = ({
  children,
}) => {
  return (
    <CardFooter className="flex flex-col gap-3 pt-4 pr-4 pl-4 pb-0">
      {children}

      <p className="text-center text-gray-600 text-sm">
        Solo para estudiantes{" "}
        <span className="hover:scale-105 transition-transform duration-200 inline-block font-bold">
          matriculados
        </span>
        .
      </p>

      <div className="w-full text-right text-xs font-bold text-gray-600 hover:scale-105 transition-transform duration-200">
        v2025-2
      </div>

      <DevelopersButton />

      <footer className="text-center text-xs text-gray-500 w-full">
        © {new Date().getFullYear()} Institución Universitaria del Putumayo
      </footer>
    </CardFooter>
  );
};
