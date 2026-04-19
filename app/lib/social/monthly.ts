import { dgtParqueMensual } from '../insights/dgt-parque-data'
import { dgtMeses } from '../insights/dgt-data'
import mensualJson from '../../../data/dgt-bev-phev-mensual.json'
import bajasJson   from '../../../data/dgt-bajas.json'
import type { TipoVehiculo } from '../insights/dgt-bev-phev-data'

const MESES_ES      = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export type MonthState = 'generando' | 'pendiente' | 'subido'

export type SocialFilters = {
  tec?:           'ambos' | 'bev' | 'phev'
  tiposVehiculo?: TipoVehiculo[]
}

export type MonthBundle = {
  periodoKey:      string       // 'YYYY-MM'
  periodoLabel:    string       // 'Abr 2026'
  periodoFull:     string       // 'Abril 2026'
  state:           MonthState
  hasData:         boolean
  dgtReleaseDate?: string
  supabasePost?:   any
  data?:           any
}

// ─── Taxonomía TipoVehiculo (bev-phev data) ↔ dgtMeses.por_tipo ─────────────
const TIPO_MAP: Record<Exclude<TipoVehiculo, 'todos'>, string[]> = {
  turismo:      ['turismo', 'suv_todo_terreno'],
  furgoneta:    ['furgoneta_van'],
  moto_scooter: ['moto'],
  microcar:     [],
  camion:       ['camion'],
  autobus:      ['autobus'],
  otros:        ['especial', 'otros', 'agricola', 'quad_atv', 'remolque'],
}
const TIPO_MAP_PARQUE: Record<Exclude<TipoVehiculo, 'todos'>, string[]> = {
  turismo:      ['turismo', 'suv_todo_terreno'],
  furgoneta:    ['furgoneta_van'],
  moto_scooter: ['moto'],
  microcar:     [],
  camion:       ['camion'],
  autobus:      ['autobus'],
  otros:        ['especial', 'otros', 'agricola', 'quad_atv'],
}

function formatPeriodo(key: string)     { const [y, m] = key.split('-'); return `${MESES_ES[parseInt(m) - 1]} ${y}` }
function formatPeriodoFull(key: string) { const [y, m] = key.split('-'); return `${MESES_ES_FULL[parseInt(m) - 1]} ${y}` }
function yoy(cur: number, prev: number | undefined) {
  if (!prev || prev === 0) return undefined
  return +(((cur - prev) / prev) * 100).toFixed(1)
}

function activeTipos(tiposVehiculo?: TipoVehiculo[]): Exclude<TipoVehiculo, 'todos'>[] | null {
  if (!tiposVehiculo || tiposVehiculo.length === 0) return null
  const active = tiposVehiculo.filter(t => t !== 'todos') as Exclude<TipoVehiculo, 'todos'>[]
  if (active.length === 0) return null
  return active
}

// ─── Lookups por periodo ───────────────────────────────────────────────────
const bevPhevByPeriodo = new Map<string, any>()
for (const m of (mensualJson.mensual as any[])) bevPhevByPeriodo.set(m.periodo, m)

const bajasByPeriodo = new Map<string, any>()
for (const m of ((bajasJson as any).meses as any[])) bajasByPeriodo.set(m.periodo, m)

// ─── Matriculaciones filtradas ─────────────────────────────────────────────
function matriculacionesFor(periodoKey: string, filters: SocialFilters) {
  const tec    = filters.tec ?? 'ambos'
  const tipos  = activeTipos(filters.tiposVehiculo)
  const parqueRow = dgtParqueMensual.find(p => p.periodo === periodoKey)
  const bevPhev   = bevPhevByPeriodo.get(periodoKey)
  const dgtMes    = dgtMeses.find(m => m.periodo === periodoKey)
  if (!parqueRow) return null

  let bev: number, phev: number, totalMercado: number
  if (tipos) {
    bev  = bevPhev  ? tipos.reduce((s, t) => s + ((bevPhev.bev_por_tipo  as any)?.[t] ?? 0), 0) : 0
    phev = bevPhev  ? tipos.reduce((s, t) => s + ((bevPhev.phev_por_tipo as any)?.[t] ?? 0), 0) : 0
    totalMercado = dgtMes
      ? tipos.reduce((s, t) => s + TIPO_MAP[t].reduce((ss, dt) => ss + ((dgtMes.por_tipo as any)?.[dt] ?? 0), 0), 0)
      : 0
  } else {
    bev  = parqueRow.matriculaciones_mes.BEV  ?? 0
    phev = parqueRow.matriculaciones_mes.PHEV ?? 0
    totalMercado = dgtMes?.total ?? 0
  }

  if (tec === 'bev')  { phev = 0 }
  if (tec === 'phev') { bev  = 0 }

  return { bev, phev, hev: 0, totalMercado }
}

