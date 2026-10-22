import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { ShakemapMetric } from '../data/shakemap'
import { useShakemapAvailability } from '../data/useShakemapAvailability'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { BasemapMode } from '../map/basemaps'
import { flyToQuake } from '../map/camera'
import { CesiumViewer } from '../map/CesiumViewer'
import {
  applyFilters,
  DEFAULT_FILTERS,
  readFilters,
  writeFilters,
  type Filters,
} from '../state/searchParams'
import { useSequenceStore } from '../state/sequence'
import { useQuakeStore } from '../state/store'
import { EventCard } from '../ui/EventCard'
import { EventList } from '../ui/EventList'
import { FilterPanel } from '../ui/FilterPanel'
import { Legend } from '../ui/Legend'
import { GuidedTour } from '../ui/onboarding/GuidedTour'
import { HelpMenu } from '../ui/onboarding/HelpMenu'
import { SplashScreen } from '../ui/onboarding/SplashScreen'
import { SequenceBar } from '../ui/SequenceBar'
import { TopBar } from '../ui/TopBar'

const IGN_DETAIL =
  'https://www.ign.es/web/ign/portal/sis-catalogo-terremotos/-/catalogo-terremotos/detailTerremoto?evid='

export default function App() {
  const { evid } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const isMobile = useMediaQuery('(max-width: 767px)')

  const quakes = useQuakeStore((state) => state.quakes)
  const status = useQuakeStore((state) => state.status)
  const error = useQuakeStore((state) => state.error)
  const fetchedAt = useQuakeStore((state) => state.fetchedAt)
  const load = useQuakeStore((state) => state.load)

  const sequence = useSequenceStore()
  const stopSequence = sequence.stop

  const [basemap, setBasemap] = useState<BasemapMode>('ortho')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [splashOpen, setSplashOpen] = useState(() => !evid)
  const [helpOpen, setHelpOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [shakemapState, setShakemapState] = useState<{
    evid: string | null
    on: boolean
  }>({ evid: null, on: false })
  const [shakemapMetric, setShakemapMetric] = useState<ShakemapMetric>('MMI')
  const shakemapAvailability = useShakemapAvailability(evid ?? null)
  const shakemapOn =
    shakemapState.evid === (evid ?? null) && shakemapState.on

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => applyFilters(quakes, filters), [quakes, filters])

  const selected = useMemo(() => {
    if (!evid) return null
    return quakes.find((quake) => quake.id === evid) ?? null
  }, [quakes, evid])

  const rendered = useMemo(() => {
    if (selected && !filtered.some((quake) => quake.id === selected.id)) {
      return [selected, ...filtered]
    }
    return filtered
  }, [filtered, selected])

  const search = searchParams.toString()

  const select = useCallback(
    (id: string, options?: { replace?: boolean }) => {
      navigate({ pathname: `/e/${id}`, search }, { replace: options?.replace })
    },
    [navigate, search],
  )

  const close = useCallback(() => {
    navigate({ pathname: '/', search })
  }, [navigate, search])

  const updateFilters = useCallback(
    (patch: Partial<Filters>) => {
      setSearchParams(writeFilters({ ...filters, ...patch }), { replace: true })
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(writeFilters(DEFAULT_FILTERS), { replace: true })
  }, [setSearchParams])

  const lastFlownId = useRef<string | null>(null)
  const exagRef = useRef(filters.exag)

  useEffect(() => {
    exagRef.current = filters.exag
  }, [filters.exag])

  useEffect(() => {
    if (selected && lastFlownId.current !== selected.id) {
      lastFlownId.current = selected.id
      flyToQuake(selected, { exaggeration: exagRef.current })
    }
    if (!selected) lastFlownId.current = null
  }, [selected])

  const step = useCallback(
    (delta: number, replace = false) => {
      if (filtered.length === 0) return
      const index = filtered.findIndex((quake) => quake.id === evid)
      const base = index === -1 ? (delta > 0 ? -1 : 0) : index
      let next = base + delta
      if (next < 0) next = sequence.loop ? filtered.length - 1 : 0
      if (next >= filtered.length) next = sequence.loop ? 0 : filtered.length - 1
      select(filtered[next].id, { replace })
    },
    [evid, filtered, select, sequence.loop],
  )

  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    if (!sequence.playing) return
    const timer = window.setInterval(
      () => stepRef.current(1, true),
      sequence.intervalMs,
    )
    return () => window.clearInterval(timer)
  }, [sequence.playing, sequence.intervalMs])

  const togglePlay = useCallback(() => {
    if (sequence.playing) {
      sequence.stop()
      return
    }
    if (!evid && filtered.length > 0) {
      select(filtered[0].id, { replace: true })
    }
    sequence.start()
  }, [evid, filtered, select, sequence])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.closest('input, textarea, select, a, [contenteditable="true"]') ??
        null

      if (event.key === 'Escape') {
        sequence.stop()
        if (evid) close()
        return
      }

      if (event.code === 'Space' && !typing && target?.tagName !== 'BUTTON') {
        event.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, evid, sequence, togglePlay])

  const reload = useCallback(() => {
    void load({ bypassCache: true })
  }, [load])

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('Enlace copiado al portapapeles')
    } catch {
      setToast('No se pudo copiar el enlace')
    }
  }, [])

  const dismissSplash = useCallback(() => {
    setSplashOpen(false)
  }, [])

  const closeHelp = useCallback(() => setHelpOpen(false), [])

  const startTour = useCallback(() => {
    setSplashOpen(false)
    setHelpOpen(false)
    stopSequence()
    if (isMobile && evid) close()
    if (isMobile) setSheetOpen(true)
    setTourActive(true)
  }, [close, evid, isMobile, stopSequence])

  const closeTour = useCallback(() => {
    setTourActive(false)
  }, [])

  const openIntro = useCallback(() => {
    setHelpOpen(false)
    setSplashOpen(true)
  }, [])

  const loading = status === 'loading'
  const firstLoad = quakes.length === 0 && (status === 'idle' || loading)
  const missingEvent = evid !== undefined && selected === null && status === 'ready'
  const showSheet = !isMobile || (!selected && !missingEvent)
  const showSequence =
    filtered.length > 0 && !(isMobile && (selected || missingEvent || sheetOpen))

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-950">
      <CesiumViewer
        quakes={rendered}
        selected={selected}
        basemap={basemap}
        exaggeration={filters.exag}
        underground={filters.underground}
        shakemapEventId={shakemapOn ? (evid ?? null) : null}
        shakemapMetric={shakemapMetric}
        faults={filters.faults}
        stations={filters.stations}
        hazard={filters.hazard}
        onSelect={(id) => {
          if (id) select(id)
          else close()
        }}
      />

      <TopBar
        count={filtered.length}
        total={quakes.length}
        fetchedAt={fetchedAt}
        loading={loading}
        basemap={basemap}
        onBasemap={setBasemap}
        onReload={reload}
        onShare={() => void share()}
        onHelp={() => setHelpOpen(true)}
      />

      {firstLoad && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-ink-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/90 px-5 py-4">
            <span className="size-4 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
            <span className="text-sm text-mist-100">
              Cargando sismicidad del IGN…
            </span>
          </div>
        </div>
      )}

      {isMobile && sheetOpen && !selected && (
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 z-10 bg-ink-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      {showSheet && (
        <section
          className={
            isMobile
              ? `pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-xl transition-[height] duration-300 ${
                  sheetOpen
                    ? 'h-[78dvh]'
                    : 'h-[calc(4rem+env(safe-area-inset-bottom))]'
                }`
              : 'pointer-events-auto absolute bottom-6 left-6 top-[7.5rem] z-20 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/85 shadow-2xl backdrop-blur-xl'
          }
        >
          {isMobile && (
            <button
              type="button"
              data-tour="sheet-handle"
              onClick={() => setSheetOpen((open) => !open)}
              aria-expanded={sheetOpen}
              className="flex h-16 shrink-0 items-center justify-between px-4"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-white/20" />
                <span className="text-xs text-mist-200">
                  {filtered.length} sismos
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-mist-500">
                {sheetOpen ? 'Cerrar' : 'Filtros y lista'}
                <svg
                  viewBox="0 0 24 24"
                  className={`size-3.5 transition-transform ${
                    sheetOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          )}

          <div
            className={`${
              isMobile && !sheetOpen ? 'hidden' : 'flex'
            } min-h-0 flex-1 flex-col`}
          >
            <FilterPanel
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
            />

            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                Terremotos
              </span>
              <span className="text-[11px] text-mist-500">
                {filtered.length} · más recientes primero
              </span>
            </div>

            <EventList
              quakes={filtered}
              selectedId={evid ?? null}
              onSelect={(id) => select(id)}
            />

            {isMobile ? (
              <details
                data-tour="view-3d-mobile"
                className="shrink-0 border-t border-white/10"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                  Leyenda y vista 3D
                  <span aria-hidden="true">▾</span>
                </summary>
                <div className="max-h-[36dvh] overflow-y-auto overscroll-contain">
                  <Legend
                    exaggeration={filters.exag}
                    underground={filters.underground}
                    onExaggeration={(value) => updateFilters({ exag: value })}
                    onUnderground={(value) =>
                      updateFilters({ underground: value })
                    }
                  />
                </div>
              </details>
            ) : (
              <Legend
                exaggeration={filters.exag}
                underground={filters.underground}
                onExaggeration={(value) => updateFilters({ exag: value })}
                onUnderground={(value) => updateFilters({ underground: value })}
              />
            )}
          </div>
        </section>
      )}

      {missingEvent && (
        <aside className="pointer-events-auto absolute right-4 top-24 z-20 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-ink-900/90 p-4 shadow-2xl backdrop-blur-xl max-md:inset-x-3 max-md:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-md:top-auto max-md:w-auto">
          <p className="text-sm font-medium text-mist-100">
            Evento no disponible
          </p>
          <p className="mt-1 text-xs leading-relaxed text-mist-300">
            El código <span className="font-mono">{evid}</span> no está en la
            ventana de 30 días del IGN. Puedes consultarlo en su ficha original.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={`${IGN_DETAIL}${evid}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-center text-xs text-mist-100 transition hover:bg-ink-700"
            >
              Ver en el IGN
            </a>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs text-mist-300 transition hover:text-mist-100"
            >
              Cerrar
            </button>
          </div>
        </aside>
      )}

      {selected && (
        <EventCard
          quake={selected}
          shakemap={shakemapAvailability}
          shakemapOn={shakemapOn}
          shakemapMetric={shakemapMetric}
          onShakemapToggle={() =>
            setShakemapState({ evid: evid ?? null, on: !shakemapOn })
          }
          onShakemapMetric={setShakemapMetric}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}

      {showSequence && (
        <SequenceBar
          playing={sequence.playing}
          intervalMs={sequence.intervalMs}
          loop={sequence.loop}
          disabled={filtered.length < 2}
          onToggle={togglePlay}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onInterval={sequence.setIntervalMs}
          onLoop={sequence.setLoop}
        />
      )}

      {error && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 backdrop-blur">
          {error}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-ink-900/95 px-4 py-2 text-xs text-mist-100 shadow-xl">
          {toast}
        </div>
      )}

      <SplashScreen
        open={splashOpen}
        onClose={dismissSplash}
        onTour={startTour}
      />
      <HelpMenu
        open={helpOpen}
        onClose={closeHelp}
        onTour={startTour}
        onIntro={openIntro}
      />
      <GuidedTour
        active={tourActive}
        isMobile={isMobile}
        onClose={closeTour}
      />
    </div>
  )
}
