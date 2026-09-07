import type { MetadataRoute } from "next";

/**
 * Web app manifest (Phase 6, offline / low-bandwidth). Lets the portal install
 * to the home screen and run standalone — useful for field staff on patchy
 * connections. Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capacity Connect — Ministry of Earth Sciences",
    short_name: "Capacity Connect",
    description: "Digital capacity building for India's weather and climate services.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#5b3a8e",
    lang: "en",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
