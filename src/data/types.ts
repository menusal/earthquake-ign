export type Region = 'peninsula' | 'canarias' | 'world'

export interface Quake {
  id: string
  lon: number
  lat: number
  depthKm: number
  mag: number
  magType: string
  intensity: string | null
  timeUtc: string
  timeLocal: string
  epochMs: number
  location: string
  felt: boolean
  region: Region
}

export interface QuakeFeed {
  quakes: Quake[]
  fetchedAt: number
}
