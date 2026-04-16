import { Fragment, useState } from 'react'
import clsx from 'clsx'
import type { ApiRecord, DataSource, Dimension, DimensionRecord } from '../types'
import { DIMENSIONS, DIMENSION_LABEL, STATUS_COLOR, STATUS_SHORT } from '../types'
import { formatDateTime, formatRelative, freshnessLevel, scoreColor } from '../utils'
import { useFilter } from '../store'
import { StatusChip } from './ui/StatusChip'
import type { FilterState } from '../utils'

interface Props {
  list: ApiRecord[]
  totalCount: number
}

const FRESHNESS_COLOR: Record<string, string> = { fresh: '#61B230', normal: '#115CAA', stale: '#FCC800', cold: '#D53C44' }
const SOURCE_LABEL: Record<DataSource, string> = { ci: 'CI', manual: '人工', import: '导入' }
const SOURCE_COLOR: Record<DataSource, string> = { ci: '#115CAA', manual: '#8C8C8C', import: '#A6A6A6' }

export function ApiTable({ list, totalCount }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { filter, update } = useFilter()

  const toggleExpand = (name: string) => {
    const n = new Set(expanded)
    n.has(name) ? n.delete(name) : n.add(name)
    setExpanded(n)
  }

  const setSort = (by: FilterState['sortBy']) => {
    if (filter.sortBy === by) update({ sortDir: filter.sortDir === 'asc' ? 'desc' : 'asc' })
    else update({ sortBy: by, sortDir: by === 'score' ? 'asc' : 'desc' })
  }

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between border-b border-line-200 px-4 py-3">
        <div>
          <div className="section-title">API 一致性矩阵</div>
          <div className="mt-0.5 pl-3.5 text-[11px] text-line-600">展示 {list.length} / {totalCount} 条</div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-line-600">排序</span>
          <SortButton label="一致性分" active={filter.sortBy === 'score'} dir={filter.sortDir} onClick={() => setSort('score')} />
          <SortButton label="更新时间" active={filter.sortBy === 'updated'} dir={filter.sortDir} onClick={() => setSort('updated')} />
          <SortButton label="名称" active={filter.sortBy === 'name'} dir={filter.sortDir} onClick={() => setSort('name')} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="hud-label">
              <th className="w-8 bg-line-50 py-2" />
              <th className="bg-line-50 px-4 py-2 text-left font-normal">API</th>
              <th className="bg-line-50 px-3 py-2 text-left font-normal">Level</th>
              {DIMENSIONS.map((d) => <th key={d} className="bg-line-50 px-3 py-2 text-left font-normal">{DIMENSION_LABEL[d]}</th>)}
              <th className="bg-line-50 px-3 py-2 text-right font-normal">一致性分</th>
              <th className="bg-line-50 px-3 py-2 text-left font-normal">风险</th>
              <th className="bg-line-50 px-3 py-2 text-left font-normal">来源</th>
              <th className="bg-line-50 px-3 py-2 text-right font-normal">更新</th>
            </tr>
          </thead>
          <tbody>
            {list.map((api) => {
              const isOpen = expanded.has(api.api_name)
              return (
                <Fragment key={api.api_name}>
                  <tr className={clsx('border-t border-line-200 text-[12px] transition hover:bg-line-50', isOpen && 'bg-line-100')}>
                    <td className="w-8 px-2 text-center">
                      <button onClick={() => toggleExpand(api.api_name)} className="flex h-5 w-5 items-center justify-center rounded border border-line-300 text-line-600 transition hover:border-brand hover:text-brand">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-mono text-[13px] text-line-950">{api.api_name}</div>
                      <div className="text-[10px] text-line-600">{api.api_module}</div>
                    </td>
                    <td className="px-3">
                      <span className={clsx('chip text-[10px]', api.api_level === 'L0' ? 'text-brand' : 'text-line-700')} style={{ background: api.api_level === 'L0' ? '#C7000B10' : '#F0F0F0', boxShadow: api.api_level === 'L0' ? 'inset 0 0 0 1px #C7000B30' : 'inset 0 0 0 1px #E5E5E5' }}>
                        {api.api_level}
                      </span>
                    </td>
                    {DIMENSIONS.map((d) => <td key={d} className="px-3"><DimensionCell rec={api.dimensions[d]} /></td>)}
                    <td className="px-3 text-right"><ScoreCell score={api.alignment_score} /></td>
                    <td className="px-3">
                      <div className="flex flex-wrap gap-1">
                        {api.risk_tags.slice(0, 2).map((t) => (
                          <span key={t} className={clsx('chip text-[9px]', t === '高风险' ? 'text-brand' : t === '不支持' ? 'text-brand-500' : t === 'L0/L1 未测' ? 'text-hi-600' : 'text-line-700')} style={{ background: '#F5F5F5', boxShadow: 'inset 0 0 0 1px #E5E5E5' }}>
                            {t}
                          </span>
                        ))}
                        {api.risk_tags.length === 0 && <span className="text-[10px] text-line-400">—</span>}
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex gap-1">
                        {api.data_source_summary.map((s) => <span key={s} className="chip text-[9px]" style={{ background: `${SOURCE_COLOR[s]}10`, color: SOURCE_COLOR[s] }}>{SOURCE_LABEL[s]}</span>)}
                      </div>
                    </td>
                    <td className="px-3 text-right">
                      <div className="tabular text-[11px] text-line-800">{formatRelative(api.updated_at)}</div>
                      <div className="tabular text-[9px] text-line-500">{formatDateTime(api.updated_at).slice(5)}</div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-line-200 bg-line-50">
                      <td colSpan={11} className="px-4 py-3"><ExpandedPanel api={api} /></td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {list.length === 0 && <tr><td colSpan={11} className="py-10 text-center text-[11px] text-line-600">暂无符合筛选条件的 API</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortButton({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('flex items-center gap-1 rounded-md border px-2 py-1 transition', active ? 'border-brand/40 bg-brand-50 text-brand' : 'border-line-300 bg-white text-line-600 hover:border-line-400')}>
      {label}
      {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none' }}><path d="M12 5v14m-7-7 7 7 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function DimensionCell({ rec }: { rec: DimensionRecord }) {
  const color = STATUS_COLOR[rec.status]
  const passRate = rec.pass_rate !== null ? `${Math.round(rec.pass_rate * 100)}%` : '—'
  const fresh = rec.latest_run_at ? freshnessLevel(rec.latest_run_at) : 'cold'
  return (
    <div className="group relative inline-flex min-w-[128px] items-center gap-2 rounded-md border py-1 pl-1.5 pr-2 text-[11px]" style={{ background: `${color}08`, borderColor: `${color}25` }}>
      <span className="h-full min-h-[26px] w-1 rounded-sm" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="font-medium" style={{ color }}>{STATUS_SHORT[rec.status]}</span>
          {rec.reviewed && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5L20 7" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] tabular text-line-600">
          <span>{passRate}</span>
          {rec.case_total > 0 && <><span className="text-line-400">·</span><span>{rec.case_total} cases</span></>}
          {rec.fail_count > 0 && <span className="text-brand-500">{rec.fail_count} fail</span>}
        </div>
      </div>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: FRESHNESS_COLOR[fresh] }} title={`最近运行`} />
    </div>
  )
}

function ScoreCell({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div className="inline-flex items-center gap-1.5">
      <svg width="26" height="26" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E5E5" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${(score / 100) * 88} 200`} strokeLinecap="round" transform="rotate(-90 18 18)" />
      </svg>
      <span className="num-display text-[14px] font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

function ExpandedPanel({ api }: { api: ApiRecord }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      {DIMENSIONS.map((d) => {
        const rec = api.dimensions[d]
        return (
          <div key={d} className="rounded-lg border border-line-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-line-800">{DIMENSION_LABEL[d]}</span>
                <StatusChip status={rec.status} short />
              </div>
              {rec.case_total > 0 && <span className="tabular text-[10px] text-line-600">{rec.case_total} cases</span>}
            </div>
            {rec.case_total > 0 && (
              <div className="mb-2 flex h-1.5 overflow-hidden rounded-full bg-line-200">
                <div className="h-full" style={{ width: `${(rec.case_stat.pass / rec.case_total) * 100}%`, background: '#61B230' }} />
                {rec.case_stat.fail > 0 && <div className="h-full" style={{ width: `${(rec.case_stat.fail / rec.case_total) * 100}%`, background: '#D53C44' }} />}
                {rec.case_stat.error > 0 && <div className="h-full" style={{ width: `${(rec.case_stat.error / rec.case_total) * 100}%`, background: '#C7000B' }} />}
                {rec.case_stat.skip > 0 && <div className="h-full" style={{ width: `${(rec.case_stat.skip / rec.case_total) * 100}%`, background: '#A6A6A6' }} />}
              </div>
            )}
            {rec.case_total > 0 ? (
              <div className="mb-2 flex gap-2 text-[9px] tabular">
                <span className="text-ok">pass {rec.case_stat.pass}</span>
                <span className="text-brand-500">fail {rec.case_stat.fail}</span>
                <span className="text-brand">err {rec.case_stat.error}</span>
                <span className="text-line-600">skip {rec.case_stat.skip}</span>
              </div>
            ) : (
              <div className="mb-2 text-[10px] text-line-500">无测试数据</div>
            )}
            {rec.reviewed && rec.deviation_note && (
              <div className="mb-2 rounded-md border border-hi-200 bg-hi-50 p-1.5 text-[10px] text-line-900">
                <div className="mb-0.5 text-[9px] uppercase tracking-wider text-hi-600">评审结论</div>
                {rec.deviation_note}
                <div className="mt-0.5 text-[9px] text-line-600">{rec.reviewer} · {rec.reviewed_at?.slice(0, 10)}</div>
              </div>
            )}
            {rec.top_failed_cases && rec.top_failed_cases.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 text-[9px] uppercase tracking-wider text-brand-500">Top 失败用例</div>
                {rec.top_failed_cases.map((c, i) => (
                  <div key={i} className="mb-0.5 rounded border border-brand-300 bg-brand-50 px-1.5 py-1 text-[10px]">
                    <div className="truncate font-mono text-line-900">{c.name}</div>
                    <div className="truncate text-[9px] text-brand-500">{c.message}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line-200 pt-1.5 text-[9px] text-line-600">
              <span>{rec.data_source === 'ci' ? '◉ CI' : rec.data_source === 'manual' ? '◉ 人工' : '◉ 导入'}</span>
              {rec.source_url ? <a href={rec.source_url} target="_blank" rel="noreferrer" className="text-info hover:underline">溯源 ↗</a> : <span className="text-line-400">无链接</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
