import { z } from 'zod'
import type { Quake, Region } from './types'

const numLike = z.union([z.string(), z.number()])

const featureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    evid: z.string(),
    mag: numLike,
    magtype: z.string().nullish(),
    intensidad: z.string().nullish(),
    depth: numLike,
    fecha: z.string(),
    fechalocal: z.string().nullish(),
    loc: z.string().nullish(),
    tipoint: z.string().nullish(),
  }),
})

const collectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
})

const SOURCES: Array<{ variable: string; region: Region }> = [
  { variable: 'tproximos', region: 'peninsula' },
  { variable: 'tproximos_canarias', region: 'canarias' },
  { variable: 'tmundiales', region: 'world' },
]

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

function toNumber(value: string | number): number | null {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function parseUtc(value: string): number {
  const iso = value.trim().replace(' ', 'T')
  const withZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`
  const ms = Date.parse(withZone)
  return Number.isFinite(ms) ? ms : 0
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function toQuake(raw: unknown, region: Region): Quake | null {
  const parsed = featureSchema.safeParse(raw)
  if (!parsed.success) return null

  const feature = parsed.data
  const props = feature.properties
  const mag = toNumber(props.mag)
  const depth = toNumber(props.depth)
  if (mag === null || depth === null) return null

  const intensity = clean(props.intensidad)

  return {
    id: props.evid.trim(),
    lon: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
    depthKm: Math.max(0, depth),
    mag,
    magType: clean(props.magtype),
    intensity: intensity.length > 0 ? intensity : null,
    timeUtc: clean(props.fecha),
    timeLocal: clean(props.fechalocal),
    epochMs: parseUtc(props.fecha),
    location: clean(props.loc),
    felt: clean(props.tipoint).length > 0 || intensity.length > 0,
    region,
  }
}

export function parseQuakeFeed(text: string): Quake[] {
  const byId = new Map<string, Quake>()

  for (const source of SOURCES) {
    const json = extractObject(text, source.variable)
    if (!json) continue

    let collection: unknown
    try {
      collection = JSON.parse(json)
    } catch {
      continue
    }

    const parsed = collectionSchema.safeParse(collection)
    if (!parsed.success) continue

    for (const feature of parsed.data.features) {
      const quake = toQuake(feature, source.region)
      if (!quake || quake.id.length === 0) continue
      if (!byId.has(quake.id)) byId.set(quake.id, quake)
    }
  }

  return [...byId.values()].sort((a, b) => b.epochMs - a.epochMs)
}
