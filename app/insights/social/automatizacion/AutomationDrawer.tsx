"use client"

import { useEffect, useState } from 'react'
import type { AutomationRow } from './page'
import { IMAGE_TYPES, imageTypeById, type FilterId } from '../../../lib/social/image-types'
import { TIPO_LABELS, type TipoVehiculo } from '../../../lib/insights/dgt-bev-phev-data'

type TipoEntry = {
  typeId:  string
  filters: {
    tec:           'ambos' | 'bev' | 'phev'
    tiposVehiculo: TipoVehiculo[]
    fuente:        'dgt' | 'anfac'
  }
}

const DEFAULT_FILTERS: TipoEntry['filters'] = {
  tec: 'ambos',
  tiposVehiculo: ['todos'],
  fuente: 'dgt',
}

const PLATAFORMAS: { id: string; label: string }[] = [
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter',   label: 'X'         },
]

const TIPOS_VEHICULO: TipoVehiculo[] = ['todos','turismo','furgoneta','moto_scooter','microcar','camion','autobus','otros']

export function AutomationDrawer({
  automation, onClose, onSave,
}: {
  automation:  AutomationRow
  onClose:    () => void
  onSave:     (updated: AutomationRow) => void
}) {
  const [nombre, setNombre]       = useState(automation.nombre)
  const [descripcion, setDesc]    = useState(automation.descripcion ?? '')
  const [tipos, setTipos]         = useState<TipoEntry[]>(automation.tipos as TipoEntry[])
  const [plataformas, setPlat]    = useState<string[]>(automation.plataformas)
  const [activa, setActiva]       = useState(automation.activa)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleTipo(typeId: string) {
    setTipos(ts => {
      const found = ts.find(t => t.typeId === typeId)
      if (found) return ts.filter(t => t.typeId !== typeId)
      return [...ts, { typeId, filters: { ...DEFAULT_FILTERS } }]
    })
  }

  function updateFilters(typeId: string, patch: Partial<TipoEntry['filters']>) {
    setTipos(ts => ts.map(t =>
      t.typeId === typeId ? { ...t, filters: { ...t.filters, ...patch } } : t
    ))
  }

  function togglePlat(id: string) {
    setPlat(ps => ps.includes(id) ? ps.filter(p => p !== id) : [...ps, id])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/social/automations', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: automation.id,
          nombre,
          descripcion,
          tipos,
          plataformas,
          activa,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const payload = await res.json()
      onSave(payload.automation)
    } catch (e: any) {
      console.error(e)
      alert(`Error guardando: ${e?.message ?? 'desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(620px, 95vw)',
          height: '100vh',
          background: '#0b0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(241,245,249,0.4)', marginBottom: 2, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Editar automatización
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{automation.nombre}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'rgba(241,245,249,0.5)', cursor: 'pointer',
            fontSize: 20, padding: '4px 10px',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          <Label>Nombre</Label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            style={inputStyle}
          />

          <Label style={{ marginTop: 18 }}>Descripción</Label>
          <textarea
            value={descripcion}
            onChange={e => setDesc(e.target.value)}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' } as React.CSSProperties}
          />

          <Label style={{ marginTop: 22 }}>Imágenes a generar</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {IMAGE_TYPES.map(t => {
              const entry = tipos.find(x => x.typeId === t.id)
              const enabled = !!entry
              const supports = new Set<FilterId>(t.supports)
              return (
                <div
                  key={t.id}
                  style={{
                    border: `1px solid ${enabled ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    background: enabled ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleTipo(t.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{t.label}</div>
                      <div style={{ fontSize: 10.5, color: 'rgba(241,245,249,0.45)', marginTop: 2 }}>{t.description}</div>
                    </div>
                  </label>

                  {enabled && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <SubField label="Tecnología" active={supports.has('tec')}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['ambos','bev','phev'] as const).map(k => (
                            <button key={k}
                              onClick={() => updateFilters(t.id, { tec: k })}
                              disabled={!supports.has('tec')}
                              style={pillStyle(entry!.filters.tec === k, supports.has('tec'))}
                            >{k === 'ambos' ? 'Ambos' : k.toUpperCase()}</button>
                          ))}
                        </div>
                      </SubField>

                      <SubField label="Tipo de vehículo" active={supports.has('tipoVehiculo')}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {TIPOS_VEHICULO.map(tv => {
                            const selected = entry!.filters.tiposVehiculo.includes(tv)
                            return (
                              <button
                                key={tv}
                                onClick={() => {
                                  if (!supports.has('tipoVehiculo')) return
                                  let next: TipoVehiculo[]
                                  if (tv === 'todos') next = ['todos']
                                  else {
                                    const rest = entry!.filters.tiposVehiculo.filter(x => x !== 'todos')
                                    next = selected ? rest.filter(x => x !== tv) : [...rest, tv]
                                    if (next.length === 0) next = ['todos']
                                  }
                                  updateFilters(t.id, { tiposVehiculo: next })
                                }}
                                disabled={!supports.has('tipoVehiculo')}
                                style={pillStyle(selected, supports.has('tipoVehiculo'))}
                              >{TIPO_LABELS[tv]}</button>
                            )
                          })}
                        </div>
                      </SubField>

                      <SubField label="Fuente" active={supports.has('fuente')}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['dgt','anfac'] as const).map(f => (
                            <button key={f}
                              onClick={() => updateFilters(t.id, { fuente: f })}
                              disabled={!supports.has('fuente')}
                              style={pillStyle(entry!.filters.fuente === f, supports.has('fuente'))}
                            >{f.toUpperCase()}</button>
                          ))}
                        </div>
                      </SubField>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Label style={{ marginTop: 22 }}>Plataformas destino</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PLATAFORMAS.map(p => {
              const active = plataformas.includes(p.id)
              return (
                <button key={p.id}
                  onClick={() => togglePlat(p.id)}
                  style={pillStyle(active, true)}
                >{p.label}</button>
              )
            })}
          </div>

          <Label style={{ marginTop: 22 }}>Estado</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setActiva(true)}  style={pillStyle(activa,   true)}>Activa</button>
            <button onClick={() => setActiva(false)} style={pillStyle(!activa,  true)}>Pausada</button>
          </div>

          <div style={{
            marginTop: 22, padding: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            fontSize: 10.5, color: 'rgba(241,245,249,0.5)',
            lineHeight: 1.5,
          }}>
            <strong>Trigger:</strong> {automation.trigger_type === 'day-15-monthly' ? 'Día 15 de cada mes, cuando DGT publica datos. No editable por ahora.' : automation.trigger_type}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={secondaryBtn}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

function SubField({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  return (
    <div style={{ opacity: active ? 1 : 0.35 }} title={active ? undefined : 'Este tipo no usa este filtro'}>
      <div style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(241,245,249,0.55)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ pointerEvents: active ? 'auto' : 'none' }}>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 12, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#f1f5f9',
  fontFamily: 'inherit',
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

const secondaryBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 600,
  padding: '8px 16px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(241,245,249,0.7)',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 700,
    padding: '8px 18px', borderRadius: 8,
    border: '1px solid rgba(56,189,248,0.5)',
    background: 'rgba(56,189,248,0.15)',
    color: '#38bdf8',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}
