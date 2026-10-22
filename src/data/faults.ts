export interface Fault {
  id: string
  name: string
  slipRate: number
  activity: string
  lines: Array<Array<[number, number]>>
}

interface FaultFeature {
  properties?: {
    ID?: string
    FaultName?: string
    Slip_Rate_?: number
    Activity_D?: number | string
  }
  geometry?: {
    type?: string
    coordinates?: unknown
  }
}

export async function fetchFaults(): Promise<Fault[]> {
  const response = await fetch('/api/qafi')
  if (!response.ok) throw new Error('No se pudo cargar QAFI')

  const json = (await response.json()) as { features?: FaultFeature[] }
  const faults: Fault[] = []

  for (const feature of json.features ?? []) {
    const geometry = feature.geometry
    if (!geometry?.coordinates) continue

    const lines: Array<Array<[number, number]>> = []
    if (geometry.type === 'MultiLineString') {
      for (const line of geometry.coordinates as Array<Array<[number, number]>>) {
        lines.push(line)
      }
    } else if (geometry.type === 'LineString') {
      lines.push(geometry.coordinates as Array<[number, number]>)
    }

    if (lines.length === 0) continue

    faults.push({
      id: feature.properties?.ID ?? crypto.randomUUID(),
      name: feature.properties?.FaultName ?? 'Falla sin nombre',
      slipRate: Number(feature.properties?.Slip_Rate_ ?? 0),
      activity: String(feature.properties?.Activity_D ?? ''),
      lines,
    })
  }

  return faults
}
