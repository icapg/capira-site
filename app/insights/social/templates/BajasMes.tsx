import type { Format } from './types'

type Props = {
  periodo: string
  periodoFull?: string
  periodoPrev?: string
  bevBajas: number
  phevBajas: number
  hevBajas: number
  totalBajasMercado: number
  bevYoy?: number
  phevYoy?: number
  evYoy?: number
  noEnchYoy?: number
  totalYoy?: number
  format: Format
  variant?: 1 | 2 | 3
}

const C = {
  bg:     '#050810',
  bev:    '#38bdf8',
  phev:   '#fb923c',
  green:  '#34d399',
  ev:     '#f87171',
  red:    '#f87171',
  text:   '#f1f5f9',
  muted:  'rgba(241,245,249,0.45)',
  dim:    'rgba(241,245,249,0.20)',
  border: 'rgba(255,255,255,0.07)',
}

function fmt(n: number) { return n.toLocaleString('es-ES') }
function pct(n: number, t: number) { return t > 0 ? ((n / t) * 100).toFixed(1) : '0.0' }

function Bar({ value, max, color, height = 7 }: { value: number; max: number; color: string; height?: number }) {
  const w = max > 0 ? Math.max(1, (value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 4 }} />
    </div>
  )
}

function YoyBadge({ value, size = 16 }: { value?: number; size?: number }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: up ? C.green : C.red }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function YoyBadgeLight({ value, size = 16, asterisk = false, flushTop = false }: { value?: number; size?: number; asterisk?: boolean; flushTop?: boolean }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: flushTop ? '0px 9px 4px' : '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', lineHeight: 1, background: up ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)', color: up ? '#16a34a' : '#dc2626' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%{asterisk ? '*' : ''}
    </span>
  )
}

