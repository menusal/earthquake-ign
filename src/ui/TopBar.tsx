import { useState } from 'react'
import type { BasemapMode } from '../map/basemaps'
import { formatClock } from '../lib/format'

interface TopBarProps {
  count: number
  total: number
  fetchedAt: number | null
  loading: boolean
  basemap: BasemapMode
  onBasemap: (mode: BasemapMode) => void
  onReload: () => void
  onShare: () => void
  onHelp: () => void
}

const BASEMAPS: Array<{ id: BasemapMode; label: string }> = [
  { id: 'ortho', label: 'Ortofoto' },
  { id: 'relief', label: 'Relieve' },
  { id: 'dark', label: 'Oscuro' },
]

export function TopBar({
  count,
  total,
  fetchedAt,
  loading,
  basemap,
  onBasemap,
  onReload,
  onShare,
  onHelp,
}: TopBarProps) {
  const [mapOpen, setMapOpen] = useState(false)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 bg-gradient-to-b from-ink-950/95 via-ink-950/70 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 md:px-6">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 md:gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-signal-500/40 bg-signal-500/10 md:size-10">
          <svg viewBox="0 0 24 24" className="size-5 md:size-6" aria-hidden="true">
            <path
              d="M2 13h4l2-7 3.5 14 3-11 2 4H22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-signal-400"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight text-mist-100 md:text-base">
            Sismicidad 3D
          </h1>
          <p className="hidden text-[11px] uppercase tracking-[0.14em] text-mist-500 sm:block">
            IGN · últimos 30 días
          </p>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2 text-xs text-mist-300 backdrop-blur md:flex">
          <span className="font-semibold text-mist-100">{count}</span>
          <span>de {total} sismos</span>
          {fetchedAt !== null && (
            <span className="text-mist-500">· {formatClock(fetchedAt)}</span>
          )}
        </div>

        <div data-tour="basemap" className="relative">
          <button
            type="button"
            onClick={() => setMapOpen((open) => !open)}
            className="rounded-xl border border-white/10 bg-ink-900/70 p-2.5 text-mist-300 backdrop-blur transition hover:text-mist-100 md:hidden"
            aria-label="Mapa base"
            aria-expanded={mapOpen}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                d="m12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="hidden rounded-xl border border-white/10 bg-ink-900/70 p-1 backdrop-blur md:flex">
            {BASEMAPS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onBasemap(option.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                  basemap === option.id
                    ? 'bg-mist-100 text-ink-950'
                    : 'text-mist-300 hover:text-mist-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mapOpen && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú de mapa"
                className="fixed inset-0 -z-10 cursor-default"
                onClick={() => setMapOpen(false)}
              />
              <div className="absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur md:hidden">
                {BASEMAPS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onBasemap(option.id)
                      setMapOpen(false)
                    }}
                    className={`block w-full px-3 py-2.5 text-left text-xs transition ${
                      basemap === option.id
                        ? 'bg-signal-500/15 text-signal-400'
                        : 'text-mist-300 hover:bg-white/5 hover:text-mist-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          data-tour="help"
          onClick={onHelp}
          className="rounded-xl border border-white/10 bg-ink-900/70 p-2.5 text-mist-300 backdrop-blur transition hover:text-mist-100"
          aria-label="Ayuda"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="button"
          data-tour="share"
          onClick={onShare}
          className="rounded-xl border border-white/10 bg-ink-900/70 p-2.5 text-mist-300 backdrop-blur transition hover:text-mist-100"
          title="Copiar enlace"
          aria-label="Copiar enlace"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="button"
          data-tour="reload"
          onClick={onReload}
          disabled={loading}
          aria-label="Recargar datos"
          title="Recargar datos"
          className="flex items-center gap-2 rounded-xl border border-signal-500/40 bg-signal-500/15 p-2.5 text-xs font-medium text-signal-400 backdrop-blur transition hover:bg-signal-500/25 disabled:opacity-60 md:px-3"
        >
          <svg
            viewBox="0 0 24 24"
            className={`size-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          >
            <path
              d="M21 12a9 9 0 1 1-3.2-6.9M21 4v5h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">Recargar</span>
        </button>
      </div>
    </header>
  )
}
