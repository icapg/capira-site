import type { Format } from './types'
export type { Format }

type Props = {
  periodo: string
  periodoFull?: string
  periodoPrev?: string
  bev: number
  phev: number
  hev: number
  totalMercado: number
  bevYoy?: number
  phevYoy?: number
  evYoy?: number
  noElecYoy?: number
  totalYoy?: number
  format: Format
  variant?: 1 | 2 | 3
}

// ─── Dark theme ──────────────────────────────────────────────────────────────
const C = {
  bg:     '#050810',
  bev:    '#38bdf8',
  phev:   '#fb923c',
  green:  '#34d399',
  ev:     '#34d399',
  red:    '#f87171',
  text:   '#f1f5f9',
  muted:  'rgba(241,245,249,0.45)',
  dim:    'rgba(241,245,249,0.20)',
  border: 'rgba(255,255,255,0.07)',
}

function fmt(n: number) { return n.toLocaleString('es-ES') }
function pct(n: number, t: number) { return t > 0 ? ((n / t) * 100).toFixed(1) : '0.0' }

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
  // 'logo sin padding.png' is 630×849 — compute exact height at given width
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
// VARIANT 1 — Dark (original)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV1({ periodo, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '18px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 24, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Matriculaciones · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={20} asterisk flushTop />}
          </div>
          <span style={{ fontSize: 28, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 4 }}>vehículos</span>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={24} />
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '14px 56px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.08),transparent 70%)', pointerEvents: 'none' }} />

        {/* Cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Cuota EV (BEV+PHEV)', value: pct(ev, total) + '%',  color: C.ev, bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)' },
            { label: 'BEV',                 value: pct(bev, total) + '%',  color: C.bev,   bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)' },
            { label: 'PHEV',                value: pct(phev, total) + '%', color: C.phev,  bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)' },
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
            { label: 'BEV',     value: bev,    color: C.bev,  yoy: bevYoy    },
            { label: 'PHEV',    value: phev,   color: C.phev, yoy: phevYoy   },
            { label: 'No Ench', value: noEnch, color: C.dim,  yoy: noElecYoy },
          ].map(row => {
            const barW = noEnch > 0 ? Math.max(4, (row.value / noEnch) * 100) : 0
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
            <span style={{ fontSize: 16, color: C.dim }}>Fuente: DGT</span>
            <span style={{ fontSize: 16, color: C.dim }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitV1({ periodo, periodoFull, periodoPrev, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'
  const v1TotalYoyMarginTop = 30 // badge bottom currently at number visual top; shift down to align tops

  const innerW = 944
  const boxW = (innerW - 32) / 3
  const gap1CenterX = boxW + 8
  const gap2CenterX = boxW * 2 + 24
  const pieSize = 260
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)

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
          <span style={{ fontSize: 36, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 6 }}>vehículos matriculados</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <LogoBlock logoW={113} logoH={40} urlSize={34} autoHeight />
        </div>
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '28px 68px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 24 }}>

          {/* Pie row */}
          <div style={{ height: 300, flexShrink: 0, position: 'relative', overflow: 'visible' }}>
            {/* Gray callout */}
            <div style={{ position: 'absolute', left: pieLeftX - 5, top: `calc(50% + ${-greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: `calc(50% + ${-greenExitDY}px)`, width: pieLeftX - 5 - noEnchCenterX, height: 2, background: noEnchColor, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: `calc(50% + ${-greenExitDY}px)`, width: 2, height: `${(150 + greenExitDY) * 2}px`, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart2 enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>
            {/* Green callout */}
            <div style={{ position: 'absolute', left: pieRightX - 5, top: `calc(50% + ${greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 5, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 5, height: 2, background: C.ev, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
          </div>

          {/* 3 boxes — NoEnch separate, BEV+PHEV inside green border wrapper */}
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: noEnchColor, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2, minHeight: 82, boxSizing: 'border-box' }}>No<br />Enchufable</div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(noEnch, total)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                <div style={{ fontSize: 67, fontWeight: 800, color: noEnchColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{(noEnch / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs {periodoPrev ?? 'año ant.'}</div>
                {noElecYoy != null
                  ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: noElecYoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: noElecYoy >= 0 ? C.green : C.red }}>{noElecYoy >= 0 ? '▲' : '▼'} {Math.abs(noElecYoy).toFixed(1)}%</span>
                  : <span style={{ fontSize: 31, color: subColor }}>—</span>
                }
              </div>
            </div>
            <div style={{ flex: 2, display: 'flex', gap: 12, border: `2px solid ${C.ev}`, borderRadius: 14, padding: 6 }}>
              {[
                { label: 'BEV',  value: bev,  color: C.bev,  yoy: bevYoy  },
                { label: 'PHEV', value: phev, color: C.phev, yoy: phevYoy },
              ].map(box => (
                <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2, minHeight: 82, boxSizing: 'border-box' }}>{box.label}</div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                    <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                    <div style={{ fontSize: 67, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{(box.value / 1000).toFixed(1)}k</div>
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

          {/* Green line: vertical — touches top of green wrapper */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${150 + greenExitDY}px`, width: 2, height: `${150 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Green text: 2 rows to the right of vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 14, top: `${150 + greenExitDY + 14}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: subColor }}>Fuente: DGT</span>
            <span style={{ fontSize: 20, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 2 — Pie chart + 3 boxes (No Ench / BEV / PHEV)
// ═══════════════════════════════════════════════════════════════════════════

function DonutChart2({ enchuf, noEnch, size, bg = C.bg }: { enchuf: number; noEnch: number; size: number; bg?: string }) {
  const total = enchuf + noEnch
  const frac = total > 0 ? enchuf / total : 0
  const innerSize = Math.round(size * 0.52)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(rgba(52,211,153,0.92) 0% ${frac * 100}%, #94a3b8 ${frac * 100}% 100%)` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: innerSize, height: innerSize, borderRadius: '50%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: Math.round(innerSize * 0.28), fontWeight: 900, color: C.ev, letterSpacing: '-0.02em', lineHeight: 1 }}>{(enchuf / 1000).toFixed(1)}k</div>
      </div>
    </div>
  )
}

function DesktopV2({ periodo, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'

  // Layout: pie centered at gap between NoEnch and BEV boxes
  const innerW = 1088
  const boxW = (innerW - 24) / 3
  const gap1CenterX = boxW + 6
  const gap2CenterX = boxW * 2 + 18
  const pieSize = 192
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '18px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 24, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Matriculaciones · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={20} flushTop />}
          </div>
          <span style={{ fontSize: 28, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 4 }}>vehículos</span>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={24} />
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '18px 56px 16px', display: 'flex', flexDirection: 'column' }}>

        {/* Main: pie row above + boxes below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 12 }}>

          {/* Pie row */}
          <div style={{ height: 220, flexShrink: 0, position: 'relative' }}>

            {/* Gray callout: dot on pie left + horizontal to NoEnch center + vertical down to boxes top */}
            <div style={{ position: 'absolute', left: pieLeftX - 4, top: `calc(50% + ${-greenExitDY}px)`, width: 8, height: 8, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: `calc(50% + ${-greenExitDY}px)`, width: pieLeftX - 4 - noEnchCenterX, height: 1.5, background: noEnchColor, transform: 'translateY(-0.75px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: `calc(50% + ${-greenExitDY}px)`, width: 1.5, height: `calc(50% - ${-greenExitDY}px)`, background: noEnchColor, pointerEvents: 'none' }} />

            {/* Pie chart */}
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart2 enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>

            {/* Green dot at green arc exit */}
            <div style={{ position: 'absolute', left: pieRightX - 4, top: `calc(50% + ${greenExitDY}px)`, width: 8, height: 8, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />

            {/* Green line: horizontal to gap2 center */}
            <div style={{ position: 'absolute', left: pieRightX + 4, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 4, height: 1.5, background: C.ev, transform: 'translateY(-0.75px)', pointerEvents: 'none' }} />

          </div>

          {/* 3 boxes, full width */}
          <div style={{ flex: 1, display: 'flex', gap: 12 }}>
            {[
              { label: 'No Enchufable', value: noEnch, color: noEnchColor, yoy: noElecYoy },
              { label: 'BEV',           value: bev,    color: C.bev,       yoy: bevYoy    },
              { label: 'PHEV',          value: phev,   color: C.phev,      yoy: phevYoy   },
            ].map(box => (
              <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: box.label === 'No Enchufable' ? 20 : 27, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>
                  {box.label}
                </div>
                <div>
                  <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>% del total</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Unidades</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{(box.value / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>vs año ant.</div>
                  {box.yoy != null
                    ? <span style={{ fontSize: 25, fontWeight: 700, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', background: box.yoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: box.yoy >= 0 ? C.green : C.red }}>{box.yoy >= 0 ? '▲' : '▼'} {Math.abs(box.yoy).toFixed(1)}%</span>
                    : <span style={{ fontSize: 19, color: subColor }}>—</span>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Green line: vertical — ends at bracket */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${110 + greenExitDY}px`, width: 1.5, height: `${85 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Green bracket: from BEV center to PHEV center */}
          <div style={{ position: 'absolute', left: Math.round(boxW * 1.5 + 12), top: `${195}px`, width: Math.round(boxW + 12), height: 1.5, background: C.ev, pointerEvents: 'none' }} />

          {/* Green text: 2 rows to the right of vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 10, top: `${110 + greenExitDY + 10}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: subColor }}>Fuente: DGT</span>
            <span style={{ fontSize: 16, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitV2({ periodo, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'

  // Layout: pie centered at gap between NoEnch and BEV boxes
  const innerW = 944
  const boxW = (innerW - 32) / 3
  const gap1CenterX = boxW + 8
  const gap2CenterX = boxW * 2 + 24
  const pieSize = 260
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Matriculaciones · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={26} flushTop />}
          </div>
          <span style={{ fontSize: 36, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 6 }}>vehículos</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0 }}>
          <LogoBlock logoW={126} logoH={40} urlSize={30} autoHeight />
        </div>
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '28px 68px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 24 }}>

          {/* Pie row */}
          <div style={{ height: 300, flexShrink: 0, position: 'relative' }}>
            {/* Gray callout */}
            <div style={{ position: 'absolute', left: pieLeftX - 5, top: `calc(50% + ${-greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: `calc(50% + ${-greenExitDY}px)`, width: pieLeftX - 5 - noEnchCenterX, height: 2, background: noEnchColor, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: `calc(50% + ${-greenExitDY}px)`, width: 2, height: `calc(50% - ${-greenExitDY}px)`, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart2 enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>
            {/* Green callout */}
            <div style={{ position: 'absolute', left: pieRightX - 5, top: `calc(50% + ${greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 5, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 5, height: 2, background: C.ev, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
          </div>

          {/* 3 boxes — NoEnch separate, BEV+PHEV inside green border wrapper */}
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: noEnchColor, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>No Enchufable</div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(noEnch, total)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                <div style={{ fontSize: 67, fontWeight: 800, color: noEnchColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{(noEnch / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs año ant.</div>
                {noElecYoy != null
                  ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: noElecYoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: noElecYoy >= 0 ? C.green : C.red }}>{noElecYoy >= 0 ? '▲' : '▼'} {Math.abs(noElecYoy).toFixed(1)}%</span>
                  : <span style={{ fontSize: 31, color: subColor }}>—</span>
                }
              </div>
            </div>
            <div style={{ flex: 2, display: 'flex', gap: 12, border: `2px solid ${C.ev}`, borderRadius: 14, padding: 6 }}>
              {[
                { label: 'BEV',  value: bev,  color: C.bev,  yoy: bevYoy  },
                { label: 'PHEV', value: phev, color: C.phev, yoy: phevYoy },
              ].map(box => (
                <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>{box.label}</div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                    <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                    <div style={{ fontSize: 67, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{(box.value / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs año ant.</div>
                    {box.yoy != null
                      ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: box.yoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: box.yoy >= 0 ? C.green : C.red }}>{box.yoy >= 0 ? '▲' : '▼'} {Math.abs(box.yoy).toFixed(1)}%</span>
                      : <span style={{ fontSize: 31, color: subColor }}>—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Green line: vertical — touches top of green wrapper */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${150 + greenExitDY}px`, width: 2, height: `${150 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Green text: 2 rows to the right of vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 14, top: `${150 + greenExitDY + 14}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: subColor }}>Fuente: DGT</span>
            <span style={{ fontSize: 20, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 3 — same as V2 but BEV+PHEV wrapped in green border
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV3({ periodo, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'

  const innerW = 1088
  const boxW = (innerW - 24) / 3
  const gap1CenterX = boxW + 6
  const gap2CenterX = boxW * 2 + 18
  const pieSize = 192
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '18px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 24, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Matriculaciones · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={20} flushTop />}
          </div>
          <span style={{ fontSize: 28, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 4 }}>vehículos</span>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={24} />
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '18px 56px 16px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 12 }}>

          {/* Pie row */}
          <div style={{ height: 220, flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', left: pieLeftX - 4, top: `calc(50% + ${-greenExitDY}px)`, width: 8, height: 8, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: `calc(50% + ${-greenExitDY}px)`, width: pieLeftX - 4 - noEnchCenterX, height: 1.5, background: noEnchColor, transform: 'translateY(-0.75px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: `calc(50% + ${-greenExitDY}px)`, width: 1.5, height: `calc(50% - ${-greenExitDY}px)`, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart2 enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>
            <div style={{ position: 'absolute', left: pieRightX - 4, top: `calc(50% + ${greenExitDY}px)`, width: 8, height: 8, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 4, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 4, height: 1.5, background: C.ev, transform: 'translateY(-0.75px)', pointerEvents: 'none' }} />
          </div>

          {/* 3 boxes — NoEnch separate, BEV+PHEV inside green border wrapper */}
          <div style={{ flex: 1, display: 'flex', gap: 12 }}>
            {/* NoEnch */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: noEnchColor, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>No Enchufable</div>
              <div>
                <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>% del total</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(noEnch, total)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Unidades</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: noEnchColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{(noEnch / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>vs año ant.</div>
                {noElecYoy != null
                  ? <span style={{ fontSize: 25, fontWeight: 700, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', background: noElecYoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: noElecYoy >= 0 ? C.green : C.red }}>{noElecYoy >= 0 ? '▲' : '▼'} {Math.abs(noElecYoy).toFixed(1)}%</span>
                  : <span style={{ fontSize: 19, color: subColor }}>—</span>
                }
              </div>
            </div>
            {/* BEV + PHEV in green border wrapper */}
            <div style={{ flex: 2, display: 'flex', gap: 8, border: `1.5px solid ${C.ev}`, borderRadius: 10, padding: 4 }}>
              {[
                { label: 'BEV',  value: bev,  color: C.bev,  yoy: bevYoy  },
                { label: 'PHEV', value: phev, color: C.phev, yoy: phevYoy },
              ].map(box => (
                <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 27, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>{box.label}</div>
                  <div>
                    <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>% del total</div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Unidades</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{(box.value / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 17, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>vs año ant.</div>
                    {box.yoy != null
                      ? <span style={{ fontSize: 25, fontWeight: 700, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', background: box.yoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: box.yoy >= 0 ? C.green : C.red }}>{box.yoy >= 0 ? '▲' : '▼'} {Math.abs(box.yoy).toFixed(1)}%</span>
                      : <span style={{ fontSize: 19, color: subColor }}>—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Green line: vertical — touches top of green wrapper */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${110 + greenExitDY}px`, width: 1.5, height: `${110 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Green text: 2 rows to the right of vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 10, top: `${110 + greenExitDY + 10}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: subColor }}>Fuente: DGT</span>
            <span style={{ fontSize: 16, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitV3({ periodo, bev, phev, hev, totalMercado, bevYoy, phevYoy, evYoy, noElecYoy, totalYoy }: Omit<Props, 'format' | 'variant'>) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
  const noEnchColor = '#94a3b8'
  const subColor = 'rgba(148,163,184,0.65)'

  const innerW = 944
  const boxW = (innerW - 32) / 3
  const gap1CenterX = boxW + 8
  const gap2CenterX = boxW * 2 + 24
  const pieSize = 260
  const pieLeftX = Math.round(gap1CenterX - pieSize / 2)
  const pieRightX = Math.round(gap1CenterX + pieSize / 2)
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* Banda blanca */}
      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Matriculaciones · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <YoyBadgeLight value={totalYoy} size={26} flushTop />}
          </div>
          <span style={{ fontSize: 36, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 6 }}>vehículos</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0 }}>
          <LogoBlock logoW={126} logoH={40} urlSize={30} autoHeight />
        </div>
      </div>

      {/* Sección oscura */}
      <div style={{ flex: 1, padding: '28px 68px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 24 }}>

          {/* Pie row */}
          <div style={{ height: 300, flexShrink: 0, position: 'relative' }}>
            {/* Gray callout */}
            <div style={{ position: 'absolute', left: pieLeftX - 5, top: `calc(50% + ${-greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: `calc(50% + ${-greenExitDY}px)`, width: pieLeftX - 5 - noEnchCenterX, height: 2, background: noEnchColor, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: `calc(50% + ${-greenExitDY}px)`, width: 2, height: `calc(50% - ${-greenExitDY}px)`, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart2 enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>
            {/* Green callout */}
            <div style={{ position: 'absolute', left: pieRightX - 5, top: `calc(50% + ${greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 5, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 5, height: 2, background: C.ev, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
          </div>

          {/* 3 boxes — NoEnch separate, BEV+PHEV inside green border wrapper */}
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: noEnchColor, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>No Enchufable</div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(noEnch, total)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                <div style={{ fontSize: 67, fontWeight: 800, color: noEnchColor, letterSpacing: '-0.02em', lineHeight: 1 }}>{(noEnch / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs año ant.</div>
                {noElecYoy != null
                  ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: noElecYoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: noElecYoy >= 0 ? C.green : C.red }}>{noElecYoy >= 0 ? '▲' : '▼'} {Math.abs(noElecYoy).toFixed(1)}%</span>
                  : <span style={{ fontSize: 31, color: subColor }}>—</span>
                }
              </div>
            </div>
            <div style={{ flex: 2, display: 'flex', gap: 12, border: `2px solid ${C.ev}`, borderRadius: 14, padding: 6 }}>
              {[
                { label: 'BEV',  value: bev,  color: C.bev,  yoy: bevYoy  },
                { label: 'PHEV', value: phev, color: C.phev, yoy: phevYoy },
              ].map(box => (
                <div key={box.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: box.color, letterSpacing: '0.05em', textTransform: 'uppercase', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.12)', lineHeight: 1.2 }}>{box.label}</div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>% del total</div>
                    <div style={{ fontSize: 76, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct(box.value, total)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Unidades</div>
                    <div style={{ fontSize: 67, fontWeight: 800, color: box.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{(box.value / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 25, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>vs año ant.</div>
                    {box.yoy != null
                      ? <span style={{ fontSize: 40, fontWeight: 700, padding: '4px 12px', borderRadius: 7, whiteSpace: 'nowrap', background: box.yoy >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: box.yoy >= 0 ? C.green : C.red }}>{box.yoy >= 0 ? '▲' : '▼'} {Math.abs(box.yoy).toFixed(1)}%</span>
                      : <span style={{ fontSize: 31, color: subColor }}>—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Green line: vertical — touches top of green wrapper */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${150 + greenExitDY}px`, width: 2, height: `${150 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          {/* Green text: 2 rows to the right of vertical line */}
          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 14, top: `${150 + greenExitDY + 14}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, color: subColor }}>Fuente: DGT</span>
            <span style={{ fontSize: 20, color: subColor }}>eMobility Insights by Capira</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

export function MatriculacionesMes({ format, variant = 1, ...props }: Props) {
  const isDesktop = format === 'linkedin-desktop'
  if (variant === 2) return isDesktop ? <DesktopV2 {...props} /> : <PortraitV2 {...props} />
  if (variant === 3) return isDesktop ? <DesktopV3 {...props} /> : <PortraitV3 {...props} />
  return isDesktop ? <DesktopV1 {...props} /> : <PortraitV1 {...props} />
}
