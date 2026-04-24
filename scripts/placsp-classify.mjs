/**
 * PLACSP classifier
 *
 * Asigna `categoria_emov`, `subcategoria`, `tiene_infra_recarga`, `tags` y
 * `confianza_clasificacion` a cada fila de `licitaciones`, usando la taxonomía
 * v3 (11 categorías) acordada con el cliente.
 *
 * Reglas:
 *   - Precedencia top-down: la primera categoría que matchea gana.
 *   - Basado en (CPV + keywords en título + keywords en resumen).
 *   - Exclusiones hard-filter aplicadas antes de clasificar.
 *
 * Usage:
 *   node scripts/placsp-classify.mjs               # todo
 *   node scripts/placsp-classify.mjs --only-new    # solo filas sin categoria_emov
 *   node scripts/placsp-classify.mjs --id=<id>     # una específica (debug)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = path.join(__dirname, '..', 'data', 'licitaciones.db');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const db = new Database(DB_FILE);

// ─── CPV sets ────────────────────────────────────────────────────────────
const CPV_CARGADORES  = new Set(['31158000', '31158100', '31681500']); // stronger signal
const CPV_VE_TURISMO  = new Set(['34144900']);                         // electric cars/vans
const CPV_BUS_ELEC    = new Set(['34144910']);                         // electric buses
const CPV_INSTALACION = new Set(['45315600', '45315300', '45317000', '45317300', '45310000', '45311000']);
const CPV_INGENIERIA  = new Set(['71240000', '71310000', '71317200', '71356200', '71541000']);
const CPV_SOFTWARE    = new Set(['48421000', '65320000']);
const CPV_MANT        = new Set(['50232100', '50532000']);

// ─── Keyword regexes ─────────────────────────────────────────────────────
const KW = {
  // infra de recarga — señal primaria
  tiene_infra: /(punto[s]? de recarga|puesto[s]? de recarga|infraestructura de recarga|estaci[óo]n(es)? de recarga|recarga r[áa]pida|recarga (semi)?r[áa]pida|puntos? de carga|wallbox|electrolinera|cargador(es)? el[éa]ctric|cargador(es)? para veh[íi]culo|cargador(es)? (de )?veh[íi]culo[s]? el[éa]ctric|recarga energ[ée]tica.*veh[íi]culo|carg[áa]ndolos?)/i,

  // cat 1 — concesión demanial / arrendamiento para recarga
  concesion_recarga: /(concesi[óo]n demanial|concesi[óo]n administrativa|concesi[óo]n de dominio p[úu]blico|concesi[óo]n de uso privativo|concurrencia competitiva de uso com[úu]n especial|arrendamiento.*(plazas?|espacios?|parcela).*(recarga|veh[íi]culo[s]? el[éa]ctric)|uso privativo.*(v[íi]a p[úu]blica|dominio p[úu]blico|parcela).*(recarga|veh[íi]culo[s]? el[éa]ctric|estaci[óo]n de recarga)|electrolinera)/i,

  // cat 2 — obra/instalación
  obra_recarga: /(obra[s]?|ejecuci[óo]n de obra|instalaci[óo]n).*(punto[s]? de recarga|infraestructura de recarga|cargador(es)? el[éa]ctric|estaci[óo]n(es)? de recarga)/i,

  // cat 3 — ingeniería/proyecto
  ingenieria: /(redacci[óo]n.*proyecto|proyecto ejecutivo|direcci[óo]n facultativa|coordinaci[óo]n de seguridad y salud|asistencia t[ée]cnica)/i,

  // cat 4 — suministro hardware (cargador)
  suministro_cargadores: /(suministro|adquisici[óo]n).*(cargador(es)? el[éa]ctric|punto[s]? de recarga|estaci[óo]n(es)? de recarga|wallbox)/i,

  // cat 5 — software/plataforma gestión recarga
  software_recarga: /(plataforma.*gesti[óo]n|software|soluci[óo]n saas|verificaci[óo]n.*autorizaci[óo]n.*recarga|facturaci[óo]n.*recarga|gesti[óo]n.*cobro.*recarga)/i,

  // cat 6 — compra/renting de VE (flota, turismos/furgonetas/camiones)
  compra_ve: /(suministro|adquisici[óo]n|renting|arrendamiento|alquiler|compra|contrataci[óo]n).*(veh[íi]culo[s]?[^.]{0,30}el[éa]ctric|coche[s]?[^.]{0,20}el[éa]ctric|furgoneta[s]?[^.]{0,30}el[éa]ctric|furg[óo]n[^.]{0,30}el[éa]ctric|turismo[s]?[^.]{0,20}el[éa]ctric|cami[óo]n[^.]{0,30}el[éa]ctric|dumper[^.]{0,20}el[éa]ctric|pick[-\s]?up[^.]{0,20}(el[éa]ctric|h[íi]brid)|h[íi]brid[oa][s]?\s+enchufable|\b100\s*%\s*el[éa]ctric)/i,

  // cat 7 — bus eléctrico (soporta plural "autobuses", adjetivos intermedios)
  bus_electrico: /(autob[úu]s(es)?[^.]{0,30}(el[éa]ctric|h[íi]brid)|\bbus(es)?\s+[^.]{0,20}el[éa]ctric|minib[úu]s[^.]{0,20}el[éa]ctric|microb[úu]s[^.]{0,20}el[éa]ctric|flota.*bus.*el[éa]ctric)/i,

  // cat 8 — gestión/mantenimiento red recarga
  mantenimiento_recarga: /(mantenimiento|gesti[óo]n|operaci[óo]n|explotaci[óo]n).*(punto[s]? de recarga|red.*recarga|cargadores?|infraestructura de recarga)/i,

  // cat 9 — micromovilidad eléctrica
  micromovilidad: /(bici[s]? el[éa]ctric|patinete[s]? el[éa]ctric|aparcabici|carsharing.*el[éa]ctric|bicicleta[s]? el[éa]ctric|anclaje.*bicicleta)/i,

  // cat 10 — mixto FV + recarga
  fv_recarga: /((fotovoltaica|panel(es)? solar|aerot[ée]rmica|p[ée]rgola.*fotovoltaica|marquesina.*fotovoltaica).*(recarga|punto[s]? de carga))|((recarga|punto[s]? de carga).*(fotovoltaica|panel(es)? solar))/i,

  // cat 11 — mantenimiento flota eléctrica
  mant_flota_ev: /(mantenimiento|reparaci[óo]n).*(veh[íi]culo[s]? el[éa]ctric|flota.*el[éa]ctric)/i,

  // keyword para VE genérica (apoyo)
  ve_generico: /(veh[íi]culo[s]?[^.]{0,30}el[éa]ctric|coche[s]?[^.]{0,20}el[éa]ctric|furgoneta[s]?[^.]{0,30}el[éa]ctric|furg[óo]n[^.]{0,30}el[éa]ctric|turismo[s]?[^.]{0,20}el[éa]ctric|cami[óo]n[^.]{0,30}el[éa]ctric|h[íi]brid[oa][s]?\s+enchufable|100\s*%\s*el[éa]ctric)/i,

  // ─── EXCLUSIONES HARD (NO e-mov aunque haya match) ─────────────────────
  excl_dispositivos_moviles: /recarga.*(dispositivo[s]? m[óo]vil|tel[ée]fon|m[óo]vil(es)?$)|banco[s]?.*paneles?.*solar.*recarga.*m[óo]vil/i,
  excl_toner:                /(recarga.*(t[óo]ner|cartuch)|cartuchos? recarga)/i,
  excl_extintores:           /recarga.*extintor|extintor(es)?.*recarga/i,
  excl_cargador_bateria:     /cargador(es)? de bater[íi]as?(?!.*veh[íi]culo.*el[éa]ctric)/i, // solo si no es para VE
  excl_carretillas:          /cargador(es)?.*carretilla|carretilla elevadora|apilador.*carga/i,
  excl_sais_ups:             /sai(s)?|ups[\s:]|sistemas? de alimentaci[óo]n ininterrumpida/i,
  excl_no_espana:            /null/, // placeholder — la exclusión de país se hace por provincia (si no tiene provincia ES, fuera)
};

// ─── Clasificador ────────────────────────────────────────────────────────
function clasificar(lic, cpvs, cpvSet) {
  const titulo = (lic.titulo ?? '').toLowerCase();
  const resumen = (lic.resumen ?? '').toLowerCase();
  const text = `${titulo}\n${resumen}`;

  const tags = [];

  // ── exclusiones hard ──
  if (KW.excl_dispositivos_moviles.test(text)) return { categoria_emov: 'no_emov', subcategoria: 'dispositivos_moviles', confianza: 0.95, tags, tiene_infra_recarga: 0 };
  if (KW.excl_toner.test(text))                return { categoria_emov: 'no_emov', subcategoria: 'toner', confianza: 0.99, tags, tiene_infra_recarga: 0 };
  if (KW.excl_extintores.test(text))           return { categoria_emov: 'no_emov', subcategoria: 'extintores', confianza: 0.99, tags, tiene_infra_recarga: 0 };
  if (KW.excl_carretillas.test(text))          return { categoria_emov: 'no_emov', subcategoria: 'carretillas', confianza: 0.95, tags, tiene_infra_recarga: 0 };

  // Cargadores de baterías genéricos sin VE → fuera
  if (KW.excl_cargador_bateria.test(text) && !KW.ve_generico.test(text) && !KW.tiene_infra.test(text)) {
    return { categoria_emov: 'no_emov', subcategoria: 'baterias_genericas', confianza: 0.85, tags, tiene_infra_recarga: 0 };
  }

  // Camiones basura (34144511/34144512) solo si son eléctricos → si no, fuera del universo e-mov
  const isCamionBasura = cpvs.includes('34144511') || cpvs.includes('34144512');
  const isElectricoEnTitulo = KW.ve_generico.test(text) || /el[éa]ctric|100% el[éa]ctric|biogas|gnc|biometano/i.test(text);
  if (isCamionBasura && !isElectricoEnTitulo) {
    return { categoria_emov: 'no_emov', subcategoria: 'camion_basura_no_electrico', confianza: 0.9, tags, tiene_infra_recarga: 0 };
  }

  // ── detector de infraestructura de recarga ──
  const tieneInfraRecarga =
    (cpvs.some((c) => CPV_CARGADORES.has(c)) || KW.tiene_infra.test(text)) ? 1 : 0;

  if (financiacionEU(text)) tags.push('next_generation');
  if (/dus[\s]*5000/i.test(text)) tags.push('dus5000');
  if (/pstd|plan de sostenibilidad tur[ií]stica/i.test(text)) tags.push('pstd');
  if (/moves[\s]?iii/i.test(text)) tags.push('moves_iii');
  if (/pipra/i.test(text)) tags.push('aena_pipra');

  // ── clasificación por precedencia ──
  // cat 1: concesión demanial para recarga
  if (KW.concesion_recarga.test(text) && (tieneInfraRecarga || /recarga|cargador(es)? el[éa]ctric/i.test(text))) {
    const sub = /arrendamiento/i.test(text) ? 'arrendamiento_espacio'
            : /concesi[óo]n administrativa/i.test(text) ? 'concesion_administrativa'
            : 'demanial_puro';
    return { categoria_emov: '1', subcategoria: sub, confianza: 0.92, tags, tiene_infra_recarga: 1 };
  }

  // cat 2: obra/instalación
  if ((KW.obra_recarga.test(text)) ||
      (cpvs.some((c) => CPV_INSTALACION.has(c)) && KW.tiene_infra.test(text))) {
    return { categoria_emov: '2', subcategoria: 'obra_instalacion', confianza: 0.9, tags, tiene_infra_recarga: 1 };
  }

  // cat 3: ingeniería
  if (KW.ingenieria.test(text) && KW.tiene_infra.test(text)) {
    return { categoria_emov: '3', subcategoria: 'ingenieria_proyecto', confianza: 0.88, tags, tiene_infra_recarga: 1 };
  }

  // cat 10: FV + recarga (mixto) — antes de suministro puro
  if (KW.fv_recarga.test(text)) {
    return { categoria_emov: '10', subcategoria: 'fv_mas_recarga', confianza: 0.85, tags, tiene_infra_recarga: 1 };
  }

  // cat 4: suministro cargadores
  if ((cpvs.some((c) => CPV_CARGADORES.has(c)) || KW.suministro_cargadores.test(text)) && !KW.compra_ve.test(text)) {
    return { categoria_emov: '4', subcategoria: 'suministro_hw', confianza: 0.88, tags, tiene_infra_recarga: 1 };
  }

  // cat 5: software
  if (KW.software_recarga.test(text) && /recarga|veh[íi]culo[s]? el[éa]ctric/i.test(text)) {
    return { categoria_emov: '5', subcategoria: 'plataforma_gestion', confianza: 0.9, tags, tiene_infra_recarga: 0 };
  }

  // cat 7: bus eléctrico
  if (cpvs.some((c) => CPV_BUS_ELEC.has(c)) || KW.bus_electrico.test(text)) {
    return { categoria_emov: '7', subcategoria: 'autobus_electrico', confianza: 0.92, tags, tiene_infra_recarga: tieneInfraRecarga };
  }

  // cat 11: mantenimiento flota eléctrica
  if (KW.mant_flota_ev.test(text)) {
    return { categoria_emov: '11', subcategoria: 'mantenimiento_flota', confianza: 0.8, tags, tiene_infra_recarga: 0 };
  }

  // cat 8: mantenimiento red recarga
  if (KW.mantenimiento_recarga.test(text)) {
    return { categoria_emov: '8', subcategoria: 'mantenimiento_red', confianza: 0.85, tags, tiene_infra_recarga: 1 };
  }

  // cat 9: micromovilidad
  if (KW.micromovilidad.test(text)) {
    return { categoria_emov: '9', subcategoria: 'micromovilidad', confianza: 0.88, tags, tiene_infra_recarga: tieneInfraRecarga };
  }

  // cat 6: compra/renting VE (al final porque es el más genérico)
  // Regla: CPV 34144900 por sí solo NO es señal suficiente — se usa mal por muchos órganos
  // como "cualquier vehículo municipal". Requiere confirmación por keyword o por mención
  // explícita de tecnología eléctrica/híbrida en título o resumen.
  const mencionEvExplicita = /(el[éa]ctric|h[íi]brid|phev|bev|100\s*%\s*el|cero\s+emisiones|zero\s+emission|enchufable|plug[-\s]?in)/i.test(text);
  const cpvVeFuerte = cpvs.some((c) => CPV_VE_TURISMO.has(c)) && mencionEvExplicita;

  if (cpvVeFuerte || KW.compra_ve.test(text)) {
    // subtipo: turismo/furgoneta vs camión/limpieza vs maquinaria
    const sub = /cami[óo]n|recolector|basura|volquete|grua/i.test(text) ? '6b_camiones'
             : /dumper|retroexcavadora|carretilla|maquinaria/i.test(text)  ? '6c_maquinaria'
             : '6a_turismos_furgonetas';
    return { categoria_emov: '6', subcategoria: sub, confianza: 0.82, tags, tiene_infra_recarga: tieneInfraRecarga };
  }

  // Fallback: si tiene infra recarga pero no cayó en ninguna → "otros e-mov"
  if (tieneInfraRecarga) {
    return { categoria_emov: '10', subcategoria: 'otros_emov', confianza: 0.6, tags, tiene_infra_recarga: 1 };
  }

  return { categoria_emov: 'no_emov', subcategoria: null, confianza: 0.99, tags: [], tiene_infra_recarga: 0 };
}

function financiacionEU(text) {
  return /(next[\s]?generation|nextgeneration|mecanismo de recuperaci[óo]n|plan de recuperaci[óo]n|feder|fondos europeos)/i.test(text);
}

// ─── main ────────────────────────────────────────────────────────────────
function main() {
  const whereOnlyNew = args['only-new'] ? 'WHERE categoria_emov IS NULL' : '';
  const whereOneId   = args.id ? `WHERE id = '${args.id.replace(/'/g, "''")}'` : '';
  const where = whereOneId || whereOnlyNew;

  const rows = db.prepare(`
    SELECT l.id, l.titulo, l.resumen, l.tipo_contrato_codigo, l.estado_actual,
           l.provincia_codigo,
           (SELECT GROUP_CONCAT(cpv_code) FROM licitacion_cpvs WHERE licitacion_id = l.id) AS cpvs_str
    FROM licitaciones l
    ${where}
  `).all();

  console.log(`Classifying ${rows.length} rows...`);
  const upd = db.prepare(`
    UPDATE licitaciones SET
      categoria_emov = ?,
      subcategoria = ?,
      confianza_clasificacion = ?,
      tags = ?,
      tiene_infra_recarga = ?
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    const counts = {};
    for (const r of rows) {
      const cpvs = r.cpvs_str ? r.cpvs_str.split(',') : [];
      const cpvSet = new Set(cpvs);
      const result = clasificar(
        { titulo: r.titulo, resumen: r.resumen, tipo_contrato_codigo: r.tipo_contrato_codigo },
        cpvs, cpvSet,
      );
      upd.run(
        result.categoria_emov,
        result.subcategoria ?? null,
        result.confianza,
        JSON.stringify(result.tags),
        result.tiene_infra_recarga,
        r.id,
      );
      counts[result.categoria_emov] = (counts[result.categoria_emov] || 0) + 1;
    }
    return counts;
  });

  const counts = tx();
  console.log('\nDistribution:');
  for (const [cat, n] of Object.entries(counts).sort()) {
    console.log(`  ${cat.padEnd(10)} ${n}`);
  }
  console.log('\nDone.');
}

main();
