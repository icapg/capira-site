/**
 * ANFAC MCP Server — Especialista en datos de matriculaciones ANFAC
 *
 * Fuente: https://anfac.com (Asociación Española de Fabricantes de Automóviles y Camiones)
 * Usa el feed RSS de la categoría "vehiculo-alternativo" para descubrir artículos
 * y extrae métricas de BEV / PHEV / HEV / Gas del contenido completo (content:encoded).
 *
 * Diferencias clave ANFAC vs DGT:
 * - ANFAC solo cubre turismos + vcl comerciales (no todos los vehículos como DGT)
 * - Reporta 2-3 días después de cierre de mes
 * - Los números pueden diferir ligeramente de DGT (distinto criterio de contabilización)
 * - ANFAC incluye MHEV (mild hybrid) como subcategoría de HEV
 * - No distingue BEV de turismos vs comerciales (dato total de mercado)
 *
 * Herramientas expuestas:
 *   get_latest_report            — último informe mensual EV (BEV/PHEV/HEV/Gas)
 *   get_report_by_period         — informe EV de un mes concreto (ej: "2026-03")
 *   list_reports                 — lista de informes disponibles
 *   get_charging_infra           — último dato trimestral de puntos de recarga
 *   get_total_market_report      — total turismos + VCL + industriales del mes
 *   get_total_market_by_period   — total mercado de un mes concreto
 */

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ─────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────

const RSS_EV_URL      = 'https://anfac.com/category/vehiculo-alternativo/feed/';
const RSS_MAT_URL     = 'https://anfac.com/category/actualidad/notas-de-matriculacion/feed/';
const RSS_CHARGING_URL = 'https://anfac.com/category/vehiculo-alternativo/feed/';

const MONTHS_ES = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};
const MONTHS_NUM = Object.fromEntries(Object.entries(MONTHS_ES).map(([k, v]) => [v, k]));

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Parsea número en formato español: "28.955" → 28955, "62,5" → 62.5 */
function pn(str) {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

/** Fetch con User-Agent */
async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; capira-insights-bot/1.0)',
      'Accept': 'application/rss+xml,application/xml,text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

/** Elimina tags HTML y normaliza espacios */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#038;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convierte pubDate RSS a YYYY-MM */
function pubDateToPeriod(pubDate) {
  if (!pubDate) return null;
  // "Mon, 02 Mar 2026 ..."
  const m = pubDate.match(/\d+ (\w+) (\d{4})/);
  if (!m) return null;
  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  return `${m[2]}-${monthMap[m[1]] || '??'}`;
}

// ─────────────────────────────────────────────────────────────────
// Parser RSS
// ─────────────────────────────────────────────────────────────────

/** Extrae el período de referencia del texto del artículo (no la fecha de publicación).
 *  ANFAC publica en abril los datos de marzo, etc.
 */
/** Extrae el período de referencia del artículo (mes de datos, no de publicación).
 *  Prioridad: título > contenido. ANFAC publica en abril los datos de marzo, etc.
 */
function extractPeriodoFromContent(title, content, pubDate) {
  const pubYear = pubDate.match(/\d{4}/)?.[0] || '';
  const pubPeriod = pubDateToPeriod(pubDate);
  const pubMon = pubPeriod?.split('-')[1] || '12';

  // ── Primero buscar en el TÍTULO ──
  // "en marzo, con 28.955 unidades" → mes sin año, inferir
  let m = title.match(
    /(?:en|de|hasta|durante)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/i
  );
  if (m) {
    const mes = MONTHS_ES[m[1].toLowerCase()];
    if (m[2]) return `${m[2]}-${mes}`;
    // Sin año: si el mes < mes de publicación → mismo año; si mayor → año anterior
    const year = mes <= pubMon ? pubYear : String(parseInt(pubYear) - 1);
    return `${year}-${mes}`;
  }

  // ── Fallback: buscar en contenido (evitar la dateline "Madrid, X de MES de AÑO") ──
  const text = stripHtml(content);
  // Ignorar la primera frase (dateline) y buscar en el resto
  const bodyText = text.replace(/^[^.!?]+[.!?]\s*/, '').substring(0, 400);
  m = bodyText.match(
    /(?:en|durante)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i
  );
  if (m) return `${m[2]}-${MONTHS_ES[m[1].toLowerCase()]}`;

  m = bodyText.match(
    /(?:en|durante)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i
  );
  if (m) {
    const mes = MONTHS_ES[m[1].toLowerCase()];
    const year = mes <= pubMon ? pubYear : String(parseInt(pubYear) - 1);
    return `${year}-${mes}`;
  }

  // Último fallback: pubDate
  return pubPeriod;
}

function parseRssItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map(m => {
    const raw = m[1];
    const title = stripHtml(raw.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '');
    const link  = (raw.match(/<link>(https?:\/\/[^<\s]+)/)?.[1] || '').replace(/\?utm_source.*/, '');
    const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const content = raw.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/)?.[1] || '';
    const description = stripHtml(raw.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || '');
    const periodo = extractPeriodoFromContent(title, content, pubDate);

    const isEV       = /electrificad|eléctric|híbrid/i.test(title);
    const isCCAA     = /CCAA/i.test(title);
    const isRecarga  = /recarga|electromovilidad|barómetro|barometro/i.test(title);
    const tipo = isEV && !isCCAA && !isRecarga ? 'mensual_ev' :
                 isRecarga ? 'recarga' :
                 isCCAA ? 'ccaa' : 'otro';

    return { title, link, pubDate, periodo, content, description, tipo };
  });
}

// ─────────────────────────────────────────────────────────────────
// Parser de métricas
// ─────────────────────────────────────────────────────────────────

function parseMetrics(content, pubDate) {
  const text = stripHtml(content);
  const m = {};

  // ── Total electrificados (BEV+PHEV) ──
  // "registran en marzo 28.955 unidades, un aumento del 62,5%"
  // "alcanzan en febrero 22.974 unidades, un aumento del 64,5%"
  let match = text.match(/(?:registran|alcanzan)\s+en\s+\w+\s+([\d.]+)\s+unidades[^.]*?(?:aumento|incremento|crecimiento)\s+del?\s+([\d,]+)%/i);
  if (match) { m.total_ev = pn(match[1]); m.total_ev_yoy_pct = pn(match[2]); }

  // Alternativa: "X.XXX nuevas ventas de vehículos electrificados"
  if (!m.total_ev) {
    match = text.match(/([\d.]+)\s+nuevas?\s+ventas?\s+de\s+vehículos?\s+electrificados/i);
    if (match) m.total_ev = pn(match[1]);
  }

  // Cuota total
  match = text.match(/cuota\s+de\s+mercado\s+de\s+los\s+vehículos?\s+electrificados[^.]*?([\d,]+)%/i);
  if (match) m.total_ev_cuota_pct = pn(match[1]);

  // YTD total
  match = text.match(/acumulado\s+del\s+año[^.]*?crecimiento\s+del?\s+([\d,]+)%[^.]*?([\d.]+)\s+unidades/i);
  if (!match) match = text.match(/(?:tres|doce|once|diez|nueve|ocho|siete|seis|cinco|cuatro|dos|primer(?:os?)?)\s+primeros?\s+meses\s+(?:del?\s+año\s+)?(?:alcanzan|registran)\s+(?:un\s+)?(?:crecimiento|incremento)\s+del?\s+([\d,]+)%[^.]*?([\d.]+)\s+unidades/i);
  if (match) { m.ytd_ev_yoy_pct = pn(match[1]); m.ytd_ev = pn(match[2]); }

  // ── BEV (eléctricos puros) ──
  // "eléctricos puros aumentaron un 42,2% en marzo de 2026, con 13.125 unidades matriculadas"
  match = text.match(/(?:eléctricos?\s+puros?|vehículos?\s+eléctricos?\s+puros?)[^.]*?(?:un\s+)?([\d,]+)%[^.]*?con\s+([\d.]+)\s+unidades\s+matriculadas/i);
  if (match) { m.bev_yoy_pct = pn(match[1]); m.bev = pn(match[2]); }

  // Fallback BEV: "eléctricos puros (BEV) crecen un X% con Y unidades"
  if (!m.bev) {
    match = text.match(/eléctricos?\s+puros?\s+\(BEV\)[^.]*?(?:un\s+)?([\d,]+)%\s+con\s+([\d.]+)\s+unidades/i);
    if (match) { m.bev_yoy_pct = pn(match[1]); m.bev = pn(match[2]); }
  }

  // Cuota BEV
  match = text.match(/(?:bev|eléctricos?\s+puros?)[^.]*?([\d,]+)%\s+(?:del\s+total|del\s+mercado)/i);
  if (match) m.bev_cuota_pct = pn(match[1]);

  // YTD BEV
  match = text.match(/tipología\s+alcanza\s+las\s+([\d.]+)\s+unidades[^.]*?un\s+([\d,]+)%\s+más/i);
  if (match) { m.ytd_bev = pn(match[1]); m.ytd_bev_yoy_pct = pn(match[2]); }

  // ── PHEV (híbridos enchufables) ──
  // "híbridos enchufables crecieron un 84,4% durante marzo y alcanzan las 15.830 unidades matriculadas"
  match = text.match(/híbridos?\s+enchufables?[^.]*?(?:un\s+)?([\d,]+)%[^.]*?(?:las\s+)?([\d.]+)\s+unidades\s+matriculadas/i);
  if (match) { m.phev_yoy_pct = pn(match[1]); m.phev = pn(match[2]); }

  // YTD PHEV: "Los tres primeros meses del año alcanzan 37.925 unidades vendidas, un 79,7% más"
  match = text.match(/(?:tres|doce|once|diez|nueve|ocho|siete|seis|cinco|cuatro|dos|primeros?)\s+(?:primeros?\s+)?meses[^.]*?([\d.]+)\s+unidades[^.]*?un\s+([\d,]+)%\s+más/i);
  if (match) { m.ytd_phev = pn(match[1]); m.ytd_phev_yoy_pct = pn(match[2]); }

  // ── HEV (híbridos no enchufables) ──
  // YoY: "Las ventas de vehículos híbridos no enchufables aumentan un 26,1% este mes"
  match = text.match(/híbridos?\s+no\s+enchufables?[^.]*?(?:un\s+)?([\d,]+)%/i);
  if (match) m.hev_yoy_pct = pn(match[1]);

  // Unidades: "se han matriculado 62.063 vehículos de esta tecnología durante el mes"
  match = text.match(/matriculado[s]?\s+([\d.]+)\s+vehículos?\s+de\s+esta\s+tecnología/i);
  if (match) m.hev = pn(match[1]);

  // Cuota HEV
  match = text.match(/con\s+el\s+([\d,]+)%\s+del\s+mercado[^.]*?(?:matriculado|esta\s+tecnología)/i);
  if (!match) match = text.match(/híbridos?\s+no\s+enchufables?[^.]*?([\d,]+)%\s+del\s+mercado/i);
  if (match) m.hev_cuota_pct = pn(match[1]);

  // YTD HEV
  match = text.match(/(?:híbridos?\s+no\s+enchufables?|esta\s+tecnología)[^.]*?acumulado[^.]*?([\d.]+)\s+unidades[^.]*?(?:crece?\s+un|que\s+crece)\s+([\d,]+)%/i);
  if (match) { m.ytd_hev = pn(match[1]); m.ytd_hev_yoy_pct = pn(match[2]); }

  // ── Gas ──
  // "Las ventas de vehículos de gas caen de nuevo con un 35% menos de ventas y 4.338 unidades matriculadas"
  match = text.match(/vehículos?\s+de\s+gas[^.]+?(?:un\s+)?([\d,]+)%\s+menos[^.]*?([\d.]+)\s+unidades/i);
  if (match) { m.gas_yoy_pct = -Math.abs(pn(match[1])); m.gas = pn(match[2]); }

  // Fallback gas positivo (si hay crecimiento)
  if (!m.gas) {
    match = text.match(/vehículos?\s+de\s+gas[^.]+?(?:un\s+)?([\d,]+)%[^.]*?([\d.]+)\s+unidades/i);
    if (match) { m.gas_yoy_pct = pn(match[1]); m.gas = pn(match[2]); }
  }

  // Cuota gas
  match = text.match(/(?:el\s+)?([\d,]+)%\s+del\s+mercado\s+total\s+del\s+mes[^.]*?gas|gas[^.]*?([\d,]+)%\s+del\s+mercado/i);
  if (match) m.gas_cuota_pct = pn(match[1] || match[2]);

  // ── Totales implícitos ──
  if (m.bev && m.phev && !m.total_ev) {
    m.total_ev_calculado = m.bev + m.phev;
  }

  return m;
}

