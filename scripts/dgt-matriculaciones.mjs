/**
 * DGT Matriculaciones — Downloader, Procesador y Generador
 *
 * Descarga microdatos mensuales de la DGT (formato MATRABA, ancho fijo,
 * 714 chars/registro, ISO-8859-1) y almacena TODOS los registros en SQLite.
 * Luego genera agregaciones para el dashboard de Capira.
 *
 * Fuente oficial:
 *   https://www.dgt.es/menusecundario/dgt-en-cifras/matraba-listados/matriculaciones-automoviles-mensual.html
 *
 * Uso:
 *   node scripts/dgt-matriculaciones.mjs                  → último mes disponible
 *   node scripts/dgt-matriculaciones.mjs --mes=2025-03    → mes específico
 *   node scripts/dgt-matriculaciones.mjs --init           → histórico completo (dic 2014 → hoy)
 *   node scripts/dgt-matriculaciones.mjs --solo-agregar   → regenera JSON/TS desde la DB existente
 *   node scripts/dgt-matriculaciones.mjs --dry-run        → sin escribir nada
 *
 * Genera:
 *   data/dgt-matriculaciones.db   — SQLite con TODOS los registros individuales (~4-6 GB histórico)
 *   data/dgt-matriculaciones.json — agregaciones mensuales para el dashboard
 *   app/lib/insights/dgt-data.ts  — exports tipados para el dashboard
 *
 * Requiere: better-sqlite3 (ya en devDependencies)
 */

import Database                                       from 'better-sqlite3';
import { createWriteStream, createReadStream,
         existsSync, writeFileSync, readdirSync,
         statSync }                                   from 'fs';
import { mkdir, rm }                                  from 'fs/promises';
import { createInterface }                            from 'readline';
import { join, dirname }                              from 'path';
import { fileURLToPath }                              from 'url';
import { tmpdir }                                     from 'os';
import { exec }                                       from 'child_process';
import { promisify }                                  from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────

const DB_FILE   = join(ROOT, 'data', 'dgt-matriculaciones.db');
const JSON_FILE = join(ROOT, 'data', 'dgt-matriculaciones.json');
const TS_FILE   = join(ROOT, 'app', 'lib', 'insights', 'dgt-data.ts');
const TEMP_DIR  = join(tmpdir(), 'dgt-mat-tmp');

const DRY_RUN      = process.argv.includes('--dry-run');
const DO_INIT      = process.argv.includes('--init');
const SOLO_AGREGAR = process.argv.includes('--solo-agregar');
const MES_ARG      = process.argv.find(a => a.startsWith('--mes='));
const SPECIFIC_MES = MES_ARG ? MES_ARG.split('=')[1] : null;

// Primer mes disponible en la DGT
const ORIGIN = { year: 2014, month: 12 };

// URL patrón: mes en la URL sin cero inicial, en el nombre con cero inicial
const dgtUrl = (year, month) =>
  `https://www.dgt.es/microdatos/salida/${year}/${month}/vehiculos/matriculaciones/export_mensual_mat_${year}${String(month).padStart(2, '0')}.zip`;

// ─────────────────────────────────────────────────────────────────
// CAMPOS FIJO-ANCHO (offset 0-based, longitud)
// Fuente: VehicInputData.cs — github.com/jcaubin/DgtDataFileHelpers
// Documento oficial: MATRICULACIONES_MATRABA.pdf (DGT)
// ─────────────────────────────────────────────────────────────────

