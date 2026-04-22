/**
 * dgt-parque-import.mjs
 * Importa un ZIP mensual del Parque de Vehículos de la DGT al SQLite local.
 *
 * Uso:
 *   node scripts/dgt-parque-import.mjs 202603                  # un mes
 *   node scripts/dgt-parque-import.mjs 202503 202603           # varios meses
 *   node scripts/dgt-parque-import.mjs --all                   # todos los ZIP en data/
 *
 * Genera/actualiza dos tablas en data/dgt-matriculaciones.db:
 *
 *   parque (solo el ÚLTIMO snapshot — para queries finos del parque actual)
 *     periodo, subtipo, tipo_grupo, catelect, propulsion, provincia, municipio,
 *     marca, modelo, fecha_matr, fec_prim_matr, clase_matr, procedencia,
 *     nuevo_usado, distintivo, carroceria
 *
 *   parque_agregados_mes  (todos los meses — para el gráfico histórico)
 *     periodo, clave, n         PK (periodo, clave)
 *     clave:
 *       TOTAL
 *       CATELECT:BEV | CATELECT:PHEV | CATELECT:HEV | CATELECT:REEV | CATELECT:FCEV | CATELECT:NO_EV
 *       TIPO:turismo | TIPO:moto | TIPO:furgoneta_van | ...
 *       CATELECT_TIPO:BEV:turismo | ...
 *       PROVINCIA:<cod>
 *       PROVINCIA_CATELECT:<cod>:<CATELECT>
 *       PROVINCIA_TIPO:<cod>:<tipo>
 *       PROVINCIA_CATELECT_TIPO:<cod>:<CATELECT>:<tipo>
 *       DISTINTIVO:CERO | DISTINTIVO:B | DISTINTIVO:C | DISTINTIVO:ECO | DISTINTIVO:Sin
 *
 * NUNCA borra snapshots anteriores — solo reemplaza el más nuevo en `parque`.
 * Los agregados de meses anteriores se mantienen.
 */

