/**
 * placsp-refresh-slug.mjs
 *
 * Refresca campos clave de un expediente PLACSP cuando la importación inicial
 * desde el ZIP mensual quedó incompleta (típicamente `fecha_formalizacion` y
 * `fecha_adjudicacion` que se publican posteriormente).
 *
 * Estrategia: lee el HTML público del deeplink + la tabla `documentos` ya
 * poblada por `placsp-extract-pdfs.mjs`, extrae fechas y estado, y hace UPDATE
 * de los campos null en `licitaciones`. NO pisa valores ya presentes.
 *
 * Usage:
 *   node scripts/placsp-refresh-slug.mjs --slug=15534510
 *   node scripts/placsp-refresh-slug.mjs --slug=15534510 --force   (pisa también valores ya presentes)
 *   node scripts/placsp-refresh-slug.mjs --all                       (todos los slugs con extraccion.json)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const DB_FILE   = path.join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR   = path.join(ROOT, 'data', 'placsp-pdfs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const FORCE = !!args.force;

const db = new Database(DB_FILE);

const slugs = args.all
  ? fs.readdirSync(PDF_DIR).filter((d) => fs.existsSync(path.join(PDF_DIR, d, 'extraccion.json')))
  : (args.slug ? [String(args.slug)] : []);
if (slugs.length === 0) {
  console.error('Falta --slug=<num> o --all');
  process.exit(1);
}

for (const slug of slugs) {
  const row = db.prepare(`SELECT * FROM licitaciones WHERE id LIKE ?`).get(`%/${slug}`);
  if (!row) { console.log(`✖ ${slug}: licitación no encontrada`); continue; }

  // Fechas derivables de la tabla `documentos` por tipo
  const docs = db.prepare(`SELECT tipo, fecha_subida FROM documentos WHERE licitacion_id = ? ORDER BY fecha_subida ASC`).all(row.id);
  const minDateOfType = (...tipos) => {
    const fechas = docs.filter((d) => tipos.includes(d.tipo) && d.fecha_subida).map((d) => d.fecha_subida).sort();
    return fechas[0] ?? null;
  };
  const maxDateOfType = (...tipos) => {
    const fechas = docs.filter((d) => tipos.includes(d.tipo) && d.fecha_subida).map((d) => d.fecha_subida).sort();
    return fechas[fechas.length - 1] ?? null;
  };
  const derived = {
    fecha_publicacion:  minDateOfType('anuncio_licitacion'),
    fecha_adjudicacion: minDateOfType('resolucion_adjudicacion', 'anuncio_adjudicacion', 'acta_propuesta_adjudicacion'),
    fecha_formalizacion: minDateOfType('formalizacion'),
  };

  // Estado derivado: si hay formalización → RES; si hay resolución adjudicación → ADJ; etc.
  let estadoDerivado = null;
  if (docs.some((d) => d.tipo === 'formalizacion')) estadoDerivado = 'RES';
  else if (docs.some((d) => d.tipo === 'resolucion_adjudicacion' || d.tipo === 'anuncio_adjudicacion')) estadoDerivado = 'ADJ';

  // No pisamos DES (declarada desierta) — tiene prioridad sobre lo derivado.
  if (row.estado_actual === 'DES') estadoDerivado = null;

  // Construir UPDATE solo con campos que están null (o todos, si --force)
  const updates = {};
  for (const [col, val] of Object.entries(derived)) {
    if (val == null) continue;
    if (FORCE || row[col] == null) updates[col] = val;
  }
  if (estadoDerivado && (FORCE || row.estado_actual == null || (row.estado_actual !== estadoDerivado && row.estado_actual !== 'DES' && row.estado_actual !== 'ANUL'))) {
    updates.estado_actual = estadoDerivado;
  }

  if (Object.keys(updates).length === 0) {
    console.log(`✓ ${slug}: nada que refrescar (estado=${row.estado_actual})`);
    continue;
  }

  const cols = Object.keys(updates);
  const sql = `UPDATE licitaciones SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...cols.map((c) => updates[c]), row.id);

  const summary = cols.map((c) => `${c}=${updates[c]}`).join(' · ');
  console.log(`🔄 ${slug}: ${summary}`);
}
db.close();
