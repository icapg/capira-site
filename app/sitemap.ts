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
    "/cargadores",
    "/casos",
    "/recursos",
    "/recursos/elegir-cargador",
    "/recursos/presupuesto",
    "/sobre-capira",
    "/contacto",
    "/terminos",
    "/privacidad",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
