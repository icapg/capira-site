/**
 * PLACSP importer
 *
 * Extrae los ZIPs mensuales de `data/placsp-raw/`, parsea los Atom (UBL/CODICE)
 * y hace upsert en la tabla `licitaciones` + tablas relacionadas.
 *
 * Idempotente por `id` (URI PLACSP). Las ejecuciones repetidas actualizan filas
 * existentes y detectan transiciones de estado (PUB→EV→ADJ→RES) en snapshots_estado.
 *
 * Usage:
 *   node scripts/placsp-import.mjs                # all available zips
 *   node scripts/placsp-import.mjs --month=202501
 *   node scripts/placsp-import.mjs --from=202401 --to=202412
 */

import fs   from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { XMLParser } from 'fast-xml-parser';
import AdmZip from 'adm-zip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR   = path.join(__dirname, '..', 'data', 'placsp-raw');
const WORK_DIR  = path.join(__dirname, '..', 'data', 'placsp-work');
const DB_FILE   = path.join(__dirname, '..', 'data', 'licitaciones.db');
const SCHEMA    = path.join(__dirname, 'placsp-schema.sql');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

// ─── DB bootstrap ────────────────────────────────────────────────────────
if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new Database(DB_FILE);
db.exec(fs.readFileSync(SCHEMA, 'utf8'));

// ─── XML parser ──────────────────────────────────────────────────────────
const parser = new XMLParser({
  ignoreAttributes:     false,
  attributeNamePrefix:  '@_',
  removeNSPrefix:       false,
  parseTagValue:        true,
  parseAttributeValue:  true,
  trimValues:           true,
  isArray: (name) => [
    'entry',
    'cac:TenderResult',
    'cac:WinningParty',
    'cac:PartyName',
    'cbc:ItemClassificationCode',
    'cac:Period',
  ].includes(name),
});

// ─── helpers ─────────────────────────────────────────────────────────────
const tipoContratoMap = {
  '1': 'Suministro', '2': 'Servicios', '3': 'Obras',
  '21': 'Gestion servicios', '22': 'Concesion obras',
  '31': 'Concesion servicios', '32': 'Concesion obra',
  '7':  'Administrativo especial', '8': 'Privado', '40': 'Mixto',
};

function mapEstado(code) {
  // SyndicationContractFolderStatusCode: PUB/EV/ADJ/RES/ANUL/PRE
  return code ?? null;
}

