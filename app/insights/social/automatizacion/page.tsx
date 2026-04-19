export const dynamic = 'force-dynamic'

import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { AutomationsClient } from './AutomationsClient'
import { dgtParqueMensual } from '../../../lib/insights/dgt-parque-data'

export type AutomationRow = {
  id:               string
  nombre:           string
  descripcion:      string | null
  trigger_type:     string
  tipos:            { typeId: string; filters: any }[]
  plataformas:      string[]
  activa:           boolean
  ultima_ejecucion: string | null
  ultimo_periodo:   string | null
  created_at:       string
  updated_at:       string
}

async function getAutomations(): Promise<{ rows: AutomationRow[]; missingTable: boolean; error?: string }> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('social_automations')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      // Código 42P01 = "undefined_table" en PostgreSQL
      if (error.code === '42P01' || /does not exist/i.test(error.message)) {
        return { rows: [], missingTable: true }
      }
      return { rows: [], missingTable: false, error: error.message }
    }
    return { rows: (data ?? []) as AutomationRow[], missingTable: false }
  } catch (e: any) {
    return { rows: [], missingTable: false, error: e?.message ?? 'unknown' }
  }
}

export default async function AutomatizacionPage() {
  const { rows, missingTable, error } = await getAutomations()

  if (missingTable) {
    return <MissingTableBanner />
  }

  if (error) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Error al cargar</div>
        <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>
      </div>
    )
  }

  // Fecha próxima ejecución = día 15 del mes siguiente al último periodo DGT publicado
  const ultimoDgt = dgtParqueMensual[dgtParqueMensual.length - 1]?.periodo ?? null
  const nextRun = ultimoDgt ? computeNextRun(ultimoDgt) : null

  return <AutomationsClient initial={rows} nextRun={nextRun} ultimoDgt={ultimoDgt} />
}

function computeNextRun(periodoKey: string): string {
  const [y, m] = periodoKey.split('-').map(Number)
  // DGT publica mes N el día 15 del mes N+1 → próxima ejecución es el día 15 del mes N+2
  const d = new Date(y, m - 1 + 2, 15)
  return d.toISOString()
}

function MissingTableBanner() {
  const SQL = `-- Ejecutar en Supabase SQL editor:
-- https://supabase.com/dashboard/project/jspbiyerpkpslfvksvqc/sql/new

create table if not exists public.social_automations (
  id               uuid primary key default gen_random_uuid(),
  nombre           text        not null,
  descripcion      text,
  trigger_type     text        not null default 'day-15-monthly',
  tipos            jsonb       not null default '[]'::jsonb,
  plataformas      text[]      not null default '{linkedin,instagram,twitter}',
  activa           boolean     not null default true,
  ultima_ejecucion timestamptz,
  ultimo_periodo   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

insert into public.social_automations (nombre, descripcion, tipos, plataformas)
select
  'Bundle mensual DGT',
  'Genera Matriculaciones, Bajas y Parque activo del último mes publicado por DGT.',
  '[
    {"typeId": "matriculaciones-mes", "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}},
    {"typeId": "bajas-mes",           "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}},
    {"typeId": "parque-activo",       "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}}
  ]'::jsonb,
  '{linkedin,instagram,twitter}'
where not exists (select 1 from public.social_automations);`

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        padding: 24,
        border: '1px solid rgba(250,204,21,0.3)',
        background: 'rgba(250,204,21,0.05)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#facc15', marginBottom: 6 }}>
          ⚠️ Falta crear la tabla <code style={{ fontSize: 13 }}>social_automations</code>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.7)', lineHeight: 1.55, marginBottom: 14 }}>
          Copiá este SQL, pegalo en el SQL editor de Supabase y ejecutalo. Después refrescá esta página.
        </div>
        <pre style={{
          padding: 14, borderRadius: 8,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, lineHeight: 1.5,
          color: 'rgba(241,245,249,0.85)',
          overflowX: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{SQL}</pre>
        <a
          href="https://supabase.com/dashboard/project/jspbiyerpkpslfvksvqc/sql/new"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block', marginTop: 12,
            fontSize: 11, fontWeight: 600,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid rgba(56,189,248,0.3)',
            background: 'rgba(56,189,248,0.08)',
            color: '#38bdf8',
            textDecoration: 'none',
          }}
        >Abrir SQL editor →</a>
      </div>
    </div>
  )
}
