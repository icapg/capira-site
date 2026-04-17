"use client"

import { useState } from 'react'
import type { MonthBundle } from '../../../lib/social/monthly'
import { MonthCard } from './MonthCard'
import { MonthDetail } from './MonthDetail'

const COLUMNS: { id: MonthBundle['state']; label: string; hint: string; color: string }[] = [
  { id: 'generando', label: 'Generando', hint: 'A la espera de datos DGT',      color: '#facc15' },
  { id: 'pendiente', label: 'Pendiente', hint: 'Listo para revisar y publicar', color: '#38bdf8' },
  { id: 'subido',    label: 'Subido',    hint: 'Publicado en redes',            color: '#4ade80' },
]

export function KanbanBoard({ bundles }: { bundles: MonthBundle[] }) {
  const [selected, setSelected] = useState<MonthBundle | null>(null)

  const byState: Record<MonthBundle['state'], MonthBundle[]> = {
    generando: [],
    pendiente: [],
    subido:    [],
  }
  for (const b of bundles) byState[b.state].push(b)

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        flex: 1,
        overflow: 'hidden',
      }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: col.color, boxShadow: `0 0 8px ${col.color}55`,
                  }}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{col.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(241,245,249,0.55)',
                  }}>{byState[col.id].length}</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(241,245,249,0.35)', marginTop: 2 }}>{col.hint}</div>
              </div>
            </div>
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: 10, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {byState[col.id].length === 0 ? (
                <div style={{
                  padding: 18, textAlign: 'center',
                  fontSize: 11, color: 'rgba(241,245,249,0.3)',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8,
                }}>Sin elementos</div>
              ) : byState[col.id].map(b => (
                <MonthCard
                  key={b.periodoKey}
                  bundle={b}
                  onClick={() => setSelected(b)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <MonthDetail
          bundle={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