// ─── Bajas filtradas ───────────────────────────────────────────────────────
function bajasFor(periodoKey: string, filters: SocialFilters) {
  const tec   = filters.tec ?? 'ambos'
  const tipos = activeTipos(filters.tiposVehiculo)
  const parqueRow = dgtParqueMensual.find(p => p.periodo === periodoKey)
  if (!parqueRow) return null

  let bevBajas: number, phevBajas: number, totalBajasMercado: number
  if (tipos) {
    const bajasRow     = bajasByPeriodo.get(periodoKey)
    const porCatTipo   = bajasRow?.por_cat_tipo ?? {}
    const porTipoTotal = bajasRow?.por_tipo     ?? {}
    bevBajas  = tipos.reduce((s, t) =>
      s + TIPO_MAP[t].reduce((ss, dt) => ss + ((porCatTipo?.[dt]?.BEV  ?? 0)), 0), 0)
    phevBajas = tipos.reduce((s, t) =>
      s + TIPO_MAP[t].reduce((ss, dt) => ss + ((porCatTipo?.[dt]?.PHEV ?? 0)), 0), 0)
    totalBajasMercado = tipos.reduce((s, t) =>
      s + TIPO_MAP[t].reduce((ss, dt) => ss + ((porTipoTotal?.[dt]   ?? 0)), 0), 0)
  } else {
    bevBajas  = parqueRow.bajas_mes.BEV  ?? 0
    phevBajas = parqueRow.bajas_mes.PHEV ?? 0
    totalBajasMercado = parqueRow.total_bajas_mes
  }

  if (tec === 'bev')  phevBajas = 0
  if (tec === 'phev') bevBajas  = 0

  return { bevBajas, phevBajas, hevBajas: 0, totalBajasMercado }
}

// ─── Parque activo filtrado ────────────────────────────────────────────────
function parqueFor(periodoKey: string, filters: SocialFilters) {
  const tec = filters.tec ?? 'ambos'
  const tipos = activeTipos(filters.tiposVehiculo)
  const parqueRow = dgtParqueMensual.find(p => p.periodo === periodoKey)
  if (!parqueRow) return null

  let bevActivos: number, phevActivos: number, parqueTotal: number, noEnchufables: number
  if (tipos && parqueRow.parque_por_tipo) {
    const tiposParque = tipos.flatMap(t => TIPO_MAP_PARQUE[t])
    bevActivos    = tiposParque.reduce((s, t) => s + ((parqueRow.parque_por_tipo as any)?.[t]?.BEV           ?? 0), 0)
    phevActivos   = tiposParque.reduce((s, t) => s + ((parqueRow.parque_por_tipo as any)?.[t]?.PHEV          ?? 0), 0)
    parqueTotal   = tiposParque.reduce((s, t) => s + ((parqueRow.parque_por_tipo as any)?.[t]?.total         ?? 0), 0)
    noEnchufables = tiposParque.reduce((s, t) => s + ((parqueRow.parque_por_tipo as any)?.[t]?.no_enchufable ?? 0), 0)
  } else {
    bevActivos    = parqueRow.parque_acumulado.BEV  ?? 0
    phevActivos   = parqueRow.parque_acumulado.PHEV ?? 0
    parqueTotal   = parqueRow.parque_total
    noEnchufables = parqueRow.parque_no_enchufable
  }

  if (tec === 'bev')  phevActivos = 0
  if (tec === 'phev') bevActivos  = 0

  return { bevActivos, phevActivos, hevActivos: 0, parqueTotal, noEnchufables }
}

/**
 * Devuelve los datos del periodo ya filtrados para alimentar los 3 templates.
 * Si filters es omitido, equivale a "todos los filtros abiertos" (dataset completo).
 */
