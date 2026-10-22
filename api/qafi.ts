export const config = { runtime: 'edge' }

const UPSTREAM =
  'https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_QAFI/MapServer/0/query' +
  '?where=1%3D1&outFields=*&outSR=4326&f=geojson'

export default async function handler(): Promise<Response> {
  const response = await fetch(UPSTREAM)

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'content-type': 'application/geo+json',
      'access-control-allow-origin': '*',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
