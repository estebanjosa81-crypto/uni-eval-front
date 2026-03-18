"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/src/api/services/auth/auth.service";
import { LoginForm } from "./components/card/LoginForm";
import { LoginHeader } from "./components/card/LoginHeader";
import { LoginFooter } from "./components/card/LoginFooter";
import { LoginButton } from "./components/card/LoginButton";
import { MediaContent } from "./components/video/MediaContent";
import { MediaToggleButton } from "./components/video/MediaToggleButton";
import { useMediaDetection } from "./hooks/useMediaDetection";
import { getLayoutClasses } from "./utils/layout.utils";
import { getRedirectPath, getRememberedUsername, saveRememberedUsername, saveUserData } from "./utils/auth";
import type { LoginFormData, LoginStage, MediaMode, VideoType } from "./types/types";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
    showPassword: false,
  });

  const [loginStage, setLoginStage] = useState<LoginStage>("idle");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>("video");
  const [videoType, setVideoType] = useState<VideoType>("youtube");
  const { videoFormat } = useMediaDetection(videoType);

  useEffect(() => {
    const savedUsername = getRememberedUsername();
    if (savedUsername) {
      setFormData((prev) => ({
        ...prev,
        username: savedUsername,
        rememberMe: true,
      }));
    }
    setTimeout(() => setIsPageLoaded(true), 100);
  }, []);

  const updateFormData = (field: keyof LoginFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMediaMode = () => {
    setMediaMode((prev) => (prev === "video" ? "image" : "video"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStage("loading");

    try {
      const response = await authService.login({
        user_username: formData.username,
        user_password: formData.password,
      });

      if (response.success) {
        setLoginStage("success");

        saveRememberedUsername(formData.username, formData.rememberMe);
        saveUserData(response.data.user);

        const redirectPath = getRedirectPath(response.data.user);

        toast({
          title: "Bienvenido",
          description: response.data.user.user_name,
        });

        setTimeout(() => setLoginStage("redirecting"), 800);
        setTimeout(() => router.replace(redirectPath), 1500);
        return;
      }

      // Error en la respuesta del servidor
      setLoginStage("idle");
      toast({
        title: "Error de autenticación",
        description: response.message || "Credenciales incorrectas",
        variant: "destructive",
      });
      return;
    } catch (error: any) {
      // Error en la solicitud
      setLoginStage("idle");
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
      return;
    }
  };

  const isDisabled = loginStage !== "idle";
  const animationClass = `transition-all duration-700 ease-out ${
    isPageLoaded
      ? "translate-y-0 opacity-100 scale-100"
      : "translate-y-8 opacity-0 scale-95"
  }`;

  const layoutClasses = getLayoutClasses(videoFormat);

  return (
    <div className={layoutClasses.container}>
      {/* Background Overlay */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 scale-110">
          <MediaContent
            mediaMode={mediaMode}
            videoType={videoType}
            videoFormat={videoFormat}
            onVideoError={() => setVideoType("youtube")}
          />
        </div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-slate-900/20"></div>
      </div>

      <div className={`${layoutClasses.mainCard} ${animationClass} backdrop-blur-sm bg-white/95 shadow-2xl`}>
        {/* Media Section */}
        <div className={`${layoutClasses.mediaSection} transition-all duration-500 delay-200 ease-out 
            transform overflow-hidden bg-black/5 backdrop-blur-none
            ${isPageLoaded ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"}`}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <MediaContent
              mediaMode={mediaMode}
              videoType={videoType}
              videoFormat={videoFormat}
              onVideoError={() => setVideoType("youtube")}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
          <MediaToggleButton mediaMode={mediaMode} onToggle={toggleMediaMode} />
        </div>

        {/* Login Section */}
        <div className={`${layoutClasses.loginSection} transition-all duration-500 delay-400 ease-out 
            backdrop-blur-sm bg-white/98 border-l border-white/40
            ${isPageLoaded ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}>
          <div className="pt-0 px-10 pb-8">
            <LoginHeader videoFormat={videoFormat} />
            
            <LoginForm
              formData={formData}
              onUpdateFormData={updateFormData}
              onSubmit={handleLogin}
              isDisabled={isDisabled}
              videoFormat={videoFormat}
            >
              <div className="mt-6">
                <LoginButton 
                  loginStage={loginStage} 
                  isDisabled={isDisabled} 
                  videoFormat={videoFormat}
                />
              </div>
            </LoginForm>

            <LoginFooter videoFormat={videoFormat}>
              {/* Additional footer content can be added here */}
              <div>
              </div>
            </LoginFooter>
          </div>
        </div>
      </div>
    </div>
  );
}