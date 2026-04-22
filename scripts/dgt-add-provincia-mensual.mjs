/**
 * dgt-add-provincia-mensual.mjs — one-off
 * Lee data/dgt-bev-phev-mensual.json y le agrega bev_por_provincia + phev_por_provincia
 * a cada entry sin regenerar el resto del pipeline.
 */

import Database from 'better-sqlite3';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const JSON_FILE = join(__dirname, '..', 'data', 'dgt-bev-phev-mensual.json');

console.log('Leyendo JSON existente...');
const current = JSON.parse(readFileSync(JSON_FILE, 'utf8'));

console.log('Querying DGT DB por provincia × mes × cat...');
const db = new Database(DB_FILE, { readonly: true });
const rows = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, cod_provincia_veh, COUNT(*) as n
  FROM matriculaciones
  WHERE cat_vehiculo_ev IN ('BEV','PHEV')
  GROUP BY periodo, cat_vehiculo_ev, cod_provincia_veh
`).all();
db.close();

console.log(`  ${rows.length} filas agrupadas.`);

const map = {};
for (const r of rows) {
  if (!map[r.periodo]) map[r.periodo] = { BEV: {}, PHEV: {} };
  const cod = r.cod_provincia_veh ?? 'ND';
  map[r.periodo][r.cat_vehiculo_ev][cod] = r.n;
}

for (const entry of current.mensual) {
  const p = map[entry.periodo] ?? { BEV: {}, PHEV: {} };
  entry.bev_por_provincia  = p.BEV;
  entry.phev_por_provincia = p.PHEV;
}

current.meta.generado_en = new Date().toISOString();

writeFileSync(JSON_FILE, JSON.stringify(current, null, 2), 'utf8');
const kb = Math.round(Buffer.byteLength(JSON.stringify(current)) / 1024);
console.log(`\nEscrito ${JSON_FILE} (${kb} KB)`);