// ─────────────────────────────────────────────────────────────────
// Funciones de negocio
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Parser de total mercado (turismos + VCL + industriales)
// ─────────────────────────────────────────────────────────────────

function parseTotalMarketMetrics(content, pubDate) {
  const text = stripHtml(content);
  const m = {};

  // ── Turismos total ──
  // "130.340 nuevas unidades, lo que supone un crecimiento del 11,7%"
  let match = text.match(/([\d.]+)\s+nuevas?\s+unidades\s*,\s*lo\s+que\s+supone\s+un\s+(?:crecimiento|incremento)\s+del?\s+([\d,]+)%/i);
  if (match) { m.turismos = pn(match[1]); m.turismos_yoy_pct = pn(match[2]); }

  // Fallback: "130.340 ventas de turismos, con un incremento del 11,7%"
  if (!m.turismos) {
    match = text.match(/([\d.]+)\s+ventas?\s+de\s+turismos?[^.]*?(?:incremento|crecimiento)\s+del?\s+([\d,]+)%/i);
    if (match) { m.turismos = pn(match[1]); m.turismos_yoy_pct = pn(match[2]); }
  }

  // YTD turismos: "300.529 unidades, lo que supone un 7,6% más durante estos tres primeros meses"
  match = text.match(/([\d.]+)\s+unidades\s*,\s*lo\s+que\s+supone\s+un\s+([\d,]+)%\s+más\s+durante\s+estos/i);
  if (match) { m.ytd_turismos = pn(match[1]); m.ytd_turismos_yoy_pct = pn(match[2]); }

  // Cuota electrificados sobre turismos: "el 20,5% de las ventas totales"
  match = text.match(/el\s+([\d,]+)%\s+de\s+las\s+ventas\s+totales/i);
  if (match) m.electrificados_turismos_cuota_pct = pn(match[1]);

  // Total electrificados turismos BEV+PHEV: "26.725 unidades y el 20"
  match = text.match(/([\d.]+)\s+unidades\s+y\s+el\s+([\d,]+)%\s+de\s+las\s+ventas/i);
  if (match) { m.electrificados_turismos = pn(match[1]); m.electrificados_turismos_cuota_pct = pn(match[2]); }

  // VCL (vehículos comerciales ligeros):
  // "Los vehículos comerciales ligeros aumentan un 19,9% en marzo, con 19.102 unidades"
  match = text.match(/(?:vehículos?\s+comerciales?\s+ligeros?|VCL)[^.]*?([\d,]+)%[^.]*?([\d.]+)\s+unidades/i);
  if (match) { m.vcl_yoy_pct = pn(match[1]); m.vcl = pn(match[2]); }

  // Industriales + autobuses:
  // "3.387, con un aumento del 29,6%" o "suman en el mes 3.387, con un aumento del 29,6%"
  match = text.match(/(?:industriales?|autobuses?|autocares?)[^.]*?suman?\s+en\s+el\s+mes\s+([\d.]+)[^.]*?(?:aumento|incremento)\s+del?\s+([\d,]+)%/i);
  if (!match) match = text.match(/(?:industriales?|autobuses?)[^.]*?([\d.]+)\s+,?\s+con\s+un\s+aumento\s+del?\s+([\d,]+)%/i);
  if (!match) match = text.match(/(?:industriales?|autobuses?)[^.]*?([\d,]+)%[^.]*?([\d.]+)\s+(?:nuevas?\s+)?(?:unidades|ventas)/i);
  if (match) { m.industriales_yoy_pct = pn(match[2]||match[1]); m.industriales = pn(match[1].includes('.')?match[1]:match[2]); }

  // Total mercado (turismos + VCL + industriales)
  if (m.turismos && m.vcl && m.industriales) {
    m.total_mercado_calculado = m.turismos + m.vcl + m.industriales;
  }

  // Emisiones CO2
  match = text.match(/([\d,]+)\s+gramos?\s+de\s+CO\s*2[^.]*?por\s+kilómetro\s+recorrido/i);
  if (match) m.co2_g_km = pn(match[1]);

  return m;
}

