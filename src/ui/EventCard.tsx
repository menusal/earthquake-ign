import type { ShakemapAvailability } from '../data/useShakemapAvailability'
import type { ShakemapMetric } from '../data/shakemap'
import type { Quake } from '../data/types'
import {
  formatDepth,
  formatLocalFull,
  formatMagnitude,
  formatUtcFull,
} from '../lib/format'
import { depthColor } from '../layers/earthquakes'

interface EventCardProps {
  quake: Quake
  shakemap: ShakemapAvailability
  shakemapOn: boolean
  shakemapMetric: ShakemapMetric
  onShakemapToggle: () => void
  onShakemapMetric: (metric: ShakemapMetric) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

const IGN_DETAIL =
  'https://www.ign.es/web/ign/portal/sis-catalogo-terremotos/-/catalogo-terremotos/detailTerremoto?evid='

export function EventCard({
  quake,
  shakemap,
  shakemapOn,
  shakemapMetric,
  onShakemapToggle,
  onShakemapMetric,
  onClose,
  onPrev,
  onNext,
}: EventCardProps) {
  return (
    <aside
      data-tour="event-card"
      className="pointer-events-auto absolute right-4 top-24 z-20 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 shadow-2xl backdrop-blur-xl max-md:inset-x-3 max-md:bottom-3 max-md:top-auto max-md:max-h-[58dvh] max-md:w-auto max-md:overflow-y-auto max-md:overscroll-contain"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-mist-100">
            M{formatMagnitude(quake.mag)}
          </span>
          <span className="text-xs uppercase tracking-wider text-mist-500">
            {quake.magType || 'mag'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-mist-500 transition hover:bg-white/5 hover:text-mist-100"
          aria-label="Cerrar ficha"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-sm font-medium text-mist-100">
            {quake.location || 'Sin localización'}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-mist-500">{quake.id}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-mist-500">Profundidad</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-mist-100">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: depthColor(quake.depthKm) }}
              />
              {formatDepth(quake.depthKm)}
            </dd>
          </div>
          <div>
            <dt className="text-mist-500">Intensidad máx.</dt>
            <dd className="mt-0.5 text-mist-100">
              {quake.intensity ?? '—'}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-mist-500">Hora UTC</dt>
            <dd className="mt-0.5 font-mono text-mist-100">
              {formatUtcFull(quake.epochMs)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-mist-500">Hora local</dt>
            <dd className="mt-0.5 font-mono text-mist-100">
              {formatLocalFull(quake.epochMs)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-mist-500">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full border border-white/80" />
            hipocentro
          </span>
          <span className="flex items-center gap-1">
            <span className="text-xs leading-none text-mist-300">+</span>
            epicentro
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-px bg-white/60" />
            profundidad
          </span>
        </div>

        {quake.felt && (
          <p className="rounded-lg border border-signal-500/30 bg-signal-500/10 px-3 py-2 text-[11px] text-signal-400">
            Sentido por la población
          </p>
        )}

        {shakemap === 'yes' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onShakemapToggle}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                shakemapOn
                  ? 'border-signal-500/40 bg-signal-500/15 text-signal-400'
                  : 'border-white/10 bg-ink-800 text-mist-100 hover:bg-ink-700'
              }`}
            >
              Shakemap
              <span
                className={`h-3.5 w-6 rounded-full p-0.5 transition ${
                  shakemapOn ? 'bg-signal-500/60' : 'bg-ink-600'
                }`}
              >
                <span
                  className={`block size-2.5 rounded-full bg-white transition ${
                    shakemapOn ? 'translate-x-2.5' : ''
                  }`}
                />
              </span>
            </button>
            {shakemapOn && (
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#cfe8ff] via-[#ffe08a] via-40% to-[#9b1c1c]" />
                <div className="flex justify-between text-[10px] text-mist-500">
                  <span>{shakemapMetric === 'MMI' ? 'I' : '0.01 %g'}</span>
                  <span>{shakemapMetric === 'MMI' ? 'XII' : '100 %g'}</span>
                </div>
              </div>
            )}
            {shakemapOn && (
              <div className="flex rounded-lg border border-white/10 bg-ink-800/70 p-0.5">
                {(['MMI', 'PGA'] as const).map((metric) => (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => onShakemapMetric(metric)}
                    className={`flex-1 rounded-md px-2 py-1 text-[11px] transition ${
                      shakemapMetric === metric
                        ? 'bg-mist-100 text-ink-950'
                        : 'text-mist-400 hover:text-mist-100'
                    }`}
                  >
                    {metric === 'MMI' ? 'Intensidad' : 'PGA'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <a
            href={`${IGN_DETAIL}${quake.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-center text-xs text-mist-100 transition hover:bg-ink-700"
          >
            Ver en el IGN
          </a>
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs text-mist-300 transition hover:text-mist-100"
            aria-label="Terremoto anterior"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs text-mist-300 transition hover:text-mist-100"
            aria-label="Terremoto siguiente"
          >
            ↓
          </button>
        </div>
      </div>
    </aside>
  )
}
