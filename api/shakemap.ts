export const config = { runtime: 'edge' }

const BASE =
  'https://www.ign.es/web/resources/sismologia/tproximos/shakemaps'
const FILES = new Set([
  'info.json',
  'grid.xml',
  'cont_mi.json',
  'cont_pga.json',
  'stationlist.json',
])

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const evid = url.searchParams.get('evid') ?? ''
  const file = url.searchParams.get('file') ?? 'info.json'

  if (!/^[a-z0-9]+$/i.test(evid) || !FILES.has(file)) {
    return new Response('Bad request', { status: 400 })
  }

  const upstream = await fetch(`${BASE}/${evid}/${file}`)

  if (file === 'info.json' && upstream.status === 404) {
    return new Response(JSON.stringify({ available: false }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'public, s-maxage=120',
      },
    })
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
      'cache-control': 'public, s-maxage=120, stale-while-revalidate=600',
    },
  })
}