import { createReadStream, existsSync, readdirSync, rmSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import Database from 'better-sqlite3';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');
const DB_FILE   = join(DATA_DIR, 'dgt-matriculaciones.db');

// ── Mapeos compartidos con dgt-parque-anchor-tipos.mjs ───────────────────────
const TIPO_NOMBRE = {
  '03':'ciclomotor','04':'motocicleta','05':'motocarro',
  // En parque DGT, subtipo '06' (spec: cuadricilo L6e/L7e) contiene en realidad
  // camiones antiguos con modelo corrupto (IVECO, MAN, Pegaso, Scania, Toyota
  // Dyna, Ford Transit, Nissan Trade...). Solo va a microcar si la marca está
  // en la whitelist; sino cae a camion. Ver investigación 2026-04.
  '06':'camion_ligero',
  // Códigos alfanuméricos de carrocería N1 no documentados por DGT (descubiertos
  // 2026-04-21 por auditoría de bucket 'otros'):
  // '0G' = furgoneta derivada (Kangoo, Berlingo, Partner, Caddy, Transit Connect)
  // '02' = pickups/VCL (Hilux, Ranger, L200, Navara, Patrol, Transit)
  // '00','07','0A' = VCL/camiones antiguos (Daily, Cabstar, Sprinter, Canter)
  // '7A' = autocaravanas (Benimar, Hymer, Knaus, VW California)
  '0G':'furgoneta','02':'camion_ligero','00':'camion_ligero',
  '07':'camion_ligero','0A':'camion_ligero','7A':'autocaravana',
  // Familia 0x/1x/08/72/74/80: camiones industriales clasificados en "otros"
  // por no estar mapeados (auditoría 2026-04-21). avg_mma 4.5-27t. El split
  // por MMA dentro del import decidirá VCL (≤3.5t) vs industrial (>3.5t).
  '01':'camion_medio','08':'camion_medio','09':'camion_medio','0B':'camion_ligero',
  '0C':'camion_pesado','0D':'camion_pesado','0E':'camion_ligero','0F':'camion_pesado',
  '1A':'camion_ligero','1C':'camion_pesado','1D':'camion_medio','1E':'camion_medio',
  '1F':'camion_medio','72':'camion_medio','74':'camion_pesado','80':'camion_pesado',
  // Familia 8x: tractocamiones N3 (Volvo/Scania/DAF/MAN/Mercedes/Iveco, avg 20t).
  '81':'tractocamion',
  // Familia 7x camiones especiales: hormigoneras (7C), grúas móviles (7E),
  // bomberos/especiales (7F). Fabricantes de camiones + carrocería especializada.
  '7C':'camion_pesado','7E':'camion_pesado','7F':'camion_medio',
  // Familia 7x maquinaria industrial (verificado por marca: 73=carretillas elevadoras
  // Linde/Still/Hyster, 7J=retroexcavadoras JCB/Case/Cat, 71=maq. construcción,
  // 7D=mini-dumpers Ausa/Wacker, 7B=barredoras Schmidt/Bucher).
  '71':'especial','73':'especial','7B':'especial','7D':'especial','7J':'especial',
  // Semirremolques con códigos alfanuméricos adicionales (Lecitrailer, Leciñena,
  // Schmitz, Fruehauf confirmados como fabricantes de remolques).
  's3':'semirremolque','SC':'semirremolque','RC':'remolque',
  // En parque DGT, subtipos 90/91 son CICLOMOTORES (Yamaha, Piaggio, Vespa, Derbi...)
  // no L6e/L7e como dice la spec oficial. Solo van a microcar si la marca es de
  // microcar (Aixam, Ligier...), lógica más abajo.
  '90':'ciclomotor','91':'ciclomotor',
  // '92' (L5e triciclo) también mixto — microcar solo por marca.
  '92':'motocarro',
  '10':'turismo','11':'autobus','12':'autobus','13':'autobus_articulado',
  '14':'autobus_mixto','15':'trolebus','16':'autobus_2_pisos',
  '20':'camion_ligero','21':'camion_medio','22':'camion_pesado','23':'tractocamion',
  '24':'furgoneta','25':'furgon_medio','26':'furgon_pesado',
  // Nota: en parque DGT, subtipo '30' codifica autobús/autocar (Mercedes Citaro,
  // MAN, Scania, Irizar, Iveco Bus, Pegaso...), NO derivado-de-turismo como en
  // matriculaciones. Ver investigación 2026-04.
  // Subtipos 31/32: spec dice "vehículo mixto" pero en data real son AUTOBUSES
  // ARTICULADOS (MB Citaro G, Volvo 7900, MAN Lion's City, Solaris, con MMA 29t
  // y carrocerías CG/CC/CE/AR). Auditoría 2026-04-22.
  '30':'autobus','31':'autobus_articulado','32':'autobus_articulado',
  '40':'turismo','41':'remolque_ligero','42':'remolque',
  '43':'semirremolque','44':'semirremolque','50':'ciclomotor',
  // Subtipos 51-55: spec dice "maquinaria agrícola" pero en data real son motos
  // 2-ruedas (51=Vespa, SYM), triciclos motorizados (53=Piaggio MP3, Yamaha MWD,
  // Peugeot Metropolis, Quadro, Gilera Fuoco) y quads (54=Kymco MXU, Bombardier,
  // Polaris, CFMoto). Ningún tractor real (ni JD, New Holland, Kubota, Fendt).
  // Default por subtipo; override a 'trimoto' por marca+modelo abajo.
  // Auditoría 2026-04-22.
  '51':'ciclomotor','52':'ciclomotor','53':'motocarro',
  '54':'quad_atv','55':'ciclomotor',
  '60':'especial','61':'especial','62':'especial','63':'especial',
  '64':'especial','65':'especial','66':'quad_atv',
  // Subtipo '70' (spec: militar) en data real es mix de quads/ATVs (Yamaha, Suzuki,
  // Polaris, CFMoto, Kymco, Bombardier, Linhai) y maquinaria industrial (JCB,
  // Manitou, Case, Caterpillar, Bobcat, New Holland, Komatsu, Liebherr, Merlo,
  // Linde, AUSA). Default quad_atv; brand override a especial para maquinaria.
  '70':'quad_atv',
  // Remolques (Rx) y semirremolques (Sx) con códigos alfanuméricos.
  'R0':'remolque_ligero','R1':'remolque_ligero','R2':'remolque_ligero',
  'R3':'remolque_ligero','R5':'remolque_ligero','R6':'remolque_ligero',
  'R7':'remolque_ligero','RA':'remolque_ligero','RD':'remolque_ligero',
  'S0':'semirremolque','S1':'semirremolque','S2':'semirremolque',
  'S3':'semirremolque','S5':'semirremolque','S6':'semirremolque',
  'S7':'semirremolque','S9':'semirremolque','SA':'semirremolque','SD':'semirremolque',
};

// Marcas de maquinaria industrial/construcción (override para subtipo '70').
const MAQUINARIA_MARCAS = new Set([
  'JCB','MANITOU','CASE','CATERPILLAR','BOBCAT','KOMATSU',
  'LIEBHERR','MERLO','LINDE','AUSA','CNH','HYSTER','STILL','JUNGHEINRICH',
  'DOOSAN','TAKEUCHI','KRAMER','VOLVO CE','WACKER NEUSON','SANDVIK',
]);

// Marcas de tractor agrícola (whitelist). Reclasifican a 'agricola' en subtipos
// 70/80/81 donde hoy caen como quad_atv/camion/furgoneta_van por default.
// JD/NH/Kubota/CaseIH son mixtas (también construcción) pero en sub 70/80/81
// con modelo corrupto, estadísticamente son tractores. Sub 7J/71/7D quedan en
// 'especial' (retroexcavadoras, maquinaria construcción). Auditoría 2026-04-22.
const TRACTOR_MARCAS = new Set([
  'JOHN DEERE','NEW HOLLAND','KUBOTA','CASE IH','FENDT','MASSEY FERGUSON',
  'DEUTZ-FAHR','CLAAS','VALTRA','LANDINI','MCCORMICK','ZETOR','STEYR','SAME',
  'DEUTZ','AGCO','SAMPO','URSUS','PASQUALI','BCS','GOLDONI','CARRARO',
  'ANTONIO CARRARO','ARBOS','LAMBORGHINI','LINDNER','HURLIMANN',
]);

const TIPO_GRUPO = {
  'turismo':'turismo','derivado_turismo':'turismo',
  'furgoneta':'furgoneta_van','furgon_medio':'furgoneta_van','furgon_pesado':'furgoneta_van',
  'autocaravana':'furgoneta_van',
  'camion_ligero':'camion','camion_medio':'camion','camion_pesado':'camion','tractocamion':'camion',
  'autobus':'autobus','autobus_articulado':'autobus','autobus_mixto':'autobus',
  'trolebus':'autobus','autobus_2_pisos':'autobus',
  'motocicleta':'moto','ciclomotor':'moto','motocarro':'moto',
  'trimoto':'trimoto',
  'cuadricilo':'microcar','microcar':'microcar',
  'quad_atv':'quad_atv',
  'remolque_ligero':'remolque','remolque':'remolque','semirremolque':'remolque',
  'tractor_agricola':'agricola','maquinaria_agricola':'agricola',
  'especial':'especial','militar':'otros','tren_turistico':'otros',
};

// Trimotos (scooters/motos de 3 ruedas). No tienen subtipo DGT propio, hay que
// detectarlos por marca+modelo. Patrones confirmados por auditoría 2026-04-22.
// Override final del tipo_grupo (mayoritariamente sacan a modelos de 'moto',
// 'motocarro' y subtipos 53/54 que fueron mal clasificados como agrícolas).
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

// Marcas reconocidas de microcar (cuadriciclo ligero/pesado L6e/L7e).
// Usadas para clasificar subtipo '92' (L5e triciclo) que en DGT mezcla microcars
// y scooters — solo van a microcar si la marca es de las reconocidas.
const MICROCAR_MARCAS = new Set([
  'AIXAM','MICROCAR','LIGIER','CHATENET','BELLIER','GRECAV','CASALINI','ESTRIMA',
  'GOUPIL','JDM','J.D.M.','MEGA','MINAUTO','SECMA','ITALCAR','TAZZARI','DUE','CLUB CAR',
]);

const CATELECT_VALID = new Set(['BEV','PHEV','HEV','REEV','FCEV']);

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parque (
      periodo       TEXT NOT NULL,
      subtipo       TEXT,
      tipo_grupo    TEXT,
      catelect      TEXT,
      propulsion    TEXT,
      distintivo    TEXT,
      provincia     TEXT,
      municipio     TEXT,
      marca         TEXT,
      modelo        TEXT,
      fecha_matr    TEXT,
      fec_prim_matr TEXT,
      clase_matr    TEXT,
      procedencia   TEXT,
      nuevo_usado   TEXT,
      carroceria    TEXT,
      mma           INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_parque_catelect     ON parque(catelect);
    CREATE INDEX IF NOT EXISTS idx_parque_tipo_grupo   ON parque(tipo_grupo);
    CREATE INDEX IF NOT EXISTS idx_parque_provincia    ON parque(provincia);
    CREATE INDEX IF NOT EXISTS idx_parque_marca_modelo ON parque(marca, modelo);
    CREATE INDEX IF NOT EXISTS idx_parque_distintivo   ON parque(distintivo);

    CREATE TABLE IF NOT EXISTS parque_agregados_mes (
      periodo  TEXT NOT NULL,
      clave    TEXT NOT NULL,
      n        INTEGER NOT NULL,
      PRIMARY KEY (periodo, clave)
    );

    CREATE INDEX IF NOT EXISTS idx_parque_agg_clave ON parque_agregados_mes(clave);

    CREATE TABLE IF NOT EXISTS parque_meses_procesados (
      periodo        TEXT PRIMARY KEY,
      rows           INTEGER NOT NULL,
      procesado_en   TEXT NOT NULL
    );
  `);
}

async function extractZip(zipPath, destDir) {
  try       { await execAsync(`tar -xf "${zipPath}" -C "${destDir}"`); return; } catch {}
  try       { await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`); return; } catch {}
  await execAsync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
  );
}

