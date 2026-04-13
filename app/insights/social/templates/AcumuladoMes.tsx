import Image from 'next/image'
import type { Format } from './types'

type Props = {
  periodo: string
  bevActivos: number
  phevActivos: number
  hevActivos: number
  bevYoy?: number
  phevYoy?: number
  evYoy?: number
  format: Format
  variant?: 1 | 2 | 3
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

function YoyBadge({ value, size = 16 }: { value?: number; size?: number }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: up ? C.green : C.red }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function YoyBadgeLight({ value, size = 16 }: { value?: number; size?: number }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: up ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)', color: up ? '#16a34a' : '#dc2626' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function LogoBlock({ logoW, logoH, urlSize, urlColor = '#94a3b8' }: { logoW: number; logoH: number; urlSize: number; urlColor?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <Image src="/logo.png" alt="Capira" width={logoW} height={logoH} style={{ objectFit: 'contain' }} />
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

function PortraitV1({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const totalActivos = bevActivos + phevActivos + hevActivos

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '32px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 33, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Parque EV Activo · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            <span style={{ fontSize: 39, fontWeight: 500, color: '#64748b' }}>BEV + PHEV activos</span>
            {evYoy != null && <YoyBadgeLight value={evYoy} size={30} />}
          </div>
        </div>
        <LogoBlock logoW={140} logoH={44} urlSize={33} />
      </div>

      <div style={{ flex: 1, padding: '28px 68px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'BEV',  value: bevActivos,  yoy: bevYoy,    color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV', value: phevActivos, yoy: phevYoy,   color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
            { label: 'HEV',  value: hevActivos,  yoy: undefined, color: C.hev,  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 33, color: C.muted, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 10 }}><YoyBadge value={card.yoy} size={27} /></div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: 33, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composición parque eléctrico</div>
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
            {[{ v: bevActivos, c: C.bev }, { v: phevActivos, c: C.phev }, { v: hevActivos, c: C.hev }].map((s, i) => (
              <div key={i} style={{ flex: s.v, background: s.c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            {[{ label: 'BEV', value: bevActivos, color: C.bev }, { label: 'PHEV', value: phevActivos, color: C.phev }, { label: 'HEV', value: hevActivos, color: C.hev }].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                <span style={{ fontSize: 33, color: C.muted }}>{item.label} · {totalActivos > 0 ? ((item.value / totalActivos) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
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

function PortraitV2({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const totalActivos = bevActivos + phevActivos + hevActivos

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '32px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 33, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Parque EV Activo · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            <span style={{ fontSize: 39, fontWeight: 500, color: '#64748b' }}>BEV + PHEV activos</span>
            {evYoy != null && <YoyBadgeLight value={evYoy} size={30} />}
          </div>
        </div>
        <LogoBlock logoW={140} logoH={44} urlSize={33} />
      </div>

      <div style={{ flex: 1, padding: '28px 68px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'BEV',  value: bevActivos,  yoy: bevYoy,    color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV', value: phevActivos, yoy: phevYoy,   color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
            { label: 'HEV',  value: hevActivos,  yoy: undefined, color: C.hev,  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 33, color: C.muted, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 10 }}><YoyBadge value={card.yoy} size={27} /></div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: 33, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composición parque eléctrico</div>
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
            {[{ v: bevActivos, c: C.bev }, { v: phevActivos, c: C.phev }, { v: hevActivos, c: C.hev }].map((s, i) => (
              <div key={i} style={{ flex: s.v, background: s.c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            {[{ label: 'BEV', value: bevActivos, color: C.bev }, { label: 'PHEV', value: phevActivos, color: C.phev }, { label: 'HEV', value: hevActivos, color: C.hev }].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                <span style={{ fontSize: 33, color: C.muted }}>{item.label} · {totalActivos > 0 ? ((item.value / totalActivos) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
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

function DesktopV3({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
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

function PortraitV3({ periodo, bevActivos, phevActivos, hevActivos, bevYoy, phevYoy, evYoy }: Omit<Props, 'format' | 'variant'>) {
  const evActivos = bevActivos + phevActivos
  const totalActivos = bevActivos + phevActivos + hevActivos

  return (
    <div style={{ width: 1080, height: 1350, background: C.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>

      <div style={{ background: '#fff', padding: '32px 68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 33, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Parque EV Activo · {periodo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 132, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(evActivos)}</span>
            <span style={{ fontSize: 39, fontWeight: 500, color: '#64748b' }}>BEV + PHEV activos</span>
            {evYoy != null && <YoyBadgeLight value={evYoy} size={30} />}
          </div>
        </div>
        <LogoBlock logoW={140} logoH={44} urlSize={33} />
      </div>

      <div style={{ flex: 1, padding: '28px 68px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.07),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'BEV',  value: bevActivos,  yoy: bevYoy,    color: C.bev,  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
            { label: 'PHEV', value: phevActivos, yoy: phevYoy,   color: C.phev, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)'  },
            { label: 'HEV',  value: hevActivos,  yoy: undefined, color: C.hev,  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)'  },
          ].map(card => (
            <div key={card.label} style={{ flex: 1, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 33, color: C.muted, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: card.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(card.value)}</div>
              {card.yoy != null && <div style={{ marginTop: 10 }}><YoyBadge value={card.yoy} size={27} /></div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: 33, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Composición parque eléctrico</div>
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
            {[{ v: bevActivos, c: C.bev }, { v: phevActivos, c: C.phev }, { v: hevActivos, c: C.hev }].map((s, i) => (
              <div key={i} style={{ flex: s.v, background: s.c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            {[{ label: 'BEV', value: bevActivos, color: C.bev }, { label: 'PHEV', value: phevActivos, color: C.phev }, { label: 'HEV', value: hevActivos, color: C.hev }].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                <span style={{ fontSize: 33, color: C.muted }}>{item.label} · {totalActivos > 0 ? ((item.value / totalActivos) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
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

export function AcumuladoMes({ format, variant = 1, ...props }: Props) {
  const isDesktop = format === 'linkedin-desktop'
  if (variant === 2) return isDesktop ? <DesktopV2 {...props} /> : <PortraitV2 {...props} />
  if (variant === 3) return isDesktop ? <DesktopV3 {...props} /> : <PortraitV3 {...props} />
  return isDesktop ? <DesktopV1 {...props} /> : <PortraitV1 {...props} />
}
