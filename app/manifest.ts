import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Kilo · Registro de entrenamiento", short_name: "Kilo", description: "Entrena, registra, progresa.", start_url: "/", display: "standalone", background_color: "#101311", theme_color: "#101311", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