function findTxt(dir) {
  return readdirSync(dir).find(f => f.toLowerCase().endsWith('.txt'));
}

async function importZip(periodo, opts) {
  const zipPath = join(DATA_DIR, `parque_vehiculos_${periodo}.zip`);
  if (!existsSync(zipPath)) {
    console.error(`[skip] ${periodo} — ZIP no existe: ${zipPath}`);
    return;
  }

  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  ensureSchema(db);

  // ¿Ya fue procesado?
  const prev = db.prepare(`SELECT * FROM parque_meses_procesados WHERE periodo = ?`).get(periodo);
  if (prev && !opts.force) {
    console.log(`[skip] ${periodo} — ya procesado (${prev.rows.toLocaleString()} filas). Usá --force para re-procesar.`);
    db.close();
    return;
  }

  console.log(`[zip ] ${periodo} — extrayendo...`);
  const tmp = await mkdtemp(join(tmpdir(), `dgt-parque-${periodo}-`));
  try {
    await extractZip(zipPath, tmp);
    const txtName = findTxt(tmp);
    if (!txtName) throw new Error('No se encontró .txt dentro del ZIP');
    const txtPath = join(tmp, txtName);
    console.log(`[zip ] ${periodo} — extraído: ${txtName}`);

    // Detectar el snapshot más reciente ya en la tabla parque (si lo hay)
    const ultimoParque = db.prepare(`SELECT MAX(periodo) AS p FROM parque`).get()?.p || null;
    const isNuevoUltimo = !ultimoParque || periodo >= ultimoParque;
    if (isNuevoUltimo) {
      console.log(`[db  ] ${periodo} será el nuevo snapshot en parque (previo: ${ultimoParque ?? 'ninguno'}). Se reemplazarán las filas.`);
    } else {
      console.log(`[db  ] ${periodo} no es el más reciente (${ultimoParque}). Solo se actualizarán agregados.`);
    }

    const rl = createInterface({
      input: createReadStream(txtPath, { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });

    let total = 0;
    let headerParsed = false;
    const col = {};
    const aggs = new Map(); // clave → n

    const insertParque = db.prepare(`
      INSERT INTO parque
        (periodo, subtipo, tipo_grupo, catelect, propulsion, distintivo,
         provincia, municipio, marca, modelo, fecha_matr, fec_prim_matr,
         clase_matr, procedencia, nuevo_usado, carroceria, mma)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    // Transacción para inserts masivos
    const writeToParque = isNuevoUltimo;
    db.prepare('BEGIN').run();
    if (writeToParque) {
      db.prepare(`DELETE FROM parque`).run();
    }

    try {
      for await (const line of rl) {
        if (!headerParsed) {
          const cols = line.split('|').map(c => c.trim());
          col.provincia  = cols.indexOf('PROVINCIA');
          col.municipio  = cols.indexOf('MUNICIPIO');
          col.marca      = cols.indexOf('MARCA');
          col.modelo     = cols.indexOf('MODELO');
          col.fechaMatr  = cols.indexOf('FECHA_MATR');
          col.fecPrim    = cols.indexOf('FEC_PRIM_MATR');
          col.claseMatr  = cols.indexOf('CLASE_MATR');
          col.procedencia= cols.indexOf('PROCEDENCIA');
          col.nuevoUsado = cols.indexOf('NUEVO_USADO');
          col.subtipo    = cols.indexOf('SUBTIPO_DGT');
          col.propulsion = cols.indexOf('PROPULSION');
          col.catelect   = cols.indexOf('CATELECT');
          col.distintivo = cols.indexOf('TIPO_DISTINTIVO');
          col.carroceria = cols.indexOf('CARROCERIA');
          col.mmta      = cols.indexOf('MMTA');
          col.pesoMax   = cols.indexOf('PESO_MAX');
          headerParsed = true;
          console.log(`[cols] subtipo=${col.subtipo} catelect=${col.catelect} propulsion=${col.propulsion} provincia=${col.provincia} marca=${col.marca} distintivo=${col.distintivo} mmta=${col.mmta} peso_max=${col.pesoMax}`);
          continue;
        }
        if (!line.trim()) continue;
        const parts = line.split('|');

        const get = (i) => i >= 0 ? (parts[i] ?? '').trim() : '';

        const subtipo    = get(col.subtipo).padStart(2, '0');
        const marcaRaw   = get(col.marca).toUpperCase();
        let   tipoNombre = TIPO_NOMBRE[subtipo] ?? 'otros';
        // subtipos 90/91/92 con marca microcar → cuadricilo (microcar); sino quedan
        // como ciclomotor/motocarro (motos), que es lo que realmente son en parque DGT.
        if (['06','90','91','92'].includes(subtipo) && MICROCAR_MARCAS.has(marcaRaw)) tipoNombre = 'cuadricilo';
        // Subtipo '70': quad_atv por default, pero si marca es de maquinaria → especial
        if (subtipo === '70' && MAQUINARIA_MARCAS.has(marcaRaw)) tipoNombre = 'especial';
        let tipoGrupo  = TIPO_GRUPO[tipoNombre] ?? 'otros';

        // MMA: preferir MMTA, fallback PESO_MAX. 0/NULL = sin dato.
        const mmaRaw = parseInt(get(col.mmta), 10) || parseInt(get(col.pesoMax), 10) || 0;
        const mma    = mmaRaw > 0 ? mmaRaw : null;

        // Split ANFAC-style: comerciales por MMA ≤3.5t = VCL (furgoneta_van), >3.5t = industriales (camion).
        // Aplica solo a N1/N2/N3 (comerciales). No tocamos M1 (turismos), M2/M3 (buses), L (motos), O (remolques), etc.
        if (mma !== null && (tipoGrupo === 'camion' || tipoGrupo === 'furgoneta_van')) {
          if (mma <= 3500 && tipoGrupo === 'camion') tipoGrupo = 'furgoneta_van';
          else if (mma > 3500 && tipoGrupo === 'furgoneta_van' && tipoNombre !== 'autocaravana') tipoGrupo = 'camion';
        }
        // ANFAC: derivados de turismo con carroceria AC (familiar/wagon) uso pasajeros
        // (Berlingo Tepee, Caddy Life, Rifter, Dokker familiar) → turismo, no VCL.
        // Solo subtipos 25 (furgon_medio) y 0G (furgoneta) que en data real son mix.
        const carroceriaRaw = get(col.carroceria).toUpperCase();
        if (tipoGrupo === 'furgoneta_van' && carroceriaRaw === 'AC' && (subtipo === '25' || subtipo === '0G')) {
          tipoGrupo = 'turismo';
        }
        // Override trimoto por marca+modelo (scooters 3 ruedas: MP3, Tricity,
        // Metropolis, Quadro, CV3, Fuoco, Spyder/Ryker).
        const modeloRaw = get(col.modelo).toUpperCase();
        if (esTrimoto(marcaRaw, modeloRaw)) tipoGrupo = 'trimoto';
        // Override agricola: marcas puramente tractoreras en subtipos 70/80/81.
        // Excluye sub 40 (LAMBORGHINI supercars) y otros grupos que ya no son
        // candidatos. Mantiene sub 7J/71/7D en 'especial' (maquinaria construcción).
        if (TRACTOR_MARCAS.has(marcaRaw) && ['70','80','81'].includes(subtipo)) {
          tipoGrupo = 'agricola';
        }
        const catRaw     = get(col.catelect);
        const catelect   = CATELECT_VALID.has(catRaw) ? catRaw : 'NO_EV';
        const provincia  = get(col.provincia);
        const distintivo = get(col.distintivo);

        // Agregados
        aggs.set('TOTAL', (aggs.get('TOTAL') ?? 0) + 1);
        aggs.set(`CATELECT:${catelect}`, (aggs.get(`CATELECT:${catelect}`) ?? 0) + 1);
        aggs.set(`TIPO:${tipoGrupo}`, (aggs.get(`TIPO:${tipoGrupo}`) ?? 0) + 1);
        aggs.set(`CATELECT_TIPO:${catelect}:${tipoGrupo}`, (aggs.get(`CATELECT_TIPO:${catelect}:${tipoGrupo}`) ?? 0) + 1);
        if (provincia) {
          aggs.set(`PROVINCIA:${provincia}`, (aggs.get(`PROVINCIA:${provincia}`) ?? 0) + 1);
          aggs.set(`PROVINCIA_CATELECT:${provincia}:${catelect}`, (aggs.get(`PROVINCIA_CATELECT:${provincia}:${catelect}`) ?? 0) + 1);
          aggs.set(`PROVINCIA_TIPO:${provincia}:${tipoGrupo}`, (aggs.get(`PROVINCIA_TIPO:${provincia}:${tipoGrupo}`) ?? 0) + 1);
          aggs.set(`PROVINCIA_CATELECT_TIPO:${provincia}:${catelect}:${tipoGrupo}`, (aggs.get(`PROVINCIA_CATELECT_TIPO:${provincia}:${catelect}:${tipoGrupo}`) ?? 0) + 1);
        }
        if (distintivo) {
          aggs.set(`DISTINTIVO:${distintivo}`, (aggs.get(`DISTINTIVO:${distintivo}`) ?? 0) + 1);
        }

        // Insert en parque (solo si es el nuevo snapshot)
        if (writeToParque) {
          insertParque.run(
            periodo,
            subtipo,
            tipoGrupo,
            catelect,
            get(col.propulsion),
            distintivo,
            provincia,
            get(col.municipio),
            get(col.marca),
            get(col.modelo),
            get(col.fechaMatr),
            get(col.fecPrim),
            get(col.claseMatr),
            get(col.procedencia),
            get(col.nuevoUsado),
            get(col.carroceria),
            mma,
          );
        }

        total++;
        if (total % 500_000 === 0) process.stdout.write(`      ${periodo}  ${total.toLocaleString()} filas...\r`);
      }

      // Limpiar agregados previos de ese periodo y escribir los nuevos
      db.prepare(`DELETE FROM parque_agregados_mes WHERE periodo = ?`).run(periodo);
      const insAgg = db.prepare(`INSERT INTO parque_agregados_mes (periodo, clave, n) VALUES (?,?,?)`);
      for (const [k, n] of aggs) insAgg.run(periodo, k, n);

      db.prepare(`INSERT OR REPLACE INTO parque_meses_procesados (periodo, rows, procesado_en) VALUES (?, ?, ?)`)
        .run(periodo, total, new Date().toISOString());

      db.prepare('COMMIT').run();
    } catch (err) {
      db.prepare('ROLLBACK').run();
      throw err;
    }

    console.log(`\n[ok  ] ${periodo} — ${total.toLocaleString()} filas, ${aggs.size} agregados`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    db.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  let periodos = args.filter(a => /^\d{6}$/.test(a));

  if (args.includes('--all')) {
    // Procesar del más NUEVO al más viejo: el primero escribe las ~38M filas en `parque`,
    // los siguientes solo actualizan agregados mensuales (DELETE parque + INSERT se saltan).
    periodos = readdirSync(DATA_DIR)
      .filter(f => /^parque_vehiculos_\d{6}\.zip$/.test(f))
      .map(f => f.match(/(\d{6})/)[1])
      .sort()
      .reverse();
  }

  if (!periodos.length) {
    console.log('Sin períodos. Uso: node scripts/dgt-parque-import.mjs YYYYMM [YYYYMM...] | --all  [--force]');
    return;
  }

  console.log(`Importando ${periodos.length} mes(es): ${periodos.join(', ')}${force ? ' [force]' : ''}`);
  for (const p of periodos) {
    try { await importZip(p, { force }); }
    catch (err) { console.error(`[err ] ${p}: ${err.message}`); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
