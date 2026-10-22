import { create } from 'zustand'
import { fetchQuakes } from '../data/fetchQuakes'
import type { Quake } from '../data/types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface QuakeState {
  quakes: Quake[]
  status: Status
  error: string | null
  fetchedAt: number | null
  load: (options?: { bypassCache?: boolean }) => Promise<void>
}

export const useQuakeStore = create<QuakeState>((set, get) => ({
  quakes: [],
  status: 'idle',
  error: null,
  fetchedAt: null,
  load: async (options) => {
    if (get().status === 'loading') return

    set({ status: 'loading', error: null })

    try {
      const feed = await fetchQuakes({ bypassCache: options?.bypassCache })
      set({
        quakes: feed.quakes,
        status: 'ready',
        fetchedAt: feed.fetchedAt,
        error: null,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los datos del IGN'
      const hasData = get().quakes.length > 0
      set({ status: hasData ? 'ready' : 'error', error: message })
    }
  },
}))