function toNum(x) {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toISODate(x) {
  if (!x) return null;
  const s = String(x);
  // Accept ISO-ish: 2025-03-12 or 2025-03-12T10:00:00+01:00
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function pickText(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return String(obj);
  if ('#text' in obj) return String(obj['#text']);
  return null;
}

// ─── Unzip (pure-JS, portable across Windows/Linux/macOS) ───────────────
function unzipTo(zipPath, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, /* overwrite */ true);
}

// ─── entry extractor ─────────────────────────────────────────────────────
function extractLicitacion(entry, sourceFile) {
  const id = entry.id;
  if (!id) return null;

  const link = Array.isArray(entry.link)
    ? entry.link.find((l) => l['@_rel'] !== 'self')?.['@_href']
    : entry.link?.['@_href'];

  const cfs = entry['cac-place-ext:ContractFolderStatus'] ?? {};
  const contractingParty = cfs['cac-place-ext:LocatedContractingParty'] ?? {};
  const party = contractingParty['cac:Party'] ?? {};
  const partyName = party['cac:PartyName']?.[0]?.['cbc:Name']
                 ?? party['cac:PartyName']?.['cbc:Name']
                 ?? null;

  const addr = contractingParty['cbc:ParentLocality'] ?? null;

  const project = cfs['cac:ProcurementProject'] ?? {};
  const typeCode = pickText(project['cbc:TypeCode']) ?? project['cbc:TypeCode'] ?? null;
  const budget   = project['cac:BudgetAmount'] ?? {};
  const location = project['cac:RealizedLocation'] ?? {};

  const cpvs = [];
  const cpvNodes = project['cac:RequiredCommodityClassification'];
  const cpvArr   = Array.isArray(cpvNodes) ? cpvNodes : (cpvNodes ? [cpvNodes] : []);
  for (const node of cpvArr) {
    const code = node['cbc:ItemClassificationCode'];
    if (Array.isArray(code)) {
      for (const c of code) cpvs.push(pickText(c) ?? String(c));
    } else if (code) {
      cpvs.push(pickText(code) ?? String(code));
    }
  }

  const estado = mapEstado(pickText(cfs['cbc-place-ext:ContractFolderStatusCode']));
  const tender = cfs['cac:TenderingProcess'] ?? {};
  const tenderPeriod = tender['cac:TenderSubmissionDeadlinePeriod'] ?? {};
  const fechaLimite = toISODate(tenderPeriod['cbc:EndDate']);

  const tenderResultsRaw = cfs['cac:TenderResult'];
  const tenderResults = Array.isArray(tenderResultsRaw)
    ? tenderResultsRaw
    : (tenderResultsRaw ? [tenderResultsRaw] : []);

  const fechaAdj = tenderResults[0]
    ? toISODate(tenderResults[0]['cbc:AwardDate'])
    : null;

  const formalization = cfs['cac:ContractFormalization'] ?? {};
  const fechaForm = toISODate(formalization['cbc:IssueDate']);

  const fechaPub = toISODate(entry.updated) || toISODate(entry.published);

  const importeEstimado  = toNum(pickText(budget['cbc:EstimatedOverallContractAmount']) ?? budget['cbc:EstimatedOverallContractAmount']);
  const importeBase      = toNum(pickText(budget['cbc:TaxExclusiveAmount']) ?? budget['cbc:TaxExclusiveAmount']);
  const importeAdj       = tenderResults[0]
    ? toNum(pickText(tenderResults[0]['cbc:TotalAmount']) ?? tenderResults[0]['cbc:TotalAmount'])
    : null;

  const fundingNode = cfs['cac-place-ext:FundingProgram'] ?? project['cac-place-ext:FundingProgram'];
  const financiacion_ue = fundingNode ? 1 : 0;
  const programa_ue = fundingNode
    ? (pickText(fundingNode['cbc:FundingProgramCode']) ?? pickText(fundingNode['cbc:Description']) ?? null)
    : null;

  const summary = typeof entry.summary === 'object' ? pickText(entry.summary) : entry.summary;

  return {
    licitacion: {
      id,
      expediente: pickText(cfs['cbc:ContractFolderID']) ?? cfs['cbc:ContractFolderID'] ?? null,
      uuid_ted:   pickText(cfs['cbc:UUID']) ?? null,
      deeplink:   link ?? id,
      titulo:     String(pickText(entry.title) ?? entry.title ?? '').slice(0, 500),
      resumen:    summary ?? null,

      organo_nombre: partyName,
      organo_nif:    pickText(party['cac:PartyIdentification']?.['cbc:ID']) ?? null,
      organo_tipo_codigo: pickText(contractingParty['cbc:ContractingPartyTypeCode']) ?? null,
      organo_actividad_codigo: pickText(contractingParty['cbc:ActivityCode']) ?? null,

      tipo_contrato: tipoContratoMap[String(typeCode)] ?? null,
      tipo_contrato_codigo: typeCode ? String(typeCode) : null,
      procedimiento: pickText(tender['cbc:ProcedureCode']) ?? null,

      importe_estimado: importeEstimado,
      importe_base:     importeBase,
      importe_adjudicado: importeAdj,
      iva_incluido:     null,
      plazo_ejecucion_meses: null,

      provincia_codigo: pickText(location['cbc:CountrySubentityCode']) ?? null,
      provincia_nombre: pickText(location['cbc:CountrySubentity']) ?? null,
      ciudad: pickText(location['cbc:CityName']) ?? null,
      ciudad_ine: null,
      poblacion_ine: null,

      fecha_publicacion: fechaPub,
      fecha_limite_ofertas: fechaLimite,
      fecha_adjudicacion: fechaAdj,
      fecha_formalizacion: fechaForm,
      fecha_ultima_actualizacion: toISODate(entry.updated),

      dias_aviso: daysBetween(fechaPub, fechaLimite),
      estado_actual: estado,

      financiacion_ue,
      programa_ue,
    },
    cpvs,
    winners: tenderResults.flatMap((tr) => {
      const wp = tr['cac:WinningParty'];
      const winners = Array.isArray(wp) ? wp : (wp ? [wp] : []);
      return winners.map((w) => ({
        empresa_nombre: pickText(w['cac:PartyName']?.[0]?.['cbc:Name']) ?? pickText(w['cac:PartyName']?.['cbc:Name']) ?? 'desconocido',
        empresa_nif:    pickText(w['cac:PartyIdentification']?.['cbc:ID']) ?? null,
        oferta_economica: toNum(pickText(tr['cbc:TotalAmount']) ?? tr['cbc:TotalAmount']),
      }));
    }),
  };
}

// ─── prepared statements ─────────────────────────────────────────────────
const upsertLic = db.prepare(`
  INSERT INTO licitaciones (
    id, expediente, uuid_ted, deeplink, titulo, resumen,
    organo_nombre, organo_nif, organo_tipo_codigo, organo_actividad_codigo,
    tipo_contrato, tipo_contrato_codigo, procedimiento,
    importe_estimado, importe_base, importe_adjudicado, iva_incluido, plazo_ejecucion_meses,
    provincia_codigo, provincia_nombre, ciudad, ciudad_ine, poblacion_ine,
    fecha_publicacion, fecha_limite_ofertas, fecha_adjudicacion, fecha_formalizacion, fecha_ultima_actualizacion,
    dias_aviso, estado_actual,
    financiacion_ue, programa_ue,
    updated_at
  ) VALUES (
    @id, @expediente, @uuid_ted, @deeplink, @titulo, @resumen,
    @organo_nombre, @organo_nif, @organo_tipo_codigo, @organo_actividad_codigo,
    @tipo_contrato, @tipo_contrato_codigo, @procedimiento,
    @importe_estimado, @importe_base, @importe_adjudicado, @iva_incluido, @plazo_ejecucion_meses,
    @provincia_codigo, @provincia_nombre, @ciudad, @ciudad_ine, @poblacion_ine,
    @fecha_publicacion, @fecha_limite_ofertas, @fecha_adjudicacion, @fecha_formalizacion, @fecha_ultima_actualizacion,
    @dias_aviso, @estado_actual,
    @financiacion_ue, @programa_ue,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT(id) DO UPDATE SET
    titulo = excluded.titulo,
    resumen = excluded.resumen,
    importe_adjudicado = COALESCE(excluded.importe_adjudicado, licitaciones.importe_adjudicado),
    fecha_adjudicacion = COALESCE(excluded.fecha_adjudicacion, licitaciones.fecha_adjudicacion),
    fecha_formalizacion = COALESCE(excluded.fecha_formalizacion, licitaciones.fecha_formalizacion),
    fecha_ultima_actualizacion = excluded.fecha_ultima_actualizacion,
    estado_actual = excluded.estado_actual,
    updated_at = CURRENT_TIMESTAMP
`);

const getEstadoPrev = db.prepare(`SELECT estado_actual FROM licitaciones WHERE id = ?`);

const insSnapshot = db.prepare(`
  INSERT INTO snapshots_estado (licitacion_id, estado, fecha, fuente_atom)
  VALUES (?, ?, ?, ?)
`);

const delCpvs = db.prepare(`DELETE FROM licitacion_cpvs WHERE licitacion_id = ?`);
const insCpv  = db.prepare(`INSERT OR IGNORE INTO licitacion_cpvs (licitacion_id, cpv_code) VALUES (?, ?)`);

const insLicitador = db.prepare(`
  INSERT INTO licitadores (licitacion_id, empresa_nif, empresa_nombre, rol, oferta_economica)
  VALUES (?, ?, ?, 'adjudicataria', ?)
`);

const markIngested = db.prepare(`
  INSERT INTO ingest_log (atom_file, entries_parsed, entries_new, entries_updated, entries_deleted)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(atom_file) DO UPDATE SET
    processed_at = CURRENT_TIMESTAMP,
    entries_parsed = excluded.entries_parsed,
    entries_new = excluded.entries_new,
    entries_updated = excluded.entries_updated,
    entries_deleted = excluded.entries_deleted
`);

const alreadyProcessed = db.prepare(`SELECT 1 FROM ingest_log WHERE atom_file = ?`);

// ─── main ────────────────────────────────────────────────────────────────
function processAtomFile(atomPath, sourceLabel) {
  const xml = fs.readFileSync(atomPath, 'utf8');
  const parsed = parser.parse(xml);
  const feed = parsed.feed ?? parsed;
  const entries = feed.entry ?? [];
  const arr = Array.isArray(entries) ? entries : [entries];

  let parsed_n = 0, newn = 0, upd = 0;
  const tx = db.transaction((batch) => {
    for (const entry of batch) {
      parsed_n++;
      const data = extractLicitacion(entry, sourceLabel);
      if (!data) continue;

      const prev = getEstadoPrev.get(data.licitacion.id);
      const isNew = !prev;

      upsertLic.run(data.licitacion);
      if (isNew) newn++;
      else upd++;

      // snapshot state transitions
      if (!prev || prev.estado_actual !== data.licitacion.estado_actual) {
        if (data.licitacion.estado_actual) {
          insSnapshot.run(
            data.licitacion.id,
            data.licitacion.estado_actual,
            data.licitacion.fecha_ultima_actualizacion ?? data.licitacion.fecha_publicacion ?? new Date().toISOString().slice(0, 10),
            sourceLabel,
          );
        }
      }

      // refresh CPVs
      delCpvs.run(data.licitacion.id);
      for (const cpv of data.cpvs) insCpv.run(data.licitacion.id, cpv);

      // winners (only when RES/ADJ and we have a winner name)
      if (['RES', 'ADJ'].includes(data.licitacion.estado_actual)) {
        for (const w of data.winners) {
          if (!w.empresa_nombre || w.empresa_nombre === 'desconocido') continue;
          insLicitador.run(data.licitacion.id, w.empresa_nif, w.empresa_nombre, w.oferta_economica);
        }
      }
    }
  });
  tx(arr);

  markIngested.run(sourceLabel, parsed_n, newn, upd, 0);
  return { parsed_n, newn, upd };
}

function processZip(zipPath) {
  const month = path.basename(zipPath).match(/_(\d{6})\.zip$/)?.[1];
  if (!month) return null;

  // Resume safely: skip month whose head atom was already processed.
  const headAtom = `licitacionesPerfilesContratanteCompleto3.atom__${month}`;
  if (alreadyProcessed.get(headAtom)) {
    console.log(`  ${month} already ingested, skipping`);
    return null;
  }

  const workMonth = path.join(WORK_DIR, month);
  if (fs.existsSync(workMonth)) fs.rmSync(workMonth, { recursive: true, force: true });
  fs.mkdirSync(workMonth, { recursive: true });

  console.log(`  ${month} unzipping...`);
  unzipTo(zipPath, workMonth);

  const atomFiles = fs.readdirSync(workMonth).filter((f) => f.endsWith('.atom'));
  let total = { parsed_n: 0, newn: 0, upd: 0 };
  for (const af of atomFiles) {
    const label = `${af}__${month}`;
    const result = processAtomFile(path.join(workMonth, af), label);
    total.parsed_n += result.parsed_n;
    total.newn += result.newn;
    total.upd += result.upd;
  }
  markIngested.run(headAtom, total.parsed_n, total.newn, total.upd, 0);

  // clean working dir
  fs.rmSync(workMonth, { recursive: true, force: true });
  return total;
}

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`No raw dir: ${RAW_DIR}. Run placsp-download.mjs first.`);
    process.exit(1);
  }

  let zips = fs.readdirSync(RAW_DIR)
    .filter((f) => f.startsWith('licitacionesPerfilesContratanteCompleto3_') && f.endsWith('.zip'))
    .sort();

  if (args.month) zips = zips.filter((z) => z.includes(`_${args.month}.zip`));
  if (args.from || args.to) {
    zips = zips.filter((z) => {
      const m = z.match(/_(\d{6})\.zip$/)?.[1];
      if (!m) return false;
      if (args.from && m < args.from) return false;
      if (args.to && m > args.to) return false;
      return true;
    });
  }

  console.log(`Importing ${zips.length} monthly zip(s) into ${DB_FILE}`);
  const t0 = Date.now();
  let grand = { parsed_n: 0, newn: 0, upd: 0 };
  for (const z of zips) {
    const res = processZip(path.join(RAW_DIR, z));
    if (res) {
      console.log(`    parsed=${res.parsed_n}  new=${res.newn}  updated=${res.upd}`);
      grand.parsed_n += res.parsed_n;
      grand.newn += res.newn;
      grand.upd += res.upd;
    }
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${secs}s.  parsed=${grand.parsed_n}  new=${grand.newn}  updated=${grand.upd}`);
}

main();
