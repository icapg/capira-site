import { dgtParqueMensual } from '../insights/dgt-parque-data'
import { dgtMeses } from '../insights/dgt-data'

const MESES_ES      = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export type MonthState = 'generando' | 'pendiente' | 'subido'

export type MonthBundle = {
  periodoKey:      string       // 'YYYY-MM'
  periodoLabel:    string       // 'Abr 2026'
  periodoFull:     string       // 'Abril 2026'
  state:           MonthState
  hasData:         boolean
  dgtReleaseDate?: string       // ISO date cuando DGT se espera publicar (día 15 del mes siguiente)
  supabasePost?:   any          // row de social_posts (si existe)
  data?:           any          // template data si hasData=true
}

function formatPeriodo(key: string) {
  const [y, m] = key.split('-')
  return `${MESES_ES[parseInt(m) - 1]} ${y}`
}
function formatPeriodoFull(key: string) {
  const [y, m] = key.split('-')
  return `${MESES_ES_FULL[parseInt(m) - 1]} ${y}`
}

function yoy(current: number, previous: number | undefined) {
  if (!previous || previous === 0) return undefined
  return +(((current - previous) / previous) * 100).toFixed(1)
}

export function getTemplateDataFor(periodoKey: string) {
  const idx = dgtParqueMensual.findIndex(p => p.periodo === periodoKey)
  if (idx < 0) return null
  const ultimo = dgtParqueMensual[idx]
  const penultimo = dgtParqueMensual[idx - 12]  // mismo mes año anterior

  const mat    = ultimo.matriculaciones_mes
  const bajas  = ultimo.bajas_mes
  const parque = ultimo.parque_acumulado
  const matPrev    = penultimo?.matriculaciones_mes
  const parquePrev = penultimo?.parque_acumulado

  const dgtMes     = dgtMeses.find(m => m.periodo === ultimo.periodo)
  const dgtMesPrev = penultimo ? dgtMeses.find(m => m.periodo === penultimo.periodo) : undefined
  const totalMercado     = dgtMes?.total ?? 0
  const totalMercadoPrev = dgtMesPrev?.total ?? 0

  const noElec     = Math.max(0, totalMercado     - (mat.BEV ?? 0)      - (mat.PHEV ?? 0))
  const noElecPrev = Math.max(0, totalMercadoPrev - (matPrev?.BEV ?? 0) - (matPrev?.PHEV ?? 0))

  const totalBajasMensual     = ultimo.total_bajas_mes
  const noEnchBajas           = Math.max(0, totalBajasMensual - (bajas.BEV ?? 0) - (bajas.PHEV ?? 0))
  const totalBajasMensualPrev = penultimo?.total_bajas_mes
  const noEnchBajasPrev       = totalBajasMensualPrev != null
    ? Math.max(0, totalBajasMensualPrev - (penultimo?.bajas_mes.BEV ?? 0) - (penultimo?.bajas_mes.PHEV ?? 0))
    : undefined

  // ─── Detección de récords (solo considerando meses anteriores, no el actual) ───
  const prevMeses = dgtParqueMensual.slice(0, idx)
  const currEnch  = (mat.BEV ?? 0) + (mat.PHEV ?? 0)
  const currBev   = mat.BEV  ?? 0
  const currPhev  = mat.PHEV ?? 0
  const maxPrevEnch = prevMeses.reduce((mx, p) => Math.max(mx, (p.matriculaciones_mes.BEV ?? 0) + (p.matriculaciones_mes.PHEV ?? 0)), 0)
  const maxPrevBev  = prevMeses.reduce((mx, p) => Math.max(mx, p.matriculaciones_mes.BEV  ?? 0), 0)
  const maxPrevPhev = prevMeses.reduce((mx, p) => Math.max(mx, p.matriculaciones_mes.PHEV ?? 0), 0)
  const records = {
    enchufablesMatri: prevMeses.length > 0 && currEnch  > maxPrevEnch,
    bevMatri:         prevMeses.length > 0 && currBev   > maxPrevBev,
    phevMatri:        prevMeses.length > 0 && currPhev  > maxPrevPhev,
    maxPrevEnchufables: maxPrevEnch,
  }

  return {
    periodo:         formatPeriodo(ultimo.periodo),
    periodoFull:     formatPeriodoFull(ultimo.periodo),
    periodoPrev:     penultimo ? formatPeriodo(penultimo.periodo) : undefined,
    periodoPrevFull: penultimo ? formatPeriodoFull(penultimo.periodo) : undefined,
    matriculaciones: {
      bev:  mat.BEV  ?? 0,
      phev: mat.PHEV ?? 0,
      hev:  mat.HEV  ?? 0,
      totalMercado,
      bevYoy:      yoy(mat.BEV  ?? 0, matPrev?.BEV),
      phevYoy:     yoy(mat.PHEV ?? 0, matPrev?.PHEV),
      evYoy:       yoy((mat.BEV ?? 0) + (mat.PHEV ?? 0), (matPrev?.BEV ?? 0) + (matPrev?.PHEV ?? 0)),
      noElecYoy:   totalMercadoPrev > 0 ? yoy(noElec, noElecPrev) : undefined,
      totalYoy:    totalMercadoPrev > 0 ? yoy(totalMercado, totalMercadoPrev) : undefined,
    },
    bajas: {
      bevBajas:          bajas.BEV  ?? 0,
      phevBajas:         bajas.PHEV ?? 0,
      hevBajas:          bajas.HEV  ?? 0,
      totalBajasMercado: totalBajasMensual,
      bevYoy:   yoy(bajas.BEV  ?? 0, penultimo?.bajas_mes.BEV),
      phevYoy:  yoy(bajas.PHEV ?? 0, penultimo?.bajas_mes.PHEV),
      evYoy:    yoy((bajas.BEV ?? 0) + (bajas.PHEV ?? 0), (penultimo?.bajas_mes.BEV ?? 0) + (penultimo?.bajas_mes.PHEV ?? 0)),
      noEnchYoy: yoy(noEnchBajas, noEnchBajasPrev),
      totalYoy:  yoy(totalBajasMensual, penultimo?.total_bajas_mes),
    },
    acumulado: {
      bevActivos:    parque.BEV  ?? 0,
      phevActivos:   parque.PHEV ?? 0,
      hevActivos:    parque.HEV  ?? 0,
      bevYoy:        yoy(parque.BEV  ?? 0, parquePrev?.BEV),
      phevYoy:       yoy(parque.PHEV ?? 0, parquePrev?.PHEV),
      evYoy:         yoy((parque.BEV ?? 0) + (parque.PHEV ?? 0), (parquePrev?.BEV ?? 0) + (parquePrev?.PHEV ?? 0)),
      parqueTotal:   ultimo.parque_total,
      noEnchufables: ultimo.parque_no_enchufable,
    },
    records,
  }
}