function parseTotalMarketRss(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map(m => {
    const raw = m[1];
    const title = stripHtml(raw.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '');
    const link  = (raw.match(/<link>(https?:\/\/[^<\s]+)/)?.[1] || '').replace(/\?utm_source.*/, '');
    const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const content = raw.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/)?.[1] || '';

    // Solo artículos de total turismos (no CCAA, no EV-only, no recarga)
    const isTotalTurismos = /ventas\s+de\s+turismos|turismos.*auge|turismos.*ascenso|turismos.*alcanzan/i.test(title);
    const isCCAA = /CCAA/i.test(title);
    const tipo = isTotalTurismos && !isCCAA ? 'total_mercado' : 'otro';

    const periodo = extractPeriodoFromContent(title, content, pubDate);

    return { title, link, pubDate, periodo, content, tipo };
  });
}

async function getTotalMarketReport(periodo) {
  const xml = await fetchText(RSS_MAT_URL);
  const items = parseTotalMarketRss(xml);
  const marketItems = items.filter(i => i.tipo === 'total_mercado');

  let item;
  if (periodo) {
    if (!/^\d{4}-\d{2}$/.test(periodo)) throw new Error('periodo debe ser YYYY-MM (ej: "2026-03")');
    item = marketItems.find(i => i.periodo === periodo);
    if (!item) {
      const [year, mon] = periodo.split('-');
      item = marketItems.find(i =>
        new RegExp(MONTHS_NUM[mon] || '', 'i').test(i.title) &&
        (i.title.includes(year) || (i.periodo?.startsWith(year)))
      );
    }
    if (!item) {
      return {
        error: `No se encontró informe total de mercado para ${periodo}`,
        disponibles: marketItems.map(i => ({ periodo: i.periodo, titulo: i.title })),
      };
    }
  } else {
    item = marketItems[0];
    if (!item) throw new Error('No se encontraron artículos de total mercado en el feed RSS');
  }

  return {
    titulo: item.title,
    url: item.link,
    periodo: item.periodo,
    pub_date: item.pubDate,
    metricas: parseTotalMarketMetrics(item.content, item.pubDate),
  };
}

