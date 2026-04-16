import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { INITIAL_FILTER, type FilterState } from './utils'
import type { AlignStatus, DataSource, Dimension } from './types'

interface FilterContextValue {
  filter: FilterState
  update: (patch: Partial<FilterState>) => void
  reset: () => void
  toggleModule: (m: string) => void
  toggleLevel: (l: string) => void
  toggleDimension: (d: Dimension) => void
  toggleStatus: (s: AlignStatus) => void
  toggleSource: (s: DataSource) => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER)

  const update = useCallback(
    (patch: Partial<FilterState>) => setFilter((prev) => ({ ...prev, ...patch })),
    [],
  )
  const reset = useCallback(() => setFilter(INITIAL_FILTER), [])

  const toggleInList = <T extends string>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  const toggleModule = useCallback(
    (m: string) => setFilter((p) => ({ ...p, modules: toggleInList(p.modules, m) })),
    [],
  )
  const toggleLevel = useCallback(
    (l: string) => setFilter((p) => ({ ...p, levels: toggleInList(p.levels, l) })),
    [],
  )
  const toggleDimension = useCallback(
    (d: Dimension) =>
      setFilter((p) => ({ ...p, dimensions: toggleInList(p.dimensions, d) })),
    [],
  )
  const toggleStatus = useCallback(
    (s: AlignStatus) =>
      setFilter((p) => ({ ...p, statuses: toggleInList(p.statuses, s) })),
    [],
  )
  const toggleSource = useCallback(
    (s: DataSource) =>
      setFilter((p) => ({ ...p, sources: toggleInList(p.sources, s) })),
    [],
  )

  const value = useMemo(
    () => ({
      filter,
      update,
      reset,
      toggleModule,
      toggleLevel,
      toggleDimension,
      toggleStatus,
      toggleSource,
    }),
    [filter, update, reset, toggleModule, toggleLevel, toggleDimension, toggleStatus, toggleSource],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilter() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter must be used inside FilterProvider')
  return ctx
}
