import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import type { Quake } from '../data/types'
import { formatDepth, formatMagnitude, formatUtc } from '../lib/format'
import { depthColor } from '../layers/earthquakes'

interface EventListProps {
  quakes: Quake[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const REGION_LABEL: Record<Quake['region'], string> = {
  peninsula: 'Península',
  canarias: 'Canarias',
  world: 'Mundo',
}

export function EventList({ quakes, selectedId, onSelect }: EventListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: quakes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 62,
    overscan: 10,
  })

  const selectedIndex = quakes.findIndex((quake) => quake.id === selectedId)

  useEffect(() => {
    if (selectedIndex >= 0) {
      virtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
    }
  }, [selectedIndex, virtualizer])

  const move = (delta: number) => {
    if (quakes.length === 0) return
    const base = selectedIndex === -1 ? 0 : selectedIndex
    const next = Math.min(quakes.length - 1, Math.max(0, base + delta))
    onSelect(quakes[next].id)
  }

  return (
    <div
      ref={parentRef}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          move(1)
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          move(-1)
        } else if (event.key === 'Home') {
          event.preventDefault()
          if (quakes.length > 0) onSelect(quakes[0].id)
        } else if (event.key === 'End') {
          event.preventDefault()
          if (quakes.length > 0) onSelect(quakes[quakes.length - 1].id)
        }
      }}
      data-tour="event-list"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--color-ink-600)_transparent]"
    >
      {quakes.length === 0 ? (
        <p className="p-6 text-center text-xs text-mist-500">
          No hay terremotos con estos filtros.
        </p>
      ) : (
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const quake = quakes[item.index]
            const active = quake.id === selectedId

            return (
              <button
                key={quake.id}
                type="button"
                data-quake-id={quake.id}
                onClick={() => onSelect(quake.id)}
                className={`absolute inset-x-0 flex items-center gap-3 px-3 text-left transition ${
                  active
                    ? 'bg-signal-500/15 ring-1 ring-inset ring-signal-500/40'
                    : 'hover:bg-white/5'
                }`}
                style={{
                  height: `${item.size}px`,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: depthColor(quake.depthKm) }}
                />
                <span className="w-14 shrink-0 font-mono text-[11px] leading-tight text-mist-500">
                  {formatUtc(quake.epochMs)}
                </span>
                <span className="w-11 shrink-0 rounded-md bg-ink-800 px-1.5 py-1 text-center font-mono text-xs font-semibold text-mist-100">
                  {formatMagnitude(quake.mag)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-mist-100">
                    {quake.location || 'Sin localización'}
                  </span>
                  <span className="block text-[11px] text-mist-500">
                    {formatDepth(quake.depthKm)} · {REGION_LABEL[quake.region]}
                    {quake.felt ? ' · sentido' : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
