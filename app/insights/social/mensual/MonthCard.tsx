"use client"

import type { MonthBundle } from '../../../lib/social/monthly'
import { MatriculacionesMes } from '../templates/MatriculacionesMes'
import { BajasMes } from '../templates/BajasMes'
import { AcumuladoMes } from '../templates/AcumuladoMes'
import { FORMAT_DIMS } from '../templates/types'

// Thumb escalado de un template portrait
function Thumb({ children, width = 110 }: { children: React.ReactNode; width?: number }) {
  const { w, h } = FORMAT_DIMS['instagram']
  const scale = width / w
  return (
    <div style={{
      width, height: h * scale,
      overflow: 'hidden',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      <div style={{
        width: w, height: h,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {children}
      </div>
    </div>
  )
}

function formatReleaseDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function MonthCard({ bundle, onClick }: { bundle: MonthBundle; onClick: () => void }) {
  const { state, data, periodoFull, dgtReleaseDate } = bundle

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        padding: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{periodoFull}</span>
        {state === 'generando' && dgtReleaseDate && (
          <span style={{ fontSize: 10, color: 'rgba(250,204,21,0.75)' }}>
            DGT · {formatReleaseDate(dgtReleaseDate)}
          </span>
        )}
        {state === 'pendiente' && (
          <span style={{ fontSize: 10, color: 'rgba(56,189,248,0.8)' }}>Datos listos</span>
        )}
        {state === 'subido' && bundle.supabasePost?.scheduled_at && (
          <span style={{ fontSize: 10, color: 'rgba(74,222,128,0.8)' }}>
            {new Date(bundle.supabasePost.scheduled_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {state === 'generando' ? (
        <div style={{
          padding: '18px 10px',
          borderRadius: 8,
          background: 'rgba(250,204,21,0.05)',
          border: '1px dashed rgba(250,204,21,0.2)',
          fontSize: 11,
          color: 'rgba(241,245,249,0.5)',
          textAlign: 'center',
        }}>
          Esperando datos DGT
        </div>
      ) : data ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <Thumb>
            <MatriculacionesMes
              periodo={data.periodo}
              periodoFull={data.periodoFull}
              periodoPrev={data.periodoPrev}
              periodoPrevFull={data.periodoPrevFull}
              {...data.matriculaciones}
              format="instagram"
              variant={1}
            />
          </Thumb>
          <Thumb>
            <BajasMes
              periodo={data.periodo}
              periodoFull={data.periodoFull}
              periodoPrev={data.periodoPrev}
              periodoPrevFull={data.periodoPrevFull}
              {...data.bajas}
              format="instagram"
              variant={1}
            />
          </Thumb>
          <Thumb>
            <AcumuladoMes
              periodo={data.periodo}
              periodoFull={data.periodoFull}
              periodoPrevFull={data.periodoPrevFull}
              {...data.acumulado}
              format="instagram"
              variant={1}
            />
          </Thumb>
        </div>
      ) : null}
    </button>
  )
}
