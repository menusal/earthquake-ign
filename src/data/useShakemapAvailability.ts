import { useEffect, useState } from 'react'
import { checkShakemap } from './shakemap'

export type ShakemapAvailability = 'unknown' | 'yes' | 'no'

const cache = new Map<string, boolean>()

export function useShakemapAvailability(
  evid: string | null,
): ShakemapAvailability {
  const [state, setState] = useState<ShakemapAvailability>('unknown')

  useEffect(() => {
    if (!evid) {
      setState('unknown')
      return
    }

    const cached = cache.get(evid)
    if (cached !== undefined) {
      setState(cached ? 'yes' : 'no')
      return
    }

    let cancelled = false
    setState('unknown')

    void checkShakemap(evid).then((available) => {
      cache.set(evid, available)
      if (!cancelled) setState(available ? 'yes' : 'no')
    })

    return () => {
      cancelled = true
    }
  }, [evid])

  return state
}
