"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS: { href: string; label: string; emoji: string }[] = [
  { href: '/info/social/generador',     label: 'Generador',     emoji: '🎨' },
  { href: '/info/social/automatizacion', label: 'Automatización', emoji: '⚙️' },
  { href: '/info/social/aprobacion',    label: 'Aprobación',    emoji: '✅' },
]

export function SocialNav() {
  const pathname = usePathname()

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(5,8,16,0.88)',
      backdropFilter: 'blur(16px)',
      position: 'sticky', top: 52, zIndex: 30,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 4, minHeight: 46 }}>
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '7px 14px', borderRadius: 8,
                textDecoration: 'none',
                color: active ? '#f1f5f9' : 'rgba(241,245,249,0.5)',
                background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                border: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{tab.emoji}</span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
