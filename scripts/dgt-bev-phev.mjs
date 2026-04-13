/**
 * dgt-bev-phev.mjs
 * Genera data/dgt-bev-phev-mensual.json  (liviano, siempre cargado)
 *       data/dgt-bev-phev-YYYY.json       (por año, cargado on-demand)
 *
 * Uso: node scripts/dgt-bev-phev.mjs
 */

import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const OUT_DIR   = join(__dirname, '..', 'data');
const DESDE     = '2014-01';

// ─── Mappings ────────────────────────────────────────────────────────────────

// Código de matrícula DGT → nombre completo de provincia
const PROVINCIA_NOMBRE = {
  A:  'Alicante',       AB: 'Albacete',        AL: 'Almería',
  AV: 'Ávila',          B:  'Barcelona',        BA: 'Badajoz',
  BI: 'Vizcaya',        BU: 'Burgos',           C:  'A Coruña',
  CA: 'Cádiz',          CC: 'Cáceres',          CE: 'Ceuta',
  CO: 'Córdoba',        CR: 'Ciudad Real',      CS: 'Castellón',
  CU: 'Cuenca',         GC: 'Las Palmas',       GI: 'Girona',
  GR: 'Granada',        GU: 'Guadalajara',      H:  'Huelva',
  HU: 'Huesca',         IB: 'Illes Balears',    J:  'Jaén',
  L:  'Lleida',         LE: 'León',             LO: 'La Rioja',
  LU: 'Lugo',           M:  'Madrid',           MA: 'Málaga',
  ME: 'Melilla',        MU: 'Murcia',           NA: 'Navarra',
  O:  'Asturias',       OR: 'Ourense',          P:  'Palencia',
  PM: 'Illes Balears',  PO: 'Pontevedra',       S:  'Cantabria',
  SA: 'Salamanca',      SE: 'Sevilla',          SG: 'Segovia',
  SO: 'Soria',          SS: 'Gipuzkoa',         T:  'Tarragona',
  TE: 'Teruel',         TF: 'Santa Cruz de Tenerife', TO: 'Toledo',
  V:  'Valencia',       VA: 'Valladolid',       VI: 'Álava',
  Z:  'Zaragoza',       ZA: 'Zamora',
};

function provinciaNombre(cod) {
  return PROVINCIA_NOMBRE[cod] ?? cod;
}

// autonomia_ev viene en unidades de 100 metros → dividir por 100 para km
const autonomiaKm = (raw) => (raw && raw > 0) ? Math.round(raw / 100) : null;

function kwBucket(kw) {
  if (!kw || kw <= 0) return 'nd';
  if (kw <= 50)  return '0-50';
  if (kw <= 100) return '51-100';
  if (kw <= 150) return '101-150';
  if (kw <= 200) return '151-200';
  return '201+';
}

function autonomiaBucket(raw) {
  const km = autonomiaKm(raw);
  if (!km) return 'nd';
  if (km <= 200) return '0-200';
  if (km <= 300) return '201-300';
  if (km <= 400) return '301-400';
  if (km <= 500) return '401-500';
  return '501+';
}

// EU carrocería codes → legible
const CARROCERIA_LABEL = {
  AA: 'berlina', AB: 'turismo', AC: 'familiar',
  AD: 'todoterreno', AE: 'cabrio_coupe', AF: 'suv_mpv',
  BB: 'furgoneta', BC: 'furgoneta', CE: 'especial',
};
function carroceriaLabel(cod) {
  if (!cod || cod === 'ND') return 'nd';
  if (cod.startsWith('BA')) return 'furgoneta';
  return CARROCERIA_LABEL[cod] ?? 'otros';
}

// persona_fisica_jur: D=particular, X=empresa/jurídica
const PFJ_LABEL = { D: 'particular', X: 'empresa' };

// servicio: B00=privado, A*=comercial/público
const servicioLabel = (s) => (!s || s.startsWith('B')) ? 'privado' : 'comercial';

