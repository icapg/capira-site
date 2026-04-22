/**
 * ALTER TABLE parque ADD COLUMN mma — solo si no existe.
 * Uso único.
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);

const cols = db.prepare(`PRAGMA table_info(parque)`).all().map(c => c.name);
if (!cols.includes('mma')) {
  db.prepare(`ALTER TABLE parque ADD COLUMN mma INTEGER`).run();
  console.log('✓ columna mma añadida a parque');
} else {
  console.log('= columna mma ya existe, nada que hacer');
}
db.close();
