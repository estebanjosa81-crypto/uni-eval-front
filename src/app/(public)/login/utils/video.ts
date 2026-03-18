import { VideoFormat, VideoType } from '../types/types';
import { KNOWN_SHORTS } from '../types/constants';

export const detectYouTubeFormat = (videoId: string): VideoFormat => {
  return KNOWN_SHORTS.includes(videoId as any) ? "short" : "fullhd";
};

export const detectLocalVideoFormat = async (videoSrc: string): Promise<VideoFormat> => {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let video: HTMLVideoElement | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (video) {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("error", handleError);
        video.src = ""; // Clear src antes de remover
        video.removeAttribute("src"); // Remover atributo src
        video.pause();
        video.load(); // Trigger abort on pending requests
        // No remover del DOM si no fue creado por nosotros, solo limpiar referencias
        video = null;
      }
    };

    const handleLoadedMetadata = () => {
      if (!resolved && video) {
        resolved = true;
        const aspectRatio = video.videoWidth / video.videoHeight;
        cleanup();
        resolve(aspectRatio < 1 ? "short" : "fullhd");
      }
    };

    const handleError = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve("fullhd"); // Fallback a fullhd si hay error
      }
    };

    // Timeout de seguridad para no esperar infinitamente
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve("fullhd");
      }
    }, 5000); // 5 segundos máximo

    video = document.createElement("video");
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.src = videoSrc;
  });
};