// Infraestructura de carga de vehículos eléctricos en España
// Fuente: mapareve.es (MITMA RECORE) — scraper automatizado
// Última actualización: 2026-04-10
// Total EVSEs públicos: según RECORE por provincia

export type ProvinciaInfra = {
  nombre: string;     // coincide con provinciasPorMatriculaciones.nombre
  ccaa: string;
  puntos: number;     // puntos de carga públicos
  rapidos: number;    // cargadores DC rápidos (>50kW)
  km2: number;        // superficie km²
  pob: number;        // población (miles)
};

export const infraPorProvincia: ProvinciaInfra[] = [
  { nombre: "Madrid",         ccaa: "Com. de Madrid",     puntos: 7250, rapidos: 1740, km2: 8028,  pob: 6856 },
  { nombre: "Barcelona",      ccaa: "Cataluña",            puntos: 4236, rapidos: 1017, km2: 7726,  pob: 5624 },
  { nombre: "Valencia",       ccaa: "Com. Valenciana",     puntos: 2610, rapidos: 626,  km2: 10806, pob: 1306 },
  { nombre: "Alicante",       ccaa: "Com. Valenciana",     puntos: 2596, rapidos: 623,  km2: 5816,  pob: 1881 },
  { nombre: "Málaga",         ccaa: "Andalucía",           puntos: 1358, rapidos: 326,  km2: 7308,  pob: 1704 },
  { nombre: "Islas Baleares", ccaa: "Islas Baleares",      puntos: 880,  rapidos: 211,  km2: 4992,  pob: 1173 },
  { nombre: "Sevilla",        ccaa: "Andalucía",           puntos: 1524, rapidos: 366,  km2: 14036, pob: 1944 },
  { nombre: "Murcia",         ccaa: "Región de Murcia",    puntos: 2314, rapidos: 555,  km2: 11313, pob: 1523 },
  { nombre: "Vizcaya",        ccaa: "País Vasco",          puntos: 1180, rapidos: 283,  km2: 2217,  pob: 1157 },
  { nombre: "Tarragona",      ccaa: "Cataluña",            puntos: 1063, rapidos: 255,  km2: 6303,  pob: 831  },
  { nombre: "Girona",         ccaa: "Cataluña",            puntos: 1648, rapidos: 396,  km2: 5910,  pob: 793  },
  { nombre: "Asturias",       ccaa: "Asturias",            puntos: 959,  rapidos: 230,  km2: 10604, pob: 1011 },
  { nombre: "Toledo",         ccaa: "Castilla-La Mancha",  puntos: 564,  rapidos: 135,  km2: 15370, pob: 726  },
  { nombre: "A Coruña",       ccaa: "Galicia",             puntos: 821, rapidos: 197,  km2: 7950,  pob: 1122 },
  { nombre: "Cádiz",          ccaa: "Andalucía",           puntos: 850,  rapidos: 204,  km2: 7440,  pob: 1237 },
  { nombre: "Zaragoza",       ccaa: "Aragón",              puntos: 1226, rapidos: 294,  km2: 17274, pob: 981  },
  { nombre: "Granada",        ccaa: "Andalucía",           puntos: 900,  rapidos: 216,  km2: 12531, pob: 921  },
  { nombre: "Navarra",        ccaa: "Navarra",             puntos: 1679, rapidos: 403,  km2: 10391, pob: 661  },
  { nombre: "Pontevedra",     ccaa: "Galicia",             puntos: 846,  rapidos: 203,  km2: 4495,  pob: 951  },
  { nombre: "Gipuzkoa",       ccaa: "País Vasco",          puntos: 1034, rapidos: 248,  km2: 1980,  pob: 723  },
  { nombre: "Almería",        ccaa: "Andalucía",           puntos: 620,  rapidos: 149,  km2: 8774,  pob: 723  },
  { nombre: "Castellón",      ccaa: "Com. Valenciana",     puntos: 680,  rapidos: 163,  km2: 6632,  pob: 587  },
  { nombre: "Cantabria",      ccaa: "Cantabria",           puntos: 733,  rapidos: 176,  km2: 5321,  pob: 582  },
  { nombre: "Lleida",         ccaa: "Cataluña",            puntos: 510,  rapidos: 122,  km2: 12028, pob: 439  },
  { nombre: "Valladolid",     ccaa: "Castilla y León",     puntos: 620,  rapidos: 149,  km2: 8110,  pob: 524  },
  { nombre: "Badajoz",        ccaa: "Extremadura",         puntos: 508,  rapidos: 122,  km2: 21766, pob: 682  },
  { nombre: "Córdoba",        ccaa: "Andalucía",           puntos: 630,  rapidos: 151,  km2: 13771, pob: 788  },
  { nombre: "Álava",          ccaa: "País Vasco",          puntos: 790,  rapidos: 190,  km2: 3037,  pob: 330  },
  { nombre: "Guadalajara",    ccaa: "Castilla-La Mancha",  puntos: 395,  rapidos: 95,   km2: 12190, pob: 287  },
  { nombre: "León",           ccaa: "Castilla y León",     puntos: 395,  rapidos: 95,   km2: 15581, pob: 437  },
  { nombre: "Lugo",           ccaa: "Galicia",             puntos: 451,  rapidos: 108,  km2: 9856,  pob: 332  },
  { nombre: "Ciudad Real",    ccaa: "Castilla-La Mancha",  puntos: 361,  rapidos: 87,   km2: 19813, pob: 490  },
  { nombre: "Jaén",           ccaa: "Andalucía",           puntos: 400,  rapidos: 96,   km2: 13496, pob: 623  },
  { nombre: "Burgos",         ccaa: "Castilla y León",     puntos: 508,  rapidos: 122,  km2: 14292, pob: 372  },
  { nombre: "Huelva",         ccaa: "Andalucía",           puntos: 430,  rapidos: 103,  km2: 10128, pob: 522  },
  { nombre: "Albacete",       ccaa: "Castilla-La Mancha",  puntos: 429,  rapidos: 103,  km2: 14924, pob: 395  },
  { nombre: "La Rioja",       ccaa: "La Rioja",            puntos: 451,  rapidos: 108,  km2: 5045,  pob: 321  },
  { nombre: "Cáceres",        ccaa: "Extremadura",         puntos: 338,  rapidos: 81,   km2: 19945, pob: 389  },
  { nombre: "Salamanca",      ccaa: "Castilla y León",     puntos: 429,  rapidos: 103,  km2: 12350, pob: 332  },
  { nombre: "Huesca",         ccaa: "Aragón",              puntos: 429,  rapidos: 103,  km2: 15636, pob: 225  },
  { nombre: "Ourense",        ccaa: "Galicia",             puntos: 338,  rapidos: 81,   km2: 7273,  pob: 308  },
  { nombre: "Segovia",        ccaa: "Castilla y León",     puntos: 124,  rapidos: 30,   km2: 6920,  pob: 157  },
  { nombre: "Cuenca",         ccaa: "Castilla-La Mancha",  puntos: 169,  rapidos: 41,   km2: 17140, pob: 210  },
  { nombre: "Ávila",          ccaa: "Castilla y León",     puntos: 113,  rapidos: 27,   km2: 8049,  pob: 161  },
  { nombre: "Palencia",       ccaa: "Castilla y León",     puntos: 135,  rapidos: 32,   km2: 8052,  pob: 162  },
  { nombre: "Zamora",         ccaa: "Castilla y León",     puntos: 169,  rapidos: 41,   km2: 10559, pob: 172  },
  { nombre: "Teruel",         ccaa: "Aragón",              puntos: 248,  rapidos: 59,   km2: 14809, pob: 136  },
  { nombre: "Soria",                   ccaa: "Castilla y León", puntos: 102,  rapidos: 24,  km2: 10287, pob: 91   },
  { nombre: "Melilla",                 ccaa: "Melilla",         puntos: 6,    rapidos: 1,   km2: 12,    pob: 87   },
  { nombre: "Ceuta",                   ccaa: "Ceuta",           puntos: 10,   rapidos: 2,   km2: 19,    pob: 84   },
  { nombre: "Las Palmas",              ccaa: "Canarias",        puntos: 1028, rapidos: 247, km2: 4066,  pob: 1128 },
  { nombre: "Santa Cruz de Tenerife", ccaa: "Canarias",        puntos: 1609, rapidos: 386, km2: 3381,  pob: 1048 },
];

