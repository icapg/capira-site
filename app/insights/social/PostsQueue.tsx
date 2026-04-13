"use client"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Borrador',  color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  approved:  { label: 'Aprobado', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  published: { label: 'Publicado',color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  failed:    { label: 'Error',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const PLATFORM_ICON: Record<string, string> = {
  linkedin: 'in',
  twitter:  'X',
  facebook: 'f',
}

export function PostsQueue({ posts }: { posts: any[] }) {
  if (posts.length === 0) {
    return (
      <div style={{
        padding: '32px 16px', textAlign: 'center',
        color: 'rgba(244,244,245,0.3)', fontSize: 12,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 10,
      }}>
        No hay posts todavía.<br />Programá uno desde los templates.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {posts.map(post => {
        const s = STATUS[post.status] ?? STATUS.draft
        return (
          <div key={post.id} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5' }}>{post.template}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px',
                borderRadius: 20, color: s.color, background: s.bg,
              }}>
                {s.label}
              </span>
            </div>

            {post.caption && (
              <p style={{
                fontSize: 11, color: 'rgba(244,244,245,0.45)',
                margin: '0 0 8px', overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {post.caption}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(post.platforms ?? []).map((p: string) => (
                  <span key={p} style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                    borderRadius: 4, background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(244,244,245,0.6)',
                  }}>
                    {PLATFORM_ICON[p] ?? p}
                  </span>
                ))}
              </div>
              {post.scheduled_at && (
                <span style={{ fontSize: 10, color: 'rgba(244,244,245,0.3)' }}>
                  {new Date(post.scheduled_at).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short',
                  })}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