const F = {
  FEC_MATRICULA:        [0,   8],  // DDMMYYYY
  COD_CLASE_MAT:        [8,   1],  // clase de matrícula
  MARCA_ITV:            [17, 30],  // marca
  MODELO_ITV:           [47, 22],  // modelo
  COD_TIPO:             [91,  2],  // tipo de vehículo (2 dígitos)
  COD_PROPULSION:       [93,  1],  // combustible
  CILINDRADA_ITV:       [94,  5],  // cm³
  POTENCIA_ITV:         [99,  6],  // CV (potencia fiscal)
  TARA:                 [105, 6],  // kg
  PESO_MAX:             [111, 6],  // kg
  NUM_PLAZAS_ITV:       [117, 3],
  COD_PROVINCIA_VEH:    [152, 2],  // provincia del titular
  COD_PROVINCIA_MAT:    [154, 2],  // provincia de matriculación
  IND_NUEVO_USADO:      [178, 1],  // N=nuevo, U=usado
  PERSONA_FIS_JUR:      [179, 1],  // F=física, J=jurídica
  SERVICIO:             [189, 3],  // particular, público, etc.
  MUNICIPIO:            [197, 30],
  KW_ITV:               [227, 7],  // potencia kW
  NUM_PLAZAS_MAX:       [234, 3],
  CO2_ITV:              [237, 5],  // g/km
  RENTING:              [242, 1],
  FEC_PRIM_MATRICULAC:  [170, 8],  // primera matriculación (DDMMYYYY)
  CODIGO_POSTAL:        [165, 5],
  FABRICANTE_ITV:       [344, 70],
  MASA_ORDEN_MARCHA:    [414, 6],  // kg
  MASA_MAX_TECNICA:     [420, 6],  // kg
  CAT_HOMOLOGACION_EU:  [426, 4],  // M1, N1, L3e, etc.
  CARROCERIA:           [430, 4],
  NIVEL_EMISION_EURO:   [437, 8],  // Euro 5, Euro 6d, etc.
  CONSUMO_WH_KM:        [445, 4],  // Wh/km (vehículos eléctricos)
  CAT_VEHICULO_EV:      [453, 4],  // categoría homologación EV
  AUTONOMIA_EV:         [457, 6],  // km (vehículos eléctricos)
  TIPO_ALIMENTACION:    [650, 1],  // tipo de alimentación (campo adicional)
};

function get(line, [start, len]) {
  return line.substring(start, start + len).trim();
}

function toInt(s)   { const n = parseInt(s,  10); return isNaN(n) ? null : n; }
function toFloat(s) { const n = parseFloat(s);    return isNaN(n) ? null : n; }

function parseFecha(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length < 8) return null;
  const d = ddmmyyyy.slice(0, 2);
  const m = ddmmyyyy.slice(2, 4);
  const y = ddmmyyyy.slice(4, 8);
  if (isNaN(+d) || isNaN(+m) || isNaN(+y) || +y < 1900) return null;
  return `${y}-${m}-${d}`;
}

// ─────────────────────────────────────────────────────────────────
// TABLAS DE CÓDIGOS
// ─────────────────────────────────────────────────────────────────

const PROPULSION = {
  '0': 'gasolina',
  '1': 'diesel',
  '2': 'electrico_bev',
  '3': 'otros',
  '4': 'butano',
  '5': 'solar',
  '6': 'glp',
  '7': 'gnc',
  '8': 'gnl',
  '9': 'hidrogeno',
  'A': 'biometano',
  'B': 'etanol',
  'C': 'biodiesel',
};

// Tipo de vehículo: código 2 dígitos → nombre
// Fuente: Tabla MATRABA DGT (VehicInputData.cs)
const TIPO_NOMBRE = {
  '03': 'ciclomotor',        '04': 'motocicleta',
  '05': 'motocarro',         '06': 'cuadricilo',
  '10': 'turismo',           '11': 'autobus',
  '12': 'autobus',           '13': 'autobus_articulado',
  '14': 'autobus_mixto',     '15': 'trolebus',
  '16': 'autobus_2_pisos',   '20': 'camion_ligero',
  '21': 'camion_medio',      '22': 'camion_pesado',
  '23': 'tractocamion',      '24': 'furgoneta',
  '25': 'furgon_medio',      '26': 'furgon_pesado',
  '30': 'derivado_turismo',  '31': 'vehiculo_mixto',
  '32': 'vehiculo_mixto',
  // 40 = turismo (código post-2015, reemplaza al 10 gradualmente)
  '40': 'turismo',
  '41': 'remolque_ligero',   '42': 'remolque',
  '43': 'semirremolque',     '44': 'semirremolque',
  // 50 = ciclomotor eléctrico/ligero (L1e-L2e), no tractor
  '50': 'ciclomotor',
  '51': 'maquinaria_agricola','52': 'maquinaria_agricola',
  '53': 'maquinaria_agricola','54': 'maquinaria_agricola',
  '55': 'maquinaria_agricola',
  '60': 'especial',          '61': 'especial',
  '62': 'especial',          '63': 'especial',
  '64': 'especial',          '65': 'especial',
  '66': 'quad_atv',          '70': 'militar',
  '80': 'tren_turistico',
};

