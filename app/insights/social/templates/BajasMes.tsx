import Image from 'next/image'
import type { Format } from './types'

type Props = {
  periodo: string
  bevBajas: number
  phevBajas: number
  hevBajas: number
  totalBajasMercado: number
  format: Format
  variant?: 1 | 2 | 3
}

const C = {
  bg:     '#050810',
  bev:    '#38bdf8',
  phev:   '#fb923c',
  green:  '#34d399',
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

function DesktopV1({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
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
            { label: 'Bajas EV (BEV+PHEV)', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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

function PortraitV1({ periodo, bevBajas, phevBajas, hevBajas, totalBajasMercado }: Omit<Props, 'format' | 'variant'>) {
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
            { label: 'Bajas EV', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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
            { label: 'Bajas EV (BEV+PHEV)', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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
            { label: 'Bajas EV', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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
            { label: 'Bajas EV (BEV+PHEV)', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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
            { label: 'Bajas EV', value: fmt(evBajas),   color: C.red,  bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
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
