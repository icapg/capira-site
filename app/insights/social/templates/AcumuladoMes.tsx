import type { Format } from './types'

type Props = {
  periodo: string
  periodoFull?: string
  periodoPrevFull?: string
  bevActivos: number
  phevActivos: number
  hevActivos: number
  bevYoy?: number
  phevYoy?: number
  evYoy?: number
  parqueTotal?: number
  noEnchufables?: number
  format: Format
  variant?: 1 | 2
}

const C = {
  bg:     '#050810',
  bev:    '#38bdf8',
  phev:   '#fb923c',
  hev:    '#34d399',
  green:  '#34d399',
  red:    '#f87171',
  text:   '#f1f5f9',
  muted:  'rgba(241,245,249,0.45)',
  dim:    'rgba(241,245,249,0.20)',
  border: 'rgba(255,255,255,0.07)',
}

function fmt(n: number) { return n.toLocaleString('es-ES') }
function fmtM(n: number) { return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M' }

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
// VARIANT 1 — Dark (original)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV1({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const totalActivos = bevActivos + phevActivos + hevActivos

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 27, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Parque EV Activo · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            <span style={{ fontSize: 33, fontWeight: 500, color: '#64748b' }}>BEV + PHEV activos</span>
            {evYoy != null && <YoyBadgeLight value={evYoy} size={26} />}
          </div>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={27} />
      </div>

      <div style={{ flex: 1, padding: '18px 56px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'BEV',  value: bevActivos,  yoy: bevYoy,    color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV', value: phevActivos, yoy: phevYoy,   color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
            { label: 'HEV',  value: hevActivos,  yoy: undefined, color: C.hev,  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 27, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 51, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 6 }}><YoyBadge value={card.yoy} size={21} /></div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 27, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composición parque eléctrico (BEV + PHEV + HEV)</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            {[{ v: bevActivos, c: C.bev }, { v: phevActivos, c: C.phev }, { v: hevActivos, c: C.hev }].map((s, i) => (
              <div key={i} style={{ flex: s.v, background: s.c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[{ label: 'BEV', value: bevActivos, color: C.bev }, { label: 'PHEV', value: phevActivos, color: C.phev }, { label: 'HEV', value: hevActivos, color: C.hev }].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 27, color: C.muted }}>{item.label} · {totalActivos > 0 ? ((item.value / totalActivos) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
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

function PortraitV1({ periodo, periodoFull, periodoPrevFull, bevActivos, phevActivos, bevYoy, phevYoy, evYoy, parqueTotal = 0, noEnchufables = 0 }: Omit<Props, 'format' | 'variant'>) {
  const evActivos  = bevActivos + phevActivos
  const penetPct   = parqueTotal > 0 ? ((evActivos    / parqueTotal) * 100).toFixed(2).replace('.', ',') : null
  const bevPct     = parqueTotal > 0 ? ((bevActivos   / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'
  const phevPct    = parqueTotal > 0 ? ((phevActivos  / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'

  // ── Donut chart geometry ────────────────────────────────────
  const SW = 960, SH = 480
  const cx = SW / 2, cy = 260
  const OR = 200, IR = 128  // outer / inner radius (72px thick ring)

  function ptAt(deg: number, r: number) {
    const rad = (deg - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function donutPath(startDeg: number, endDeg: number, outerR: number, innerR: number): string {
    const diff = endDeg - startDeg
    if (diff <= 0) return ''
    const large  = diff > 180 ? 1 : 0
    const so = ptAt(startDeg, outerR), eo = ptAt(endDeg, outerR)
    const si = ptAt(startDeg, innerR), ei = ptAt(endDeg, innerR)
    return `M ${so.x.toFixed(2)} ${so.y.toFixed(2)} A ${outerR} ${outerR} 0 ${large} 1 ${eo.x.toFixed(2)} ${eo.y.toFixed(2)} L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)} A ${innerR} ${innerR} 0 ${large} 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)} Z`
  }

  // Segmentos: visualmente aumentados (no proporcionales) para legibilidad
  const BEV_DEG = 28, PHEV_DEG = 22, GAP = 2.5
  const bevStart  = 0,               bevEnd  = BEV_DEG
  const phevStart = bevEnd + GAP,    phevEnd = phevStart + PHEV_DEG
  const bgStart   = phevEnd + GAP,   bgEnd   = 360 - GAP

  const bevPath  = donutPath(bevStart,  bevEnd,  OR, IR)
  const phevPath = donutPath(phevStart, phevEnd, OR, IR)
  const bgPath   = donutPath(bgStart,   bgEnd,   OR, IR)
  // halos (ligeramente más grandes)
  const bevHalo  = donutPath(bevStart - 1,  bevEnd + 1,  OR + 10, IR - 10)
  const phevHalo = donutPath(phevStart - 1, phevEnd + 1, OR + 10, IR - 10)

  // Ticks decorativos (cada 10°)
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = i * 10
    const p1 = ptAt(a, OR + 6), p2 = ptAt(a, OR + 18)
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
  })

  // Etiquetas fuera del ring
  const bevMid   = (bevStart + bevEnd) / 2
  const phevMid  = (phevStart + phevEnd) / 2
  const LBLR_BEV  = OR + 52
  const LBLR_PHEV = OR + 90
  const bevLbl   = ptAt(bevMid,  LBLR_BEV)
  const phevLbl  = ptAt(phevMid, LBLR_PHEV)
  const bevDot   = ptAt(bevMid, OR + 4)
  const phevDot  = ptAt(phevMid, OR + 4)

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* ── Banda blanca (mismo header que BajasMes V1) ── */}
      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 35, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {periodoFull ?? periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            {evYoy != null && <div style={{ marginTop: 30 }}><YoyBadgeLight value={evYoy} size={34} flushTop /></div>}
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, color: C.green, display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 8, letterSpacing: '0.08em' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 5px rgba(52,211,153,0.20)' }} />
            ENCHUFABLES ACTIVOS
          </span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <LogoBlock logoW={113} logoH={40} urlSize={34} autoHeight />
        </div>
      </div>

      {/* ── DARK BODY ── */}
      <div style={{ flex: 1, padding: '32px 40px 28px', display: 'flex', flexDirection: 'column' }}>

        {/* Cards BEV + PHEV */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'BEV',  sub: 'Eléctrico puro',       value: bevActivos,  yoy: bevYoy,  color: C.bev,  bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
            { label: 'PHEV', sub: 'Híbrido enchufable',   value: phevActivos, yoy: phevYoy, color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)' },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 16, padding: '22px 28px' }}>
              <div style={{ fontSize: 32, color: card.color, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1 }}>{card.label}</div>
              <div style={{ fontSize: 30, color: card.color, opacity: 0.7, fontWeight: 500, marginTop: 4, marginBottom: 10 }}>{card.sub}</div>
              <div style={{ fontSize: 86, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 10 }}><YoyBadge value={card.yoy} size={31} /></div>}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }} />

        {/* Donut chart con texto centrado */}
        <div style={{ position: 'relative', width: SW, alignSelf: 'center', flexShrink: 0 }}>
          <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: 'block', overflow: 'hidden' }}>

            {/* Ticks decorativos */}
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)}
                stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
            ))}

            {/* Background — no enchufables */}
            <path d={bgPath} fill="rgba(255,255,255,0.05)" />

            {/* Halos */}
            <path d={bevHalo}  fill="rgba(56,189,248,0.12)" />
            <path d={phevHalo} fill="rgba(251,146,60,0.12)" />

            {/* Segmentos */}
            <path d={bevPath}  fill="#38bdf8" />
            <path d={phevPath} fill="#fb923c" />

            {/* Líneas a etiquetas */}
            <line x1={bevDot.x.toFixed(1)}  y1={bevDot.y.toFixed(1)}  x2={bevLbl.x.toFixed(1)}  y2={(bevLbl.y + 8).toFixed(1)}
              stroke="rgba(56,189,248,0.45)"  strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1={phevDot.x.toFixed(1)} y1={phevDot.y.toFixed(1)} x2={phevLbl.x.toFixed(1)} y2={(phevLbl.y + 8).toFixed(1)}
              stroke="rgba(251,146,60,0.45)" strokeWidth="1.5" strokeDasharray="4 3" />

            {/* Etiquetas externas */}
            <text x={bevLbl.x.toFixed(1)}  y={(bevLbl.y + 28).toFixed(1)}  textAnchor="middle"
              fill="#38bdf8" fontSize="36" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">
              {bevPct}%
            </text>
            <text x={phevLbl.x.toFixed(1)} y={(phevLbl.y + 28).toFixed(1)} textAnchor="middle"
              fill="#fb923c" fontSize="36" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">
              {phevPct}%
            </text>

          </svg>

          {/* Texto central superpuesto */}
          <div style={{
            position: 'absolute',
            left: `${cx}px`, top: `${cy}px`,
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            {penetPct != null
              ? <div style={{ fontSize: 96, fontWeight: 900, color: C.green, letterSpacing: '-0.05em', lineHeight: 1 }}>{penetPct}%</div>
              : <div style={{ fontSize: 48, color: C.muted }}>—</div>
            }
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginTop: 12, alignItems: 'stretch' }}>
          {[
            { label: 'Parque total',        value: fmtM(parqueTotal),   color: C.text    },
            { label: 'No enchufables',       value: fmtM(noEnchufables), color: '#94a3b8' },
            { label: 'Enchufables',          value: fmt(evActivos),      color: C.green   },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 20 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 24, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 72, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24, color: 'rgba(241,245,249,0.55)' }}>▲▼ Comparación {periodoFull ?? periodo} vs {periodoPrevFull ?? 'año anterior'}</span>
            <span style={{ fontSize: 24, color: 'rgba(241,245,249,0.55)' }}>Fuente: DGT</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 2 — (copia de V1 para experimentar)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopV2({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const totalActivos = bevActivos + phevActivos + hevActivos

  return (
    <div style={{ width: 1200, height: 627, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 27, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Parque EV Activo · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 93, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            <span style={{ fontSize: 33, fontWeight: 500, color: '#64748b' }}>BEV + PHEV activos</span>
            {evYoy != null && <YoyBadgeLight value={evYoy} size={26} />}
          </div>
        </div>
        <LogoBlock logoW={110} logoH={34} urlSize={27} />
      </div>

      <div style={{ flex: 1, padding: '18px 56px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'BEV',  value: bevActivos,  yoy: bevYoy,    color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV', value: phevActivos, yoy: phevYoy,   color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
            { label: 'HEV',  value: hevActivos,  yoy: undefined, color: C.hev,  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 27, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 51, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 6 }}><YoyBadge value={card.yoy} size={21} /></div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 27, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composición parque eléctrico (BEV + PHEV + HEV)</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            {[{ v: bevActivos, c: C.bev }, { v: phevActivos, c: C.phev }, { v: hevActivos, c: C.hev }].map((s, i) => (
              <div key={i} style={{ flex: s.v, background: s.c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[{ label: 'BEV', value: bevActivos, color: C.bev }, { label: 'PHEV', value: phevActivos, color: C.phev }, { label: 'HEV', value: hevActivos, color: C.hev }].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 27, color: C.muted }}>{item.label} · {totalActivos > 0 ? ((item.value / totalActivos) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
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

function PortraitV2({ periodo, periodoFull, periodoPrevFull, bevActivos, phevActivos, bevYoy, phevYoy, evYoy, parqueTotal = 0, noEnchufables = 0 }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const penetRaw  = parqueTotal > 0 ? (evActivos / parqueTotal) * 100 : 0
  const penetStr  = parqueTotal > 0 ? penetRaw.toFixed(2).replace('.', ',') : null
  const bevPct    = parqueTotal > 0 ? ((bevActivos  / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'
  const phevPct   = parqueTotal > 0 ? ((phevActivos / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'

  // ── Gauge geometry (semicircle) ──
  const GW = 960, GH = 500
  const gcx = GW / 2, gcy = 440
  const gOR = 340, gIR = 250
  const startDeg = -90    // 9 o'clock, measured with 0° pointing up (we'll rotate)
  const endDeg   = 90     // 3 o'clock
  // We'll draw along the top half. Angle runs from -90 (left) to +90 (right).
  // Filled portion = penetRaw / MAX * (endDeg - startDeg)
  const GAUGE_MAX = 5  // show progress against a 5% goal so 1.63% reads clearly
  const frac = Math.min(penetRaw / GAUGE_MAX, 1)
  const fillEnd = startDeg + frac * (endDeg - startDeg)

  function ptAt(deg: number, r: number) {
    // deg: -90 = left, 0 = top, +90 = right (measuring from vertical)
    const rad = (deg - 90) * Math.PI / 180  // rotate so -90 → 180° standard (left side)
    return { x: gcx + r * Math.cos(rad), y: gcy + r * Math.sin(rad) }
  }

  function arcPath(sDeg: number, eDeg: number, outerR: number, innerR: number): string {
    const diff = eDeg - sDeg
    if (diff <= 0.01) return ''
    const large = diff > 180 ? 1 : 0
    const so = ptAt(sDeg, outerR), eo = ptAt(eDeg, outerR)
    const si = ptAt(sDeg, innerR), ei = ptAt(eDeg, innerR)
    return `M ${so.x.toFixed(2)} ${so.y.toFixed(2)} A ${outerR} ${outerR} 0 ${large} 1 ${eo.x.toFixed(2)} ${eo.y.toFixed(2)} L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)} A ${innerR} ${innerR} 0 ${large} 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)} Z`
  }

  const trackPath = arcPath(startDeg, endDeg, gOR, gIR)
  const fillPath  = arcPath(startDeg, fillEnd, gOR, gIR)

  // Needle
  const needleAngleDeg = fillEnd
  const needleOuter = ptAt(needleAngleDeg, gOR + 22)
  const needleInner = ptAt(needleAngleDeg, gIR - 10)

  // Tick marks every 1%
  const ticks = Array.from({ length: GAUGE_MAX + 1 }, (_, i) => {
    const d = startDeg + (i / GAUGE_MAX) * (endDeg - startDeg)
    const p1 = ptAt(d, gOR + 12), p2 = ptAt(d, gOR + 30)
    const lblP = ptAt(d, gOR + 58)
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, lx: lblP.x, ly: lblP.y, label: `${i}%` }
  })

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ background: '#fff', padding: '28px 68px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, color: '#16a34a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Parque EV · {periodoFull ?? periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span style={{ fontSize: 138, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            {evYoy != null && <div style={{ marginTop: 32 }}><YoyBadgeLight value={evYoy} size={36} flushTop /></div>}
          </div>
          <span style={{ fontSize: 30, fontWeight: 500, color: '#64748b', display: 'block', marginTop: 6 }}>enchufables activos en circulación</span>
        </div>
        <div style={{ marginLeft: 32, flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <LogoBlock logoW={113} logoH={40} urlSize={34} autoHeight />
        </div>
      </div>

      {/* ── DARK BODY ── */}
      <div style={{ flex: 1, padding: '32px 60px 24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.10), transparent 65%)', pointerEvents: 'none' }} />

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, position: 'relative' }}>
          <div style={{ width: 6, height: 28, background: C.green, borderRadius: 3 }} />
          <span style={{ fontSize: 26, color: 'rgba(241,245,249,0.65)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Penetración sobre parque total</span>
        </div>

        {/* Gauge */}
        <div style={{ position: 'relative', alignSelf: 'center', width: GW, marginBottom: 8 }}>
          <svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`} style={{ display: 'block', overflow: 'visible' }}>
            {/* Track */}
            <path d={trackPath} fill="rgba(255,255,255,0.06)" />

            {/* Gradient for fill */}
            <defs>
              <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#38bdf8" />
                <stop offset="60%"  stopColor="#34d399" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Fill */}
            <path d={fillPath} fill="url(#gaugeFill)" filter="url(#glow)" />

            {/* Ticks + labels */}
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)}
                  stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                <text x={t.lx.toFixed(1)} y={(t.ly + 8).toFixed(1)} textAnchor="middle"
                  fill="rgba(241,245,249,0.4)" fontSize="22" fontWeight="600" fontFamily="system-ui,-apple-system,sans-serif">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Needle */}
            <line
              x1={needleInner.x.toFixed(2)} y1={needleInner.y.toFixed(2)}
              x2={needleOuter.x.toFixed(2)} y2={needleOuter.y.toFixed(2)}
              stroke="#34d399" strokeWidth="5" strokeLinecap="round"
            />
            <circle cx={gcx} cy={gcy} r="12" fill="#34d399" />
            <circle cx={gcx} cy={gcy} r="6" fill={C.bg} />
          </svg>

          {/* Center readout */}
          <div style={{
            position: 'absolute',
            left: `${gcx}px`, top: `${gcy - 110}px`,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 22, color: 'rgba(241,245,249,0.5)', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Penetración actual</div>
            {penetStr != null
              ? <div style={{ fontSize: 132, fontWeight: 900, color: C.green, letterSpacing: '-0.05em', lineHeight: 1 }}>{penetStr}%</div>
              : <div style={{ fontSize: 48, color: C.muted }}>—</div>
            }
          </div>
        </div>

        {/* BEV + PHEV cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, marginTop: 4, position: 'relative' }}>
          {[
            { label: 'BEV',  sub: 'Eléctrico puro',      value: bevActivos,  yoy: bevYoy,  pct: bevPct,  color: C.bev,  rgb: '56,189,248' },
            { label: 'PHEV', sub: 'Híbrido enchufable',  value: phevActivos, yoy: phevYoy, pct: phevPct, color: C.phev, rgb: '251,146,60' },
          ].map(card => (
            <div key={card.label} style={{
              flex: 1,
              background: `linear-gradient(135deg, rgba(${card.rgb},0.16) 0%, rgba(${card.rgb},0.04) 100%)`,
              border: `1px solid rgba(${card.rgb},0.38)`,
              borderRadius: 22,
              padding: '22px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, rgba(${card.rgb},0.20), transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 36, color: card.color, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1 }}>{card.label}</div>
                  <div style={{ fontSize: 22, color: 'rgba(241,245,249,0.55)', fontWeight: 500, marginTop: 4 }}>{card.sub}</div>
                </div>
                {card.yoy != null && <YoyBadge value={card.yoy} size={26} />}
              </div>

              <div style={{ fontSize: 72, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', lineHeight: 1, position: 'relative' }}>{fmt(card.value)}</div>
              <div style={{ fontSize: 24, color: card.color, fontWeight: 700, marginTop: 8, letterSpacing: '0.02em', position: 'relative' }}>{card.pct}% del parque</div>
            </div>
          ))}
        </div>

        {/* Context strip */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '14px 24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 14 }}>
          {[
            { label: 'Parque total',    value: fmtM(parqueTotal),    color: C.text    },
            { label: 'No enchufables',  value: fmtM(noEnchufables),  color: '#94a3b8' },
            { label: 'Enchufables',     value: fmt(evActivos),       color: C.green   },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 18, color: 'rgba(241,245,249,0.45)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24, color: 'rgba(241,245,249,0.5)' }}>▲▼ vs {periodoPrevFull ?? 'año anterior'}</span>
            <span style={{ fontSize: 24, color: 'rgba(241,245,249,0.5)' }}>Fuente: DGT</span>
          </div>
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

export function AcumuladoMes({ format, variant = 1, ...props }: Props) {
  const isDesktop = format === 'linkedin-desktop'
  if (variant === 2) return isDesktop ? <DesktopV2 {...props} /> : <PortraitV2 {...props} />
  return isDesktop ? <DesktopV1 {...props} /> : <PortraitV1 {...props} />
}
