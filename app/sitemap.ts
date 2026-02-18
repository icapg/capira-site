import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://capira.com"; // luego reemplazamos
  const routes = [
    "",
    "/soluciones",
    "/comercios",
    "/flotas",
    "/cpo",
    "/residencial",
    "/casos",
    "/recursos",
    "/sobre-capira",
    "/contacto",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
