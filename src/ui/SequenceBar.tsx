interface SequenceBarProps {
  playing: boolean
  intervalMs: number
  loop: boolean
  disabled: boolean
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
  onInterval: (ms: number) => void
  onLoop: (loop: boolean) => void
}

const SPEEDS = [
  { value: 1000, label: '1 s' },
  { value: 2000, label: '2 s' },
  { value: 4000, label: '4 s' },
]

export function SequenceBar({
  playing,
  intervalMs,
  loop,
  disabled,
  onToggle,
  onPrev,
  onNext,
  onInterval,
  onLoop,
}: SequenceBarProps) {
  const cycleSpeed = () => {
    const index = SPEEDS.findIndex((speed) => speed.value === intervalMs)
    onInterval(SPEEDS[(index + 1) % SPEEDS.length].value)
  }

  return (
    <div
      data-tour="sequence"
      className="pointer-events-auto absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-white/10 bg-ink-900/90 px-2 py-2 shadow-2xl backdrop-blur-xl md:bottom-6 md:gap-2 md:px-3"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled}
        className="rounded-lg p-2 text-mist-300 transition hover:bg-white/5 hover:text-mist-100 disabled:opacity-40"
        aria-label="Anterior"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`grid size-10 place-items-center rounded-xl transition ${
          playing
            ? 'bg-signal-500 text-ink-950'
            : 'bg-mist-100 text-ink-950 hover:bg-white'
        } disabled:opacity-40`}
        aria-label={playing ? 'Pausar secuencia' : 'Reproducir secuencia'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M8 5v14M16 5v14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M8 5l11 7-11 7V5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-lg p-2 text-mist-300 transition hover:bg-white/5 hover:text-mist-100 disabled:opacity-40"
        aria-label="Siguiente"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M9 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="mx-0.5 h-6 w-px bg-white/10 md:mx-1" />

      <div className="hidden items-center gap-1 md:flex">
        {SPEEDS.map((speed) => (
          <button
            key={speed.value}
            type="button"
            onClick={() => onInterval(speed.value)}
            className={`rounded-md px-2 py-1 text-[11px] transition ${
              intervalMs === speed.value
                ? 'bg-white/10 text-mist-100'
                : 'text-mist-500 hover:text-mist-100'
            }`}
          >
            {speed.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className="rounded-md px-2.5 py-1.5 text-[11px] text-mist-300 transition hover:text-mist-100 md:hidden"
        aria-label="Cambiar velocidad de la secuencia"
      >
        {intervalMs / 1000} s
      </button>

      <button
        type="button"
        onClick={() => onLoop(!loop)}
        className={`hidden rounded-md px-2 py-1 text-[11px] transition md:block ${
          loop ? 'bg-white/10 text-mist-100' : 'text-mist-500 hover:text-mist-100'
        }`}
        aria-pressed={loop}
      >
        Bucle
      </button>
    </div>
  )
}
