const utcDate = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const utcFull = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const localFull = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const clock = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatUtc(epochMs: number): string {
  return utcDate.format(new Date(epochMs))
}

export function formatUtcFull(epochMs: number): string {
  return `${utcFull.format(new Date(epochMs))} UTC`
}

export function formatLocalFull(epochMs: number): string {
  return localFull.format(new Date(epochMs))
}

export function formatClock(epochMs: number): string {
  return clock.format(new Date(epochMs))
}

export function formatDepth(depthKm: number): string {
  return depthKm < 1 ? '<1 km' : `${depthKm.toFixed(1)} km`
}

export function formatMagnitude(mag: number): string {
  return mag.toFixed(1)
}
