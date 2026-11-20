import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Manifest PWA: situs bisa dipasang di layar utama HP seperti aplikasi. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: "Belajar online SD, SMP, SMA, dan persiapan UTBK.",
    start_url: "/id/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f5fafb",
    theme_color: siteConfig.colors.primary,
    lang: "id",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
