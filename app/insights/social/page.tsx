export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { dgtParqueMensual } from '../../lib/insights/dgt-parque-data'
import { dgtMeses } from '../../lib/insights/dgt-data'
import { PostsQueue } from './PostsQueue'
import { TemplatesPanel } from './TemplatesPanel'

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatPeriodo(periodo: string) {
  const [y, m] = periodo.split('-')
  return `${MESES_ES[parseInt(m) - 1]} ${y}`
}

function yoy(current: number, previous: number | undefined) {
  if (!previous || previous === 0) return undefined
  return +((( current - previous) / previous) * 100).toFixed(1)
}

function getTemplateData() {
  const ultimo = dgtParqueMensual.at(-1)!
  const penultimo = dgtParqueMensual.at(-13) // mismo mes año anterior

  const mat    = ultimo.matriculaciones_mes
  const bajas  = ultimo.bajas_mes
  const parque = ultimo.parque_acumulado
  const matPrev    = penultimo?.matriculaciones_mes
  const parquePrev = penultimo?.parque_acumulado

  const dgtMes     = dgtMeses.find(m => m.periodo === ultimo.periodo)
  const dgtMesPrev = penultimo ? dgtMeses.find(m => m.periodo === penultimo.periodo) : undefined
  const totalMercado     = dgtMes?.total ?? 0
  const totalMercadoPrev = dgtMesPrev?.total ?? 0

  const noElec     = Math.max(0, totalMercado     - (mat.BEV ?? 0)      - (mat.PHEV ?? 0))
  const noElecPrev = Math.max(0, totalMercadoPrev - (matPrev?.BEV ?? 0) - (matPrev?.PHEV ?? 0))

  const totalBajasMensual = ultimo.total_bajas_mes

  return {
    periodo: formatPeriodo(ultimo.periodo),
    matriculaciones: {
      bev:  mat.BEV  ?? 0,
      phev: mat.PHEV ?? 0,
      hev:  mat.HEV  ?? 0,
      totalMercado,
      bevYoy:      yoy(mat.BEV ?? 0, matPrev?.BEV),
      phevYoy:     yoy(mat.PHEV ?? 0, matPrev?.PHEV),
      evYoy:       yoy((mat.BEV ?? 0) + (mat.PHEV ?? 0), (matPrev?.BEV ?? 0) + (matPrev?.PHEV ?? 0)),
      noElecYoy:   totalMercadoPrev > 0 ? yoy(noElec, noElecPrev) : undefined,
      totalYoy:    totalMercadoPrev > 0 ? yoy(totalMercado, totalMercadoPrev) : undefined,
    },
    bajas: {
      bevBajas:          bajas.BEV  ?? 0,
      phevBajas:         bajas.PHEV ?? 0,
      hevBajas:          bajas.HEV  ?? 0,
      totalBajasMercado: totalBajasMensual,
      bevYoy:   yoy(bajas.BEV  ?? 0, penultimo?.bajas_mes.BEV),
      phevYoy:  yoy(bajas.PHEV ?? 0, penultimo?.bajas_mes.PHEV),
      evYoy:    yoy((bajas.BEV ?? 0) + (bajas.PHEV ?? 0), (penultimo?.bajas_mes.BEV ?? 0) + (penultimo?.bajas_mes.PHEV ?? 0)),
      totalYoy: yoy(totalBajasMensual, penultimo?.total_bajas_mes),
    },
    acumulado: {
      bevActivos:  parque.BEV  ?? 0,
      phevActivos: parque.PHEV ?? 0,
      hevActivos:  parque.HEV  ?? 0,
      bevYoy:  yoy(parque.BEV  ?? 0, parquePrev?.BEV),
      phevYoy: yoy(parque.PHEV ?? 0, parquePrev?.PHEV),
      evYoy:   yoy((parque.BEV ?? 0) + (parque.PHEV ?? 0), (parquePrev?.BEV ?? 0) + (parquePrev?.PHEV ?? 0)),
    },
  }
}

async function getPosts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key)
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function SocialPage() {
  const [posts, data] = await Promise.all([getPosts(), Promise.resolve(getTemplateData())])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

      {/* Panel izquierdo — Cola */}
      <div style={{
        width: 300, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto', padding: '24px 18px',
      }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' }}>Cola de posts</h2>
          <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', margin: 0 }}>
            {posts.length} posts · {posts.filter((p: any) => p.status === 'draft').length} borradores
          </p>
        </div>
        <PostsQueue posts={posts} />
      </div>

      {/* Panel derecho — Templates (client para el selector de formato) */}
      <TemplatesPanel data={data} />
    </div>
  )
}