// Agrupación para el dashboard
const TIPO_GRUPO = {
  'turismo':             'turismo',
  'derivado_turismo':    'turismo',
  'vehiculo_mixto':      'suv_todo_terreno',
  'furgoneta':           'furgoneta_van',
  'furgon_medio':        'furgoneta_van',
  'furgon_pesado':       'furgoneta_van',
  'camion_ligero':       'camion',
  'camion_medio':        'camion',
  'camion_pesado':       'camion',
  'tractocamion':        'camion',
  'autobus':             'autobus',
  'autobus_articulado':  'autobus',
  'autobus_mixto':       'autobus',
  'trolebus':            'autobus',
  'autobus_2_pisos':     'autobus',
  'motocicleta':         'moto',
  'ciclomotor':          'moto',
  'motocarro':           'moto',
  'cuadricilo':          'quad_atv',
  'quad_atv':            'quad_atv',
  'remolque_ligero':     'remolque',
  'remolque':            'remolque',
  'semirremolque':       'remolque',
  'tractor_agricola':    'agricola',
  'maquinaria_agricola': 'agricola',
  'especial':            'especial',
  'militar':             'otros',
  'tren_turistico':      'otros',
};

const PROVINCIAS = {
  '01': 'Álava',          '02': 'Albacete',        '03': 'Alicante',
  '04': 'Almería',        '05': 'Ávila',            '06': 'Badajoz',
  '07': 'Baleares',       '08': 'Barcelona',        '09': 'Burgos',
  '10': 'Cáceres',        '11': 'Cádiz',            '12': 'Castellón',
  '13': 'Ciudad Real',    '14': 'Córdoba',          '15': 'A Coruña',
  '16': 'Cuenca',         '17': 'Girona',           '18': 'Granada',
  '19': 'Guadalajara',    '20': 'Guipúzcoa',        '21': 'Huelva',
  '22': 'Huesca',         '23': 'Jaén',             '24': 'León',
  '25': 'Lleida',         '26': 'La Rioja',         '27': 'Lugo',
  '28': 'Madrid',         '29': 'Málaga',           '30': 'Murcia',
  '31': 'Navarra',        '32': 'Ourense',          '33': 'Asturias',
  '34': 'Palencia',       '35': 'Las Palmas',       '36': 'Pontevedra',
  '37': 'Salamanca',      '38': 'S.C. Tenerife',    '39': 'Cantabria',
  '40': 'Segovia',        '41': 'Sevilla',          '42': 'Soria',
  '43': 'Tarragona',      '44': 'Teruel',           '45': 'Toledo',
  '46': 'Valencia',       '47': 'Valladolid',       '48': 'Bizkaia',
  '49': 'Zamora',         '50': 'Zaragoza',         '51': 'Ceuta',
  '52': 'Melilla',
};

// ─────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DE LA BASE DE DATOS
// ─────────────────────────────────────────────────────────────────

function openDb() {
  const db = new Database(DB_FILE);

  // Optimizaciones de rendimiento para inserciones masivas
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 268435456');  // 256 MB mmap

  db.exec(`
    CREATE TABLE IF NOT EXISTS matriculaciones (
      -- Identificación temporal
      periodo                TEXT    NOT NULL,  -- "2025-03"
      año                    INTEGER NOT NULL,
      mes                    INTEGER NOT NULL,
      fecha                  TEXT,              -- "YYYY-MM-DD"

      -- Vehículo
      marca                  TEXT,
      modelo                 TEXT,
      fabricante             TEXT,
      cod_tipo               TEXT,              -- código original 2 dígitos
      tipo_vehiculo          TEXT,              -- nombre derivado
      tipo_grupo             TEXT,              -- agrupación dashboard

      -- Propulsión
      cod_propulsion         TEXT,              -- código original (0,1,2,...)
      combustible            TEXT,              -- nombre: gasolina, diesel, bev...
      cilindrada             INTEGER,           -- cm³
      potencia_cv            REAL,              -- CV (potencia fiscal)
      kw                     REAL,              -- kW (ITV)
      co2                    INTEGER,           -- g/km
      nivel_euro             TEXT,              -- "Euro 6d", "Euro 5", etc.
      tipo_alimentacion      TEXT,

      -- Vehículo eléctrico
      cat_vehiculo_ev        TEXT,
      autonomia_ev           INTEGER,           -- km
      consumo_wh_km          REAL,              -- Wh/km

      -- Dimensiones / masa
      tara                   INTEGER,           -- kg
      peso_max               INTEGER,           -- kg
      masa_orden_marcha      INTEGER,           -- kg
      masa_max_tecnica       INTEGER,           -- kg

      -- Plazas
      num_plazas             INTEGER,
      num_plazas_max         INTEGER,

      -- Carrocería / homologación
      carroceria             TEXT,
      cat_homologacion_eu    TEXT,              -- M1, N1, L3e, etc.

      -- Matrícula
      ind_nuevo_usado        TEXT,              -- N / U
      clase_matricula        TEXT,
      persona_fisica_jur     TEXT,              -- F / J
      servicio               TEXT,

      -- Primera matriculación (si es vehículo de importación/usado)
      fecha_prim_matriculac  TEXT,

      -- Localización
      cod_provincia_mat      TEXT,              -- código INE 2 dígitos
      provincia_mat          TEXT,
      cod_provincia_veh      TEXT,
      provincia_veh          TEXT,
      municipio              TEXT,
      codigo_postal          TEXT,

      -- Renting
      renting                TEXT               -- S / N
    );

    CREATE TABLE IF NOT EXISTS meses_procesados (
      periodo         TEXT    PRIMARY KEY,
      año             INTEGER NOT NULL,
      mes             INTEGER NOT NULL,
      total_registros INTEGER NOT NULL,
      procesado_en    TEXT    NOT NULL
    );

    -- Índices para consultas frecuentes del dashboard
    CREATE INDEX IF NOT EXISTS idx_mat_periodo    ON matriculaciones(periodo);
    CREATE INDEX IF NOT EXISTS idx_mat_combustible ON matriculaciones(combustible);
    CREATE INDEX IF NOT EXISTS idx_mat_tipo_grupo  ON matriculaciones(tipo_grupo);
    CREATE INDEX IF NOT EXISTS idx_mat_provincia   ON matriculaciones(cod_provincia_mat);
    CREATE INDEX IF NOT EXISTS idx_mat_marca       ON matriculaciones(marca);
    CREATE INDEX IF NOT EXISTS idx_mat_nuevo_usado ON matriculaciones(ind_nuevo_usado);
    CREATE INDEX IF NOT EXISTS idx_mat_año         ON matriculaciones(año);
  `);

  return db;
}

