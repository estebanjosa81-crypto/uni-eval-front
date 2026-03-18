import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { UserRound, Eye, EyeOff, AlertCircle } from "lucide-react";
import type { LoginFormData, VideoFormat } from "../../types/types";

interface LoginFormProps {
  formData: LoginFormData;
  onUpdateFormData: (field: keyof LoginFormData, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isDisabled: boolean;
  videoFormat: VideoFormat;
  children: React.ReactNode;
}

interface ValidationState {
  hasError: boolean;
  message: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  onUpdateFormData,
  onSubmit,
  isDisabled,
  videoFormat,
  children,
}) => {
  const [usernameError, setUsernameError] = useState<ValidationState>({
    hasError: false,
    message: "",
  });

  const [passwordError, setPasswordError] = useState<ValidationState>({
    hasError: false,
    message: "",
  });

  const [hasUserInteracted, setHasUserInteracted] = useState({
    username: false,
    password: false,
  });

  const inputSize = videoFormat === "short" ? "py-4 text-lg" : "py-3 text-base";
  const formScale =
    videoFormat === "short" ? "scale-100 text-base" : "scale-[1.05] text-lg";
  const spacing = videoFormat === "short" ? "space-y-6" : "space-y-5";

  const baseInputClasses = `
    w-full rounded-md focus:outline-none focus:ring-2 focus:border-transparent
    hover:border-gray-400 transform focus:scale-[1.01] bg-white placeholder-gray-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const validateUsername = (value: string): ValidationState => {
    if (!value.trim()) {
      return { hasError: true, message: "El documento es obligatorio." };
    }
    if (!/^\d+$/.test(value)) {
      return { hasError: true, message: "Digite solo números en el documento." };
    }
    if (value.length < 8) {
      return { hasError: true, message: "Digite su documento completo" };
    }
    return { hasError: false, message: "" };
  };

  const validatePassword = (value: string): ValidationState => {
    if (!value.trim()) {
      return { hasError: true, message: "La contraseña es obligatoria." };
    }
    if (value.length < 6) {
      return { hasError: true, message: "Digite su contraseña." };
    }
    if (value.length > 16) {
      return { hasError: true, message: "La contraseña es demasiado extensa." };
    }
    return { hasError: false, message: "" };
  };

  useEffect(() => {
    if (hasUserInteracted.username) {
      setUsernameError(validateUsername(formData.username));
    }
  }, [formData.username, hasUserInteracted.username]);

  useEffect(() => {
    if (hasUserInteracted.password) {
      setPasswordError(validatePassword(formData.password));
    }
  }, [formData.password, hasUserInteracted.password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const usernameValidation = validateUsername(formData.username);
    const passwordValidation = validatePassword(formData.password);

    setUsernameError(usernameValidation);
    setPasswordError(passwordValidation);
    setHasUserInteracted({ username: true, password: true });

    if (!usernameValidation.hasError && !passwordValidation.hasError) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${formScale}`}>
      <div className={spacing}>
        {/* Username */}
        <div className="relative group">
          <div className="relative">
            <UserRound
              size={22}
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${
                usernameError.hasError
                  ? "text-red-500"
                  : "text-gray-600 group-focus-within:text-gray-800"
              }`}
            />

            <Input
              placeholder="Documento"
              value={formData.username}
              onChange={(e) => {
                setHasUserInteracted(p => ({ ...p, username: true }));
                onUpdateFormData("username", e.target.value);
              }}
              required
              disabled={isDisabled}
              className={`pl-12 pr-4 ${baseInputClasses} ${inputSize} ${
                usernameError.hasError
                  ? "border-red-500 focus:ring-red-500 bg-red-50/50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />

            {usernameError.hasError && (
              <AlertCircle
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none"
              />
            )}
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              usernameError.hasError && hasUserInteracted.username
                ? "max-h-20 opacity-100 mt-2"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{usernameError.message}</span>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="relative group">
          <div className="relative">
            <Input
              type={formData.showPassword ? "text" : "password"}
              value={formData.password}
              placeholder="Contraseña"
              onChange={(e) => {
                setHasUserInteracted(p => ({ ...p, password: true }));
                onUpdateFormData("password", e.target.value);
              }}
              required
              disabled={isDisabled}
              className={`pl-4 pr-12 ${baseInputClasses} ${inputSize} ${
                passwordError.hasError
                  ? "border-red-500 focus:ring-red-500 bg-red-50/50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />

            <button
              type="button"
              tabIndex={-1}
              disabled={isDisabled}
              onClick={() =>
                onUpdateFormData("showPassword", !formData.showPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transform hover:scale-110 transition disabled:opacity-50"
            >
              {formData.showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>

            {passwordError.hasError && (
              <AlertCircle
                size={20}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none"
              />
            )}
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              passwordError.hasError && hasUserInteracted.password
                ? "max-h-20 opacity-100 mt-2"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{passwordError.message}</span>
            </div>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) =>
                onUpdateFormData("rememberMe", e.target.checked)
              }
              disabled={isDisabled}
              className="accent-blue-600 transform group-hover:scale-110 transition"
            />
            <span className="group-hover:text-gray-900 transform group-hover:scale-105">
              Recordarme
            </span>
          </label>

          <a
            href="https://sigedin.itp.edu.co/estudiantes/ctrl_recoverpassword/ctrl_recoverpassword.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 transform hover:scale-105 text-[15px] text-right"
          >
            ¿Olvidaste tu
            <br />
            contraseña?
          </a>
        </div>
      </div>

      {children}
    </form>
  );
};