// cat_homologacion_eu → grupo simplificado
// Códigos EU estándar + códigos DGT específicos (*XX)
function homologacionGrupo(cat) {
  if (!cat) return 'nd';
  // Turismos
  if (cat === 'M1' || cat === 'M1G') return 'turismo';
  // Furgonetas ligeras
  if (cat === 'N1' || cat === 'N1G') return 'furgoneta';
  // Camiones
  if (cat === 'N2' || cat === 'N2G' || cat === 'N3' || cat === 'N3G') return 'camion';
  // Autobuses
  if (cat === 'M2' || cat === 'M3') return 'autobus';
  // Motos y ciclomotores estándar (L1E, L3E, L5E...)
  if (cat.startsWith('L')) return 'moto_scooter';
  // Tractores
  if (cat.startsWith('T')) return 'tractor';
  // Códigos DGT *XX — identificados por cruce con marca/modelo
  if (cat === '*05' || cat === '*06') return 'moto_scooter';  // Silence, BMW CE04
  if (cat === '*02' || cat === '*03') return 'quad_atv';       // Yamaha, NIU, Carver
  if (cat === '*21' || cat === '*27') return 'cuadricilo';     // Citroën Ami, Microlino, XEV
  if (cat === 'MAA' || cat === 'MA1') return 'especial';      // Carretillas industriales
  // Resto de *XX y desconocidos
  if (cat.startsWith('*')) return 'especial';
  return 'nd';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function topN(arr, key, n = 20) {
  const map = {};
  for (const item of arr) {
    const k = item[key] ?? 'ND';
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, n]) => ({ [key]: k, n }));
}

function countBy(arr, fn) {
  const map = {};
  for (const item of arr) {
    const k = fn(item) ?? 'nd';
    map[k] = (map[k] ?? 0) + 1;
  }
  return map;
}

function pct(num, total, decimals = 1) {
  if (!total) return 0;
  return parseFloat(((num / total) * 100).toFixed(decimals));
}

function write(filename, data) {
  const path = join(OUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  const kb = Math.round(Buffer.byteLength(JSON.stringify(data)) / 1024);
  console.log(`  ✓ ${filename} (${kb} KB)`);
}

// ─── DB ──────────────────────────────────────────────────────────────────────

const db = new Database(DB_FILE, { readonly: true });
const generado_en = new Date().toISOString();

// ─── 1. MENSUAL ───────────────────────────────────────────────────────────────
console.log('\n[1/2] Generando mensual...');

const mensualRows = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, ind_nuevo_usado, COUNT(*) as n
  FROM matriculaciones
  WHERE periodo >= ? AND cat_vehiculo_ev IN ('BEV','PHEV')
  GROUP BY periodo, cat_vehiculo_ev, ind_nuevo_usado
  ORDER BY periodo
`).all(DESDE);

// Desglose mensual por tipo de vehículo
const tipoRows = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, cat_homologacion_eu, COUNT(*) as n
  FROM matriculaciones
  WHERE periodo >= ? AND cat_vehiculo_ev IN ('BEV','PHEV')
  GROUP BY periodo, cat_vehiculo_ev, cat_homologacion_eu
  ORDER BY periodo
`).all(DESDE);

function catToTipo(cat) {
  if (!cat) return 'otros';
  if (cat === 'M1' || cat === 'M1G') return 'turismo';
  if (cat === 'N1' || cat === 'N1G') return 'furgoneta';
  if (cat === 'N2' || cat === 'N2G' || cat === 'N3' || cat === 'N3G') return 'camion';
  if (cat === 'M2' || cat === 'M3') return 'autobus';
  if (cat.startsWith('L') || cat === '*05' || cat === '*06') return 'moto_scooter';
  if (cat === '*21' || cat === '*27') return 'microcar';
  return 'otros';
}

const tipoMap = {}; // { periodo: { BEV: { turismo:0, ...}, PHEV: {...} } }
for (const row of tipoRows) {
  if (!tipoMap[row.periodo]) tipoMap[row.periodo] = { BEV: {}, PHEV: {} };
  const tipo = catToTipo(row.cat_homologacion_eu);
  const cat  = tipoMap[row.periodo][row.cat_vehiculo_ev];
  cat[tipo]  = (cat[tipo] ?? 0) + row.n;
}

// ANFAC-equivalent: M1+M1G nuevos solamente (mismo criterio que ANFAC/IDEAUTO)
const anfacRows = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, COUNT(*) as n
  FROM matriculaciones
  WHERE periodo >= ?
    AND cat_vehiculo_ev IN ('BEV','PHEV')
    AND cat_homologacion_eu IN ('M1','M1G')
    AND ind_nuevo_usado = 'N'
  GROUP BY periodo, cat_vehiculo_ev
  ORDER BY periodo
