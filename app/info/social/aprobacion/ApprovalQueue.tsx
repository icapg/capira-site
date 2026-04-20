"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { toPng } from 'html-to-image'
import type { MonthBundle } from '../../../lib/social/monthly'
import { MatriculacionesMes } from '../templates/MatriculacionesMes'
import { BajasMes } from '../templates/BajasMes'
import { AcumuladoMes } from '../templates/AcumuladoMes'
import { PORTRAIT_W, PORTRAIT_H } from '../templates/types'

type Copy = { long: string; short: string }
type Platform = 'long' | 'short'

const PLATFORMS: { id: Platform; label: string; limit: number }[] = [
  { id: 'long',  label: 'LinkedIn / Instagram', limit: 3000 },
  { id: 'short', label: 'X (Twitter)',          limit: 280  },
]

function parseCaption(raw?: string | null): Copy {
  if (!raw) return { long: '', short: '' }
  try {
    const parsed = JSON.parse(raw)
    const long  = parsed.long  ?? parsed.linkedin  ?? parsed.instagram ?? ''
    const short = parsed.short ?? parsed.twitter   ?? ''
    return { long: String(long), short: String(short) }
  } catch {
    return { long: raw, short: '' }
  }
}

function DownloadableImage({
  label, scale, children,
}: {
  label: string; scale: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!ref.current) return
    setDownloading(true)
    try {
      const opts = {
        cacheBust: true, pixelRatio: 2,
        width: PORTRAIT_W, height: PORTRAIT_H,
        style: { transform: 'none', transformOrigin: 'top left' as const },
      }
      await toPng(ref.current, opts)
      const dataUrl = await toPng(ref.current, opts)
      const link = document.createElement('a')
      link.download = `${label}.png`
      link.href = dataUrl
      link.click()
    } catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      <div style={{
        width:  PORTRAIT_W * scale,
        height: PORTRAIT_H * scale,
        overflow: 'hidden',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div ref={ref} style={{
          width: PORTRAIT_W, height: PORTRAIT_H,
          transform: `scale(${scale})`, transformOrigin: 'top left',
        }}>{children}</div>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          fontSize: 10, fontWeight: 600,
          padding: '5px 10px', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(241,245,249,0.65)',
          cursor: downloading ? 'default' : 'pointer',
          fontFamily: 'inherit',
        }}
      >{downloading ? 'Generando…' : '↓ Descargar'}</button>
    </div>
  )
}