function LogoBlock({ logoW, logoH, urlSize, urlColor = '#94a3b8', autoHeight }: { logoW: number; logoH: number; urlSize: number; urlColor?: string; autoHeight?: boolean }) {
  const computedH = autoHeight ? Math.round(logoW * 849 / 630) : logoH
  const src = autoHeight ? '/logo sin padding.png' : '/logo.png'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Capira" width={logoW} height={computedH} style={{ objectFit: 'contain', display: 'block', width: logoW, height: computedH }} />
      <span style={{ fontSize: urlSize, color: urlColor, fontWeight: 500 }}>capirapower.com</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 1 — Dark (mismo diseño que MatriculacionesMes V1)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV1({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado, bevYoy, phevYoy, evYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '18px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 24, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Bajas · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={20} asterisk flushTop />}
          </div>
          <span style={{ fontSize: 28, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 4 }}>vehículos dados de baja</span>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={24} />
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '14px 56px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(248,113,113,0.08),transparent 70%)', pointerEvents: 'none' }} />

        {/* Cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Cuota bajas EV (BEV+PHEV)', value: pct(evBajas, total) + '%',  color: C.ev,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
            { label: 'BEV',                        value: pct(bevBajas, total) + '%',  color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)' },
            { label: 'PHEV',                       value: pct(phevBajas, total) + '%', color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)' },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '8px 16px' }}>
              <div style={{ fontSize: 22, color: C.muted, marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 54, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Filas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'BEV',     value: bevBajas,    color: C.bev,  yoy: bevYoy  },
            { label: 'PHEV',    value: phevBajas,   color: C.phev, yoy: phevYoy },
            { label: 'No Ench', value: noEnchBajas, color: C.dim,  yoy: undefined },
          ].map(row => {
            const barW = noEnchBajas > 0 ? Math.max(4, (row.value / noEnchBajas) * 100) : 0
            return (
              <div key={row.label}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 27, fontWeight: 800, color: row.color, whiteSpace: 'nowrap', marginRight: 14, letterSpacing: '0.03em' }}>{row.label}</span>
                  <span style={{ fontSize: 27, fontWeight: 700, color: C.text, marginRight: 'auto' }}>{fmt(row.value)}</span>
                  <span style={{ fontSize: 25, color: C.muted, marginRight: 12 }}>{pct(row.value, total)}%</span>
                  <YoyBadge value={row.yoy} size={21} />
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ height: '100%', width: `${barW}%`, background: row.color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          <div style={{ fontSize: 14, color: C.dim, marginBottom: 4 }}>* vs mismo mes año anterior</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: C.dim }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 16, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonutChartBajas({ enchuf, noEnch, size, bg = C.bg }: { enchuf: number; noEnch: number; size: number; bg?: string }) {
  const total = enchuf + noEnch
  const frac = total > 0 ? enchuf / total : 0
  const innerSize = Math.round(size * 0.52)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(rgba(248,113,113,0.92) 0% ${frac * 100}%, #94a3b8 ${frac * 100}% 100%)` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: innerSize, height: innerSize, borderRadius: '50%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: Math.round(innerSize * 0.28), fontWeight: 900, color: C.ev, letterSpacing: '-0.02em', lineHeight: 1 }}>{(enchuf / 1000).toFixed(1)}k</div>
      </div>
    </div>
  )
}

function PortraitV1({ periodo, periodoFull, periodoPrev, bevBajas, phevBajas, hevBajas, totalBajasMercado, bevYoy, phevYoy, evYoy, noEnchYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'
  const v1TotalYoyMarginTop = 30

  const innerW = 944
  const boxW = (innerW - 32) / 3
  const gap1CenterX = boxW + 8
  const gap2CenterX = boxW * 2 + 24
  const pieSize = 260
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? evBajas / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)
  const origDownH = 150 + greenExitDY
  const noEnchTopY = 150 - greenExitDY - origDownH * 2

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 35, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {periodoFull ?? periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <div style={{ marginTop: v1TotalYoyMarginTop }}><YoyBadgeLight value={totalYoy} size={34} flushTop /></div>}
          </div>
          <span style={{ fontSize: 36, fontWeight: 500, color: C.red, display: 'block', marginTop: 6 }}>vehículos dados de baja</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <LogoBlock logoW={113} logoH={40} urlSize={34} autoHeight />
        </div>
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '28px 68px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 24 }}>

          {/* Pie row */}
          <div style={{ height: 300, flexShrink: 0, position: 'relative' }}>
            {/* Gray callout */}
            <div style={{ position: 'absolute', left: pieLeftX - 5, top: noEnchTopY, width: 10, height: 10, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: noEnchTopY, width: pieLeftX - 5 - noEnchCenterX, height: 2, background: noEnchColor, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: noEnchTopY, width: 2, height: origDownH * 3, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChartBajas enchuf={evBajas} noEnch={noEnchBajas} size={pieSize} bg={C.bg} />
            </div>
            {/* Red callout */}
            <div style={{ position: 'absolute', left: pieRightX - 5, top: `calc(50% + ${greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 5, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 5, height: 2, background: C.ev, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
          </div>

          {/* 3 boxes */}
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: noEnchColor, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2, minHeight: 82, boxSizing: 'border-box' }}>No<br />Enchufable</div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(noEnchBajas, total)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                <div style={{ fontSize: 67, fontWeight: 800, color: noEnchColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{(noEnchBajas / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs {periodoPrev ?? 'año ant.'}</div>
                {noEnchYoy != null
                  ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: noEnchYoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: noEnchYoy >= 0 ? C.green : C.red }}>{noEnchYoy >= 0 ? '▲' : '▼'} {Math.abs(noEnchYoy).toFixed(1)}%</span>
                  : <span style={{ fontSize: 31, color: subColor }}>—</span>
                }
              </div>
            </div>
            <div style={{ flex: 2, display: 'flex', gap: 12, border: `2px solid ${C.ev}`, borderRadius: 14, padding: 6 }}>
              {[
                { label: 'BEV',  value: bevBajas,  color: C.bev,  yoy: bevYoy  },
                { label: 'PHEV', value: phevBajas, color: C.phev, yoy: phevYoy },
              ].map(box => (
                <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2, minHeight: 82, boxSizing: 'border-box' }}>{box.label}</div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                    <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                    <div style={{ fontSize: 67, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(box.value)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs {periodoPrev ?? 'año ant.'}</div>
                    {box.yoy != null
                      ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: box.yoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: box.yoy >= 0 ? C.green : C.red }}>{box.yoy >= 0 ? '▲' : '▼'} {Math.abs(box.yoy).toFixed(1)}%</span>
                      : <span style={{ fontSize: 31, color: subColor }}>—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Red vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${150 + greenExitDY}px`, width: 2, height: `${150 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Red annotation */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 14, top: `${150 + greenExitDY + 14}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(evBajas, total)}%</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: subColor }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 20, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 2 — (copia de V1 para experimentar)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV2({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 27, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Bajas · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            <span style={{ fontSize: 33, fontWeight: 500, color: '#64748b' }}>vehículos dados de baja</span>
          </div>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={27} />
      </div>

      <div style={{ flex: 1, padding: '18px 56px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.08),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Bajas EV (BEV+PHEV)', value: fmt(evBajas),   color: C.ev,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
            { label: 'BEV',                 value: fmt(bevBajas),  color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV',                value: fmt(phevBajas), color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 27, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 57, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[
            { label: 'BEV',      value: bevBajas,    color: C.bev  },
            { label: 'PHEV',     value: phevBajas,   color: C.phev },
            { label: 'No Ench',  value: noEnchBajas, color: C.dim  },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 84, fontSize: 30, fontWeight: 800, color: row.color, letterSpacing: '0.04em' }}>{row.label}</div>
              <div style={{ width: 106, fontSize: 30, fontWeight: 700, color: C.text, textAlign: 'right' }}>{fmt(row.value)}</div>
              <Bar value={row.value} max={total} color={row.color} />
              <div style={{ width: 58, fontSize: 29, color: C.muted, textAlign: 'right' }}>{pct(row.value, total)}%</div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, color: C.dim, marginBottom: 4 }}>* vs mismo mes año anterior</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: C.dim }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 16, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitV2({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '32px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 33, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Bajas · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            <span style={{ fontSize: 39, fontWeight: 500, color: '#64748b' }}>vehículos dados de baja</span>
          </div>
        </div>
        <LogoBlock logoW={140} logoH={44} urlSize={33} />
      </div>

      <div style={{ flex: 1, padding: '28px 68px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Bajas EV', value: fmt(evBajas),   color: C.ev,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
            { label: 'BEV',      value: fmt(bevBajas),  color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV',     value: fmt(phevBajas), color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 33, color: C.muted, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 84, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
          {[
            { label: 'BEV',      value: bevBajas,    color: C.bev  },
            { label: 'PHEV',     value: phevBajas,   color: C.phev },
            { label: 'No Ench',  value: noEnchBajas, color: C.dim  },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 110, fontSize: 36, fontWeight: 800, color: row.color, letterSpacing: '0.04em' }}>{row.label}</div>
              <div style={{ width: 130, fontSize: 36, fontWeight: 700, color: C.text, textAlign: 'right' }}>{fmt(row.value)}</div>
              <Bar value={row.value} max={total} color={row.color} height={9} />
              <div style={{ width: 72, fontSize: 33, color: C.muted, textAlign: 'right' }}>{pct(row.value, total)}%</div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, color: C.dim, marginBottom: 6 }}>* vs mismo mes año anterior</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: C.dim }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 20, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 3 — (copia de V1 para experimentar)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV3({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 27, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Bajas · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            <span style={{ fontSize: 33, fontWeight: 500, color: '#64748b' }}>vehículos dados de baja</span>
          </div>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={27} />
      </div>

      <div style={{ flex: 1, padding: '18px 56px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.08),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Bajas EV (BEV+PHEV)', value: fmt(evBajas),   color: C.ev,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
            { label: 'BEV',                 value: fmt(bevBajas),  color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV',                value: fmt(phevBajas), color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 27, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 57, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[
            { label: 'BEV',      value: bevBajas,    color: C.bev  },
            { label: 'PHEV',     value: phevBajas,   color: C.phev },
            { label: 'No Ench',  value: noEnchBajas, color: C.dim  },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 84, fontSize: 30, fontWeight: 800, color: row.color, letterSpacing: '0.04em' }}>{row.label}</div>
              <div style={{ width: 106, fontSize: 30, fontWeight: 700, color: C.text, textAlign: 'right' }}>{fmt(row.value)}</div>
              <Bar value={row.value} max={total} color={row.color} />
              <div style={{ width: 58, fontSize: 29, color: C.muted, textAlign: 'right' }}>{pct(row.value, total)}%</div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, color: C.dim, marginBottom: 4 }}>* vs mismo mes año anterior</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: C.dim }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 16, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitV3({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
  const evBajas = bevBajas + phevBajas
  const noEnchBajas = Math.max(0, totalBajasMercado - bevBajas - phevBajas)
  const total = totalBajasMercado

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '32px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 33, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Bajas · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            <span style={{ fontSize: 39, fontWeight: 500, color: '#64748b' }}>vehículos dados de baja</span>
          </div>
        </div>
        <LogoBlock logoW={140} logoH={44} urlSize={33} />
      </div>

      <div style={{ flex: 1, padding: '28px 68px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Bajas EV', value: fmt(evBajas),   color: C.ev,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
            { label: 'BEV',      value: fmt(bevBajas),  color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV',     value: fmt(phevBajas), color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 33, color: C.muted, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 84, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
          {[
            { label: 'BEV',      value: bevBajas,    color: C.bev  },
            { label: 'PHEV',     value: phevBajas,   color: C.phev },
            { label: 'No Ench',  value: noEnchBajas, color: C.dim  },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 110, fontSize: 36, fontWeight: 800, color: row.color, letterSpacing: '0.04em' }}>{row.label}</div>
              <div style={{ width: 130, fontSize: 36, fontWeight: 700, color: C.text, textAlign: 'right' }}>{fmt(row.value)}</div>
              <Bar value={row.value} max={total} color={row.color} height={9} />
              <div style={{ width: 72, fontSize: 33, color: C.muted, textAlign: 'right' }}>{pct(row.value, total)}%</div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, color: C.dim, marginBottom: 6 }}>* vs mismo mes año anterior</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: C.dim }}>Fuente: DGT Microdatos MATRABA</span>
            <span style={{ fontSize: 20, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

export function BajasMes({ format, variant = 1, ...props }: Props) {
  const isDesktop = format === 'linkedin-desktop'
  if (variant === 2) return isDesktop ? <DesktopV2 {...props} /> : <PortraitV2 {...props} />
  if (variant === 3) return isDesktop ? <DesktopV3 {...props} /> : <PortraitV3 {...props} />
  return isDesktop ? <DesktopV1 {...props} /> : <PortraitV1 {...props} />
}
