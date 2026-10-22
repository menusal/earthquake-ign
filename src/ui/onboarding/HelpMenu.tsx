import { useEffect, useRef } from 'react'

interface HelpMenuProps {
  open: boolean
  onClose: () => void
  onTour: () => void
  onIntro: () => void
}

export function HelpMenu({
  open,
  onClose,
  onTour,
  onIntro,
}: HelpMenuProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
        className="w-[min(430px,100%)] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="help-title" className="text-sm font-semibold text-mist-100">
              Ayuda
            </h2>
            <p className="mt-0.5 text-[11px] text-mist-500">
              Qué puedes hacer en Sismicidad 3D
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="rounded-lg p-1.5 text-mist-500 transition hover:bg-white/5 hover:text-mist-100"
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

        <div className="divide-y divide-white/5">
          <button
            type="button"
            onClick={onTour}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-signal-500/30 bg-signal-500/10 text-signal-400">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <span className="block text-xs font-medium text-mist-100">
                Tour guiado
              </span>
              <span className="block text-[11px] text-mist-500">
                Recorre el mapa, los filtros, las capas y la secuencia.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onIntro}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-800 text-mist-300">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  d="M12 8v.01M12 11v5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>
              <span className="block text-xs font-medium text-mist-100">
                Qué puedes ver
              </span>
              <span className="block text-[11px] text-mist-500">
                Introducción, controles y atribuciones.
              </span>
            </span>
          </button>

          <div className="px-5 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Atajos
            </p>
            <dl className="mt-2 space-y-1.5 text-[11px] text-mist-400">
              <div className="flex items-center justify-between gap-4">
                <dt>Reproducir / pausar secuencia</dt>
                <dd className="rounded border border-white/10 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-mist-200">
                  Espacio
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Cerrar ficha o tour</dt>
                <dd className="rounded border border-white/10 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-mist-200">
                  Esc
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Moverse por la lista</dt>
                <dd className="rounded border border-white/10 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-mist-200">
                  ↑ ↓
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-5 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Atribuciones
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-mist-400">
              Datos sísmicos y geográficos del{' '}
              <a
                href="https://www.ign.es"
                target="_blank"
                rel="noreferrer"
                className="text-mist-200 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                IGN
              </a>{' '}
              (CC-BY 4.0). Fallas activas:{' '}
              <a
                href="https://www.igme.es"
                target="_blank"
                rel="noreferrer"
                className="text-mist-200 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                IGME · QAFI
              </a>
              . Motor 3D: CesiumJS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
