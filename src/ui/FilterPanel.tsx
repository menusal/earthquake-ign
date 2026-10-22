import { DEFAULT_FILTERS, type Filters, type Scope } from '../state/searchParams'

interface FilterPanelProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

const SCOPES: Array<{ id: Scope; label: string }> = [
  { id: 'espana', label: 'España' },
  { id: 'peninsula', label: 'Península y Baleares' },
  { id: 'canarias', label: 'Canarias' },
  { id: 'mundo', label: 'Mundo' },
  { id: 'todo', label: 'Todo' },
]

const DEPTHS = [
  { value: 15, label: '≤ 15 km' },
  { value: 30, label: '≤ 30 km' },
  { value: 70, label: '≤ 70 km' },
  { value: 150, label: '≤ 150 km' },
  { value: 700, label: 'Sin límite' },
]

const DAYS = [
  { value: 1, label: '24 h' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
]

const selectClass =
  'w-full rounded-lg border border-white/10 bg-ink-800/80 px-2.5 py-2 text-xs text-mist-100 outline-none transition focus:border-signal-500/60'

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const dirty =
    filters.magMin !== DEFAULT_FILTERS.magMin ||
    filters.depthMax !== DEFAULT_FILTERS.depthMax ||
    filters.scope !== DEFAULT_FILTERS.scope ||
    filters.days !== DEFAULT_FILTERS.days ||
    filters.feltOnly ||
    filters.q.length > 0

  return (
    <div data-tour="filters" className="space-y-3 border-b border-white/10 p-3.5 md:p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
          Filtros
        </span>
        {dirty && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-signal-400 hover:text-signal-500"
          >
            Limpiar
          </button>
        )}
      </div>

      <label className="block">
        <div className="mb-1 flex items-center justify-between text-xs text-mist-300">
          <span>Magnitud mínima</span>
          <span className="font-mono text-mist-100">
            M{filters.magMin.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={filters.magMin}
          onChange={(event) => onChange({ magMin: Number(event.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-signal-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-mist-300">Profundidad</span>
          <select
            value={filters.depthMax}
            onChange={(event) =>
              onChange({ depthMax: Number(event.target.value) })
            }
            className={selectClass}
          >
            {DEPTHS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-mist-300">Periodo</span>
          <select
            value={filters.days}
            onChange={(event) => onChange({ days: Number(event.target.value) })}
            className={selectClass}
          >
            {DAYS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-mist-300">Ámbito</span>
        <select
          value={filters.scope}
          onChange={(event) => onChange({ scope: event.target.value as Scope })}
          className={selectClass}
        >
          {SCOPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <input
        type="search"
        value={filters.q}
        onChange={(event) => onChange({ q: event.target.value })}
        placeholder="Localidad o código (ej. Granada)"
        className="w-full rounded-lg border border-white/10 bg-ink-800/80 px-2.5 py-2 text-xs text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-signal-500/60"
      />

      <label className="flex cursor-pointer items-center gap-2 text-xs text-mist-300">
        <input
          type="checkbox"
          checked={filters.feltOnly}
          onChange={(event) => onChange({ feltOnly: event.target.checked })}
          className="size-4 accent-signal-500"
        />
        Solo sentidos por la población
      </label>

      <div data-tour="layers" className="space-y-1.5 border-t border-white/10 pt-3">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
          Capas 3D
        </span>
        {[
          ['faults', 'Fallas activas (QAFI)'],
          ['stations', 'Estaciones sísmicas'],
          ['hazard', 'Peligrosidad sísmica 2015'],
        ].map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 text-xs text-mist-300"
          >
            <input
              type="checkbox"
              checked={filters[key as 'faults' | 'stations' | 'hazard']}
              onChange={(event) =>
                onChange({
                  [key]: event.target.checked,
                } as Partial<Filters>)
              }
              className="size-4 accent-signal-500"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
