import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const periodoKey: string = body?.periodoKey
    const caption:    string = body?.caption ?? ''
    const status:     string = body?.status  ?? 'published'

    if (!periodoKey || !/^\d{4}-\d{2}$/.test(periodoKey)) {
      return NextResponse.json({ error: 'invalid periodoKey' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'supabase not configured' }, { status: 500 })
    }
    const supabase = createClient(url, key)

    const template = `mensual-bundle-${periodoKey}`
    const scheduled_at = new Date().toISOString()

    const { data: existing } = await supabase
      .from('social_posts')
      .select('id')
      .eq('template', template)
      .limit(1)

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('social_posts')
        .update({ caption, status, scheduled_at })
        .eq('id', existing[0].id)
      if (error) throw error
      return NextResponse.json({ ok: true, updated: true })
    }

    const { error } = await supabase
      .from('social_posts')
      .insert({
        template,
        caption,
        status,
        platforms:    ['linkedin', 'instagram', 'twitter'],
        scheduled_at,
      })
    if (error) throw error

    return NextResponse.json({ ok: true, created: true })
  } catch (err: any) {
    console.error('[mark-published] error', err)
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 })
  }
}
