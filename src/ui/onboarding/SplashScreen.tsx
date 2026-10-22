import { useEffect, useRef } from 'react'

interface SplashScreenProps {
  open: boolean
  onClose: () => void
  onTour: () => void
}

const FEATURES = [
  {
    title: 'Hipocentros reales',
    text: 'Cada sismo a su profundidad, con exageración vertical y vista de subsuelo.',
    icon: (
      <path
        d="M12 3v8m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-8 3 3M12 3 9 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Terreno 3D',
    text: 'Relieve y ortofoto del IGN, con más detalle en las zonas sísmicas.',
    icon: (
      <path
        d="M3 18 9 7l4 6 3-4 5 9H3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Shakemaps',
    text: 'Intensidad y aceleración del suelo en los eventos que las tienen.',
    icon: (
      <path
        d="M4 12h3l2-6 3 12 2.5-8 1.5 2H20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Fallas activas',
    text: 'Trazas QAFI y cortinas 3D interpretativas de las principales fallas.',
    icon: (
      <path
        d="M5 5l6 6m0 0 4-4m-4 4 4 6M5 19l5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: 'Secuencia',
    text: 'Reproduce los terremotos filtrados con vuelo de cámara entre eventos.',
    icon: (
      <path
        d="M8 5v14l11-7L8 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Enlaces compartibles',
    text: 'Comparte un evento, los filtros y las capas activas por URL.',
    icon: (
      <path
        d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
  },
]

export function SplashScreen({ open, onClose, onTour }: SplashScreenProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    primaryRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink-950"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_600px_at_15%_-10%,rgba(240,90,40,0.22),transparent),radial-gradient(800px_500px_at_95%_5%,rgba(70,130,220,0.18),transparent)]"
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-signal-500/40 bg-signal-500/10">
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
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
            <div>
              <p className="text-sm font-semibold text-mist-100">Sismicidad 3D</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist-500">
                Instituto Geográfico Nacional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar introducción"
            className="rounded-lg p-2 text-mist-500 transition hover:bg-white/5 hover:text-mist-100"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
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

        <div className="mt-14 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal-400">
            Últimos 30 días · España y entorno
          </p>
          <h1
            id="splash-title"
            className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-mist-100 sm:text-5xl"
          >
            La Tierra no está quieta.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist-300 sm:text-base">
            Explora la sismicidad reciente en 3D: hipocentros a su profundidad
            real, terreno y ortofoto del IGN, shakemaps, fallas activas y
            estaciones. Filtra, reproduce secuencias y comparte cualquier evento
            por enlace.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-ink-900/60 p-4 backdrop-blur"
            >
              <div className="flex items-center gap-2 text-signal-400">
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  {feature.icon}
                </svg>
                <h2 className="text-sm font-medium text-mist-100">
                  {feature.title}
                </h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mist-400">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-ink-900/50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Cómo moverse
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-mist-300">
              <li>Arrastra para girar · rueda o pinch para acercar.</li>
              <li>Inclina con dos dedos o botón derecho para ver el 3D.</li>
              <li>Click o tap en un sismo para abrir su ficha.</li>
              <li>Activa “Ver subsuelo” para mirar bajo el terreno.</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Atribuciones
            </p>
            <p className="mt-2 text-xs leading-relaxed text-mist-400">
              Datos sísmicos y geográficos:{' '}
              <a
                href="https://www.ign.es"
                target="_blank"
                rel="noreferrer"
                className="text-mist-200 underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                Instituto Geográfico Nacional
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
              . Motor 3D: CesiumJS (Apache-2.0).
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-mist-500">
            La información está sujeta a revisión por el IGN.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onTour}
              className="rounded-xl border border-white/10 bg-ink-900/80 px-4 py-3 text-sm text-mist-200 transition hover:text-white"
            >
              Ver tour guiado
            </button>
            <button
              ref={primaryRef}
              type="button"
              onClick={onClose}
              className="rounded-xl bg-signal-500 px-5 py-3 text-sm font-medium text-ink-950 transition hover:bg-signal-400"
            >
              Explorar el mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