// ─────────────────────────────────────────────────────────────────
// DESCARGA
// ─────────────────────────────────────────────────────────────────

async function downloadZip(url, destPath) {
  console.log(`  ↓ ${url}`);
  const resp = await fetch(url);
  if (resp.status === 404) return false;
  if (!resp.ok) throw new Error(`HTTP ${resp.status} descargando ${url}`);

  const writer = createWriteStream(destPath);
  for await (const chunk of resp.body) writer.write(chunk);
  await new Promise((res, rej) => writer.end(err => err ? rej(err) : res()));
  return true;
}

// ─────────────────────────────────────────────────────────────────
// EXTRACCIÓN ZIP
// ─────────────────────────────────────────────────────────────────

async function extractZip(zipPath, destDir) {
  await mkdir(destDir, { recursive: true });
  try {
    await execAsync(`tar -xf "${zipPath}" -C "${destDir}"`);
  } catch {
    try {
      await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
    } catch {
      await execAsync(
        `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`
      );
    }
  }

  // Buscar el fichero de datos recursivamente (la DGT a veces mete el fichero
  // dentro de una subcarpeta, o sin extensión)
  function findDataFile(dir) {
    const entries = readdirSync(dir);
    // Primero buscar ficheros con extensión conocida
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isFile() && /\.(txt|csv|dat)$/i.test(entry)) return full;
    }
    // Si no, buscar cualquier fichero (no oculto)
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isFile() && !entry.startsWith('.')) return full;
    }
    // Buscar en subdirectorios
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        const found = findDataFile(full);
        if (found) return found;
      }
    }
    return null;
  }

  const dataFilePath = findDataFile(destDir);
  if (!dataFilePath)
    throw new Error(`No se encontró fichero de datos en ${destDir}`);
  return dataFilePath;
}

// ─────────────────────────────────────────────────────────────────
// PARSEO E INSERCIÓN EN SQLITE
// ─────────────────────────────────────────────────────────────────

