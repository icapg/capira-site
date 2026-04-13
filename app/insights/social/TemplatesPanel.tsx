"use client"

import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { MatriculacionesMes } from './templates/MatriculacionesMes'
import { BajasMes } from './templates/BajasMes'
import { AcumuladoMes } from './templates/AcumuladoMes'
import { FORMAT_DIMS } from './templates/types'
import type { Format } from './templates/types'

type Props = {
  data: {
    periodo: string
    matriculaciones: any
    bajas: any
    acumulado: any
  }
}

const FORMATS: { id: Format; label: string; ratio: string }[] = [
  { id: 'linkedin-desktop',  label: 'LinkedIn',  ratio: '1200×627'  },
  { id: 'linkedin-portrait', label: 'LinkedIn',  ratio: '1080×1350' },
  { id: 'instagram',         label: 'Instagram', ratio: '1080×1350' },
]

const VARIANT_LABELS = ['Variante 1', 'Variante 2', 'Variante 3']

// ─── Preview con escala + botón de descarga ──────────────────────────────────
function ScaledPreview({
  format,
  label,
  previewWidth: previewWidthOverride,
  children,
}: {
  format: Format
  label: string
  previewWidth?: number
  children: React.ReactNode
}) {
  const { w, h } = FORMAT_DIMS[format]
  const previewWidth = previewWidthOverride ?? (format === 'linkedin-desktop' ? 900 : 520)
  const scale = previewWidth / w
  const scaledHeight = h * scale

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
      // Primera pasada para cachear recursos (fuentes, imágenes)
      await toPng(innerRef.current, opts)
      // Segunda pasada — resultado final limpio
      const dataUrl = await toPng(innerRef.current, opts)
      const link = document.createElement('a')
      link.download = `${label.toLowerCase().replace(/\s+/g, '-')}-${format}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Error generando imagen:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      {/* Preview escalado */}
      <div style={{
        width: previewWidth,
        height: scaledHeight,
        overflow: 'hidden',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div
          ref={innerRef}
          style={{
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>

      {/* Botón descargar */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: 7,
          border: '1px solid rgba(255,255,255,0.12)',
          background: downloading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
          color: downloading ? 'rgba(241,245,249,0.35)' : 'rgba(241,245,249,0.7)',
          cursor: downloading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'all 0.15s',
        }}
      >
        {downloading ? (
          <>
            <span style={{ fontSize: 10 }}>⏳</span> Generando...
          </>
        ) : (
          <>
            <span style={{ fontSize: 12 }}>↓</span> Descargar
          </>
        )}
      </button>
    </div>
  )
}

// ─── Panel principal ─────────────────────────────────────────────────────────
export function TemplatesPanel({ data }: Props) {
  const [format, setFormat] = useState<Format>('linkedin-desktop')

  const isDesktop = format === 'linkedin-desktop'
  // With 3 side by side, scale down the previews
  const variantPreviewWidth = isDesktop ? 340 : 260

  const templates = [
    {
      id:    'matriculaciones-mes',
      label: 'Matriculaciones del mes',
      variants: [
        <MatriculacionesMes key="v1" periodo={data.periodo} {...data.matriculaciones} format={format} variant={1} />,
        <MatriculacionesMes key="v2" periodo={data.periodo} {...data.matriculaciones} format={format} variant={2} />,
        <MatriculacionesMes key="v3" periodo={data.periodo} {...data.matriculaciones} format={format} variant={3} />,
      ],
    },
    {
      id:    'bajas-mes',
      label: 'Bajas del mes',
      variants: [
        <BajasMes key="v1" periodo={data.periodo} {...data.bajas} format={format} variant={1} />,
        <BajasMes key="v2" periodo={data.periodo} {...data.bajas} format={format} variant={2} />,
        <BajasMes key="v3" periodo={data.periodo} {...data.bajas} format={format} variant={3} />,
      ],
    },
    {
      id:    'acumulado-mes',
      label: 'Parque EV Activo',
      variants: [
        <AcumuladoMes key="v1" periodo={data.periodo} {...data.acumulado} format={format} variant={1} />,
        <AcumuladoMes key="v2" periodo={data.periodo} {...data.acumulado} format={format} variant={2} />,
        <AcumuladoMes key="v3" periodo={data.periodo} {...data.acumulado} format={format} variant={3} />,
      ],
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' }}>Templates</h1>
          <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', margin: 0 }}>
            Datos de {data.periodo} · Seleccioná formato y descargá
          </p>
        </div>

        {/* Selector de formato */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 2 }}>
          {FORMATS.map(f => {
            const active = format === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '6px 16px', borderRadius: 8, border: 'none',
                  background: active ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: active ? '#38bdf8' : 'rgba(241,245,249,0.45)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 400 }}>{f.ratio}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Templates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {templates.map(t => (
          <div key={t.id}>
            {/* Template header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{t.label}</span>
              <button style={{
                fontSize: 12, fontWeight: 600, padding: '6px 16px',
                borderRadius: 7, border: '1px solid rgba(56,189,248,0.35)',
                background: 'rgba(56,189,248,0.08)', color: '#38bdf8',
                cursor: 'pointer',
              }}>
                Programar →
              </button>
            </div>

            {/* 3 variants side by side */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {t.variants.map((variantNode, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ScaledPreview
                    format={format}
                    label={`${t.label}-v${idx + 1}`}
                    previewWidth={variantPreviewWidth}
                  >
                    {variantNode}
                  </ScaledPreview>
                  <span style={{
                    marginTop: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(241,245,249,0.35)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {VARIANT_LABELS[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
