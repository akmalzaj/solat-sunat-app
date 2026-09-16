import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SolatWiki - Panduan Solat Sunat & Doa",
    short_name: "SolatWiki",
    description: "SolatWiki: Panduan Solat Sunat dan Doa Untuk Semua",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f2",
    theme_color: "#0f3d36",
    icons: [
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
