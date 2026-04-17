export const dynamic = 'force-dynamic'

import Link from 'next/link'

type Section = {
  id:       string
  label:    string
  subtitle: string
  href?:    string
  emoji:    string
  active:   boolean
}

const SECTIONS: Section[] = [
  {
    id:       'mensual',
    label:    'Mensual',
    subtitle: 'Matriculaciones · Bajas · Parque activo',
    href:     '/insights/social/mensual',
    emoji:    '📅',
    active:   true,
  },
  {
    id:       'anual',
    label:    'Anual',
    subtitle: 'Resumen del año completo',
    emoji:    '🗓',
    active:   false,
  },
  {
    id:       'infraestructura',
    label:    'Infraestructura',
    subtitle: 'Cargadores públicos · cobertura',
    emoji:    '⚡',
    active:   false,
  },
  {
    id:       'comparativas',
    label:    'Comparativas',
    subtitle: 'Marcas · Provincias · Segmentos',
    emoji:    '📊',
    active:   false,
  },
]

export default function SocialPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Social</h1>
        <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.45)', margin: 0 }}>
          Secciones para generar y programar contenido.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {SECTIONS.map(s => {
          const body = (
            <div style={{
              padding: '20px 22px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
              background: s.active ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.025)',
              opacity: s.active ? 1 : 0.55,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'all 0.15s',
              cursor: s.active ? 'pointer' : 'default',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                {!s.active && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 20, letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'rgba(241,245,249,0.4)',
                    background: 'rgba(255,255,255,0.05)',
                  }}>Pronto</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.5)' }}>{s.subtitle}</div>
              </div>
            </div>
          )
          return s.active && s.href
            ? <Link key={s.id} href={s.href} style={{ textDecoration: 'none' }}>{body}</Link>
            : <div key={s.id}>{body}</div>
        })}
      </div>
    </div>
  )
}
