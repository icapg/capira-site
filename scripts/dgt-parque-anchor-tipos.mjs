/**
 * dgt-parque-anchor-tipos.mjs
 * Lee el ZIP de parque_vehiculos_202503.zip (microdatos DGT parque marzo 2025)
 * y cuenta vehículos activos por tipo_grupo.
 *
 * Genera: data/dgt-parque-anchor-tipos.json
 * Uso: node scripts/dgt-parque-anchor-tipos.mjs
 */

import { createReadStream, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ZIP_FILE  = join(__dirname, '..', 'data', 'parque_vehiculos_202503.zip');
const OUT_FILE  = join(__dirname, '..', 'data', 'dgt-parque-anchor-tipos.json');

// ── Mismo mapeo que dgt-matriculaciones.mjs ──────────────────────────────────
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
  '40': 'turismo',
  '41': 'remolque_ligero',   '42': 'remolque',
  '43': 'semirremolque',     '44': 'semirremolque',
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

// Columna SUBTIPO_DGT (0-indexed) en el TXT de parque
// Header: PROVINCIA|MUNICIPIO|FABRICANTE|MARCA|MODELO|TIPO|VARIANTE|VERSION|
//         PROVINCIA_MATR|FECHA_MATR|FEC_PRIM_MATR|CLASE_MATR|PROCEDENCIA|
//         NUEVO_USADO|TIPO_TITULAR|NUM_TITULARES|SUBTIPO_DGT|...
const COL_SUBTIPO = 16;

async function extractZip(zipPath, destDir) {
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
}

async function findTxt(dir) {
  const { readdirSync } = await import('fs');
  return readdirSync(dir).find(f => f.endsWith('.txt') || f.endsWith('.TXT'));
}

async function main() {
  if (!existsSync(ZIP_FILE)) {
    console.error('ZIP no encontrado:', ZIP_FILE);
    process.exit(1);
  }

  console.log('Extrayendo ZIP... (puede tardar 1-2 min, son 7.6 GB)');
  const tmpDir = await mkdtemp(join(tmpdir(), 'dgt-parque-'));
  try {
    await extractZip(ZIP_FILE, tmpDir);
    const txtName = await findTxt(tmpDir);
    if (!txtName) throw new Error('No se encontró .txt en el ZIP');
    const txtPath = join(tmpDir, txtName);
    console.log('Archivo extraído:', txtName);

    console.log('Contando vehículos por tipo_grupo...');
    const counts = {};
    let total = 0;
    let header = null;

    const rl = createInterface({
      input: createReadStream(txtPath, { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!header) { header = line; continue; }
      if (!line.trim()) continue;

      const parts = line.split('|');
      const subtipo = (parts[COL_SUBTIPO] ?? '').trim().padStart(2, '0');
      const tipoNombre = TIPO_NOMBRE[subtipo] ?? 'otros';
      const tipoGrupo  = TIPO_GRUPO[tipoNombre] ?? 'otros';

      counts[tipoGrupo] = (counts[tipoGrupo] ?? 0) + 1;
      total++;

      if (total % 1_000_000 === 0) process.stdout.write(`  ${total.toLocaleString()} vehículos...\r`);
    }

    console.log(`\nTotal procesado: ${total.toLocaleString()}`);
    console.log('Por tipo_grupo:');
    for (const [tg, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${tg.padEnd(20)} ${n.toLocaleString()}`);
    }

    const output = { periodo: '2025-03', total, por_tipo: counts };
    writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log('\n✅ Generado:', OUT_FILE);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch(e => { console.error(e); process.exit(1); });
