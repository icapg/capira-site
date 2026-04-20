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
    href: "/insights/matriculaciones",
    tier: "public",
    ready: true,
    topNav: true,
    metric: "200K+",
    metricLabel: "VE registrados en 2024",
    description: "Evolución mensual y anual de BEV y PHEV en España. Por marca, modelo y provincia.",
  },
  {
    slug: "parque",
    label: "Parque activo",
    href: "/insights/parque",
    tier: "private",
    ready: true,
    topNav: true,
    metric: "600K+",
    metricLabel: "vehículos eléctricos en circulación",
    description: "Flota activa real: matriculaciones menos bajas, desglosada por tipo de vehículo.",
  },
  {
    slug: "infraestructura",
    label: "Infraestructura",
    href: "/insights/infraestructura",
    tier: "private",
    ready: true,
    metric: "56K+",
    metricLabel: "puntos de recarga públicos",
    description: "Red de carga pública por provincia y CCAA, cruzada con la adopción de VE.",
  },
  {
    slug: "precios-energia",
    label: "Precios Energía",
    href: "/insights/precios-energia",
    tier: "private",
    ready: false,
    description: "Precios mayoristas y tarifas eléctricas relevantes para operación de carga.",
  },
  {
    slug: "licitaciones",
    label: "Licitaciones",
    href: "/insights/licitaciones",
    tier: "private",
    ready: false,
    description: "Concursos públicos y licitaciones de infraestructura de recarga en España.",
  },
  {
    slug: "social",
    label: "Social",
    href: "/insights/social",
    tier: "private",
    ready: true,
    adminOnly: true,
    description: "Generador de contenido social mensual. Uso interno.",
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
