import type { Quake } from '../data/types'
import { formatDepth, formatMagnitude, formatUtc } from '../lib/format'
import { depthColor } from '../layers/earthquakes'

interface QuakeTooltipProps {
  quake: Quake
}

export function QuakeTooltip({ quake }: QuakeTooltipProps) {
  return (
    <div className="w-[260px] overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: depthColor(quake.depthKm) }}
          />
          <span className="text-sm font-semibold text-mist-100">
            M{formatMagnitude(quake.mag)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-mist-500">
            {quake.magType || 'mag'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-mist-300">
          {formatDepth(quake.depthKm)}
        </span>
      </div>

      <div className="space-y-1 px-3 py-2">
        <p className="truncate text-xs text-mist-100">
          {quake.location || 'Sin localización'}
        </p>
        <p className="font-mono text-[10px] text-mist-500">
          {formatUtc(quake.epochMs)} UTC
        </p>
        {(quake.intensity || quake.felt) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {quake.intensity && (
              <span className="rounded bg-signal-500/15 px-1.5 py-0.5 text-[10px] text-signal-400">
                Int. {quake.intensity}
              </span>
            )}
            {quake.felt && (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-mist-300">
                Sentido
              </span>
            )}
          </div>
        )}
      </div>

      <p className="border-t border-white/10 px-3 py-1.5 text-[10px] text-mist-500">
        Click para abrir la ficha
      </p>
    </div>
  )
}
