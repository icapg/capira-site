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

export function AcumuladoMes({ periodo, periodoFull, periodoPrevFull, bevActivos, phevActivos, bevYoy, phevYoy, evYoy, parqueTotal = 0, noEnchufables = 0 }: Props) {
  const evActivos  = bevActivos + phevActivos
  const penetPct   = parqueTotal > 0 ? ((evActivos    / parqueTotal) * 100).toFixed(2).replace('.', ',') : null
  const bevPct     = parqueTotal > 0 ? ((bevActivos   / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'
  const phevPct    = parqueTotal > 0 ? ((phevActivos  / parqueTotal) * 100).toFixed(2).replace('.', ',') : '0'

  const SW = 960, SH = 480
  const cx = SW / 2, cy = 260
  const OR = 200, IR = 128

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

  const BEV_DEG = 28, PHEV_DEG = 22, GAP = 2.5
  const bevStart  = 0,               bevEnd  = BEV_DEG
  const phevStart = bevEnd + GAP,    phevEnd = phevStart + PHEV_DEG
  const bgStart   = phevEnd + GAP,   bgEnd   = 360 - GAP

  const bevPath  = donutPath(bevStart,  bevEnd,  OR, IR)
  const phevPath = donutPath(phevStart, phevEnd, OR, IR)
  const bgPath   = donutPath(bgStart,   bgEnd,   OR, IR)
  const bevHalo  = donutPath(bevStart - 1,  bevEnd + 1,  OR + 10, IR - 10)
  const phevHalo = donutPath(phevStart - 1, phevEnd + 1, OR + 10, IR - 10)

  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = i * 10
    const p1 = ptAt(a, OR + 6), p2 = ptAt(a, OR + 18)
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
  })

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
          <LogoBlock logoW={113} urlSize={34} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 40px 28px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'BEV',  sub: 'Eléctrico puro',     value: bevActivos,  yoy: bevYoy,  color: C.bev,  bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
            { label: 'PHEV', sub: 'Híbrido enchufable', value: phevActivos, yoy: phevYoy, color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)' },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 16, padding: '22px 28px' }}>
              <div style={{ fontSize: 32, color: card.color, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1 }}>{card.label}</div>
              <div style={{ fontSize: 30, color: card.color, opacity: 0.7, fontWeight: 500, marginTop: 4, marginBottom: 10 }}>{card.sub}</div>
              <div style={{ fontSize: 86, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 10 }}><YoyBadge value={card.yoy} size={31} /></div>}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }} />

        <div style={{ position: 'relative', width: SW, alignSelf: 'center', flexShrink: 0 }}>
          <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: 'block', overflow: 'hidden' }}>

            {ticks.map((t, i) => (
              <line key={i} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)}
                stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
            ))}

            <path d={bgPath} fill="rgba(255,255,255,0.05)" />

            <path d={bevHalo}  fill="rgba(56,189,248,0.12)" />
            <path d={phevHalo} fill="rgba(251,146,60,0.12)" />

            <path d={bevPath}  fill="#38bdf8" />
            <path d={phevPath} fill="#fb923c" />

            <line x1={bevDot.x.toFixed(1)}  y1={bevDot.y.toFixed(1)}  x2={bevLbl.x.toFixed(1)}  y2={(bevLbl.y + 8).toFixed(1)}
              stroke="rgba(56,189,248,0.45)"  strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1={phevDot.x.toFixed(1)} y1={phevDot.y.toFixed(1)} x2={phevLbl.x.toFixed(1)} y2={(phevLbl.y + 8).toFixed(1)}
              stroke="rgba(251,146,60,0.45)" strokeWidth="1.5" strokeDasharray="4 3" />

            <text x={bevLbl.x.toFixed(1)}  y={(bevLbl.y + 28).toFixed(1)}  textAnchor="middle"
              fill="#38bdf8" fontSize="36" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">
              {bevPct}%
            </text>
            <text x={phevLbl.x.toFixed(1)} y={(phevLbl.y + 28).toFixed(1)} textAnchor="middle"
              fill="#fb923c" fontSize="36" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">
              {phevPct}%
            </text>

          </svg>

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

        <div style={{ display: 'flex', gap: 0, marginTop: 12, alignItems: 'stretch' }}>
          {[
            { label: 'Parque total',   value: fmtM(parqueTotal),   color: C.text    },
            { label: 'No enchufables', value: fmtM(noEnchufables), color: '#94a3b8' },
            { label: 'Enchufables',    value: fmt(evActivos),      color: C.green   },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 20 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 24, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 72, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>{s.value}</div>
            </div>
          ))}
        </div>

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
