import React from "react";

interface LocalVideoProps {
  videoSrc: string;
  onError: () => void;
}

export const LocalVideo: React.FC<LocalVideoProps> = ({
  videoSrc,
  onError,
}) => (
  <video
    autoPlay
    muted
    loop
    playsInline
    onError={onError}
    className="w-full h-full object-cover"
  >
    <source src={videoSrc} type="video/mp4" />
    Tu navegador no soporta el elemento de video.
  </video>
);