export function getTemplateDataFor(periodoKey: string, filters: SocialFilters = {}) {
  const idx = dgtParqueMensual.findIndex(p => p.periodo === periodoKey)
  if (idx < 0) return null

  const prevKey = dgtParqueMensual[idx - 12]?.periodo

  const mat  = matriculacionesFor(periodoKey, filters); if (!mat)  return null
  const bjs  = bajasFor(periodoKey, filters);           if (!bjs)  return null
  const par  = parqueFor(periodoKey, filters);          if (!par)  return null
  const matP = prevKey ? matriculacionesFor(prevKey, filters) : null
  const bjsP = prevKey ? bajasFor(prevKey, filters)           : null
  const parP = prevKey ? parqueFor(prevKey, filters)          : null

  const evCur  = mat.bev + mat.phev
  const evPrev = matP ? matP.bev + matP.phev : undefined
  const noElecCur  = Math.max(0, mat.totalMercado - evCur)
  const noElecPrev = matP ? Math.max(0, matP.totalMercado - (matP.bev + matP.phev)) : undefined

  const evCurBjs  = bjs.bevBajas + bjs.phevBajas
  const evPrevBjs = bjsP ? bjsP.bevBajas + bjsP.phevBajas : undefined
  const noEnchBjsCur  = Math.max(0, bjs.totalBajasMercado - evCurBjs)
  const noEnchBjsPrev = bjsP ? Math.max(0, bjsP.totalBajasMercado - (bjsP.bevBajas + bjsP.phevBajas)) : undefined

  // ── Records (solo tec=ambos y tipos=todos, para no confundir) ────────────
  const sinFiltros = (filters.tec ?? 'ambos') === 'ambos' && !activeTipos(filters.tiposVehiculo)
  let records = { enchufablesMatri: false, bevMatri: false, phevMatri: false, maxPrevEnchufables: 0 }
  if (sinFiltros) {
    const prev = dgtParqueMensual.slice(0, idx)
    const currEnch = (mat.bev + mat.phev)
    const maxPrevEnch = prev.reduce((mx, p) => Math.max(mx, (p.matriculaciones_mes.BEV ?? 0) + (p.matriculaciones_mes.PHEV ?? 0)), 0)
    const maxPrevBev  = prev.reduce((mx, p) => Math.max(mx, p.matriculaciones_mes.BEV  ?? 0), 0)
    const maxPrevPhev = prev.reduce((mx, p) => Math.max(mx, p.matriculaciones_mes.PHEV ?? 0), 0)
    records = {
      enchufablesMatri: prev.length > 0 && currEnch > maxPrevEnch,
      bevMatri:         prev.length > 0 && mat.bev  > maxPrevBev,
      phevMatri:        prev.length > 0 && mat.phev > maxPrevPhev,
      maxPrevEnchufables: maxPrevEnch,
    }
  }

  return {
    periodo:         formatPeriodo(periodoKey),
    periodoFull:     formatPeriodoFull(periodoKey),
    periodoPrev:     prevKey ? formatPeriodo(prevKey) : undefined,
    periodoPrevFull: prevKey ? formatPeriodoFull(prevKey) : undefined,
    matriculaciones: {
      bev:  mat.bev,
      phev: mat.phev,
      hev:  mat.hev,
      totalMercado: mat.totalMercado,
      bevYoy:    yoy(mat.bev,  matP?.bev),
      phevYoy:   yoy(mat.phev, matP?.phev),
      evYoy:     yoy(evCur, evPrev),
      noElecYoy: yoy(noElecCur, noElecPrev),
      totalYoy:  yoy(mat.totalMercado, matP?.totalMercado),
    },
    bajas: {
      bevBajas:          bjs.bevBajas,
      phevBajas:         bjs.phevBajas,
      hevBajas:          bjs.hevBajas,
      totalBajasMercado: bjs.totalBajasMercado,
      bevYoy:    yoy(bjs.bevBajas,  bjsP?.bevBajas),
      phevYoy:   yoy(bjs.phevBajas, bjsP?.phevBajas),
      evYoy:     yoy(evCurBjs, evPrevBjs),
      noEnchYoy: yoy(noEnchBjsCur, noEnchBjsPrev),
      totalYoy:  yoy(bjs.totalBajasMercado, bjsP?.totalBajasMercado),
    },
    acumulado: {
      bevActivos:    par.bevActivos,
      phevActivos:   par.phevActivos,
      hevActivos:    par.hevActivos,
      bevYoy:        yoy(par.bevActivos,  parP?.bevActivos),
      phevYoy:       yoy(par.phevActivos, parP?.phevActivos),
      evYoy:         yoy(par.bevActivos + par.phevActivos, parP ? parP.bevActivos + parP.phevActivos : undefined),
      parqueTotal:   par.parqueTotal,
      noEnchufables: par.noEnchufables,
    },
    records,
  }
}

function addMonths(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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
    if (!hasData)                             state = 'generando'
    else if (postRow?.status === 'published') state = 'subido'
    else                                      state = 'pendiente'

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

  return bundles.reverse()
}
