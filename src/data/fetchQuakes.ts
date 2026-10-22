import { parseQuakeFeed } from './parseTproximos'
import type { QuakeFeed } from './types'

const FEED_URL =
  'https://www.ign.es/web/resources/sismologia/tproximos/todos_visualizadores.js'

export async function fetchQuakes(options: {
  signal?: AbortSignal
  bypassCache?: boolean
} = {}): Promise<QuakeFeed> {
  const response = await fetch(FEED_URL, {
    signal: options.signal,
    cache: options.bypassCache ? 'no-store' : 'default',
  })

  if (!response.ok) {
    throw new Error(`El IGN respondió con ${response.status}`)
  }

  const text = await response.text()
  const quakes = parseQuakeFeed(text)

  if (quakes.length === 0) {
    throw new Error('La respuesta del IGN no contiene terremotos')
  }

  return { quakes, fetchedAt: Date.now() }
}