async function parsearEInsertar(filePath, periodo, db) {
  console.log(`  ⚙️  Parseando e insertando ${filePath}...`);

  const [year, month] = periodo.split('-').map(Number);

  const insertStmt = db.prepare(`
    INSERT INTO matriculaciones (
      periodo, año, mes, fecha,
      marca, modelo, fabricante,
      cod_tipo, tipo_vehiculo, tipo_grupo,
      cod_propulsion, combustible, cilindrada, potencia_cv, kw, co2,
      nivel_euro, tipo_alimentacion,
      cat_vehiculo_ev, autonomia_ev, consumo_wh_km,
      tara, peso_max, masa_orden_marcha, masa_max_tecnica,
      num_plazas, num_plazas_max,
      carroceria, cat_homologacion_eu,
      ind_nuevo_usado, clase_matricula, persona_fisica_jur, servicio,
      fecha_prim_matriculac,
      cod_provincia_mat, provincia_mat, cod_provincia_veh, provincia_veh,
      municipio, codigo_postal, renting
    ) VALUES (
      @periodo, @año, @mes, @fecha,
      @marca, @modelo, @fabricante,
      @cod_tipo, @tipo_vehiculo, @tipo_grupo,
      @cod_propulsion, @combustible, @cilindrada, @potencia_cv, @kw, @co2,
      @nivel_euro, @tipo_alimentacion,
      @cat_vehiculo_ev, @autonomia_ev, @consumo_wh_km,
      @tara, @peso_max, @masa_orden_marcha, @masa_max_tecnica,
      @num_plazas, @num_plazas_max,
      @carroceria, @cat_homologacion_eu,
      @ind_nuevo_usado, @clase_matricula, @persona_fisica_jur, @servicio,
      @fecha_prim_matriculac,
      @cod_provincia_mat, @provincia_mat, @cod_provincia_veh, @provincia_veh,
      @municipio, @codigo_postal, @renting
    )
  `);

  // Inserciones en lotes dentro de una transacción por batch (muy rápido)
  const insertBatch = db.transaction((records) => {
    for (const r of records) insertStmt.run(r);
  });

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let totalInserted = 0;
  let batch = [];
  const BATCH_SIZE = 10_000;
  const unknownTypes = new Set();

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue;   // cabecera
    if (line.length < 100) continue;

    const codTipo       = get(line, F.COD_TIPO);
    const codPropulsion = get(line, F.COD_PROPULSION).toUpperCase();
    const codProvMat    = get(line, F.COD_PROVINCIA_MAT);
    const codProvVeh    = get(line, F.COD_PROVINCIA_VEH);
    const tipoVehiculo  = TIPO_NOMBRE[codTipo];
    if (!tipoVehiculo && codTipo) unknownTypes.add(codTipo);

    batch.push({
      periodo,
      año:   year,
      mes:   month,
      fecha: parseFecha(get(line, F.FEC_MATRICULA)),

      marca:      get(line, F.MARCA_ITV).toUpperCase().replace(/\s+/g, ' ') || null,
      modelo:     get(line, F.MODELO_ITV) || null,
      fabricante: get(line, F.FABRICANTE_ITV) || null,

      cod_tipo:      codTipo || null,
      tipo_vehiculo: tipoVehiculo || null,
      tipo_grupo:    TIPO_GRUPO[tipoVehiculo] ?? 'otros',

      cod_propulsion:   codPropulsion || null,
      combustible:      PROPULSION[codPropulsion] ?? 'otros',
      cilindrada:       toInt(get(line, F.CILINDRADA_ITV)),
      potencia_cv:      toFloat(get(line, F.POTENCIA_ITV)),
      kw:               toFloat(get(line, F.KW_ITV)),
      co2:              toInt(get(line, F.CO2_ITV)),
      nivel_euro:       get(line, F.NIVEL_EMISION_EURO) || null,
      tipo_alimentacion: get(line, F.TIPO_ALIMENTACION) || null,

      cat_vehiculo_ev:  get(line, F.CAT_VEHICULO_EV) || null,
      autonomia_ev:     toInt(get(line, F.AUTONOMIA_EV)),
      consumo_wh_km:    toFloat(get(line, F.CONSUMO_WH_KM)),

      tara:               toInt(get(line, F.TARA)),
      peso_max:           toInt(get(line, F.PESO_MAX)),
      masa_orden_marcha:  toInt(get(line, F.MASA_ORDEN_MARCHA)),
      masa_max_tecnica:   toInt(get(line, F.MASA_MAX_TECNICA)),

      num_plazas:     toInt(get(line, F.NUM_PLAZAS_ITV)),
      num_plazas_max: toInt(get(line, F.NUM_PLAZAS_MAX)),

      carroceria:         get(line, F.CARROCERIA) || null,
      cat_homologacion_eu: get(line, F.CAT_HOMOLOGACION_EU) || null,

      ind_nuevo_usado:    get(line, F.IND_NUEVO_USADO).toUpperCase() || null,
      clase_matricula:    get(line, F.COD_CLASE_MAT) || null,
      persona_fisica_jur: get(line, F.PERSONA_FIS_JUR).toUpperCase() || null,
      servicio:           get(line, F.SERVICIO) || null,

      fecha_prim_matriculac: parseFecha(get(line, F.FEC_PRIM_MATRICULAC)),

      cod_provincia_mat: codProvMat || null,
      provincia_mat:     PROVINCIAS[codProvMat] ?? null,
      cod_provincia_veh: codProvVeh || null,
      provincia_veh:     PROVINCIAS[codProvVeh] ?? null,
      municipio:         get(line, F.MUNICIPIO) || null,
      codigo_postal:     get(line, F.CODIGO_POSTAL) || null,

      renting: get(line, F.RENTING) || null,
    });

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      totalInserted += batch.length;
      batch = [];
      process.stdout.write(`    ${totalInserted.toLocaleString()} insertados...\r`);
    }
  }

  // Último batch
  if (batch.length) {
    insertBatch(batch);
    totalInserted += batch.length;
  }

  console.log(`\n    ✓ ${totalInserted.toLocaleString()} registros insertados`);

  if (unknownTypes.size > 0) {
    console.log(`    ⚠️  Códigos de tipo desconocidos (clasificados como "otros"): ${[...unknownTypes].join(', ')}`);
    console.log(`       → si son relevantes, añadir a TIPO_NOMBRE en el script`);
  }

  // Registrar mes como procesado
  db.prepare(`
    INSERT OR REPLACE INTO meses_procesados (periodo, año, mes, total_registros, procesado_en)
    VALUES (?, ?, ?, ?, ?)
  `).run(periodo, year, month, totalInserted, new Date().toISOString());

  return totalInserted;
}

