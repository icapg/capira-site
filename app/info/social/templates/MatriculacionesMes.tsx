type Props = {
  periodo: string
  periodoFull?: string
  periodoPrev?: string
  periodoPrevFull?: string
  bev: number
  phev: number
  hev: number
  totalMercado: number
  bevYoy?: number
  phevYoy?: number
  evYoy?: number
  noElecYoy?: number
  totalYoy?: number
}

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

function YoyBadgeLight({ value, size = 16, flushTop = false }: { value?: number; size?: number; flushTop?: boolean }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: flushTop ? '0px 9px 4px' : '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', lineHeight: 1, background: up ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)', color: up ? '#16a34a' : '#dc2626' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function LogoBlock({ logoW, urlSize, urlColor = '#94a3b8' }: { logoW: number; urlSize: number; urlColor?: string }) {
  const computedH = Math.round(logoW * 849 / 630)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo sin padding.png" alt="Capira" width={logoW} height={computedH} style={{ objectFit: 'contain', display: 'block', width: logoW, height: computedH }} />
      <span style={{ fontSize: urlSize, color: urlColor, fontWeight: 500 }}>capirapower.com</span>
    </div>
  )
}

function DonutChart({ enchuf, noEnch, size, bg = C.bg }: { enchuf: number; noEnch: number; size: number; bg?: string }) {
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

export function MatriculacionesMes({ periodo, periodoFull, periodoPrev, periodoPrevFull, bev, phev, totalMercado, bevYoy, phevYoy, noElecYoy, totalYoy }: Props) {
  const ev = bev + phev
  const noEnch = Math.max(0, totalMercado - bev - phev)
  const total = totalMercado
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
  const frac = total > 0 ? ev / total : 0
  const midAngleRad = (frac / 2) * 2 * Math.PI
  const greenExitDY = Math.round(-Math.cos(midAngleRad) * (pieSize / 2))
  const noEnchCenterX = Math.round(boxW / 2)
  const origDownH = 150 + greenExitDY
  const noEnchTopY = 150 - greenExitDY - origDownH * 2

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 35, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {periodoFull ?? periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(total)}</span>
            {totalYoy != null && <div style={{ marginTop: v1TotalYoyMarginTop }}><YoyBadgeLight value={totalYoy} size={34} flushTop /></div>}
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#fff', background: '#16a34a', display: 'inline-block', marginTop: 8, padding: '4px 14px', borderRadius: 7 }}>vehículos matriculados</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <LogoBlock logoW={113} urlSize={34} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '28px 68px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 24 }}>

          <div style={{ height: 300, flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', left: pieLeftX - 5, top: noEnchTopY, width: 10, height: 10, borderRadius: '50%', background: noEnchColor, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX, top: noEnchTopY, width: pieLeftX - 5 - noEnchCenterX, height: 2, background: noEnchColor, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: noEnchCenterX - 1, top: noEnchTopY, width: 2, height: origDownH * 3, background: noEnchColor, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieLeftX, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DonutChart enchuf={ev} noEnch={noEnch} size={pieSize} bg={C.bg} />
            </div>
            <div style={{ position: 'absolute', left: pieRightX - 5, top: `calc(50% + ${greenExitDY}px)`, width: 10, height: 10, borderRadius: '50%', background: C.ev, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: pieRightX + 5, top: `calc(50% + ${greenExitDY}px)`, width: gap2CenterX - pieRightX - 5, height: 2, background: C.ev, transform: 'translateY(-1px)', pointerEvents: 'none' }} />
          </div>

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

          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) - 1, top: `${150 + greenExitDY}px`, width: 2, height: `${150 - greenExitDY}px`, background: C.ev, pointerEvents: 'none' }} />

          <div style={{ position: 'absolute', left: Math.round(gap2CenterX) + 14, top: `${150 + greenExitDY + 14}px`, pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.ev, lineHeight: 1.15 }}>{pct(ev, total)}%</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ev, lineHeight: 1.15 }}>enchufables</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 30, color: 'rgba(148,163,184,0.95)' }}>▲▼ Comparación {periodoFull ?? periodo} vs {periodoPrevFull ?? periodoPrev ?? 'año anterior'}</span>
            <span style={{ fontSize: 30, color: 'rgba(148,163,184,0.95)' }}>Fuente: DGT</span>
          </div>
        </div>
      </div>
    </div>
  )
}