function addMonths(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// DGT publica datos del mes N el día 15 del mes N+1
function expectedDgtRelease(periodoKey: string): string {
  const next = addMonths(periodoKey, 1)
  return `${next}-15`
}

export function buildMonthBundles(
  published: any[],
  opts?: { pastMonths?: number; futureMonths?: number }
): MonthBundle[] {
  const pastMonths   = opts?.pastMonths   ?? 8
  const futureMonths = opts?.futureMonths ?? 2

  const now = new Date()
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const publishedByPeriodo = new Map<string, any>()
  for (const p of published) {
    const match = typeof p.template === 'string' ? p.template.match(/^mensual-bundle-(\d{4}-\d{2})$/) : null
    if (match) publishedByPeriodo.set(match[1], p)
  }

  const dgtPeriodos = new Set(dgtParqueMensual.map(p => p.periodo))

  const bundles: MonthBundle[] = []
  for (let i = -pastMonths; i <= futureMonths; i++) {
    const periodoKey = addMonths(currentKey, i)
    const hasData    = dgtPeriodos.has(periodoKey)
    const postRow    = publishedByPeriodo.get(periodoKey)

    let state: MonthState
    if (!hasData)                                     state = 'generando'
    else if (postRow?.status === 'published')         state = 'subido'
    else                                              state = 'pendiente'

    bundles.push({
      periodoKey,
      periodoLabel:    formatPeriodo(periodoKey),
      periodoFull:     formatPeriodoFull(periodoKey),
      state,
      hasData,
      dgtReleaseDate:  !hasData ? expectedDgtRelease(periodoKey) : undefined,
      supabasePost:    postRow,
      data:            hasData ? getTemplateDataFor(periodoKey) : undefined,
    })
  }

  // Orden: más recientes primero dentro de cada columna
  return bundles.reverse()
}
