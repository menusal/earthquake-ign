import type { Quake } from '../data/types'

export type Scope = 'espana' | 'peninsula' | 'canarias' | 'mundo' | 'todo'

export interface Filters {
  magMin: number
  magMax: number
  depthMax: number
  scope: Scope
  days: number
  feltOnly: boolean
  q: string
  exag: number
  underground: boolean
  faults: boolean
  stations: boolean
  hazard: boolean
}

export const DEFAULT_FILTERS: Filters = {
  magMin: 0,
  magMax: 10,
  depthMax: 700,
  scope: 'espana',
  days: 30,
  feltOnly: false,
  q: '',
  exag: 1,
  underground: false,
  faults: false,
  stations: false,
  hazard: false,
}

const SCOPES: Scope[] = ['espana', 'peninsula', 'canarias', 'mundo', 'todo']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') return fallback
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed)) return fallback
  return clamp(parsed, min, max)
}

export function readFilters(params: URLSearchParams): Filters {
  const layers = new Set((params.get('capas') ?? '').split(',').filter(Boolean))
  const scopeRaw = params.get('ambito')
  const scope =
    scopeRaw !== null && SCOPES.includes(scopeRaw as Scope)
      ? (scopeRaw as Scope)
      : DEFAULT_FILTERS.scope

  return {
    magMin: readNumber(params, 'magMin', DEFAULT_FILTERS.magMin, 0, 10),
    magMax: readNumber(params, 'magMax', DEFAULT_FILTERS.magMax, 0, 10),
    depthMax: readNumber(params, 'depthMax', DEFAULT_FILTERS.depthMax, 0, 700),
    scope,
    days: readNumber(params, 'dias', DEFAULT_FILTERS.days, 1, 30),
    feltOnly: params.get('sentidos') === '1',
    q: (params.get('q') ?? '').trim(),
    exag: readNumber(params, 'exag', DEFAULT_FILTERS.exag, 1, 10),
    underground: params.get('subsuelo') === '1',
    faults: layers.has('fallas'),
    stations: layers.has('estaciones'),
    hazard: layers.has('peligrosidad'),
  }
}

export function writeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.magMin !== DEFAULT_FILTERS.magMin) {
    params.set('magMin', String(filters.magMin))
  }
  if (filters.magMax !== DEFAULT_FILTERS.magMax) {
    params.set('magMax', String(filters.magMax))
  }
  if (filters.depthMax !== DEFAULT_FILTERS.depthMax) {
    params.set('depthMax', String(filters.depthMax))
  }
  if (filters.scope !== DEFAULT_FILTERS.scope) {
    params.set('ambito', filters.scope)
  }
  if (filters.days !== DEFAULT_FILTERS.days) {
    params.set('dias', String(filters.days))
  }
  if (filters.feltOnly) params.set('sentidos', '1')
  if (filters.q.length > 0) params.set('q', filters.q)
  if (filters.exag !== DEFAULT_FILTERS.exag) params.set('exag', String(filters.exag))
  if (filters.underground) params.set('subsuelo', '1')

  const layers = [
    filters.faults ? 'fallas' : null,
    filters.stations ? 'estaciones' : null,
    filters.hazard ? 'peligrosidad' : null,
  ].filter((value): value is string => value !== null)
  if (layers.length > 0) params.set('capas', layers.join(','))

  return params
}

export function applyFilters(
  quakes: Quake[],
  filters: Filters,
  now = Date.now(),
): Quake[] {
  const limitMs = filters.days * 86_400_000
  const query = filters.q.toLocaleLowerCase('es')

  return quakes.filter((quake) => {
    if (quake.mag < filters.magMin || quake.mag > filters.magMax) return false
    if (quake.depthKm > filters.depthMax) return false
    if (filters.feltOnly && !quake.felt) return false

    if (filters.scope === 'espana' && quake.region === 'world') return false
    if (filters.scope === 'peninsula' && quake.region !== 'peninsula') return false
    if (filters.scope === 'canarias' && quake.region !== 'canarias') return false
    if (filters.scope === 'mundo' && quake.region !== 'world') return false

    if (limitMs < 30 * 86_400_000) {
      const age = now - quake.epochMs
      if (age > limitMs) return false
    }

    if (query.length > 0) {
      const haystack = `${quake.location} ${quake.id}`.toLocaleLowerCase('es')
      if (!haystack.includes(query)) return false
    }

    return true
  })
}
