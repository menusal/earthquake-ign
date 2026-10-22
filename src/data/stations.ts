export interface Station {
  id: string
  name: string
  lon: number
  lat: number
}

interface StationFeature {
  properties?: { STA?: string; EMPLAZAMIENTO?: string }
  geometry?: { coordinates?: [number, number] }
}

const URL =
  'https://www.ign.es/web/resources/sismologia/estaciones/json/estaciones_velocidad.geojson'

export async function fetchStations(): Promise<Station[]> {
  const response = await fetch(URL)
  if (!response.ok) throw new Error('No se pudieron cargar las estaciones')

  const json = (await response.json()) as { features?: StationFeature[] }
  const stations: Station[] = []

  for (const feature of json.features ?? []) {
    const coordinates = feature.geometry?.coordinates
    if (!coordinates) continue
    stations.push({
      id: feature.properties?.STA ?? crypto.randomUUID(),
      name: feature.properties?.EMPLAZAMIENTO ?? '',
      lon: coordinates[0],
      lat: coordinates[1],
    })
  }

  return stations
}
