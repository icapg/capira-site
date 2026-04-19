"use client"

import { useMemo, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { IMAGE_TYPES, ALL_FILTERS, imageTypeById, type ImageFilters, type FilterId } from '../../../lib/social/image-types'
import { getTemplateDataFor } from '../../../lib/social/monthly'
import { TIPO_LABELS, type TipoVehiculo } from '../../../lib/insights/dgt-bev-phev-data'
import { PORTRAIT_W, PORTRAIT_H } from '../templates/types'

const MESES_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Copy = { long: string; short: string }
type Platform = 'long' | 'short'

const PLATFORMS: { id: Platform; label: string; hint: string; limit: number }[] = [
  { id: 'long',  label: 'LinkedIn / Instagram', hint: 'Post extendido con estructura y bullets', limit: 3000 },
  { id: 'short', label: 'X (Twitter)',          hint: 'Versión compacta ≤ 280 chars',           limit: 280  },
]

const TIPOS_VEHICULO: TipoVehiculo[] = ['todos','turismo','furgoneta','moto_scooter','microcar','camion','autobus','otros']

function labelForPeriodo(key: string) {
  const [y, m] = key.split('-')
  return `${MESES_ES_FULL[parseInt(m) - 1]} ${y}`
}

export function Playground({ periodos }: { periodos: string[] }) {
  const defaultPeriodo = periodos[0] ?? ''
  const [typeId, setTypeId]             = useState<string>(IMAGE_TYPES[0].id)
  const [periodoKey, setPeriodoKey]     = useState<string>(defaultPeriodo)
  const [tec, setTec]                   = useState<'ambos'|'bev'|'phev'>('ambos')
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>(['turismo', 'furgoneta', 'camion', 'autobus'])
  const [notas, setNotas]               = useState<string>('')

  const [copy, setCopy]             = useState<Copy>({ long: '', short: '' })
  const [activePlatform, setActive] = useState<Platform>('long')
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const type = imageTypeById(typeId) ?? IMAGE_TYPES[0]
  const supports = new Set<FilterId>(type.supports)

  const filters: ImageFilters = { periodoKey, tec, tiposVehiculo }
  const rendered = useMemo(() => type.render(filters), [type, periodoKey, tec, tiposVehiculo])

  const templateData = useMemo(() => getTemplateDataFor(periodoKey, { tec, tiposVehiculo }), [periodoKey, tec, tiposVehiculo])

  const handleGenerate = useCallback(async () => {
    if (!templateData) return
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate-copy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodoKey, data: templateData, tiposVehiculo, notas: notas.trim() || undefined }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const payload = await res.json()
      setCopy({ long: payload.long ?? '', short: payload.short ?? '' })
    } catch (e: any) {
      console.error(e)
      alert(`Error generando copy: ${e?.message ?? 'desconocido'}`)
    } finally {
      setGenerating(false)
    }
  }, [periodoKey, templateData, tiposVehiculo, notas])

  async function handleDownload() {
    if (!canvasRef.current) return
    setDownloading(true)
    try {
      const opts = {
        cacheBust: true,
        pixelRatio: 2,
        width: PORTRAIT_W,
        height: PORTRAIT_H,
        style: { transform: 'none', transformOrigin: 'top left' as const },
      }
      await toPng(canvasRef.current, opts)
      const dataUrl = await toPng(canvasRef.current, opts)
      const link = document.createElement('a')
      link.download = `${type.id}-${periodoKey}.png`
      link.href = dataUrl
      link.click()
    } catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  async function handleCopyText() {
    try { await navigator.clipboard.writeText(copy[activePlatform]) } catch (e) { console.error(e) }
  }

  // Canvas preview scale — fit portrait 1080x1350 into the viewport
  const scale = 0.42

  const activeCopy = copy[activePlatform]
  const activeMeta = PLATFORMS.find(p => p.id === activePlatform)!
  const len = [...activeCopy].length
  const over = len > activeMeta.limit
  const near = !over && len > activeMeta.limit * 0.9
  const counterColor = over ? '#f87171' : near ? '#facc15' : 'rgba(241,245,249,0.4)'

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Sidebar */}
      <aside style={{
        width: 300, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,8,16,0.4)',
        padding: '20px 20px 24px',
        overflowY: 'auto',
      }}>
        <SectionTitle>Tipo de imagen</SectionTitle>
        <select
          value={typeId}
          onChange={e => setTypeId(e.target.value)}
          style={selectStyle}
        >
          {IMAGE_TYPES.map(t => (
            <option key={t.id} value={t.id} style={optionStyle}>{t.label}</option>
          ))}
        </select>
        <div style={hintStyle}>{type.description}</div>

        <SectionTitle style={{ marginTop: 22 }}>Periodo</SectionTitle>
        <FilterWrapper active={supports.has('periodo')}>
          <select
            value={periodoKey}
            onChange={e => setPeriodoKey(e.target.value)}
            disabled={!supports.has('periodo') || periodos.length === 0}
            style={selectStyle}
          >
            {periodos.map(p => (
              <option key={p} value={p} style={optionStyle}>{labelForPeriodo(p)}</option>
            ))}
          </select>
        </FilterWrapper>

        <SectionTitle style={{ marginTop: 22 }}>Tecnología</SectionTitle>
        <FilterWrapper active={supports.has('tec')}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['ambos','bev','phev'] as const).map(k => (
              <button
                key={k}
                onClick={() => setTec(k)}
                disabled={!supports.has('tec')}
                style={pillStyle(tec === k, supports.has('tec'))}
              >{k === 'ambos' ? 'Ambos' : k.toUpperCase()}</button>
            ))}
          </div>
        </FilterWrapper>

        <SectionTitle style={{ marginTop: 22 }}>Tipo de vehículo</SectionTitle>
        <FilterWrapper active={supports.has('tipoVehiculo')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {TIPOS_VEHICULO.map(tv => {
              const selected = tiposVehiculo.includes(tv)
              return (
                <button
                  key={tv}
                  onClick={() => {
                    if (!supports.has('tipoVehiculo')) return
                    if (tv === 'todos') { setTiposVehiculo(['todos']); return }
                    const rest = tiposVehiculo.filter(x => x !== 'todos')
                    const next = selected ? rest.filter(x => x !== tv) : [...rest, tv]
                    setTiposVehiculo(next.length === 0 ? ['todos'] : next)
                  }}
                  disabled={!supports.has('tipoVehiculo')}
                  style={pillStyle(selected, supports.has('tipoVehiculo'))}
                >{TIPO_LABELS[tv]}</button>
              )
            })}
          </div>
        </FilterWrapper>

        <SectionTitle style={{ marginTop: 22 }}>Ideas / notas para el copy</SectionTitle>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Opcional: angulo, tono, datos a destacar, CTA, emojis…"
          style={{
            width: '100%', minHeight: 96, padding: 10,
            fontSize: 11.5, lineHeight: 1.5,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7, color: '#f1f5f9',
            fontFamily: 'inherit', resize: 'vertical',
          }}
        />
        <div style={hintStyle}>Se incorporan al prompt al generar el copy.</div>

        <div style={{
          marginTop: 26, padding: 10,
          background: 'rgba(56,189,248,0.04)',
          border: '1px solid rgba(56,189,248,0.12)',
          borderRadius: 8, fontSize: 10,
          color: 'rgba(241,245,249,0.55)',
          lineHeight: 1.5,
        }}>
          Playground efímero. Los cambios no se persisten — descargá la imagen o copiá el texto.
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Canvas area */}
        <div style={{
          flex: 1,
          background: 'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.04), transparent 60%), #050810',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
          overflow: 'auto',
        }}>
          {rendered ? (
            <div style={{
              width:  PORTRAIT_W * scale,
              height: PORTRAIT_H * scale,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}>
              <div
                ref={canvasRef}
                style={{
                  width: PORTRAIT_W, height: PORTRAIT_H,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {rendered}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '48px 32px',
              textAlign: 'center',
              color: 'rgba(241,245,249,0.5)',
              fontSize: 13,
              border: '1px dashed rgba(250,204,21,0.25)',
              borderRadius: 12, background: 'rgba(250,204,21,0.04)',
              maxWidth: 440,
            }}>
              No hay datos DGT para <strong>{labelForPeriodo(periodoKey)}</strong>.
              Probá con otro periodo en el sidebar.
            </div>
          )}
        </div>

        {/* Bottom panel: actions + copy */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,8,16,0.6)',
          padding: '16px 24px',
          display: 'flex', gap: 20,
        }}>
          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 180, flexShrink: 0 }}>
            <button
              onClick={handleDownload}
              disabled={downloading || !rendered}
              style={primaryBtn(!rendered || downloading, '#38bdf8')}
            >{downloading ? 'Generando…' : '↓ Descargar PNG'}</button>
            <button
              onClick={handleGenerate}
              disabled={generating || !templateData}
              style={primaryBtn(!templateData || generating, '#a78bfa')}
            >{generating ? 'Generando…' : copy.long ? '↻ Regenerar copy' : '✨ Generar copy'}</button>
          </div>

          {/* Copy */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {PLATFORMS.map(p => {
                const active = activePlatform === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '6px 12px', borderRadius: 7,
                      border: 'none',
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: active ? '#f1f5f9' : 'rgba(241,245,249,0.4)',
                      cursor: 'pointer',
                    }}
                  >{p.label}</button>
                )
              })}
            </div>
            <textarea
              value={activeCopy}
              onChange={e => setCopy({ ...copy, [activePlatform]: e.target.value })}
              placeholder={`${activeMeta.hint} — generá copy o escribí manualmente…`}
              style={{
                width: '100%', height: 96, padding: 12,
                fontSize: 12, lineHeight: 1.5,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#f1f5f9',
                resize: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: counterColor, fontVariantNumeric: 'tabular-nums' }}>
                {len.toLocaleString('es-ES')} / {activeMeta.limit.toLocaleString('es-ES')} chars
                {over && ` · supera el límite`}
              </span>
              <button
                onClick={handleCopyText}
                disabled={!activeCopy}
                style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '4px 10px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(241,245,249,0.55)',
                  cursor: activeCopy ? 'pointer' : 'default',
                }}
              >Copiar al portapapeles</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ─── helpers ─── */

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'rgba(241,245,249,0.45)',
      marginBottom: 8,
      ...style,
    }}>{children}</div>
  )
}

function FilterWrapper({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      title={active ? undefined : 'Este tipo de imagen no usa este filtro'}
      style={{ opacity: active ? 1 : 0.35, pointerEvents: active ? 'auto' : 'none' }}
    >{children}</div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 12, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#f1f5f9',
  fontFamily: 'inherit',
}

const optionStyle: React.CSSProperties = {
  color: '#000',
  background: '#fff',
}

const hintStyle: React.CSSProperties = {
  fontSize: 10.5,
  marginTop: 6,
  color: 'rgba(241,245,249,0.4)',
  lineHeight: 1.45,
}

function pillStyle(active: boolean, enabled: boolean): React.CSSProperties {
  return {
    fontSize: 10.5, fontWeight: 600,
    padding: '5px 10px', borderRadius: 6,
    border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
    color: active ? '#f1f5f9' : 'rgba(241,245,249,0.5)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
  }
}

function primaryBtn(disabled: boolean, color: string): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 600,
    padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${color}55`,
    background: `${color}18`,
    color: disabled ? `${color}77` : color,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}