// ─────────────────────────────────────────────────────────────────
// GENERACIÓN DE AGREGACIONES PARA EL DASHBOARD
// Consulta la DB y genera JSON + TypeScript
// ─────────────────────────────────────────────────────────────────

function generarAgregaciones(db) {
  console.log('\n📊 Generando agregaciones desde la DB...');

  const periodos = db.prepare(`
    SELECT periodo, año, mes, total_registros
    FROM meses_procesados
    ORDER BY periodo
  `).all();

  // Statements reutilizables
  const stmtTotales = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ind_nuevo_usado = 'N' THEN 1 ELSE 0 END) as nuevos,
      SUM(CASE WHEN ind_nuevo_usado = 'U' THEN 1 ELSE 0 END) as usados
    FROM matriculaciones WHERE periodo = ?
  `);

  const stmtCombustible = db.prepare(`
    SELECT combustible, COUNT(*) as total
    FROM matriculaciones
    WHERE periodo = ? AND combustible IS NOT NULL
    GROUP BY combustible
    ORDER BY total DESC
  `);

  const stmtTipo = db.prepare(`
    SELECT tipo_grupo, COUNT(*) as total
    FROM matriculaciones
    WHERE periodo = ?
    GROUP BY tipo_grupo
    ORDER BY total DESC
  `);

  const stmtProvincia = db.prepare(`
    SELECT cod_provincia_mat, provincia_mat, COUNT(*) as total
    FROM matriculaciones
    WHERE periodo = ? AND provincia_mat IS NOT NULL
    GROUP BY cod_provincia_mat, provincia_mat
    ORDER BY total DESC
  `);

  const stmtMarcas = db.prepare(`
    SELECT marca, COUNT(*) as total
    FROM matriculaciones
    WHERE periodo = ? AND marca IS NOT NULL
    GROUP BY marca
    ORDER BY total DESC
  `);

  const stmtCatEv = db.prepare(`
    SELECT cat_vehiculo_ev, COUNT(*) as total
    FROM matriculaciones
    WHERE periodo = ? AND cat_vehiculo_ev IS NOT NULL AND cat_vehiculo_ev != '0'
    GROUP BY cat_vehiculo_ev
    ORDER BY total DESC
  `);

  const meses = periodos.map(({ periodo, año, mes }, i) => {
    process.stdout.write(`  Agregando ${periodo} (${i + 1}/${periodos.length})...\r`);

    const totales   = stmtTotales.get(periodo);
    const combustible = Object.fromEntries(
      stmtCombustible.all(periodo).map(r => [r.combustible, r.total])
    );
    const tipo = Object.fromEntries(
      stmtTipo.all(periodo).map(r => [r.tipo_grupo, r.total])
    );
    const por_provincia = Object.fromEntries(
      stmtProvincia.all(periodo).map(r => [
        r.cod_provincia_mat,
        { nombre: r.provincia_mat, total: r.total }
      ])
    );
    const marcas = stmtMarcas.all(periodo).map(r => ({
      marca: r.marca,
      total: r.total,
    }));

    const por_cat_ev = Object.fromEntries(
      stmtCatEv.all(periodo).map(r => [r.cat_vehiculo_ev, r.total])
    );

    return {
      periodo,
      año,
      mes,
      total:  totales.total,
      nuevos: totales.nuevos,
      usados: totales.usados,
      por_combustible: combustible,
      por_tipo:        tipo,
      por_cat_ev,
      por_provincia,
      marcas,   // TODAS las marcas, sin límite
    };
  });

  console.log(`\n  ✓ ${meses.length} meses agregados`);
  return meses;
}

// ─────────────────────────────────────────────────────────────────
// ESCRITURA DE ARCHIVOS DE SALIDA
// ─────────────────────────────────────────────────────────────────

function guardarJson(meses) {
  if (DRY_RUN) { console.log('  [DRY RUN] JSON no escrito'); return; }
  const payload = {
    meta: {
      fuente: 'DGT - Microdatos de Matriculaciones Mensuales (MATRABA)',
      url_patron: 'https://www.dgt.es/microdatos/salida/{year}/{month}/vehiculos/matriculaciones/export_mensual_mat_{YYYYMM}.zip',
      disponible_desde: '2014-12',
      ultima_actualizacion: new Date().toISOString().slice(0, 10),
      total_meses: meses.length,
    },
    meses,
  };
  writeFileSync(JSON_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`  💾 Guardado: data/dgt-matriculaciones.json (${meses.length} meses)`);
}

function generarTs(meses) {
  if (DRY_RUN) { console.log('  [DRY RUN] TypeScript no escrito'); return; }
  const hoy = new Date().toISOString().slice(0, 10);

  const ts = `// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────
