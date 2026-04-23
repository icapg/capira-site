import aliasesJson from "../../../data/dgt-marca-aliases.json";

/**
 * Normalización de marcas — misma lógica que consume scripts/dgt-marca-perfil-build.mjs.
 * Fuente de aliases: data/dgt-marca-aliases.json.
 */
const MARCAS_ALIASES: Record<string, string> = aliasesJson.aliases as Record<string, string>;
const MARCAS_EXCLUIR = new Set<string>((aliasesJson.excluir as string[]).map((s) => s.toUpperCase()));

export function normalizarMarca(raw: string | null | undefined): string {
  if (!raw) return "";
  const upper = raw.trim().toUpperCase();
  if (MARCAS_EXCLUIR.has(upper)) return "";
  return MARCAS_ALIASES[upper] ?? upper;
}

export function slugMarca(marca: string): string {
  return marca
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Top modelos EV en España — Fuente: AEDIVE 2025
export type ModeloData = {
  modelo: string;
  marca: string;
  tipo: "BEV" | "PHEV";
  unidades: number;
};

export const topModelos: ModeloData[] = [
  { modelo: "Model 3",         marca: "Tesla",   tipo: "BEV",  unidades: 12419 },
  { modelo: "Seal U DM-i",     marca: "BYD",     tipo: "PHEV", unidades: 11709 },
  { modelo: "C-HR 2.0 320H",   marca: "Toyota",  tipo: "PHEV", unidades: 11014 },
  { modelo: "Kuga 2.5 PHEV",   marca: "Ford",    tipo: "PHEV", unidades: 9571  },
  { modelo: "HS 1.5 PHEV",     marca: "MG",      tipo: "PHEV", unidades: 9044  },
  { modelo: "Model Y",         marca: "Tesla",   tipo: "BEV",  unidades: 8030  },
  { modelo: "EV3",             marca: "KIA",     tipo: "BEV",  unidades: 6554  },
  { modelo: "RAV-4 R LUS-IN",  marca: "Toyota",  tipo: "PHEV", unidades: 5988  },
  { modelo: "Dolphin Surf",    marca: "BYD",     tipo: "BEV",  unidades: 5514  },
];

export const topMarcas = [
  { marca: "BYD", bev: 15863, phev: 9697 },
  { marca: "TESLA", bev: 16008, phev: 0 },
  { marca: "BMW", bev: 4676, phev: 6030 },
  { marca: "MG", bev: 1426, phev: 8417 },
  { marca: "FORD", bev: 2196, phev: 6832 },
  { marca: "RENAULT", bev: 5510, phev: 2551 },
  { marca: "AUDI", bev: 1971, phev: 6074 },
  { marca: "VOLVO", bev: 2133, phev: 2231 },
  { marca: "MINI", bev: 3470, phev: 0 },
  { marca: "LEXUS", bev: 125, phev: 2726 },
];

export type MarcaAnualData = {
  marca: string;
  bev: number;
  phev: number;
};

export type MarcasPorAñoEntry = {
  año: number;
  marcas: MarcaAnualData[];
  fuente?: string;  // si no se indica fuente, los datos son estimados
};

// Solo se cargan años con datos oficiales verificados.
// Para agregar un año: buscar el desglose por fabricante en el dashboard
// Power BI de AEDIVE (sección "Matriculaciones por Marca") o en el anuario ANFAC.
export const topMarcasPorAño: MarcasPorAñoEntry[] = [
  {
    año: 2026,
    fuente: "AEDIVE",
    marcas: [
      { marca: "BYD", bev: 15863, phev: 9697 },
      { marca: "TESLA", bev: 16008, phev: 0 },
      { marca: "BMW", bev: 4676, phev: 6030 },
      { marca: "MG", bev: 1426, phev: 8417 },
      { marca: "FORD", bev: 2196, phev: 6832 },
      { marca: "RENAULT", bev: 5510, phev: 2551 },
      { marca: "AUDI", bev: 1971, phev: 6074 },
      { marca: "VOLVO", bev: 2133, phev: 2231 },
      { marca: "MINI", bev: 3470, phev: 0 },
      { marca: "LEXUS", bev: 125, phev: 2726 },
      { marca: "PORSCHE", bev: 1050, phev: 1382 },
      { marca: "SMART", bev: 253, phev: 1589 },
      { marca: "SEAT", bev: 0, phev: 1434 },
      { marca: "MITSUBISHI", bev: 15, phev: 1281 },
      { marca: "POLESTAR", bev: 842, phev: 0 },
      { marca: "DS", bev: 43, phev: 588 },
      { marca: "ALPINE", bev: 371, phev: 0 },
      { marca: "ALFA ROMEO", bev: 133, phev: 49 },
      { marca: "SSANGYONG", bev: 104, phev: 0 },
      { marca: "FERRARI", bev: 0, phev: 56 },
      { marca: "SUBARU", bev: 47, phev: 0 },
      { marca: "FIAT", bev: 33, phev: 0 },
      { marca: "LOTUS", bev: 9, phev: 0 },
      { marca: "MASERATI", bev: 1, phev: 0 },
    ],
  },
];
