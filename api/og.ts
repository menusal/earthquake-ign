export const config = { runtime: 'edge' }

const FEED =
  'https://www.ign.es/web/resources/sismologia/tproximos/todos_visualizadores.js'

interface RawProperties {
  evid?: string
  mag?: string
  magtype?: string
  depth?: string
  fecha?: string
  loc?: string
}

function extractObject(text: string, variable: string): string | null {
  const match = new RegExp(`var\\s+${variable}\\s*=\\s*`).exec(text)
  if (!match) return null

  let start = match.index + match[0].length
  while (start < text.length && /\s/.test(text[start])) start++
  if (text[start] !== '{') return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const evid = url.searchParams.get('evid') ?? ''

  let quake: RawProperties | null = null

  try {
    const response = await fetch(FEED)
    const text = await response.text()
    const json = extractObject(text, 'tproximos')
    if (json) {
      const data = JSON.parse(json) as {
        features?: Array<{ properties?: RawProperties }>
      }
      quake =
        data.features?.find((feature) => feature.properties?.evid === evid)
          ?.properties ?? null
    }
  } catch {
    quake = null
  }

  const title = quake
    ? `M${quake.mag ?? '?'} · ${quake.loc ?? 'Terremoto'}`
    : 'Sismicidad 3D · IGN'
  const description = quake
    ? `${quake.fecha ?? ''} UTC · ${quake.depth ?? '?'} km · ${quake.magtype ?? ''} · Instituto Geográfico Nacional`
    : 'Visor 3D de la sismicidad reciente en España. Instituto Geográfico Nacional.'

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Sismicidad 3D" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="https://${url.host}/e/${escapeHtml(evid)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="/e/${escapeHtml(evid)}" />
    <meta http-equiv="refresh" content="0; url=/e/${escapeHtml(evid)}" />
  </head>
  <body>
    <p>${escapeHtml(title)}</p>
    <p>${escapeHtml(description)}</p>
  </body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
