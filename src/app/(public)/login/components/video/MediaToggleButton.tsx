import React from "react";
import { Play, Image as ImageIcon } from "lucide-react";
import type { MediaMode } from "../../types/types";

interface MediaToggleButtonProps {
  mediaMode: MediaMode;
  onToggle: () => void;
}

export const MediaToggleButton: React.FC<MediaToggleButtonProps> = ({
  mediaMode,
  onToggle,
}) => {
  const isVideo = mediaMode === "video";

  return (
    <button
      onClick={onToggle}
      title={isVideo ? "Cambiar a imagen" : "Cambiar a video"}
      className="absolute bottom-4 right-4 bg-black/30 hover:bg-black/40
        backdrop-blur-md text-white p-3 rounded-full transition-all duration-200
        transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50
        z-10 pointer-events-auto border border-white/20 shadow-lg"
    >
      {isVideo ? <ImageIcon size={20} /> : <Play size={20} />}
    </button>
  );
};
