import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { MediaMode, VideoType, VideoFormat } from "../../types/types";
import { MEDIA_CONFIG } from "../../types/constants";
import { YouTubeVideo } from "./YouTubeVideo";
import { LocalVideo } from "./LocalVideo";

interface MediaContentProps {
  mediaMode: MediaMode;
  videoType: VideoType;
  videoFormat: VideoFormat;
  onVideoError: () => void;
}

export const MediaContent: React.FC<MediaContentProps> = ({
  mediaMode,
  videoType,
  videoFormat,
  onVideoError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (mediaMode === "image") {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [mediaMode]);

  if (mediaMode === "image") {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />

        {!imageError && (
          <Image
            src={MEDIA_CONFIG.backgroundImage}
            alt="Fondo Universidad del Putumayo"
            fill
            priority
            unoptimized
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <Image
                  src="/img/uniPutumayo/0-isotipo-azul-PNG.png"
                  alt="Logo Universidad"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <p className="text-lg font-light">
                Institución Universitaria del Putumayo
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (videoType === "youtube") {
    return (
      <YouTubeVideo
        videoId={MEDIA_CONFIG.youtubeVideoId}
        videoFormat={videoFormat}
      />
    );
  }

  return (
    <LocalVideo
      videoSrc={MEDIA_CONFIG.localVideo}
      onError={onVideoError}
    />
  );
};
