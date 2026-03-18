/**
 * Configuración de medios y assets para login
 * 
 * NOTA: ROLE_ROUTES ahora está centralizado en @/src/api/core/auth/types
 * para evitar duplicación y mantener una única fuente de verdad
 */

export const MEDIA_CONFIG = {
  youtubeVideoId: "UiYQTRtGh9E", //  UiYQTRtGh9E // swagboy : UALQxIy0odc
  localVideo: "/path/to/your/video.mp4",
  backgroundImage: "https://itp.edu.co/ITP2022/wp-content/uploads/2023/02/245216850_2524156664394432_3397011422600315621_n-scaled.jpg", // https://itp.edu.co/ITP2022/wp-content/uploads/2023/02/245216850_2524156664394432_3397011422600315621_n-scaled.jpg - https://virtual.itp.edu.co/moodle2025-2/pluginfile.php/1/theme_eguru/slide1image/1757194342/INSTITUCION%20UNIVERSITARIA%20DEL%20PUTUMAYO.png
} as const;

export const LOGOS = {
  main: "/img/uniPutumayo/0-isotipo-azul-PNG.png",
  full: "/img/uniPutumayo/1-logo-azul-PNG.png",
} as const;

export const KNOWN_SHORTS = [
  "gydbVxUB-ZI",
  "gsNSyhvplSg", 
  "8cZgv2Tq85o",
  "UiYQTRtGh9E",
] as const;