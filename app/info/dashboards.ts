export type DashboardTier = "public" | "private";

export type Dashboard = {
  slug: string;
  label: string;
  href: string;
  tier: DashboardTier;
  ready: boolean;
  adminOnly?: boolean;
  topNav?: boolean;
  metric?: string;
  metricLabel?: string;
  description: string;
};

export const DASHBOARDS: Dashboard[] = [
  {
    slug: "matriculaciones",
    label: "Matriculaciones",
    href: "/info/matriculaciones",
    tier: "public",
    ready: true,
    topNav: true,
    metric: "200K+",
    metricLabel: "VE registrados en 2024",
    description: "Evolución mensual y anual de BEV y PHEV en España. Por marca, modelo y provincia.",
  },
  {
    slug: "parque",
    label: "Parque Activo",
    href: "/info/parque",
    tier: "public",
    ready: true,
    topNav: true,
    metric: "600K+",
    metricLabel: "vehículos eléctricos en circulación",
    description: "Flota activa real: matriculaciones menos bajas, desglosada por tipo de vehículo.",
  },
  {
    slug: "marca-perfil",
    label: "Marca · Perfil",
    href: "/info/marca-perfil",
    tier: "private",
    ready: true,
    topNav: true,
    description: "Perfil tecnológico de cada fabricante: % BEV vs PHEV de sus matriculaciones enchufables.",
  },
  {
    slug: "infraestructura",
    label: "Infraestructura",
    href: "/info/infraestructura",
    tier: "private",
    ready: true,
    metric: "56K+",
    metricLabel: "puntos de recarga públicos",
    description: "Red de carga pública por provincia y CCAA, cruzada con la adopción de VE.",
  },
  {
    slug: "precios-energia",
    label: "Precios Energía",
    href: "/info/precios-energia",
    tier: "private",
    ready: false,
    description: "Precios mayoristas y tarifas eléctricas relevantes para operación de carga.",
  },
  {
    slug: "licitaciones",
    label: "Licitaciones",
    href: "/info/licitaciones",
    tier: "private",
    ready: true,
    metric: "4.229",
    metricLabel: "licitaciones e-mov clasificadas",
    description: "Licitaciones públicas de e-movilidad en España (PLACSP): concesiones, infraestructura, VE, buses y servicios.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/info/social",
    tier: "private",
    ready: true,
    adminOnly: true,
    description: "Generador de contenido social mensual. Uso interno.",
  },
  {
    slug: "analisis-marca",
    label: "Análisis por Marca",
    href: "/info/analisis-marca",
    tier: "private",
    ready: false,
    description: "Desglose y evolución del mercado por marca.",
  },
  {
    slug: "analisis-provincia",
    label: "Análisis por Provincia",
    href: "/info/analisis-provincia",
    tier: "private",
    ready: false,
    description: "Comparativa de adopción y mercado por provincia.",
  },
  {
    slug: "analisis-evs-cargadores",
    label: "Análisis EVs/Cargadores",
    href: "/info/analisis-evs-cargadores",
    tier: "private",
    ready: false,
    description: "Relación vehículos eléctricos vs infraestructura de carga.",
  },
  {
    slug: "analisis-uso-cargadores",
    label: "Análisis uso de cargadores",
    href: "/info/analisis-uso-cargadores",
    tier: "private",
    ready: false,
    description: "Patrones de uso, ocupación y demanda de la red pública.",
  },
  {
    slug: "analisis-potencia-nodos",
    label: "Análisis Potencia nodos",
    href: "/info/analisis-potencia-nodos",
    tier: "private",
    ready: false,
    description: "Distribución de potencia instalada por nodo de carga.",
  },
  {
    slug: "analisis-precio-potencia-energia",
    label: "Análisis Precio Potencia vs Energía",
    href: "/info/analisis-precio-potencia-energia",
    tier: "private",
    ready: false,
    description: "Comparativa de tarifas de potencia contratada vs energía.",
  },
  {
    slug: "analisis-cpos",
    label: "Análisis CPOs",
    href: "/info/analisis-cpos",
    tier: "private",
    ready: false,
    description: "Ranking y evolución de operadores de carga (CPOs).",
  },
  {
    slug: "otros",
    label: "Otros",
    href: "/info/otros",
    tier: "private",
    ready: false,
    description: "Análisis complementarios en preparación.",
  },
];

export const PUBLIC_DASHBOARD_SLUGS = DASHBOARDS
  .filter((d) => d.tier === "public")
  .map((d) => d.slug);

export function isVisibleTo(d: Dashboard, isAdmin: boolean): boolean {
  if (d.adminOnly) return isAdmin;
  return true;
}

export function isUnlockedFor(d: Dashboard, isAdmin: boolean): boolean {
  if (!d.ready) return false;
  if (d.tier === "public") return true;
  return isAdmin;
}
