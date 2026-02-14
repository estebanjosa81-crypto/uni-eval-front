import { useState, useEffect, useMemo } from 'react';
import type { VideoFormat, VideoType } from '../types/types';
import { detectYouTubeFormat, detectLocalVideoFormat } from '../utils/video';
import { MEDIA_CONFIG } from '../types/constants';

export const useMediaDetection = (videoType: VideoType) => {
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("fullhd");

  useEffect(() => {
    // Crear AbortController para limpiar async operations si se desmonta
    const abortController = new AbortController();
    let isMounted = true;

    const detectFormat = async () => {
      try {
        let format: VideoFormat;

        if (videoType === "youtube") {
          // YouTube format es synchronous
          format = detectYouTubeFormat(MEDIA_CONFIG.youtubeVideoId);
        } else {
          // Local video format es async
          format = await detectLocalVideoFormat(MEDIA_CONFIG.localVideo);
        }

        // Solo actualizar si el componente está montado
        if (isMounted && !abortController.signal.aborted) {
          setVideoFormat(format);
        }
      } catch (error) {
        // No loguear si fue abortado
        if (!abortController.signal.aborted) {
          console.warn("Error detecting video format:", error);
          if (isMounted) {
            setVideoFormat("fullhd"); // fallback
          }
        }
      }
    };

    detectFormat();

    // Cleanup: prevenir memory leaks
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [videoType]);

  return useMemo(() => ({ videoFormat }), [videoFormat]);
};