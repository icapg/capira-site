export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { buildMonthBundles } from '../../../lib/social/monthly'
import { ApprovalQueue } from './ApprovalQueue'

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

export default async function AprobacionPage() {
  const published = await getPublished()
  const bundles = buildMonthBundles(published, { pastMonths: 12, futureMonths: 0 })
  const pendientes = bundles.filter(b => b.state === 'pendiente' && b.hasData)

  return <ApprovalQueue bundles={pendientes} />
}
