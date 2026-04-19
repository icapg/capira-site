import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('social_automations')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message, hint: error.hint, code: error.code }, { status: 500 })
  }
  return NextResponse.json({ automations: data ?? [] })
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const id:           string | undefined = body?.id
    const nombre:       string | undefined = body?.nombre
    const descripcion:  string | undefined = body?.descripcion
    const tipos:        unknown            = body?.tipos
    const plataformas:  string[] | undefined = body?.plataformas
    const activa:       boolean | undefined = body?.activa

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (nombre      !== undefined) update.nombre      = nombre
    if (descripcion !== undefined) update.descripcion = descripcion
    if (tipos       !== undefined) update.tipos       = tipos
    if (plataformas !== undefined) update.plataformas = plataformas
    if (activa      !== undefined) update.activa      = activa

    const { data, error } = await supabaseAdmin
      .from('social_automations')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ automation: data })
  } catch (err: any) {
    console.error('[automations PUT]', err)
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 })
  }
}
