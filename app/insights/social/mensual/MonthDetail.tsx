"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import type { MonthBundle } from '../../../lib/social/monthly'
import { MatriculacionesMes } from '../templates/MatriculacionesMes'
import { BajasMes } from '../templates/BajasMes'
import { AcumuladoMes } from '../templates/AcumuladoMes'
import { FORMAT_DIMS } from '../templates/types'

type Copy = { linkedin: string; instagram: string; twitter: string }

type Platform = keyof Copy

const PLATFORMS: { id: Platform; label: string; color: string; limit: number }[] = [
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2', limit: 3000 },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', limit: 2200 },
  { id: 'twitter',   label: 'X',         color: '#1d9bf0', limit: 280  },
]

function DownloadableImage({
  label, children,
}: {
  label: string
  children: React.ReactNode
}) {
  const { w, h } = FORMAT_DIMS['instagram']
  const previewWidth = 240
  const scale = previewWidth / w
  const innerRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!innerRef.current) return
    setDownloading(true)
    try {
      const opts = {
        cacheBust: true,
        pixelRatio: 1,
        width: w,
        height: h,
        style: { transform: 'none', transformOrigin: 'top left' },
      }
      await toPng(innerRef.current, opts)
      const dataUrl = await toPng(innerRef.current, opts)
      const link = document.createElement('a')
      link.download = `${label.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        width: previewWidth, height: h * scale,
        overflow: 'hidden',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div
          ref={innerRef}
          style={{
            width: w, height: h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          fontSize: 10, fontWeight: 600,
          padding: '5px 10px', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(241,245,249,0.7)',
          cursor: downloading ? 'default' : 'pointer',
        }}
      >
        {downloading ? 'Generando...' : '↓ Descargar'}
      </button>
    </div>
  )
}

function parseCaption(raw?: string | null): Copy {
  if (!raw) return { linkedin: '', instagram: '', twitter: '' }
  try {
    const parsed = JSON.parse(raw)
    return {
      linkedin:  typeof parsed.linkedin  === 'string' ? parsed.linkedin  : '',
      instagram: typeof parsed.instagram === 'string' ? parsed.instagram : '',
      twitter:   typeof parsed.twitter   === 'string' ? parsed.twitter   : '',
    }
  } catch {
    return { linkedin: raw, instagram: raw, twitter: raw }
  }
}

export function MonthDetail({ bundle, onClose }: { bundle: MonthBundle; onClose: () => void }) {
  const { data, periodoKey, periodoFull, state, supabasePost } = bundle
  const [copy, setCopy] = useState<Copy>(parseCaption(supabasePost?.caption))
  const [activePlatform, setActivePlatform] = useState<Platform>('linkedin')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [status, setStatus] = useState<string>(supabasePost?.status ?? 'draft')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleGenerateCopy = useCallback(async () => {
    if (!data) return
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate-copy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodoKey, data }),
      })
      if (!res.ok) {
        const body = await res.text()
        console.error('[generate-copy] response', res.status, body)
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      const payload = await res.json()
      const unified = payload.text ?? payload.linkedin ?? ''
      setCopy({
        linkedin:  payload.linkedin  ?? unified,
        instagram: payload.instagram ?? unified,
        twitter:   payload.twitter   ?? unified,
      })
    } catch (e: any) {
      console.error(e)
      alert(`Error generando copy: ${e?.message ?? 'desconocido'}`)
    } finally {
      setGenerating(false)
    }
  }, [data, periodoKey])

  // Auto-genera la primera versión si el bundle está pendiente y no hay caption previo
  const autoGenTriggered = useRef(false)
  useEffect(() => {
    if (autoGenTriggered.current) return
    const hasCopy = copy.linkedin || copy.instagram || copy.twitter
    if (data && state === 'pendiente' && !hasCopy && !generating) {
      autoGenTriggered.current = true
      handleGenerateCopy()
    }
  }, [data, state, copy, generating, handleGenerateCopy])

  async function handleMarkPublished() {
    setPublishing(true)
    try {
      const res = await fetch('/api/social/mark-published', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          periodoKey,
          caption: JSON.stringify(copy),
          status: 'published',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('published')
    } catch (e) {
      console.error(e)
      alert('Error persistiendo. Revisá la consola.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(copy[activePlatform])
    } catch (e) {
      console.error(e)
    }
  }

  const activeCopy = copy[activePlatform]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(900px, 95vw)',
          height: '100vh',
          background: '#0b0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginBottom: 2 }}>Mensual</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{periodoFull}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20,
              color: status === 'published' ? '#4ade80' : '#38bdf8',
              background: status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(56,189,248,0.1)',
            }}>
              {status === 'published' ? 'Publicado' : 'Pendiente'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none',
                color: 'rgba(241,245,249,0.5)', cursor: 'pointer',
                fontSize: 20, padding: '4px 10px',
              }}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {state === 'generando' || !data ? (
            <div style={{
              padding: '48px 24px',
              borderRadius: 12,
              background: 'rgba(250,204,21,0.05)',
              border: '1px dashed rgba(250,204,21,0.2)',
              textAlign: 'center',
              color: 'rgba(241,245,249,0.6)',
            }}>
              Los datos de {periodoFull} todavía no han sido publicados por DGT.
              {bundle.dgtReleaseDate && (
                <div style={{ fontSize: 11, marginTop: 6, color: 'rgba(241,245,249,0.4)' }}>
                  Publicación estimada: {new Date(bundle.dgtReleaseDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Imágenes */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Imágenes</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <DownloadableImage label={`matri-${periodoKey}`}>
                    <MatriculacionesMes
                      periodo={data.periodo}
                      periodoFull={data.periodoFull}
                      periodoPrev={data.periodoPrev}
                      periodoPrevFull={data.periodoPrevFull}
                      {...data.matriculaciones}
                      format="instagram"
                      variant={1}
                    />
                  </DownloadableImage>
                  <DownloadableImage label={`bajas-${periodoKey}`}>
                    <BajasMes
                      periodo={data.periodo}
                      periodoFull={data.periodoFull}
                      periodoPrev={data.periodoPrev}
                      periodoPrevFull={data.periodoPrevFull}
                      {...data.bajas}
                      format="instagram"
                      variant={1}
                    />
                  </DownloadableImage>
                  <DownloadableImage label={`activo-${periodoKey}`}>
                    <AcumuladoMes
                      periodo={data.periodo}
                      periodoFull={data.periodoFull}
                      periodoPrevFull={data.periodoPrevFull}
                      {...data.acumulado}
                      format="instagram"
                      variant={1}
                    />
                  </DownloadableImage>
                </div>
              </div>

              {/* Copy */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>Copy</div>
                  <button
                    onClick={handleGenerateCopy}
                    disabled={generating}
                    style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(56,189,248,0.35)',
                      background: 'rgba(56,189,248,0.08)',
                      color: '#38bdf8',
                      cursor: generating ? 'default' : 'pointer',
                    }}
                  >
                    {generating ? 'Generando...' : copy.linkedin ? '↻ Regenerar' : '✨ Generar copy'}
                  </button>
                </div>

                {/* Platform tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {PLATFORMS.map(p => {
                    const active = activePlatform === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActivePlatform(p.id)}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '6px 14px', borderRadius: 7,
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
                  placeholder={`Copy para ${PLATFORMS.find(p => p.id === activePlatform)?.label}…`}
                  style={{
                    width: '100%', minHeight: 180,
                    padding: 14, fontSize: 13, lineHeight: 1.5,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: '#f1f5f9',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                {(() => {
                  const activeMeta = PLATFORMS.find(p => p.id === activePlatform)!
                  const len = [...activeCopy].length
                  const over = len > activeMeta.limit
                  const near = !over && len > activeMeta.limit * 0.9
                  const counterColor = over ? '#f87171' : near ? '#facc15' : 'rgba(241,245,249,0.4)'
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: counterColor, fontVariantNumeric: 'tabular-nums' }}>
                        {len.toLocaleString('es-ES')} / {activeMeta.limit.toLocaleString('es-ES')} chars
                        {over && ` · supera el límite de ${activeMeta.label}`}
                      </span>
                      <button
                        onClick={handleCopyText}
                        disabled={!activeCopy}
                        style={{
                          fontSize: 10, fontWeight: 600,
                          padding: '5px 10px', borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent',
                          color: 'rgba(241,245,249,0.55)',
                          cursor: activeCopy ? 'pointer' : 'default',
                        }}
                      >Copiar al portapapeles</button>
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {state !== 'generando' && data && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}>
            <button
              onClick={handleMarkPublished}
              disabled={publishing || status === 'published'}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '8px 18px', borderRadius: 8,
                border: status === 'published'
                  ? '1px solid rgba(74,222,128,0.3)'
                  : '1px solid rgba(74,222,128,0.5)',
                background: status === 'published'
                  ? 'rgba(74,222,128,0.08)'
                  : 'rgba(74,222,128,0.15)',
                color: status === 'published' ? 'rgba(74,222,128,0.6)' : '#4ade80',
                cursor: (publishing || status === 'published') ? 'default' : 'pointer',
              }}
            >
              {status === 'published'
                ? '✓ Marcado como subido'
                : publishing
                  ? 'Guardando...'
                  : 'Marcar como subido'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
