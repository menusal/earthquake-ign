const API = '/api/shakemap'

function shakemapUrl(evid: string, file: string): string {
  return `${API}?evid=${encodeURIComponent(evid)}&file=${encodeURIComponent(file)}`
}

export type ShakemapMetric = 'MMI' | 'PGA'

export interface ShakemapGrid {
  lonMin: number
  latMin: number
  lonMax: number
  latMax: number
  nlon: number
  nlat: number
  spacingLon: number
  spacingLat: number
  values: Record<ShakemapMetric, Float32Array>
}

export interface ShakemapContour {
  value: number
  color: string
  lines: Array<Array<[number, number]>>
}

export interface ShakemapData {
  grid: ShakemapGrid
  contours: ShakemapContour[]
}

export async function checkShakemap(evid: string): Promise<boolean> {
  try {
    const response = await fetch(shakemapUrl(evid, 'info.json'), {
      cache: 'no-store',
    })
    if (!response.ok) return false
    const json = (await response.json().catch(() => null)) as
      | { available?: boolean }
      | null
    return json?.available !== false
  } catch {
    return false
  }
}

export function parseShakemapGrid(xml: string): ShakemapGrid {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const spec = doc.querySelector('grid_specification')
  const dataNode = doc.querySelector('grid_data')
  if (!spec || !dataNode) throw new Error('Shakemap sin grid_specification')

  const nlon = Number(spec.getAttribute('nlon'))
  const nlat = Number(spec.getAttribute('nlat'))
  const lonMin = Number(spec.getAttribute('lon_min'))
  const lonMax = Number(spec.getAttribute('lon_max'))
  const latMin = Number(spec.getAttribute('lat_min'))
  const latMax = Number(spec.getAttribute('lat_max'))
  const spacingLon = Number(spec.getAttribute('nominal_lon_spacing'))
  const spacingLat = Number(spec.getAttribute('nominal_lat_spacing'))

  const fields = [...doc.querySelectorAll('grid_field')].map(
    (field) => field.getAttribute('name') ?? '',
  )
  const mmiIndex = fields.indexOf('MMI')
  const pgaIndex = fields.indexOf('PGA')

  const values: Record<ShakemapMetric, Float32Array> = {
    MMI: new Float32Array(nlon * nlat),
    PGA: new Float32Array(nlon * nlat),
  }

  const rows = (dataNode.textContent ?? '').trim().split(/\r?\n/)

  for (let i = 0; i < rows.length && i < nlon * nlat; i++) {
    const parts = rows[i].trim().split(/\s+/)
    values.MMI[i] = Number(parts[mmiIndex])
    values.PGA[i] = Number(parts[pgaIndex])
  }

  return {
    lonMin,
    latMin,
    lonMax,
    latMax,
    nlon,
    nlat,
    spacingLon,
    spacingLat,
    values,
  }
}

async function fetchContours(
  evid: string,
  metric: ShakemapMetric,
): Promise<ShakemapContour[]> {
  const file = metric === 'MMI' ? 'cont_mi.json' : 'cont_pga.json'
  const response = await fetch(shakemapUrl(evid, file))
  if (!response.ok) return []

  const json = (await response.json()) as {
    features?: Array<{
      properties?: { value?: number; color?: string }
      geometry?: { type?: string; coordinates?: unknown }
    }>
  }

  const contours: ShakemapContour[] = []

  for (const feature of json.features ?? []) {
    const value = Number(feature.properties?.value)
    const color = feature.properties?.color ?? '#ffffff'
    const geometry = feature.geometry
    if (!Number.isFinite(value) || !geometry?.coordinates) continue

    const lines: Array<Array<[number, number]>> = []
    if (geometry.type === 'MultiLineString') {
      for (const line of geometry.coordinates as Array<Array<[number, number]>>) {
        lines.push(line)
      }
    } else if (geometry.type === 'LineString') {
      lines.push(geometry.coordinates as Array<[number, number]>)
    }

    if (lines.length > 0) contours.push({ value, color, lines })
  }

  return contours
}

export async function fetchShakemap(
  evid: string,
  metric: ShakemapMetric,
): Promise<ShakemapData> {
  const response = await fetch(shakemapUrl(evid, 'grid.xml'))
  if (!response.ok) throw new Error('Shakemap no disponible')

  const grid = parseShakemapGrid(await response.text())
  const contours = await fetchContours(evid, metric).catch(() => [])

  return { grid, contours }
}
