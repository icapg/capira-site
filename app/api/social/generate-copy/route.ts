import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const HASHTAGS_FIJOS = '#MovilidadElectrica #CocheElectrico #VehiculoElectrico #DGT #EV #ESPAÑA'

function pct(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return ''
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtNum(n: number | undefined | null): string {
  if (n == null) return '0'
  return n.toLocaleString('es-ES')
}

function buildPrompt(periodoFull: string, data: any): string {
  const mat = data.matriculaciones
  const bajas = data.bajas
  const acu = data.acumulado
  const rec = data.records ?? {}
  const evMat = (mat.bev ?? 0) + (mat.phev ?? 0)
  const evBajas = (bajas.bevBajas ?? 0) + (bajas.phevBajas ?? 0)
  const evActivo = (acu.bevActivos ?? 0) + (acu.phevActivos ?? 0)
  const penetracion = acu.parqueTotal > 0 ? (evActivo / acu.parqueTotal) * 100 : 0

  const recordBlock = rec.enchufablesMatri
    ? `\n⚠️ RÉCORD HISTÓRICO: ${fmtNum(evMat)} enchufables matriculados este mes es la cifra MÁS ALTA de toda la historia registrada en España (supera el récord anterior de ${fmtNum(rec.maxPrevEnchufables ?? 0)}). ESTO DEBE SER EL FOCO ABSOLUTO DEL POST.`
    : rec.bevMatri
      ? `\n⚠️ Este mes marca un RÉCORD HISTÓRICO de BEV (${fmtNum(mat.bev)}). Destacalo en el hook.`
      : rec.phevMatri
        ? `\n⚠️ Este mes marca un RÉCORD HISTÓRICO de PHEV (${fmtNum(mat.phev)}). Mencionalo en el hook.`
        : ''

  return `Eres el community manager de CAPIRA, empresa española de infraestructura de carga para vehículos eléctricos. Tu audiencia: CPOs, inversores en infra, industria. Tono: profesional, directo, con datos concretos, sin exageraciones. Español de España. Números con formato español: puntos de miles (31.295), coma decimal (58,2%).

Genera DOS versiones del post sobre los datos DGT de ${periodoFull}:
- "long": para LinkedIn e Instagram (misma, sin límite estricto de largo, con toda la estructura).
- "short": para X (Twitter) — máximo 280 caracteres INCLUYENDO hashtags y emojis, porque X gratis corta ahí.

DATOS REALES DE ${periodoFull.toUpperCase()}:

Matriculaciones del mes:
- BEV (100% eléctricos): ${fmtNum(mat.bev)} (YoY ${pct(mat.bevYoy)})
- PHEV (híbridos enchufables): ${fmtNum(mat.phev)} (YoY ${pct(mat.phevYoy)})
- Total enchufables matriculados: ${fmtNum(evMat)} (YoY ${pct(mat.evYoy)})
- Total mercado: ${fmtNum(mat.totalMercado)} (YoY ${pct(mat.totalYoy)})

Bajas del mes:
- Total enchufables dados de baja: ${fmtNum(evBajas)} (YoY ${pct(bajas.evYoy)})

Parque activo (acumulado histórico España):
- Total enchufables en circulación: ${fmtNum(evActivo)}
- Parque total: ${fmtNum(acu.parqueTotal)}
- Penetración EV: ${penetracion.toFixed(2)}%
- YoY crecimiento enchufables: ${pct(acu.evYoy)}${recordBlock}

═══ ESTRUCTURA DE "long" (LinkedIn + Instagram) ═══
Respetá EXACTAMENTE este formato con saltos de línea:

[1 línea de hook con 1-2 emojis al inicio (🚗⚡ ejemplo). Describe la tendencia del mes concreta, orientada al negocio de infraestructura/CPOs. Adaptá verbos a los datos: si YoY sube fuerte usá "acelerando/impulsando"; si cae "ajustándose/moderándose"; si es mixto "con luces y sombras". Variá cada mes, NO copies el ejemplo.]

📈 ${periodoFull}: ${fmtNum(evMat)} vehículos enchufables matriculados (${pct(mat.evYoy)} YoY)
🔋 España ya supera las ${fmtNum(evActivo)} unidades enchufables en circulación
📊 El parque eléctrico crece un sólido ${pct(acu.evYoy)} interanual

[1 línea de cierre: reflexión breve sobre el impacto para infraestructura de carga, demanda energética o ubicaciones estratégicas. Variá según los datos.]

*Excluye la categoría Otros (tractores, maquinaria especial y vehículos fuera de las categorías principales).

${HASHTAGS_FIJOS}

═══ ESTRUCTURA DE "short" (X / Twitter) ═══
Un post compacto, máximo 280 caracteres INCLUYENDO hashtags y emojis. No uses los 3 bullets completos — elegí 1-2 datos clave.

Formato orientativo:
[1 emoji + frase con 1-2 cifras clave, ej: "🔋 ${periodoFull}: +${fmtNum(evMat)} enchufables (${pct(mat.evYoy)} YoY). España supera ${fmtNum(evActivo)} en circulación."]
${HASHTAGS_FIJOS}

REGLAS ESTRICTAS para la versión long:
- Si hay marcador de RÉCORD HISTÓRICO en los datos, el HOOK DEBE empezar mencionándolo de forma clara (ej. "🏆 Récord histórico en España" / "🚀 Mes récord: nunca tantas matriculaciones enchufables"). Es el mensaje principal.
- Usá EXACTAMENTE los 3 bullets (📈 🔋 📊) con esos números y en ese orden.
- Hashtags finales: EXACTAMENTE los listados, en ese orden, sin agregar ni quitar.
- Si algún YoY es negativo, usá verbos adecuados — no digas "acelerando" si cayó.
- Texto plano, sin negrita ni cursiva.

REGLAS ESTRICTAS para la versión short:
- MÁXIMO 280 caracteres (contá emojis como 2). Si te pasás, acortá la frase inicial, NUNCA quites hashtags.
- Si hay RÉCORD HISTÓRICO, mencionalo sí o sí (ej. "🏆 Récord: ..."). Es prioritario.
- Mismos hashtags fijos al final: ${HASHTAGS_FIJOS}.

Ejemplo de estilo (guía, NO copiar literal):
"🚗⚡ Las matriculaciones siguen acelerando… y el parque activo también sigue creciendo, un dato clave para los CPOs."

Responde ÚNICAMENTE con JSON, sin markdown, sin \`\`\`. Formato:
{"long":"...","short":"..."}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const periodoKey: string = body?.periodoKey
    const data = body?.data
    if (!data || !periodoKey) {
      return NextResponse.json({ error: 'missing periodoKey/data' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const prompt = buildPrompt(data.periodoFull ?? periodoKey, data)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[generate-copy] anthropic error', res.status, text)
      return NextResponse.json({ error: 'anthropic api error', detail: text }, { status: 500 })
    }

    const payload = await res.json()
    const text: string = payload?.content?.[0]?.text ?? ''

    // Extraer JSON robusto — a veces el modelo envuelve en ```json
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Fallback: buscar el primer { y el último }
      const start = cleaned.indexOf('{')
      const end   = cleaned.lastIndexOf('}')
      if (start >= 0 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1))
      } else {
        throw new Error('respuesta no parseable')
      }
    }

    const long  = String(parsed.long  ?? parsed.text ?? parsed.linkedin ?? parsed.instagram ?? '')
    const short = String(parsed.short ?? parsed.twitter ?? long).slice(0, 280)
    return NextResponse.json({
      long,
      short,
      linkedin:  long,
      instagram: long,
      twitter:   short,
    })
  } catch (err: any) {
    console.error('[generate-copy] error', err)
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 })
  }
}