// Genera: node scripts/dgt-matriculaciones.mjs
// Fuente: DGT - Microdatos de Matriculaciones Mensuales (MATRABA)
// Última actualización: ${hoy}
// ⚠️  No editar manualmente
// ────────────────────────────────────────────────────────────────────────────

export type CombustibleDGT = {
  gasolina?:       number;
  diesel?:         number;
  electrico_bev?:  number;
  glp?:            number;
  gnc?:            number;
  gnl?:            number;
  hidrogeno?:      number;
  biometano?:      number;
  etanol?:         number;
  biodiesel?:      number;
  solar?:          number;
  butano?:         number;
  otros?:          number;
};

export type TipoVehiculoDGT = {
  turismo?:          number;
  suv_todo_terreno?: number;
  furgoneta_van?:    number;
  camion?:           number;
  autobus?:          number;
  moto?:             number;
  quad_atv?:         number;
  remolque?:         number;
  agricola?:         number;
  especial?:         number;
  otros?:            number;
};

export type ProvinciaDGT = { nombre: string; total: number };

export type MarcaDGT = { marca: string; total: number };

export type CatEvDGT = {
  BEV?:  number;   // Eléctrico puro (batería)
  PHEV?: number;   // Híbrido enchufable
  HEV?:  number;   // Híbrido no enchufable
  REEV?: number;   // Eléctrico con autonomía extendida
  FCEV?: number;   // Pila de combustible (hidrógeno)
  [key: string]: number | undefined;  // otros códigos residuales
};

export type MesDGT = {
  periodo:         string;                       // "YYYY-MM"
  año:             number;
  mes:             number;
  total:           number;
  nuevos:          number;
  usados:          number;
  por_combustible: CombustibleDGT;
  por_tipo:        TipoVehiculoDGT;
  por_cat_ev:      CatEvDGT;
  por_provincia:   Record<string, ProvinciaDGT>;
  marcas:          MarcaDGT[];                   // todas las marcas
};

export const dgtMeta = {
  fuente:               "DGT - Microdatos de Matriculaciones Mensuales (MATRABA)",
  url_patron:           "https://www.dgt.es/microdatos/salida/{year}/{month}/vehiculos/matriculaciones/export_mensual_mat_{YYYYMM}.zip",
  disponible_desde:     "2014-12",
  ultima_actualizacion: "${hoy}",
} as const;

export const dgtMeses: MesDGT[] = ${JSON.stringify(meses, null, 2)};

// ─── Utilidades ─────────────────────────────────────────────────────────────

export function getDgtAnual(año: number): MesDGT[] {
  return dgtMeses.filter(m => m.año === año);
}

