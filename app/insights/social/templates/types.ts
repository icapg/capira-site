export type Format = 'linkedin-desktop' | 'linkedin-portrait' | 'instagram'

export const FORMAT_DIMS: Record<Format, { w: number; h: number }> = {
  'linkedin-desktop':  { w: 1200, h: 627  },
  'linkedin-portrait': { w: 1080, h: 1350 },
  'instagram':         { w: 1080, h: 1350 },
}
