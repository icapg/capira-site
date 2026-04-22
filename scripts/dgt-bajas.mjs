/**
 * DGT Bajas — Downloader, Procesador y Generador
 *
 * Descarga microdatos mensuales de BAJAS de vehículos de la DGT
 * (mismo formato MATRABA que matriculaciones, 714 chars/registro)
 * y almacena TODOS los registros en la misma DB SQLite.
 *
 * Fuente oficial:
 *   https://www.dgt.es/menusecundario/dgt-en-cifras/matraba-listados/bajas-automoviles-mensual.html
 *
 * Uso:
 *   node scripts/dgt-bajas.mjs                  → último mes disponible
 *   node scripts/dgt-bajas.mjs --mes=2025-03    → mes específico
 *   node scripts/dgt-bajas.mjs --init           → histórico completo (dic 2014 → hoy)
 *   node scripts/dgt-bajas.mjs --solo-agregar   → regenera JSON/TS desde la DB
 *   node scripts/dgt-bajas.mjs --dry-run        → sin escribir nada
 *
 * Genera/actualiza:
 *   data/dgt-matriculaciones.db   — misma DB, nueva tabla "bajas"
 *   data/dgt-bajas.json           — agregaciones mensuales
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

const DB_FILE        = join(ROOT, 'data', 'dgt-matriculaciones.db');  // misma DB
const JSON_FILE_BAJAS = join(ROOT, 'data', 'dgt-bajas.json');
const TEMP_DIR       = join(tmpdir(), 'dgt-bajas-tmp');

const DRY_RUN      = process.argv.includes('--dry-run');
const DO_INIT      = process.argv.includes('--init');
const SOLO_AGREGAR = process.argv.includes('--solo-agregar');
const MES_ARG      = process.argv.find(a => a.startsWith('--mes='));
const SPECIFIC_MES = MES_ARG ? MES_ARG.split('=')[1] : null;

const ORIGIN = { year: 2014, month: 12 };

// URL bajas: mismo patrón que matriculaciones pero con "bajas" y "bajas" en el nombre
const dgtUrlBajas = (year, month) =>
  `https://www.dgt.es/microdatos/salida/${year}/${month}/vehiculos/bajas/export_mensual_bajas_${year}${String(month).padStart(2, '0')}.zip`;

// ─────────────────────────────────────────────────────────────────
// CAMPOS (mismos offsets que matriculaciones — formato MATRABA)
// Para bajas:
//   FEC_MATRICULA [0,8]   = fecha de BAJA (DDMMYYYY)
//   CLAVE_TRAMITE [156,1] = motivo de baja
// ─────────────────────────────────────────────────────────────────

const F = {
  FEC_BAJA:             [0,   8],  // DDMMYYYY — fecha de la baja
  MARCA_ITV:            [17, 30],
  MODELO_ITV:           [47, 22],
  COD_TIPO:             [91,  2],
  COD_PROPULSION:       [93,  1],
  CILINDRADA_ITV:       [94,  5],
  POTENCIA_ITV:         [99,  6],
  TARA:                 [105, 6],
  PESO_MAX:             [111, 6],
  NUM_PLAZAS_ITV:       [117, 3],
  COD_PROVINCIA_VEH:    [152, 2],
  COD_PROVINCIA_MAT:    [154, 2],
  MOTIVO_BAJA:          [156, 1],  // ClaveTramite = motivo de baja
  FEC_PRIM_MATRICULAC:  [170, 8],  // fecha primera matriculación original
  PERSONA_FIS_JUR:      [179, 1],
  SERVICIO:             [189, 3],
  MUNICIPIO:            [197, 30],
  KW_ITV:               [227, 7],
  CO2_ITV:              [237, 5],
  FABRICANTE_ITV:       [344, 70],
  CAT_HOMOLOGACION_EU:  [426, 4],
  CARROCERIA:           [430, 4],
  NIVEL_EMISION_EURO:   [437, 8],
  CAT_VEHICULO_EV:      [453, 4],
  AUTONOMIA_EV:         [457, 6],
};

function get(line, [start, len]) {
  return line.substring(start, start + len).trim();
}
function toInt(s)   { const n = parseInt(s,  10); return isNaN(n) ? null : n; }
function toFloat(s) { const n = parseFloat(s);    return isNaN(n) ? null : n; }
function parseFecha(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length < 8) return null;
  const d = ddmmyyyy.slice(0, 2), m = ddmmyyyy.slice(2, 4), y = ddmmyyyy.slice(4, 8);
  if (isNaN(+d) || isNaN(+m) || isNaN(+y) || +y < 1900) return null;
  return `${y}-${m}-${d}`;
}

// ─────────────────────────────────────────────────────────────────
// TABLAS DE CÓDIGOS
// ─────────────────────────────────────────────────────────────────

const MOTIVO_BAJA = {
  '0': 'desguace',
  '1': 'agotamiento',
  '2': 'antiguedad',
  '3': 'renovacion_parque',
  '4': 'otros',
  '5': 'plan_renove',
  '7': 'voluntaria',
  '8': 'exportacion',
  '9': 'transito_comunitario',
  'A': 'abandono_oficio',
  'B': 'seguridad_oficio',
  'C': 'tratamiento_residual',
};

const PROPULSION = {
  '0': 'gasolina',   '1': 'diesel',        '2': 'electrico_bev',
  '3': 'otros',      '4': 'butano',        '5': 'solar',
  '6': 'glp',        '7': 'gnc',           '8': 'gnl',
  '9': 'hidrogeno',  'A': 'biometano',     'B': 'etanol',
  'C': 'biodiesel',
};

const TIPO_NOMBRE = {
  '03': 'ciclomotor',        '04': 'motocicleta',      '05': 'motocarro',
  // cod_tipo '06' (spec: cuadricilo) contiene camiones antiguos. Solo va a
  // microcar si la marca está en la whitelist. Ver nota en dgt-matriculaciones.mjs.
  '06': 'camion_ligero',     '10': 'turismo',           '11': 'autobus',
  '12': 'autobus',           '13': 'autobus_articulado','14': 'autobus_mixto',
  '15': 'trolebus',          '16': 'autobus_2_pisos',   '20': 'camion_ligero',
  '21': 'camion_medio',      '22': 'camion_pesado',     '23': 'tractocamion',
  '24': 'furgoneta',         '25': 'furgon_medio',      '26': 'furgon_pesado',
  // '30' en MATRABA → autobús (ver nota en dgt-matriculaciones.mjs)
  // Subtipos 31/32 → autobuses articulados (spec "vehículo mixto" es inexacta).
  // Auditoría 2026-04-22.
  '30': 'autobus',           '31': 'autobus_articulado','32': 'autobus_articulado',
  '40': 'remolque_ligero',   '41': 'remolque',          '42': 'remolque',
  '43': 'semirremolque',     '44': 'semirremolque',     '50': 'tractor_agricola',
  // Subtipos 51-55 spec "maq. agrícola" pero en data son motos/triciclos/quads.
  // Auditoría 2026-04-22. Override trimoto por marca+modelo abajo.
  '51': 'ciclomotor',        '52': 'ciclomotor',        '53': 'motocarro',
  '54': 'quad_atv',          '55': 'ciclomotor',        '60': 'especial',
  '61': 'especial',          '62': 'especial',          '63': 'especial',
  '64': 'especial',          '65': 'especial',          '66': 'quad_atv',
  '70': 'quad_atv',          '80': 'tren_turistico',    '81': 'autocaravana',
  '82': 'autocaravana',      '90': 'ciclomotor',        '91': 'ciclomotor',
  '92': 'motocarro',
  // Subtipos alfanuméricos N1/M1 no documentados en spec pero presentes en datos:
  '0G': 'furgoneta',         '02': 'camion_ligero',     '00': 'camion_ligero',
  '07': 'camion_ligero',     '0A': 'camion_ligero',     '7A': 'autocaravana',
  // Camiones industriales (auditoría 2026-04-21). Split MMA decide VCL vs industrial.
  '01': 'camion_medio',      '08': 'camion_medio',      '09': 'camion_medio',
  '0B': 'camion_ligero',     '0C': 'camion_pesado',     '0D': 'camion_pesado',
  '0E': 'camion_ligero',     '0F': 'camion_pesado',     '1A': 'camion_ligero',
  '1C': 'camion_pesado',     '1D': 'camion_medio',      '1E': 'camion_medio',
  '1F': 'camion_medio',      '72': 'camion_medio',      '74': 'camion_pesado',
  // Familia 8x: tractocamiones N3. Familia 7x mix: camiones especiales vs maquinaria.
  '7C': 'camion_pesado',     '7E': 'camion_pesado',     '7F': 'camion_medio',
  '71': 'especial',          '73': 'especial',          '7B': 'especial',
  '7D': 'especial',          '7J': 'especial',
  // Semirremolques alfanuméricos adicionales.
  's3': 'semirremolque',     'SC': 'semirremolque',     'RC': 'remolque',
  'R0': 'remolque_ligero',   'R1': 'remolque_ligero',   'R2': 'remolque_ligero',
  'R3': 'remolque_ligero',   'R5': 'remolque_ligero',   'R6': 'remolque_ligero',
  'R7': 'remolque_ligero',   'RA': 'remolque_ligero',   'RD': 'remolque_ligero',
  'S0': 'semirremolque',     'S1': 'semirremolque',     'S2': 'semirremolque',
  'S3': 'semirremolque',     'S5': 'semirremolque',     'S6': 'semirremolque',
  'S7': 'semirremolque',     'S9': 'semirremolque',     'SA': 'semirremolque',
  'SD': 'semirremolque',
};

const MICROCAR_MARCAS = new Set([
  'AIXAM','MICROCAR','LIGIER','CHATENET','BELLIER','GRECAV','CASALINI','ESTRIMA',
  'GOUPIL','JDM','J.D.M.','MEGA','MINAUTO','SECMA','ITALCAR','TAZZARI','DUE','CLUB CAR',
]);

// Marcas de maquinaria industrial/construcción (override para subtipo '70').
const MAQUINARIA_MARCAS = new Set([
  'JCB','MANITOU','CASE','CATERPILLAR','BOBCAT','KOMATSU',
  'LIEBHERR','MERLO','LINDE','AUSA','CNH','HYSTER','STILL','JUNGHEINRICH',
  'DOOSAN','TAKEUCHI','KRAMER','VOLVO CE','WACKER NEUSON','SANDVIK',
]);

// Marcas de tractor agrícola (whitelist). Ver nota en dgt-parque-import.mjs.
const TRACTOR_MARCAS = new Set([
  'JOHN DEERE','NEW HOLLAND','KUBOTA','CASE IH','FENDT','MASSEY FERGUSON',
  'DEUTZ-FAHR','CLAAS','VALTRA','LANDINI','MCCORMICK','ZETOR','STEYR','SAME',
  'DEUTZ','AGCO','SAMPO','URSUS','PASQUALI','BCS','GOLDONI','CARRARO',
  'ANTONIO CARRARO','ARBOS','LAMBORGHINI','LINDNER','HURLIMANN',
]);

const TIPO_GRUPO = {
  'turismo': 'turismo', 'derivado_turismo': 'turismo',
  'furgoneta': 'furgoneta_van', 'furgon_medio': 'furgoneta_van', 'furgon_pesado': 'furgoneta_van',
  'camion_ligero': 'camion', 'camion_medio': 'camion', 'camion_pesado': 'camion', 'tractocamion': 'camion',
  'autobus': 'autobus', 'autobus_articulado': 'autobus', 'autobus_mixto': 'autobus',
  'trolebus': 'autobus', 'autobus_2_pisos': 'autobus',
  'motocicleta': 'moto', 'ciclomotor': 'moto', 'motocarro': 'moto',
  'trimoto': 'trimoto',
  'cuadricilo': 'microcar', 'microcar': 'microcar', 'quad_atv': 'quad_atv',
  'remolque_ligero': 'remolque', 'remolque': 'remolque', 'semirremolque': 'remolque',
  'tractor_agricola': 'agricola', 'maquinaria_agricola': 'agricola',
  'especial': 'especial', 'autocaravana': 'furgoneta_van',
  'militar': 'otros', 'tren_turistico': 'otros',
};

// Trimotos: scooters/motos 3 ruedas por marca+modelo. Auditoría 2026-04-22.
function esTrimoto(marca, modelo) {
  if (!marca || !modelo) return false;
  if (marca === 'QUADRO' || marca === 'REWACO') return true;
  if (marca === 'PIAGGIO' && /^MP3\b/.test(modelo)) return true;
  if (marca === 'GILERA' && /\bFUOCO\b/.test(modelo)) return true;
  if (marca === 'PEUGEOT' && /\bMETROPOLIS\b/.test(modelo)) return true;
  if (marca === 'KYMCO' && /^CV3\b/.test(modelo)) return true;
  if (marca === 'YAMAHA' && /^(MWD|MWS|MW|TRICITY|NIKEN)/.test(modelo)) return true;
  if (marca === 'CAN-AM' && /\b(SPYDER|RYKER)\b/.test(modelo)) return true;
  if (marca === 'HARLEY-DAVIDSON' && /\b(TRI GLIDE|FREEWHEELER)\b/.test(modelo)) return true;
  if (/\b(TRIKE|TRICICLO|MOTOTRIKE)\b/.test(modelo)) return true;
  return false;
}

const PROVINCIAS = {
  '01': 'Álava',       '02': 'Albacete',    '03': 'Alicante',    '04': 'Almería',
  '05': 'Ávila',       '06': 'Badajoz',     '07': 'Baleares',    '08': 'Barcelona',
  '09': 'Burgos',      '10': 'Cáceres',     '11': 'Cádiz',       '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba',     '15': 'A Coruña',    '16': 'Cuenca',
  '17': 'Girona',      '18': 'Granada',     '19': 'Guadalajara', '20': 'Guipúzcoa',
  '21': 'Huelva',      '22': 'Huesca',      '23': 'Jaén',        '24': 'León',
  '25': 'Lleida',      '26': 'La Rioja',    '27': 'Lugo',        '28': 'Madrid',
  '29': 'Málaga',      '30': 'Murcia',      '31': 'Navarra',     '32': 'Ourense',
  '33': 'Asturias',    '34': 'Palencia',    '35': 'Las Palmas',  '36': 'Pontevedra',
  '37': 'Salamanca',   '38': 'S.C. Tenerife','39': 'Cantabria',  '40': 'Segovia',
  '41': 'Sevilla',     '42': 'Soria',       '43': 'Tarragona',   '44': 'Teruel',
  '45': 'Toledo',      '46': 'Valencia',    '47': 'Valladolid',  '48': 'Bizkaia',
  '49': 'Zamora',      '50': 'Zaragoza',    '51': 'Ceuta',       '52': 'Melilla',
};

// ─────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DB — tabla bajas
// ─────────────────────────────────────────────────────────────────

function openDb() {
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 268435456');

  db.exec(`
    CREATE TABLE IF NOT EXISTS bajas (
      periodo                TEXT    NOT NULL,
      año                    INTEGER NOT NULL,
      mes                    INTEGER NOT NULL,
      fecha_baja             TEXT,
      marca                  TEXT,
      modelo                 TEXT,
      fabricante             TEXT,
      cod_tipo               TEXT,
      tipo_vehiculo          TEXT,
      tipo_grupo             TEXT,
      cod_propulsion         TEXT,
      combustible            TEXT,
      cilindrada             INTEGER,
      potencia_cv            REAL,
      kw                     REAL,
      co2                    INTEGER,
      nivel_euro             TEXT,
      cat_vehiculo_ev        TEXT,
      autonomia_ev           INTEGER,
      tara                   INTEGER,
      peso_max               INTEGER,
      num_plazas             INTEGER,
      carroceria             TEXT,
      cat_homologacion_eu    TEXT,
      motivo_baja            TEXT,
      motivo_baja_desc       TEXT,
      persona_fisica_jur     TEXT,
      servicio               TEXT,
      fecha_prim_matriculac  TEXT,
      cod_provincia_veh      TEXT,
      provincia_veh          TEXT,
      municipio              TEXT
    );

    CREATE TABLE IF NOT EXISTS meses_procesados_bajas (
      periodo         TEXT    PRIMARY KEY,
      año             INTEGER NOT NULL,
      mes             INTEGER NOT NULL,
      total_registros INTEGER NOT NULL,
      procesado_en    TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bajas_periodo     ON bajas(periodo);
    CREATE INDEX IF NOT EXISTS idx_bajas_motivo      ON bajas(motivo_baja);
    CREATE INDEX IF NOT EXISTS idx_bajas_combustible ON bajas(combustible);
    CREATE INDEX IF NOT EXISTS idx_bajas_tipo_grupo  ON bajas(tipo_grupo);
    CREATE INDEX IF NOT EXISTS idx_bajas_provincia   ON bajas(cod_provincia_veh);
    CREATE INDEX IF NOT EXISTS idx_bajas_marca       ON bajas(marca);
    CREATE INDEX IF NOT EXISTS idx_bajas_año         ON bajas(año);
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
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const writer = createWriteStream(destPath);
  for await (const chunk of resp.body) writer.write(chunk);
  await new Promise((res, rej) => writer.end(err => err ? rej(err) : res()));
  return true;
}

// ─────────────────────────────────────────────────────────────────
// EXTRACCIÓN (busca recursivamente el fichero de datos)
// ─────────────────────────────────────────────────────────────────

async function extractZip(zipPath, destDir) {
  await mkdir(destDir, { recursive: true });
  try {
    await execAsync(`tar -xf "${zipPath}" -C "${destDir}"`);
  } catch {
    try { await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`); }
    catch { await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`); }
  }

  function findDataFile(dir) {
    const entries = readdirSync(dir);
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isFile() && /\.(txt|csv|dat)$/i.test(e)) return full;
    }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isFile() && !e.startsWith('.')) return full;
    }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) { const f = findDataFile(full); if (f) return f; }
    }
    return null;
  }

  const found = findDataFile(destDir);
  if (!found) throw new Error(`No se encontró fichero de datos en ${destDir}`);
  return found;
}

// ─────────────────────────────────────────────────────────────────
// PARSEO E INSERCIÓN
// ─────────────────────────────────────────────────────────────────

async function parsearEInsertar(filePath, periodo, db) {
  console.log(`  ⚙️  Parseando ${filePath}...`);
  const [year, month] = periodo.split('-').map(Number);

  const insertStmt = db.prepare(`
    INSERT INTO bajas (
      periodo, año, mes, fecha_baja,
      marca, modelo, fabricante,
      cod_tipo, tipo_vehiculo, tipo_grupo,
      cod_propulsion, combustible, cilindrada, potencia_cv, kw, co2,
      nivel_euro, cat_vehiculo_ev, autonomia_ev,
      tara, peso_max, num_plazas,
      carroceria, cat_homologacion_eu,
      motivo_baja, motivo_baja_desc,
      persona_fisica_jur, servicio, fecha_prim_matriculac,
      cod_provincia_veh, provincia_veh, municipio
    ) VALUES (
      @periodo, @año, @mes, @fecha_baja,
      @marca, @modelo, @fabricante,
      @cod_tipo, @tipo_vehiculo, @tipo_grupo,
      @cod_propulsion, @combustible, @cilindrada, @potencia_cv, @kw, @co2,
      @nivel_euro, @cat_vehiculo_ev, @autonomia_ev,
      @tara, @peso_max, @num_plazas,
      @carroceria, @cat_homologacion_eu,
      @motivo_baja, @motivo_baja_desc,
      @persona_fisica_jur, @servicio, @fecha_prim_matriculac,
      @cod_provincia_veh, @provincia_veh, @municipio
    )
  `);

  const insertBatch = db.transaction((records) => {
    for (const r of records) insertStmt.run(r);
  });

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  let lineNum = 0, total = 0;
  let batch = [];
  const BATCH_SIZE = 10_000;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue;
    if (line.length < 100) continue;

    const codTipo       = get(line, F.COD_TIPO);
    const codPropulsion = get(line, F.COD_PROPULSION).toUpperCase();
    const codProvVeh    = get(line, F.COD_PROVINCIA_VEH);
    const motivoCod     = get(line, F.MOTIVO_BAJA).toUpperCase();
    const marcaUp       = (get(line, F.MARCA_ITV) || '').toUpperCase().replace(/\s+/g, ' ');
    let   tipoVehiculo  = TIPO_NOMBRE[codTipo];
    if (['06','90','91','92'].includes(codTipo) && MICROCAR_MARCAS.has(marcaUp)) tipoVehiculo = 'cuadricilo';
    if (codTipo === '70' && MAQUINARIA_MARCAS.has(marcaUp)) tipoVehiculo = 'especial';

    let tipoGrupoFinal = TIPO_GRUPO[tipoVehiculo] ?? 'otros';
    // Split ANFAC-style: comerciales por peso_max (proxy MMA, bajas no trae masa_max_tecnica).
    const mmaBaja = toInt(get(line, F.PESO_MAX));
    if (mmaBaja && (tipoGrupoFinal === 'camion' || tipoGrupoFinal === 'furgoneta_van')) {
      if (mmaBaja <= 3500 && tipoGrupoFinal === 'camion') tipoGrupoFinal = 'furgoneta_van';
      else if (mmaBaja > 3500 && tipoGrupoFinal === 'furgoneta_van' && tipoVehiculo !== 'autocaravana') tipoGrupoFinal = 'camion';
    }
    // Derivados de turismo (carroceria AC) subtipos 25/0G → turismo, no VCL.
    const carroceriaBaja = (get(line, F.CARROCERIA) || '').toUpperCase();
    if (tipoGrupoFinal === 'furgoneta_van' && carroceriaBaja === 'AC' && (codTipo === '25' || codTipo === '0G')) {
      tipoGrupoFinal = 'turismo';
    }
    // Override trimoto por marca+modelo.
    const modeloUp = (get(line, F.MODELO_ITV) || '').toUpperCase();
    if (esTrimoto(marcaUp, modeloUp)) tipoGrupoFinal = 'trimoto';
    // Override agricola: marcas tractoreras en subtipos 70/80/81.
    if (TRACTOR_MARCAS.has(marcaUp) && ['70','80','81'].includes(codTipo)) {
      tipoGrupoFinal = 'agricola';
    }

    batch.push({
      periodo, año: year, mes: month,
      fecha_baja:   parseFecha(get(line, F.FEC_BAJA)),
      marca:        get(line, F.MARCA_ITV).toUpperCase().replace(/\s+/g, ' ') || null,
      modelo:       get(line, F.MODELO_ITV) || null,
      fabricante:   get(line, F.FABRICANTE_ITV) || null,
      cod_tipo:     codTipo || null,
      tipo_vehiculo: tipoVehiculo || null,
      tipo_grupo:   tipoGrupoFinal,
      cod_propulsion: codPropulsion || null,
      combustible:  PROPULSION[codPropulsion] ?? 'otros',
      cilindrada:   toInt(get(line, F.CILINDRADA_ITV)),
      potencia_cv:  toFloat(get(line, F.POTENCIA_ITV)),
      kw:           toFloat(get(line, F.KW_ITV)),
      co2:          toInt(get(line, F.CO2_ITV)),
      nivel_euro:   get(line, F.NIVEL_EMISION_EURO) || null,
      cat_vehiculo_ev: get(line, F.CAT_VEHICULO_EV) || null,
      autonomia_ev: toInt(get(line, F.AUTONOMIA_EV)),
      tara:         toInt(get(line, F.TARA)),
      peso_max:     toInt(get(line, F.PESO_MAX)),
      num_plazas:   toInt(get(line, F.NUM_PLAZAS_ITV)),
      carroceria:   get(line, F.CARROCERIA) || null,
      cat_homologacion_eu: get(line, F.CAT_HOMOLOGACION_EU) || null,
      motivo_baja:  motivoCod || null,
      motivo_baja_desc: MOTIVO_BAJA[motivoCod] ?? null,
      persona_fisica_jur: get(line, F.PERSONA_FIS_JUR).toUpperCase() || null,
      servicio:     get(line, F.SERVICIO) || null,
      fecha_prim_matriculac: parseFecha(get(line, F.FEC_PRIM_MATRICULAC)),
      cod_provincia_veh: codProvVeh || null,
      provincia_veh: PROVINCIAS[codProvVeh] ?? null,
      municipio:    get(line, F.MUNICIPIO) || null,
    });

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      total += batch.length;
      batch = [];
      process.stdout.write(`    ${total.toLocaleString()} insertados...\r`);
    }
  }

  if (batch.length) { insertBatch(batch); total += batch.length; }
  console.log(`\n    ✓ ${total.toLocaleString()} registros insertados`);

  db.prepare(`
    INSERT OR REPLACE INTO meses_procesados_bajas (periodo, año, mes, total_registros, procesado_en)
    VALUES (?, ?, ?, ?, ?)
  `).run(periodo, year, month, total, new Date().toISOString());

  return total;
}

// ─────────────────────────────────────────────────────────────────
// GENERACIÓN DE AGREGACIONES
// ─────────────────────────────────────────────────────────────────

function generarAgregaciones(db) {
  console.log('\n📊 Generando agregaciones de bajas...');

  const periodos = db.prepare(`
    SELECT periodo, año, mes, total_registros
    FROM meses_procesados_bajas ORDER BY periodo
  `).all();

  const stmtMotivo = db.prepare(`
    SELECT motivo_baja, motivo_baja_desc, COUNT(*) as total
    FROM bajas WHERE periodo = ? AND motivo_baja IS NOT NULL
    GROUP BY motivo_baja ORDER BY total DESC
  `);
  const stmtCombustible = db.prepare(`
    SELECT combustible, COUNT(*) as total
    FROM bajas WHERE periodo = ? AND combustible IS NOT NULL
    GROUP BY combustible ORDER BY total DESC
  `);
  const stmtTipo = db.prepare(`
    SELECT tipo_grupo, COUNT(*) as total
    FROM bajas WHERE periodo = ?
    GROUP BY tipo_grupo ORDER BY total DESC
  `);
  const stmtProvincia = db.prepare(`
    SELECT cod_provincia_veh, provincia_veh, COUNT(*) as total
    FROM bajas WHERE periodo = ? AND provincia_veh IS NOT NULL
    GROUP BY cod_provincia_veh, provincia_veh ORDER BY total DESC
  `);
  const stmtMarcas = db.prepare(`
    SELECT marca, COUNT(*) as total
    FROM bajas WHERE periodo = ? AND marca IS NOT NULL
    GROUP BY marca ORDER BY total DESC
  `);
  const stmtCatTipo = db.prepare(`
    SELECT cat_vehiculo_ev, tipo_grupo, COUNT(*) as total
    FROM bajas WHERE periodo = ? AND cat_vehiculo_ev IS NOT NULL
    GROUP BY cat_vehiculo_ev, tipo_grupo
  `);

  const meses = periodos.map(({ periodo, año, mes }, i) => {
    process.stdout.write(`  Agregando ${periodo} (${i + 1}/${periodos.length})...\r`);

    // por_cat_tipo: { [tipo_grupo]: { BEV, PHEV, HEV, REEV, FCEV } }
    const porCatTipo = {};
    for (const r of stmtCatTipo.all(periodo)) {
      const tg = r.tipo_grupo ?? 'otros';
      if (!porCatTipo[tg]) porCatTipo[tg] = {};
      porCatTipo[tg][r.cat_vehiculo_ev] = r.total;
    }

    return {
      periodo, año, mes,
      total: periodos[i].total_registros,
      por_motivo: Object.fromEntries(
        stmtMotivo.all(periodo).map(r => [r.motivo_baja, { desc: r.motivo_baja_desc, total: r.total }])
      ),
      por_combustible: Object.fromEntries(
        stmtCombustible.all(periodo).map(r => [r.combustible, r.total])
      ),
      por_tipo: Object.fromEntries(
        stmtTipo.all(periodo).map(r => [r.tipo_grupo, r.total])
      ),
      por_cat_tipo: porCatTipo,
      por_provincia: Object.fromEntries(
        stmtProvincia.all(periodo).map(r => [r.cod_provincia_veh, { nombre: r.provincia_veh, total: r.total }])
      ),
      marcas: stmtMarcas.all(periodo).map(r => ({ marca: r.marca, total: r.total })),
    };
  });

  console.log(`\n  ✓ ${meses.length} meses agregados`);
  return meses;
}

function guardarJson(meses) {
  if (DRY_RUN) { console.log('  [DRY RUN] JSON no escrito'); return; }
  const payload = {
    meta: {
      fuente: 'DGT - Microdatos de Bajas de Vehículos Mensuales (MATRABA)',
      url_patron: 'https://www.dgt.es/microdatos/salida/{year}/{month}/vehiculos/bajas/export_mensual_bajas_{YYYYMM}.zip',
      disponible_desde: '2014-12',
      ultima_actualizacion: new Date().toISOString().slice(0, 10),
      total_meses: meses.length,
    },
    meses,
  };
  writeFileSync(JSON_FILE_BAJAS, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`  💾 Guardado: data/dgt-bajas.json (${meses.length} meses)`);
}

// ─────────────────────────────────────────────────────────────────
// PROCESAR UN MES
// ─────────────────────────────────────────────────────────────────

async function procesarMes(year, month, db) {
  const periodo = `${year}-${String(month).padStart(2, '0')}`;

  const yaExiste = db.prepare('SELECT 1 FROM meses_procesados_bajas WHERE periodo = ?').get(periodo);
  if (yaExiste) { console.log(`  ⏩ ${periodo} ya está en la DB, saltando`); return false; }

  console.log(`\n📅 ${periodo}...`);
  const zipPath    = join(TEMP_DIR, `bajas_${periodo}.zip`);
  const extractDir = join(TEMP_DIR, `bajas_${periodo}`);

  try {
    await mkdir(TEMP_DIR, { recursive: true });
    const downloaded = await downloadZip(dgtUrlBajas(year, month), zipPath);
    if (!downloaded) { console.log(`  ⚠️  ${periodo} no disponible todavía`); return false; }
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
    console.log('🔄 Modo --solo-agregar: regenerando desde la DB...');

  } else if (SPECIFIC_MES) {
    const [year, month] = SPECIFIC_MES.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      console.error('❌ Formato inválido. Usa --mes=YYYY-MM'); process.exit(1);
    }
    hayNuevos = await procesarMes(year, month, db);

  } else if (DO_INIT) {
    const total = db.prepare('SELECT COUNT(*) as n FROM meses_procesados_bajas').get().n;
    console.log(`🚀 Modo --init bajas: dic 2014 → hoy`);
    console.log(`   Meses ya en DB: ${total}\n`);

    const now = new Date();
    let y = ORIGIN.year, m = ORIGIN.month;
    while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
      const result = await procesarMes(y, m, db);
      if (result) hayNuevos = true;
      m++; if (m > 12) { m = 1; y++; }
    }

  } else {
    const now = new Date();
    let encontrado = false;
    for (let delta = 3; delta >= 1 && !encontrado; delta--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - delta, 1);
      const y  = d.getFullYear(), mo = d.getMonth() + 1;
      const periodo = `${y}-${String(mo).padStart(2, '0')}`;
      const yaExiste = db.prepare('SELECT 1 FROM meses_procesados_bajas WHERE periodo = ?').get(periodo);
      if (!yaExiste) {
        const result = await procesarMes(y, mo, db);
        if (result) { hayNuevos = true; encontrado = true; }
      } else {
        encontrado = true;
        console.log(`✅ Bajas ya actualizadas hasta ${periodo}`);
      }
    }
  }

  if (hayNuevos || SOLO_AGREGAR) {
    const meses = generarAgregaciones(db);
    guardarJson(meses);
    const total = db.prepare('SELECT COUNT(*) as n FROM bajas').get().n;
    console.log(`\n✅ Listo.`);
    console.log(`   Registros en DB: ${total.toLocaleString()}`);
    console.log(`   Meses disponibles: ${meses.length}`);
  }

  db.close();
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
