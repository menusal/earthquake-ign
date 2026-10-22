import { DEPTH_LEGEND } from '../layers/earthquakes'

interface LegendProps {
  exaggeration: number
  underground: boolean
  onExaggeration: (value: number) => void
  onUnderground: (value: boolean) => void
}

const EXAGGERATIONS = [1, 3, 5]

export function Legend({
  exaggeration,
  underground,
  onExaggeration,
  onUnderground,
}: LegendProps) {
  return (
    <div data-tour="view-3d" className="space-y-2.5 border-t border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
          Profundidad
        </span>
        <span className="text-[11px] text-mist-500">tamaño = magnitud</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {DEPTH_LEGEND.map((band) => (
          <span
            key={band.label}
            className="flex items-center gap-1.5 text-[11px] text-mist-300"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: band.color }}
            />
            {band.label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-mist-500">Exageración vertical</span>
        <div className="flex rounded-lg border border-white/10 bg-ink-800/70 p-0.5">
          {EXAGGERATIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onExaggeration(value)}
              className={`rounded-md px-2 py-0.5 text-[11px] transition ${
                exaggeration === value
                  ? 'bg-mist-100 text-ink-950'
                  : 'text-mist-400 hover:text-mist-100'
              }`}
            >
              ×{value}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onUnderground(!underground)}
        aria-pressed={underground}
        className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
          underground
            ? 'border-signal-500/40 bg-signal-500/15 text-signal-400'
            : 'border-white/10 bg-ink-800/70 text-mist-400 hover:text-mist-100'
        }`}
      >
        Ver subsuelo
        <span
          className={`h-3.5 w-6 rounded-full p-0.5 transition ${
            underground ? 'bg-signal-500/60' : 'bg-ink-600'
          }`}
        >
          <span
            className={`block size-2.5 rounded-full bg-white transition ${
              underground ? 'translate-x-2.5' : ''
            }`}
          />
        </span>
      </button>

      <p className="text-[10px] leading-relaxed text-mist-500">
        Datos: Instituto Geográfico Nacional (CC-BY 4.0).
      </p>
    </div>
  )
}
