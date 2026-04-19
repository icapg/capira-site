"use client"

import { useState } from 'react'
import type { AutomationRow } from './page'
import { AutomationDrawer } from './AutomationDrawer'

const MESES_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function labelForPeriodo(key: string | null) {
  if (!key) return '—'
  const [y, m] = key.split('-')
  return `${MESES_ES_FULL[parseInt(m) - 1]} ${y}`
}

export function AutomationsClient({
  initial, nextRun, ultimoDgt,
}: {
  initial: AutomationRow[]
  nextRun: string | null
  ultimoDgt: string | null
}) {
  const [rows, setRows] = useState<AutomationRow[]>(initial)
  const [editing, setEditing] = useState<AutomationRow | null>(null)

  function handleSave(updated: AutomationRow) {
    setRows(rs => rs.map(r => r.id === updated.id ? updated : r))
    setEditing(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Automatizaciones</div>
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.5)', marginTop: 4 }}>
          Flujos que se ejecutan sin intervención y depositan contenido en la cola de aprobación. Click en una fila para editar.
        </div>
      </div>

      <div style={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        background: 'rgba(5,8,16,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.7fr',
          gap: 12,
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, fontWeight: 700,
          letterSpacing: 0.6, textTransform: 'uppercase',
          color: 'rgba(241,245,249,0.4)',
        }}>
          <div>Nombre</div>
          <div>Trigger</div>
          <div>Último periodo</div>
          <div>Próxima ejecución</div>
          <div>Estado</div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 24, fontSize: 12, color: 'rgba(241,245,249,0.5)', textAlign: 'center' }}>
            No hay automatizaciones configuradas todavía.
          </div>
        )}
        {rows.map(a => (
          <div
            key={a.id}
            onClick={() => setEditing(a)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.7fr',
              gap: 12,
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: 12,
              color: '#f1f5f9',
              alignItems: 'start',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.nombre}</div>
              <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.55)', lineHeight: 1.5 }}>
                {a.descripcion}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {a.tipos.map(t => (
                  <span key={t.typeId} style={tagStyle('#38bdf8')}>{t.typeId}</span>
                ))}
                {a.plataformas.map(p => (
                  <span key={p} style={tagStyle('#a78bfa')}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{ color: 'rgba(241,245,249,0.7)' }}>
              {a.trigger_type === 'day-15-monthly' ? 'Día 15 de cada mes (tras DGT)' : a.trigger_type}
            </div>
            <div style={{ color: 'rgba(241,245,249,0.7)' }}>
              {labelForPeriodo(a.ultimo_periodo ?? ultimoDgt)}
            </div>
            <div style={{ color: 'rgba(241,245,249,0.7)' }}>
              {nextRun
                ? new Date(nextRun).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </div>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                color: a.activa ? '#4ade80' : '#facc15',
                background: a.activa ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>{a.activa ? 'activa' : 'pausada'}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, padding: 14,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 10,
        fontSize: 11,
        color: 'rgba(241,245,249,0.45)',
        lineHeight: 1.55,
      }}>
        Los flujos automáticos siempre depositan el contenido en la pestaña <strong style={{ color: 'rgba(241,245,249,0.75)' }}>Aprobación</strong>. Nunca publican solos: cada bundle requiere revisión humana antes de subirse.
      </div>

      {editing && (
        <AutomationDrawer
          automation={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function tagStyle(color: string): React.CSSProperties {
  return {
    fontSize: 9.5, fontWeight: 600,
    padding: '2px 8px', borderRadius: 5,
    background: `${color}12`,
    border: `1px solid ${color}30`,
    color,
  }
}