async function fetchRssParsed() {
  const xml = await fetchText(RSS_EV_URL);
  return parseRssItems(xml);
}

async function getLatestReport() {
  const items = await fetchRssParsed();
  const monthly = items.filter(i => i.tipo === 'mensual_ev');
  if (!monthly.length) throw new Error('No se encontraron informes mensuales en el feed RSS');
  const latest = monthly[0];
  return {
    titulo: latest.title,
    url: latest.link,
    periodo: latest.periodo,
    pub_date: latest.pubDate,
    metricas: parseMetrics(latest.content, latest.pubDate),
    descripcion_breve: latest.description,
  };
}

async function getReportByPeriod(periodo) {
  if (!/^\d{4}-\d{2}$/.test(periodo)) throw new Error('periodo debe ser YYYY-MM (ej: "2026-03")');
  const items = await fetchRssParsed();

  // Primero buscar por periodo exacto (pubDate)
  let item = items.find(i => i.tipo === 'mensual_ev' && i.periodo === periodo);

  // Fallback: buscar por mes en el título (algunos artículos se publican el mes siguiente)
  if (!item) {
    const [year, mon] = periodo.split('-');
    const mesNombre = MONTHS_NUM[mon];
    item = items.find(i =>
      i.tipo === 'mensual_ev' &&
      new RegExp(mesNombre, 'i').test(i.title) &&
      (i.title.includes(year) || (i.periodo && i.periodo.startsWith(year)))
    );
  }

  if (!item) {
    const disponibles = items.filter(i => i.tipo === 'mensual_ev').map(i => ({
      periodo: i.periodo,
      titulo: i.title,
    }));
    return {
      error: `No se encontró informe para ${periodo} en el feed RSS (últimos ~10 artículos)`,
      disponibles,
    };
  }

  return {
    titulo: item.title,
    url: item.link,
    periodo: item.periodo,
    pub_date: item.pubDate,
    metricas: parseMetrics(item.content, item.pubDate),
    descripcion_breve: item.description,
  };
}

async function listReports() {
  const items = await fetchRssParsed();
  return items.map(i => ({
    tipo: i.tipo,
    titulo: i.title,
    url: i.link,
    periodo: i.periodo,
    pub_date: i.pubDate,
  }));
}

