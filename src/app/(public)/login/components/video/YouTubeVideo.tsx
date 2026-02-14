import React from "react";
import type { VideoFormat } from "../../types/types";

interface YouTubeVideoProps {
  videoId: string;
  videoFormat: VideoFormat;
}

export const YouTubeVideo: React.FC<YouTubeVideoProps> = ({
  videoId,
  videoFormat,
}) => {
  const baseUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1`;

  const isShort = videoFormat === "short";

  const iframeStyle = isShort
    ? {
        height: "100vh",
        minWidth: "100%",
        minHeight: "177.78vw",
      }
    : {
        minWidth: "100%",
        minHeight: "100%",
        width: "100vw",
        height: "56.25vw",
      };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        isShort ? "bg-black" : ""
      }`}
    >
      <iframe
        src={baseUrl}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{ border: "none", ...iframeStyle }}
        allow="autoplay; encrypted-media"
        allowFullScreen={false}
        title={isShort ? "Background Short Video" : "Background Video"}
      />
    </div>
  );
};