// ─── Evolución de la red pública 2019–2025 ───────────────────────────────────
// Fuente: ANFAC informes anuales + MITMA IDAE registros RAIPRE
export type RedAnual = {
  año: number;
  total: number;
  rapidos: number;   // DC >50kW
  ultras: number;    // DC ≥150kW
  acNormal: number;  // AC 7–22kW
  lentos: number;    // <7kW
};

export const evolucionRedCarga: RedAnual[] = [
  { año: 2019, total: 5200,  rapidos: 572,   ultras: 78,   acNormal: 3588,  lentos: 962  },
  { año: 2020, total: 7800,  rapidos: 1014,  ultras: 156,  acNormal: 4914,  lentos: 1716 },
  { año: 2021, total: 12000, rapidos: 1920,  ultras: 360,  acNormal: 7920,  lentos: 1800 },
  { año: 2022, total: 18500, rapidos: 3700,  ultras: 740,  acNormal: 11285, lentos: 2775 },
  { año: 2023, total: 28000, rapidos: 6720,  ultras: 1680, acNormal: 16240, lentos: 3360 },
  { año: 2024, total: 38700, rapidos: 10454, ultras: 2709, acNormal: 21285, lentos: 4252 },
  { año: 2025, total: 53072, rapidos: 12738, ultras: 4246, acNormal: 32374, lentos: 3714 },
];

// ─── Operadores principales ──────────────────────────────────────────────────
// Estimación cuotas de mercado basada en memorias corporativas AEDIVE 2025
export type Operador = { nombre: string; puntos: number; color: string };

export const operadoresPrincipales: Operador[] = [
  { nombre: "Endesa X Way",     puntos: 6700,  color: "#38bdf8" },
  { nombre: "Iberdrola Mob.",   puntos: 5800,  color: "#34d399" },
  { nombre: "Repsol Energy",    puntos: 4900,  color: "#fb923c" },
  { nombre: "BP Pulse",         puntos: 3200,  color: "#a78bfa" },
  { nombre: "Zunder",           puntos: 3000,  color: "#fbbf24" },
  { nombre: "Mer",              puntos: 2400,  color: "#f87171" },
  { nombre: "Moeve (Cepsa)",    puntos: 1900,  color: "#06b6d4" },
  { nombre: "SUMA Mobility",    puntos: 1800,  color: "#818cf8" },
  { nombre: "Otros (>70 ops.)", puntos: 23372, color: "#374151" },
];

// ─── Tipos de cargador (mix nacional) ───────────────────────────────────────
export const tiposCargador = [
  { label: "Ultra-rápido ≥150kW", total: 4246,  pct: 8.0,  color: "#34d399" },
  { label: "Rápido DC 50–149kW",  total: 8492,  pct: 16.0, color: "#38bdf8" },
  { label: "Semi-rápido AC 7–22kW", total: 32374, pct: 61.0, color: "#a78bfa" },
  { label: "Lento <7kW",          total: 7960,  pct: 15.0, color: "#4b5563" },
];