async function getChargingInfra() {
  const items = await fetchRssParsed();
  const latest = items.find(i => i.tipo === 'recarga');
  if (!latest) throw new Error('No se encontró artículo de puntos de recarga en el feed RSS');

  const text = stripHtml(latest.content);
  const datos = {};

  // Total puntos
  let match = text.match(/([\d.]+)\s+puntos?\s+(?:de\s+)?recarga/i);
  if (match) datos.total_puntos = pn(match[1]);

  // Nuevos en trimestre
  match = text.match(/([\d.,]+)\s+nuevos?\s+puntos?\s+de\s+recarga/i);
  if (match) datos.nuevos_puntos = pn(match[1]);

  // % crecimiento trimestral
  match = text.match(/crecido?\s+(?:un\s+)?([\d,]+)%/i);
  if (!match) match = text.match(/crecimiento\s+(?:del?\s+)?([\d,]+)%/i);
  if (match) datos.crecimiento_trimestral_pct = pn(match[1]);

  // Trimestre
  match = text.match(/(primer|segundo|tercer|cuarto)\s+trimestre\s+(?:de\s+)?(\d{4})/i);
  if (match) {
    const q = { primer: 'Q1', segundo: 'Q2', tercer: 'Q3', cuarto: 'Q4' };
    datos.trimestre = `${q[match[1].toLowerCase()]} ${match[2]}`;
  }

  return {
    titulo: latest.title,
    url: latest.link,
    pub_date: latest.pubDate,
    datos,
    texto_breve: text.substring(0, 600),
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'anfac-specialist', version: '1.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_latest_report',
      description: `Obtiene el último informe mensual disponible de ANFAC sobre matriculaciones de vehículos electrificados en España.
Retorna: BEV, PHEV, HEV, Gas — unidades del mes + YoY % + cuota de mercado + YTD acumulado.
Fuente: feed RSS de anfac.com/category/vehiculo-alternativo/ (actualizado ~1-2 días después de cierre de mes).

Nota: ANFAC reporta el mercado total de turismos + vcl comerciales, no los microdatos granulares como DGT.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_report_by_period',
      description: `Obtiene el informe ANFAC de un período concreto.
Parámetro: periodo en formato "YYYY-MM" (ej: "2026-03" para marzo 2026).
Solo disponible para los últimos ~10 artículos en el feed RSS (aprox. últimos 6 meses).`,
      inputSchema: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período en formato YYYY-MM, ej: "2026-03"',
          },
        },
        required: ['periodo'],
      },
    },
    {
      name: 'list_reports',
      description: 'Lista todos los artículos disponibles en el feed RSS de ANFAC vehículo alternativo (últimos ~10 artículos). Incluye: informes mensuales EV, datos CCAA (PDF), artículos de recarga.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_charging_infra',
      description: 'Obtiene el último dato trimestral de puntos de recarga pública en España según ANFAC. Incluye: total puntos, nuevos en el trimestre, % crecimiento.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_total_market_report',
      description: `Obtiene el último informe mensual de TOTAL MERCADO ANFAC: turismos + vehículos comerciales ligeros (VCL) + industriales/autobuses.
Retorna: total turismos, YoY %, YTD, electrificados (BEV+PHEV turismos) con cuota, VCL, industriales, total mercado calculado.
Nota: ANFAC publica los totales en un artículo separado al de los electrificados.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_total_market_by_period',
      description: `Obtiene el informe de TOTAL MERCADO ANFAC para un mes concreto.
Parámetro: periodo en formato "YYYY-MM" (ej: "2026-03").
Retorna: turismos, VCL, industriales, electrificados turismos, YoY %, YTD.`,
      inputSchema: {
        type: 'object',
        properties: {
          periodo: { type: 'string', description: 'Período YYYY-MM, ej: "2026-03"' },
        },
        required: ['periodo'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    let result;
    if (name === 'get_latest_report')       result = await getLatestReport();
    else if (name === 'get_report_by_period') result = await getReportByPeriod(args?.periodo);
    else if (name === 'list_reports')         result = await listReports();
    else if (name === 'get_charging_infra')         result = await getChargingInfra();
    else if (name === 'get_total_market_report')    result = await getTotalMarketReport(null);
    else if (name === 'get_total_market_by_period') result = await getTotalMarketReport(args?.periodo);
    else throw new Error(`Herramienta desconocida: ${name}`);

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
