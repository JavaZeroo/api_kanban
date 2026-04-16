import type {
  ActivityEvent,
  AlignStatus,
  ApiRecord,
  DataSource,
  Dimension,
  DimensionRecord,
} from './types'
import { DIMENSIONS, STATUS_ORDER } from './types'

/* ---------------- date helpers ---------------- */

export const NOW = new Date('2026-04-15T12:00:00')

export function daysSince(iso: string): number {
  const d = new Date(iso)
  return (NOW.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
}

export function formatRelative(iso: string): string {
  const d = daysSince(iso)
  if (d < 1 / 24) return '刚刚'
  if (d < 1) return `${Math.floor(d * 24)} 小时前`
  if (d < 30) return `${Math.floor(d)} 天前`
  return `${Math.floor(d / 30)} 月前`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function freshnessLevel(iso: string): 'fresh' | 'normal' | 'stale' | 'cold' {
  const d = daysSince(iso)
  if (d < 1) return 'fresh'
  if (d < 7) return 'normal'
  if (d < 30) return 'stale'
  return 'cold'
}

export const FRESHNESS_LABEL: Record<ReturnType<typeof freshnessLevel>, string> = {
  fresh: '24h 内',
  normal: '7 天内',
  stale: '7-30 天',
  cold: '30 天+',
}

/* ---------------- aggregation ---------------- */

export interface StatusDistribution {
  aligned: number
  reviewed: number
  pending: number
  unsupported: number
  untested: number
  total: number
}

export const EMPTY_DIST: StatusDistribution = {
  aligned: 0,
  reviewed: 0,
  pending: 0,
  unsupported: 0,
  untested: 0,
  total: 0,
}

export function distOfDimension(
  list: ApiRecord[],
  dim: Dimension,
): StatusDistribution {
  const out: StatusDistribution = { ...EMPTY_DIST }
  for (const api of list) {
    const s = api.dimensions[dim].status
    out[s] += 1
    out.total += 1
  }
  return out
}

export function coverageRate(dist: StatusDistribution): number {
  if (dist.total === 0) return 0
  return (dist.total - dist.untested) / dist.total
}

const SCORE_WEIGHT: Record<AlignStatus, number> = {
  aligned: 100,
  reviewed: 70,
  pending: 30,
  unsupported: 0,
  untested: 0,
}

export function dimensionHealthScore(list: ApiRecord[], dim: Dimension): number {
  if (list.length === 0) return 0
  let sum = 0
  for (const api of list) {
    sum += SCORE_WEIGHT[api.dimensions[dim].status]
  }
  return Math.round(sum / list.length)
}

export function globalHealthScore(list: ApiRecord[]): number {
  if (list.length === 0) return 0
  const sum = list.reduce((acc, api) => acc + api.alignment_score, 0)
  return Math.round(sum / list.length)
}

export function isHighRisk(api: ApiRecord): boolean {
  const statuses = DIMENSIONS.map((d) => api.dimensions[d].status)
  if (statuses.includes('pending') || statuses.includes('unsupported')) return true
  if ((api.api_level === 'L0' || api.api_level === 'L1') && statuses.includes('untested'))
    return true
  return false
}

export function countHighRisk(list: ApiRecord[]): number {
  return list.filter(isHighRisk).length
}

export function allModules(list: ApiRecord[]): string[] {
  return Array.from(new Set(list.map((a) => a.api_module))).sort()
}

export function allLevels(list: ApiRecord[]): string[] {
  return Array.from(new Set(list.map((a) => a.api_level))).sort()
}

export interface MatrixCell {
  module: string
  dimension: Dimension
  score: number
  api_count: number
  high_risk_count: number
  dist: StatusDistribution
}

export function buildMatrix(list: ApiRecord[]): MatrixCell[] {
  const modules = allModules(list)
  const cells: MatrixCell[] = []
  for (const m of modules) {
    const moduleApis = list.filter((a) => a.api_module === m)
    for (const d of DIMENSIONS) {
      const dist = distOfDimension(moduleApis, d)
      cells.push({
        module: m,
        dimension: d,
        score: dimensionHealthScore(moduleApis, d),
        api_count: moduleApis.length,
        high_risk_count: moduleApis.filter(
          (api) =>
            api.dimensions[d].status === 'pending' ||
            api.dimensions[d].status === 'unsupported',
        ).length,
        dist,
      })
    }
  }
  return cells
}

export function freshness24hRate(list: ApiRecord[]): number {
  if (!list.length) return 0
  return list.filter((a) => daysSince(a.updated_at) < 1).length / list.length
}

export function stale7dCount(list: ApiRecord[]): number {
  return list.filter((a) => daysSince(a.updated_at) >= 7).length
}

export function noSourceUrlCount(list: ApiRecord[]): number {
  let n = 0
  for (const api of list) {
    for (const d of DIMENSIONS) {
      const rec = api.dimensions[d]
      if (rec.status !== 'untested' && !rec.source_url) n++
    }
  }
  return n
}

/* ---------------- score color ---------------- */

export function scoreColor(score: number): string {
  if (score >= 85) return '#61B230'
  if (score >= 65) return '#85C460'
  if (score >= 45) return '#FCC800'
  if (score >= 25) return '#D53C44'
  return '#C7000B'
}

/* ---------------- ordering helpers ---------------- */

export function statusOrderIndex(s: AlignStatus): number {
  return STATUS_ORDER.indexOf(s)
}

/* ---------------- filtering ---------------- */

export interface FilterState {
  keyword: string
  modules: string[]
  levels: string[]
  dimensions: Dimension[]
  statuses: AlignStatus[]
  sources: DataSource[]
  onlyRisk: boolean
  onlyRecent: boolean
  sortBy: 'score' | 'updated' | 'name'
  sortDir: 'asc' | 'desc'
}

export const INITIAL_FILTER: FilterState = {
  keyword: '',
  modules: [],
  levels: [],
  dimensions: [],
  statuses: [],
  sources: [],
  onlyRisk: false,
  onlyRecent: false,
  sortBy: 'score',
  sortDir: 'asc',
}

export function applyFilter(list: ApiRecord[], f: FilterState): ApiRecord[] {
  let result = list.filter((api) => {
    if (f.keyword && !api.api_name.toLowerCase().includes(f.keyword.toLowerCase()))
      return false
    if (f.modules.length && !f.modules.includes(api.api_module)) return false
    if (f.levels.length && !f.levels.includes(api.api_level)) return false
    if (f.sources.length) {
      const hit = api.data_source_summary.some((s) => f.sources.includes(s))
      if (!hit) return false
    }
    if (f.statuses.length) {
      const dims = f.dimensions.length ? f.dimensions : DIMENSIONS
      const hit = dims.some((d) => f.statuses.includes(api.dimensions[d].status))
      if (!hit) return false
    } else if (f.dimensions.length) {
      // no status filter but dimension filter → keep all
    }
    if (f.onlyRisk && !isHighRisk(api)) return false
    if (f.onlyRecent && daysSince(api.updated_at) > 2) return false
    return true
  })

  result = [...result].sort((a, b) => {
    let v = 0
    if (f.sortBy === 'score') v = a.alignment_score - b.alignment_score
    else if (f.sortBy === 'updated')
      v = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    else v = a.api_name.localeCompare(b.api_name)
    return f.sortDir === 'asc' ? v : -v
  })
  return result
}

/* ---------------- activity helpers ---------------- */

export function sortedActivities(list: ActivityEvent[]): ActivityEvent[] {
  return [...list].sort(
    (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
  )
}

export function topFixPending(list: ApiRecord[], n = 6): {
  api: ApiRecord
  dim: Dimension
  rec: DimensionRecord
}[] {
  const items: { api: ApiRecord; dim: Dimension; rec: DimensionRecord }[] = []
  for (const api of list) {
    for (const d of DIMENSIONS) {
      const rec = api.dimensions[d]
      if (rec.status === 'pending') items.push({ api, dim: d, rec })
    }
  }
  items.sort((a, b) => b.rec.fail_count - a.rec.fail_count)
  return items.slice(0, n)
}

export function topUntested(list: ApiRecord[], n = 6): ApiRecord[] {
  return list
    .filter((api) => DIMENSIONS.some((d) => api.dimensions[d].status === 'untested'))
    .sort((a, b) => {
      const cntA = DIMENSIONS.filter((d) => a.dimensions[d].status === 'untested').length
      const cntB = DIMENSIONS.filter((d) => b.dimensions[d].status === 'untested').length
      if (cntA !== cntB) return cntB - cntA
      const lv = ['L0', 'L1', 'L2', 'TBD']
      return lv.indexOf(a.api_level) - lv.indexOf(b.api_level)
    })
    .slice(0, n)
}

export function topReviewedDiffs(list: ApiRecord[], n = 6): {
  api: ApiRecord
  dim: Dimension
  rec: DimensionRecord
}[] {
  const items: { api: ApiRecord; dim: Dimension; rec: DimensionRecord }[] = []
  for (const api of list) {
    for (const d of DIMENSIONS) {
      const rec = api.dimensions[d]
      if (rec.status === 'reviewed') items.push({ api, dim: d, rec })
    }
  }
  return items.slice(0, n)
}