`).all(DESDE);
const anfacMap = {};
for (const row of anfacRows) {
  if (!anfacMap[row.periodo]) anfacMap[row.periodo] = { bev: 0, phev: 0 };
  anfacMap[row.periodo][row.cat_vehiculo_ev.toLowerCase()] = row.n;
}

// Total mercado nuevos por periodo (para cuota)
const mercadoRows = db.prepare(`
  SELECT periodo, COUNT(*) as n
  FROM matriculaciones
  WHERE periodo >= ? AND ind_nuevo_usado = 'N'
  GROUP BY periodo
`).all(DESDE);
const mercadoMap = Object.fromEntries(mercadoRows.map(r => [r.periodo, r.n]));

// Agrupar por periodo
const mensualMap = {};
for (const row of mensualRows) {
  if (!mensualMap[row.periodo]) {
    mensualMap[row.periodo] = {
      bev:  { total: 0, nuevos: 0, usados: 0 },
      phev: { total: 0, nuevos: 0, usados: 0 },
    };
  }
  const cat  = row.cat_vehiculo_ev.toLowerCase();
  const tipo = row.ind_nuevo_usado === 'N' ? 'nuevos' : 'usados';
  mensualMap[row.periodo][cat].total  += row.n;
  mensualMap[row.periodo][cat][tipo]  += row.n;
}

const mensual = Object.entries(mensualMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([periodo, d]) => {
    const mercado = mercadoMap[periodo] ?? 0;
    const anfac   = anfacMap[periodo]   ?? { bev: 0, phev: 0 };
    const tipos   = tipoMap[periodo]    ?? {};
    const TIPOS   = ['turismo','furgoneta','moto_scooter','microcar','camion','autobus','otros'];
    const emptyTipo = () => Object.fromEntries(TIPOS.map(t => [t, 0]));
    return {
      periodo,
      bev:  d.bev,
      phev: d.phev,
      bev_por_tipo:  { ...emptyTipo(), ...(tipos.BEV  ?? {}) },
      phev_por_tipo: { ...emptyTipo(), ...(tipos.PHEV ?? {}) },
      anfac_bev:  anfac.bev,
      anfac_phev: anfac.phev,
      total_mercado_nuevos: mercado,
      cuota_bev_pct:  pct(d.bev.nuevos,  mercado, 2),
      cuota_phev_pct: pct(d.phev.nuevos, mercado, 2),
    };
  });

write('dgt-bev-phev-mensual.json', {
  meta: {
    fuente: 'DGT MATRABA microdatos',
    generado_en,
    primer_periodo: mensual[0]?.periodo,
    ultimo_periodo: mensual.at(-1)?.periodo,
  },
  mensual,
});

// ─── 2. POR AÑO ──────────────────────────────────────────────────────────────
console.log('\n[2/3] Generando por año...');

const años = db.prepare(`
  SELECT DISTINCT año FROM matriculaciones
  WHERE periodo >= ? AND cat_vehiculo_ev IN ('BEV','PHEV')
  ORDER BY año