export function getDgtTotalAnual(año: number): number {
  return getDgtAnual(año).reduce((s, m) => s + m.total, 0);
}

export function getDgtUltimoMes(): MesDGT | null {
  return dgtMeses.at(-1) ?? null;
}

export const dgtAñosDisponibles: number[] =
  [...new Set(dgtMeses.map(m => m.año))].sort((a, b) => a - b);
`;

  writeFileSync(TS_FILE, ts, 'utf8');
  console.log(`  💾 Generado: app/lib/insights/dgt-data.ts`);
}

// ─────────────────────────────────────────────────────────────────
// PROCESAR UN MES COMPLETO
// ─────────────────────────────────────────────────────────────────

async function procesarMes(year, month, db) {
  const periodo = `${year}-${String(month).padStart(2, '0')}`;

  const yaExiste = db.prepare('SELECT 1 FROM meses_procesados WHERE periodo = ?').get(periodo);
  if (yaExiste) {
    console.log(`  ⏩ ${periodo} ya está en la DB, saltando`);
    return false;
  }

  console.log(`\n📅 ${periodo}...`);

  const zipPath    = join(TEMP_DIR, `mat_${periodo}.zip`);
  const extractDir = join(TEMP_DIR, `mat_${periodo}`);

  try {
    await mkdir(TEMP_DIR, { recursive: true });

    const downloaded = await downloadZip(dgtUrl(year, month), zipPath);
    if (!downloaded) {
      console.log(`  ⚠️  ${periodo} no disponible todavía en la DGT`);
      return false;
    }

    const txtFile = await extractZip(zipPath, extractDir);
    await parsearEInsertar(txtFile, periodo, db);
    return true;

  } finally {
    await rm(zipPath,    { force: true }).catch(() => {});
    await rm(extractDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

async function main() {
  const db = openDb();
  let hayNuevos = false;

  if (SOLO_AGREGAR) {
    // ── Solo regenerar JSON/TS desde la DB ya existente ─────────
    console.log('🔄 Modo --solo-agregar: regenerando archivos desde la DB...');

  } else if (SPECIFIC_MES) {
    // ── Mes específico: --mes=YYYY-MM ────────────────────────────
    const [year, month] = SPECIFIC_MES.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      console.error('❌ Formato inválido. Usa --mes=YYYY-MM (ej: --mes=2025-03)');
      process.exit(1);
    }
    hayNuevos = await procesarMes(year, month, db);

  } else if (DO_INIT) {
    // ── Histórico completo ───────────────────────────────────────
    const total = db.prepare('SELECT COUNT(*) as n FROM meses_procesados').get().n;
    console.log(`🚀 Modo --init: dic 2014 → hoy`);
    console.log(`   Meses ya en DB: ${total}`);
    console.log(`   Estimado: ~5-8 GB descarga, 1-2 horas total\n`);

    const now = new Date();
    let y = ORIGIN.year, m = ORIGIN.month;

    while (
      y < now.getFullYear() ||
      (y === now.getFullYear() && m <= now.getMonth() + 1)
    ) {
      const result = await procesarMes(y, m, db);
      if (result) hayNuevos = true;
      m++;
      if (m > 12) { m = 1; y++; }
    }

  } else {
    // ── Modo por defecto: último mes disponible ──────────────────
    // La DGT publica el mes N con ~1-2 meses de retraso
    const now = new Date();
    let encontrado = false;

    for (let delta = 3; delta >= 1 && !encontrado; delta--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - delta, 1);
      const y  = d.getFullYear();
      const mo = d.getMonth() + 1;
      const periodo = `${y}-${String(mo).padStart(2, '0')}`;

      const yaExiste = db.prepare('SELECT 1 FROM meses_procesados WHERE periodo = ?').get(periodo);
      if (!yaExiste) {
        const result = await procesarMes(y, mo, db);
        if (result) { hayNuevos = true; encontrado = true; }
      } else {
        encontrado = true;
        console.log(`✅ Ya actualizado hasta ${periodo}`);
      }
    }
  }

  // Regenerar JSON y TS si hay datos nuevos o se pidió explícitamente
  if (hayNuevos || SOLO_AGREGAR) {
    const meses = generarAgregaciones(db);
    guardarJson(meses);
    generarTs(meses);
    const total = db.prepare('SELECT COUNT(*) as n FROM matriculaciones').get().n;
    console.log(`\n✅ Listo.`);
    console.log(`   Registros en DB: ${total.toLocaleString()}`);
    console.log(`   Meses disponibles: ${meses.length}`);
  }

  db.close();
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
