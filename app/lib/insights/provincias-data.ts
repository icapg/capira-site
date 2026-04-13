// Matriculaciones EV por provincia — España
// Fuente: AEDIVE Power BI (scraper automatizado)
// Período: acumulado 2019–2025

export type ProvinciaData = {
  nombre: string;        // nombre normalizado para GeoJSON
  aedive: string;        // nombre tal como viene de AEDIVE
  total: number;
  ccaa: string;
};

export const provinciasPorMatriculaciones: ProvinciaData[] = [
  { nombre: "Madrid",         aedive: "MADRID",       total: 136190, ccaa: "Com. de Madrid" },
  { nombre: "Barcelona",      aedive: "BARCELONA",    total: 33910,  ccaa: "Cataluña" },
  { nombre: "Valencia",       aedive: "VALENCIA",     total: 19714,  ccaa: "Com. Valenciana" },
  { nombre: "Alicante",       aedive: "ALICANTE",     total: 10522,  ccaa: "Com. Valenciana" },
  { nombre: "Málaga",         aedive: "MALAGA",       total: 8452,   ccaa: "Andalucía" },
  { nombre: "Islas Baleares", aedive: "BALEARES",     total: 7181,   ccaa: "Islas Baleares" },
  { nombre: "Sevilla",        aedive: "SEVILLA",      total: 6224,   ccaa: "Andalucía" },
  { nombre: "Murcia",         aedive: "MURCIA",       total: 5750,   ccaa: "Región de Murcia" },
  { nombre: "Vizcaya",        aedive: "VIZCAYA",      total: 5095,   ccaa: "País Vasco" },
  { nombre: "Tarragona",      aedive: "TARRAGONA",    total: 4588,   ccaa: "Cataluña" },
  { nombre: "Girona",         aedive: "GERONA",       total: 4204,   ccaa: "Cataluña" },
  { nombre: "Asturias",       aedive: "ASTURIAS",     total: 4045,   ccaa: "Asturias" },
  { nombre: "Toledo",         aedive: "TOLEDO",       total: 4004,   ccaa: "Castilla-La Mancha" },
  { nombre: "A Coruña",       aedive: "CORUÑA (LA)",  total: 3944,   ccaa: "Galicia" },
  { nombre: "Cádiz",          aedive: "CADIZ",        total: 3865,   ccaa: "Andalucía" },
  { nombre: "Zaragoza",       aedive: "ZARAGOZA",     total: 3859,   ccaa: "Aragón" },
  { nombre: "Granada",        aedive: "GRANADA",      total: 3659,   ccaa: "Andalucía" },
  { nombre: "Navarra",        aedive: "NAVARRA",      total: 3565,   ccaa: "Navarra" },
  { nombre: "Pontevedra",     aedive: "PONTEVEDRA",   total: 3279,   ccaa: "Galicia" },
  { nombre: "Gipuzkoa",       aedive: "GUIPUZCOA",    total: 2826,   ccaa: "País Vasco" },
  { nombre: "Almería",        aedive: "ALMERIA",      total: 2625,   ccaa: "Andalucía" },
  { nombre: "Castellón",      aedive: "CASTELLON",    total: 2625,   ccaa: "Com. Valenciana" },
  { nombre: "Cantabria",      aedive: "CANTABRIA",    total: 2580,   ccaa: "Cantabria" },
  { nombre: "Lleida",         aedive: "LERIDA",       total: 2455,   ccaa: "Cataluña" },
  { nombre: "Valladolid",     aedive: "VALLADOLID",   total: 2351,   ccaa: "Castilla y León" },
  { nombre: "Badajoz",        aedive: "BADAJOZ",      total: 2022,   ccaa: "Extremadura" },
  { nombre: "Córdoba",        aedive: "CORDOBA",      total: 2005,   ccaa: "Andalucía" },
  { nombre: "Álava",          aedive: "ALAVA",        total: 1972,   ccaa: "País Vasco" },
  { nombre: "Guadalajara",    aedive: "GUADALAJARA",  total: 1732,   ccaa: "Castilla-La Mancha" },
  { nombre: "León",           aedive: "LEON",         total: 1512,   ccaa: "Castilla y León" },
  { nombre: "Lugo",           aedive: "LUGO",         total: 1499,   ccaa: "Galicia" },
  { nombre: "Ciudad Real",    aedive: "CIUDAD REAL",  total: 1448,   ccaa: "Castilla-La Mancha" },
  { nombre: "Jaén",           aedive: "JAEN",         total: 1392,   ccaa: "Andalucía" },
  { nombre: "Burgos",         aedive: "BURGOS",       total: 1283,   ccaa: "Castilla y León" },
  { nombre: "Huelva",         aedive: "HUELVA",       total: 1279,   ccaa: "Andalucía" },
  { nombre: "Albacete",       aedive: "ALBACETE",     total: 1239,   ccaa: "Castilla-La Mancha" },
  { nombre: "La Rioja",       aedive: "RIOJA (LA)",   total: 1226,   ccaa: "La Rioja" },
  { nombre: "Cáceres",        aedive: "CACERES",      total: 1070,   ccaa: "Extremadura" },
  { nombre: "Salamanca",      aedive: "SALAMANCA",    total: 999,    ccaa: "Castilla y León" },
  { nombre: "Huesca",         aedive: "HUESCA",       total: 935,    ccaa: "Aragón" },
  { nombre: "Ourense",        aedive: "ORENSE",       total: 911,    ccaa: "Galicia" },
  { nombre: "Segovia",        aedive: "SEGOVIA",      total: 598,    ccaa: "Castilla y León" },
  { nombre: "Cuenca",         aedive: "CUENCA",       total: 560,    ccaa: "Castilla-La Mancha" },
  { nombre: "Ávila",          aedive: "AVILA",        total: 537,    ccaa: "Castilla y León" },
  { nombre: "Palencia",       aedive: "PALENCIA",     total: 417,    ccaa: "Castilla y León" },
  { nombre: "Zamora",         aedive: "ZAMORA",       total: 356,    ccaa: "Castilla y León" },
  { nombre: "Teruel",         aedive: "TERUEL",       total: 341,    ccaa: "Aragón" },
  { nombre: "Soria",          aedive: "SORIA",        total: 325,    ccaa: "Castilla y León" },
  { nombre: "Melilla",        aedive: "MELILLA",      total: 126,    ccaa: "Melilla" },
  { nombre: "Ceuta",          aedive: "CEUTA",        total: 106,    ccaa: "Ceuta" },
  // Canarias — pendiente verificación AEDIVE (estimado por población vs media nacional)
  { nombre: "Las Palmas",              aedive: "LAS PALMAS",    total: 4800, ccaa: "Canarias" },
  { nombre: "Santa Cruz de Tenerife", aedive: "TENERIFE",      total: 4200, ccaa: "Canarias" },
];

export const totalEspana = provinciasPorMatriculaciones.reduce((s, p) => s + p.total, 0);