`).all(DESDE).map(r => r.año);

// Acumulador para dgt-marcas-provincias.json
const marcasProvSummary = [];

for (const año of años) {
  process.stdout.write(`  ${año}... `);

  const rows = db.prepare(`
    SELECT
      cat_vehiculo_ev, ind_nuevo_usado,
      marca, modelo,
      cod_provincia_veh, provincia_veh,
      municipio,
      persona_fisica_jur, servicio, renting,
      cat_homologacion_eu, carroceria,
      kw, autonomia_ev
    FROM matriculaciones
    WHERE año = ? AND cat_vehiculo_ev IN ('BEV','PHEV')
  `).all(año);

  const bevRows  = rows.filter(r => r.cat_vehiculo_ev === 'BEV');
  const phevRows = rows.filter(r => r.cat_vehiculo_ev === 'PHEV');

  function buildCat(catRows) {
    const nuevos  = catRows.filter(r => r.ind_nuevo_usado === 'N');
    const usados  = catRows.filter(r => r.ind_nuevo_usado !== 'N');
    const total   = catRows.length;
    const renting = catRows.filter(r => r.renting === 'S').length;
    const empresa = catRows.filter(r => r.persona_fisica_jur === 'X').length;

    // Provincias — agrupar por cod+nombre
    const provMap = {};
    for (const r of catRows) {
      const cod = r.cod_provincia_veh ?? 'ND';
      if (!provMap[cod]) provMap[cod] = { cod, provincia: provinciaNombre(cod), n: 0 };
      provMap[cod].n++;
    }
    const provincias = Object.values(provMap).sort((a, b) => b.n - a.n);

    // Municipios — solo totales
    const munMap = {};
    for (const r of catRows) {
      const m = r.municipio ?? 'ND';
      munMap[m] = (munMap[m] ?? 0) + 1;
    }
    const municipios = Object.entries(munMap)
      .sort((a, b) => b[1] - a[1])
      .map(([municipio, n]) => ({ municipio, n }));

    return {
      total,
      nuevos: nuevos.length,
      usados: usados.length,
      renting_pct:  pct(renting, total),
      empresa_pct:  pct(empresa, total),
      marcas_top20:  topN(catRows, 'marca', 20),
      modelos_top20: topN(catRows, 'modelo', 20),
      provincias,
      municipios,
      cat_homologacion: countBy(catRows, r => homologacionGrupo(r.cat_homologacion_eu)),
      carroceria:       countBy(catRows, r => carroceriaLabel(r.carroceria)),
      servicio:         countBy(catRows, r => servicioLabel(r.servicio)),
      kw_buckets:       countBy(catRows, r => kwBucket(r.kw)),
      autonomia_buckets: countBy(catRows, r => autonomiaBucket(r.autonomia_ev)),
    };
  }

  write(`dgt-bev-phev-${año}.json`, {
    meta: { año, fuente: 'DGT MATRABA microdatos', generado_en },
    bev:  buildCat(bevRows),
    phev: buildCat(phevRows),
  });

  // ── Slim summary para el dashboard ────────────────────────────────────────
  // Marcas combinadas BEV+PHEV con desglose por tipo de vehículo
  const TIPOS_LIST = ['turismo','furgoneta','moto_scooter','microcar','camion','autobus','otros'];
  const emptyTipos = () => Object.fromEntries(TIPOS_LIST.map(t => [t, 0]));
  const marcaMap = {};
  for (const r of rows) {
    const m    = r.marca ?? 'ND';
    const tipo = catToTipo(r.cat_homologacion_eu);
    if (!marcaMap[m]) marcaMap[m] = { marca: m, bev: 0, phev: 0, por_tipo: emptyTipos() };
    if (r.cat_vehiculo_ev === 'BEV') marcaMap[m].bev++;
    else marcaMap[m].phev++;
    marcaMap[m].por_tipo[tipo]++;
  }
  const marcas = Object.values(marcaMap)
    .sort((a, b) => (b.bev + b.phev) - (a.bev + a.phev))
    .slice(0, 30);

  // Provincias combinadas BEV+PHEV
  const provMap = {};
  for (const r of rows) {
    const cod = r.cod_provincia_veh ?? 'ND';
    if (!provMap[cod]) provMap[cod] = { cod, provincia: provinciaNombre(cod), bev: 0, phev: 0 };
    if (r.cat_vehiculo_ev === 'BEV') provMap[cod].bev++;
    else provMap[cod].phev++;
  }
  const provincias = Object.values(provMap)
    .map(p => ({ ...p, total: p.bev + p.phev }))
    .sort((a, b) => b.total - a.total);

  // Modelos BEV y PHEV top 15
  const bev_modelos = topN(bevRows, 'modelo', 15).map(e => ({
    modelo: e.modelo,
    marca: bevRows.find(r => r.modelo === e.modelo)?.marca ?? 'ND',
    n: e.n,
  }));
  const phev_modelos = topN(phevRows, 'modelo', 15).map(e => ({
    modelo: e.modelo,
    marca: phevRows.find(r => r.modelo === e.modelo)?.marca ?? 'ND',
    n: e.n,
  }));

  marcasProvSummary.push({ año, marcas, bev_modelos, phev_modelos, provincias });
}

// ─── 3. MARCAS+PROVINCIAS SUMMARY ────────────────────────────────────────────
console.log('\n[3/3] Generando marcas-provincias summary...');
write('dgt-marcas-provincias.json', {
  meta: { fuente: 'DGT MATRABA microdatos', generado_en },
  por_año: marcasProvSummary,
});

// ─── 4. PARQUE ACTIVO ─────────────────────────────────────────────────────────
console.log('\n[4/4] Generando parque activo...');

// Matriculaciones acumuladas por año (desde el inicio del dataset)
const matAcumRows = db.prepare(`
  SELECT substr(periodo, 1, 4) as año, cat_vehiculo_ev, COUNT(*) as n
  FROM matriculaciones
  WHERE cat_vehiculo_ev IN ('BEV','PHEV')
  GROUP BY año, cat_vehiculo_ev
  ORDER BY año
