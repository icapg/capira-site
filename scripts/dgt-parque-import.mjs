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
  '03':'ciclomotor','04':'motocicleta','05':'motocarro','06':'cuadricilo',
  '10':'turismo','11':'autobus','12':'autobus','13':'autobus_articulado',
  '14':'autobus_mixto','15':'trolebus','16':'autobus_2_pisos',
  '20':'camion_ligero','21':'camion_medio','22':'camion_pesado','23':'tractocamion',
  '24':'furgoneta','25':'furgon_medio','26':'furgon_pesado',
  '30':'derivado_turismo','31':'vehiculo_mixto','32':'vehiculo_mixto',
  '40':'turismo','41':'remolque_ligero','42':'remolque',
  '43':'semirremolque','44':'semirremolque','50':'ciclomotor',
  '51':'maquinaria_agricola','52':'maquinaria_agricola','53':'maquinaria_agricola',
  '54':'maquinaria_agricola','55':'maquinaria_agricola',
  '60':'especial','61':'especial','62':'especial','63':'especial',
  '64':'especial','65':'especial','66':'quad_atv',
  '70':'militar','80':'tren_turistico',
};

const TIPO_GRUPO = {
  'turismo':'turismo','derivado_turismo':'turismo',
  'vehiculo_mixto':'suv_todo_terreno',
  'furgoneta':'furgoneta_van','furgon_medio':'furgoneta_van','furgon_pesado':'furgoneta_van',
  'camion_ligero':'camion','camion_medio':'camion','camion_pesado':'camion','tractocamion':'camion',
  'autobus':'autobus','autobus_articulado':'autobus','autobus_mixto':'autobus',
  'trolebus':'autobus','autobus_2_pisos':'autobus',
  'motocicleta':'moto','ciclomotor':'moto','motocarro':'moto',
  'cuadricilo':'quad_atv','quad_atv':'quad_atv',
  'remolque_ligero':'remolque','remolque':'remolque','semirremolque':'remolque',
  'tractor_agricola':'agricola','maquinaria_agricola':'agricola',
  'especial':'especial','militar':'otros','tren_turistico':'otros',
};

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
      carroceria    TEXT
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
    const isNuevoUltimo = !ultimoParque || periodo > ultimoParque;
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
         clase_matr, procedencia, nuevo_usado, carroceria)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
          headerParsed = true;
          console.log(`[cols] subtipo=${col.subtipo} catelect=${col.catelect} propulsion=${col.propulsion} provincia=${col.provincia} marca=${col.marca} distintivo=${col.distintivo}`);
          continue;
        }
        if (!line.trim()) continue;
        const parts = line.split('|');

        const get = (i) => i >= 0 ? (parts[i] ?? '').trim() : '';

        const subtipo    = get(col.subtipo).padStart(2, '0');
        const tipoNombre = TIPO_NOMBRE[subtipo] ?? 'otros';
        const tipoGrupo  = TIPO_GRUPO[tipoNombre] ?? 'otros';
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
