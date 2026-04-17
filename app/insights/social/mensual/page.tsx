export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { buildMonthBundles } from '../../../lib/social/monthly'
import { KanbanBoard } from './KanbanBoard'

async function getPublished() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key)
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .like('template', 'mensual-bundle-%')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function MensualPage() {
  const published = await getPublished()
  const bundles = buildMonthBundles(published, { pastMonths: 8, futureMonths: 2 })

  return (
    <div style={{ padding: '24px 32px', height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <Link href="/insights/social" style={{
              fontSize: 11, color: 'rgba(241,245,249,0.45)',
              textDecoration: 'none',
            }}>
              ← Social
            </Link>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' }}>Mensual</h1>
          <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.45)', margin: 0 }}>
            Matriculaciones · Bajas · Parque activo — un bundle por mes
          </p>
        </div>
      </div>

      <KanbanBoard bundles={bundles} />
    </div>
  )
}