export function ApprovalQueue({ bundles }: { bundles: MonthBundle[] }) {
  const [idx, setIdx] = useState(0)
  const current = bundles[idx]
  const [copy, setCopy] = useState<Copy>(parseCaption(current?.supabasePost?.caption))
  const [activePlatform, setActive] = useState<Platform>('long')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Reset copy when switching bundle
  const lastKey = useRef<string | undefined>(current?.periodoKey)
  useEffect(() => {
    if (current?.periodoKey !== lastKey.current) {
      setCopy(parseCaption(current?.supabasePost?.caption))
      setActive('long')
      lastKey.current = current?.periodoKey
    }
  }, [current])

  const goNext = useCallback(() => setIdx(i => Math.min(i + 1, bundles.length - 1)), [bundles.length])
  const goPrev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])

  const handleGenerate = useCallback(async () => {
    if (!current?.data) return
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate-copy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodoKey: current.periodoKey, data: current.data }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = await res.json()
      setCopy({ long: payload.long ?? '', short: payload.short ?? '' })
    } catch (e: any) {
      console.error(e)
      alert(`Error generando copy: ${e?.message ?? 'desconocido'}`)
    } finally { setGenerating(false) }
  }, [current])

  // Auto-gen si no hay copy previo
  const autoTriggered = useRef<string | null>(null)
  useEffect(() => {
    if (!current) return
    if (autoTriggered.current === current.periodoKey) return
    const hasCopy = copy.long || copy.short
    if (!hasCopy && current.data && !generating) {
      autoTriggered.current = current.periodoKey
      handleGenerate()
    }
  }, [current, copy, generating, handleGenerate])

  async function persist(status: 'draft' | 'published') {
    if (!current) return
    setSaving(true)
    try {
      const res = await fetch('/api/social/mark-published', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          periodoKey: current.periodoKey,
          caption: JSON.stringify(copy),
          status,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (status === 'published') goNext()
    } catch (e) { console.error(e); alert('Error persistiendo') }
    finally { setSaving(false) }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key.toLowerCase() === 'a') { e.preventDefault(); if (!saving) persist('published') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, saving, copy]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48, textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 44, marginBottom: 14 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
            No hay nada pendiente
          </div>
          <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.5)', marginBottom: 18 }}>
            Todos los bundles con datos DGT ya están publicados.
          </div>
          <Link href="/insights/social/generador" style={{
            fontSize: 12, fontWeight: 600,
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid rgba(56,189,248,0.3)',
            background: 'rgba(56,189,248,0.08)',
            color: '#38bdf8',
            textDecoration: 'none',
          }}>Ir al Generador →</Link>
        </div>
      </div>
    )
  }

  const { data, periodoFull, periodoKey } = current
  const scale = 0.24
  const activeCopy = copy[activePlatform]
  const activeMeta = PLATFORMS.find(p => p.id === activePlatform)!
  const len = [...activeCopy].length
  const over = len > activeMeta.limit
  const counterColor = over ? '#f87171' : 'rgba(241,245,249,0.4)'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Queue bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(5,8,16,0.5)',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(241,245,249,0.45)', marginBottom: 2 }}>
            Pendiente de aprobación · {idx + 1} / {bundles.length}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{periodoFull}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={goPrev} disabled={idx === 0}        style={navBtn(idx === 0)}>← Anterior</button>
          <button onClick={goNext} disabled={idx >= bundles.length - 1} style={navBtn(idx >= bundles.length - 1)}>Siguiente →</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
        {data && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(241,245,249,0.4)', marginBottom: 10 }}>
              Imágenes
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <DownloadableImage label={`matri-${periodoKey}`} scale={scale}>
                <MatriculacionesMes
                  periodo={data.periodo} periodoFull={data.periodoFull}
                  periodoPrev={data.periodoPrev} periodoPrevFull={data.periodoPrevFull}
                  {...data.matriculaciones}
                />
              </DownloadableImage>
              <DownloadableImage label={`bajas-${periodoKey}`} scale={scale}>
                <BajasMes
                  periodo={data.periodo} periodoFull={data.periodoFull}
                  periodoPrev={data.periodoPrev} periodoPrevFull={data.periodoPrevFull}
                  {...data.bajas}
                />
              </DownloadableImage>
              <DownloadableImage label={`activo-${periodoKey}`} scale={scale}>
                <AcumuladoMes
                  periodo={data.periodo} periodoFull={data.periodoFull}
                  periodoPrevFull={data.periodoPrevFull}
                  {...data.acumulado}
                />
              </DownloadableImage>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(241,245,249,0.4)' }}>
                Copy
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 7,
                  border: '1px solid rgba(167,139,250,0.35)',
                  background: 'rgba(167,139,250,0.08)',
                  color: '#a78bfa',
                  cursor: generating ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >{generating ? 'Generando…' : copy.long ? '↻ Regenerar' : '✨ Generar'}</button>
            </div>

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
                      fontFamily: 'inherit',
                    }}
                  >{p.label}</button>
                )
              })}
            </div>

            <textarea
              value={activeCopy}
              onChange={e => setCopy({ ...copy, [activePlatform]: e.target.value })}
              style={{
                width: '100%', minHeight: 180, padding: 14,
                fontSize: 13, lineHeight: 1.55,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, color: '#f1f5f9',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 10, color: counterColor, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {len.toLocaleString('es-ES')} / {activeMeta.limit.toLocaleString('es-ES')} chars
              {over && ' · supera el límite'}
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,8,16,0.6)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(241,245,249,0.4)' }}>
          Atajos: <kbd style={kbd}>←</kbd> anterior · <kbd style={kbd}>→</kbd> siguiente · <kbd style={kbd}>A</kbd> aprobar
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => persist('draft')}
            disabled={saving}
            style={secondaryBtn(saving)}
          >💾 Guardar borrador</button>
          <button
            onClick={() => persist('published')}
            disabled={saving}
            style={approveBtn(saving)}
          >{saving ? 'Guardando…' : '✓ Aprobar y marcar publicado'}</button>
        </div>
      </div>
    </div>
  )
}

const kbd: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 9,
  padding: '1px 5px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(241,245,249,0.7)',
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 600,
    padding: '6px 12px', borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: disabled ? 'rgba(241,245,249,0.3)' : 'rgba(241,245,249,0.7)',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600,
    padding: '8px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(241,245,249,0.7)',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}

function approveBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 700,
    padding: '8px 18px', borderRadius: 8,
    border: '1px solid rgba(74,222,128,0.5)',
    background: 'rgba(74,222,128,0.15)',
    color: '#4ade80',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}