`).all();

// Bajas acumuladas por año — solo BEV/PHEV (HEV excluido)
// NOTA: la tabla 'bajas' tiene segmentos SQLite internos no compactados.
// - Sin filtro de fecha: devuelve datos históricos correctos (hasta 2023) pero OMITE los
//   registros del segmento más reciente (2024+).
// - Con filtro fecha >= '2024-01-01': accede exactamente al segmento nuevo con datos 2024+.
// - Con filtro fecha < '2024-01-01': corrompe los conteos históricos (diferente plan de acceso).
// Solución: query SIN filtro para histórico + query CON filtro >= '2024' para datos nuevos.
const bajasAcumHist = db.prepare(`
  SELECT substr(fecha_baja, 1, 4) as año, cat_vehiculo_ev, COUNT(*) as n
  FROM bajas
  WHERE cat_vehiculo_ev IN ('BEV','PHEV')
    AND fecha_baja IS NOT NULL
    AND fecha_baja != ''
  GROUP BY año, cat_vehiculo_ev
  ORDER BY año
`).all();
const bajasAcumRecent = db.prepare(`
  SELECT substr(fecha_baja, 1, 4) as año, cat_vehiculo_ev, COUNT(*) as n
  FROM bajas
  WHERE cat_vehiculo_ev IN ('BEV','PHEV')
    AND fecha_baja IS NOT NULL
    AND fecha_baja != ''
    AND fecha_baja >= '2024-01-01'
  GROUP BY año, cat_vehiculo_ev
  ORDER BY año
`).all();
const bajasAcumRows = [...bajasAcumHist, ...bajasAcumRecent];

// Acumular matriculaciones por año
const matByYear = {};
for (const r of matAcumRows) {
  if (!matByYear[r.año]) matByYear[r.año] = { bev: 0, phev: 0 };
  matByYear[r.año][r.cat_vehiculo_ev.toLowerCase()] += r.n;
}

// Acumular bajas por año (la tabla bajas puede devolver múltiples segmentos
// para el mismo año — usar += para sumar todos los segmentos)
const bajasByYear = {};
for (const r of bajasAcumRows) {
  if (!bajasByYear[r.año]) bajasByYear[r.año] = { bev: 0, phev: 0 };
  bajasByYear[r.año][r.cat_vehiculo_ev.toLowerCase()] += r.n;
}

// Calcular parque activo acumulado año a año
const allYears = [...new Set([
  ...Object.keys(matByYear),
  ...Object.keys(bajasByYear),
])].sort();

let cumMat  = { bev: 0, phev: 0 };
let cumBajas = { bev: 0, phev: 0 };
const parqueByYear = [];

for (const año of allYears) {
  const mat   = matByYear[año]   ?? { bev: 0, phev: 0 };
  const bajas = bajasByYear[año] ?? { bev: 0, phev: 0 };
  cumMat.bev   += mat.bev;
  cumMat.phev  += mat.phev;
  cumBajas.bev  += bajas.bev;
  cumBajas.phev += bajas.phev;
  parqueByYear.push({
    año: parseInt(año),
    mat_acum_bev:    cumMat.bev,
    mat_acum_phev:   cumMat.phev,
    bajas_acum_bev:  cumBajas.bev,
    bajas_acum_phev: cumBajas.phev,
    parque_bev:      cumMat.bev  - cumBajas.bev,
    parque_phev:     cumMat.phev - cumBajas.phev,
    parque_total:    (cumMat.bev + cumMat.phev) - (cumBajas.bev + cumBajas.phev),
  });
}

const lastParque = parqueByYear[parqueByYear.length - 1];
const parqueTotal = {
  bev:   lastParque?.parque_bev   ?? 0,
  phev:  lastParque?.parque_phev  ?? 0,
  total: lastParque?.parque_total ?? 0,
};

write('dgt-parque-activo.json', {
  meta: { fuente: 'DGT MATRABA microdatos (matriculaciones − bajas)', generado_en },
  total: parqueTotal,
  por_año: parqueByYear,
});

db.close();
console.log('\nListo.');
