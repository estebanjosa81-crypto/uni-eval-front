import React from "react";
import { Button } from "@/components/ui/button";
import type { LoginStage } from "../../types/types";

interface LoginButtonProps {
  loginStage: LoginStage;
  isDisabled: boolean;
  videoFormat: "fullhd" | "short";
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  loginStage,
  isDisabled,
  videoFormat,
}) => {
  const spinner = (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  const buttonSize = videoFormat === "short" ? "text-xl py-4" : "text-xl py-3";

  const contentMap: Record<LoginStage, React.ReactNode> = {
    loading: (
      <div className="flex items-center gap-2">
        {spinner}
        Verificando...
      </div>
    ),
    success: (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 text-green-400">✓</div>
        ¡Bienvenido!
      </div>
    ),
    redirecting: (
      <div className="flex items-center gap-2">
        {spinner}
        Redirigiendo...
      </div>
    ),
    idle: (
      <div className="flex items-center justify-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
          />
        </svg>
        Acceder
      </div>
    ),
  };

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={`w-full transform hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-150 shadow-md hover:shadow-lg
        disabled:transform-none disabled:hover:scale-100 ${buttonSize}`}
    >
      {contentMap[loginStage]}
    </Button>
  );
};
