import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ApiRecord } from '../types'
import { DIMENSIONS, DIMENSION_LABEL, STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '../types'
import { buildMatrix, scoreColor } from '../utils'
import { useFilter } from '../store'
import type { Dimension } from '../types'
import { SectionHeader } from './ui/SectionHeader'

interface Props {
  list: ApiRecord[]
}

export function ModuleMatrix({ list }: Props) {
  const cells = useMemo(() => buildMatrix(list), [list])
  const modules = useMemo(() => Array.from(new Set(cells.map((c) => c.module))), [cells])

  const modScore = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of modules) {
      const cs = cells.filter((c) => c.module === m)
      map.set(m, cs.reduce((a, b) => a + b.score, 0) / cs.length)
    }
    return map
  }, [modules, cells])

  const [sortBy, setSortBy] = useState<'score' | 'alpha'>('score')
  const sortedModules = useMemo(() => {
    if (sortBy === 'alpha') return [...modules].sort()
    return [...modules].sort((a, b) => (modScore.get(a) ?? 0) - (modScore.get(b) ?? 0))
  }, [modules, sortBy, modScore])

  const { update, filter } = useFilter()

  return (
    <div className="glass-card relative h-full p-4">
      <span className="panel-id">S.04</span>
      <SectionHeader
        code="S.04"
        title="模块 × 维度健康矩阵"
        subtitle="每格：健康分 + 迷你堆叠条 + 风险数角标 · 点击下钻"
        right={
          <div className="flex gap-1 rounded-[5px] border border-line-300 bg-white p-0.5 text-[9.5px]">
            <button onClick={() => setSortBy('score')} className={clsx('rounded-[3px] px-2 py-0.5 transition', sortBy === 'score' ? 'bg-brand-50 text-brand' : 'text-line-600 hover:text-line-900')}>
              按分数
            </button>
            <button onClick={() => setSortBy('alpha')} className={clsx('rounded-[3px] px-2 py-0.5 transition', sortBy === 'alpha' ? 'bg-brand-50 text-brand' : 'text-line-600 hover:text-line-900')}>
              字母序
            </button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-[8px] border border-line-300">
        <table className="w-full">
          <thead>
            <tr className="hud-label">
              <th className="bg-line-50 px-3 py-2 text-left font-normal">MODULE</th>
              {DIMENSIONS.map((d) => (
                <th key={d} className="bg-line-50 px-3 py-2 text-center font-normal">{DIMENSION_LABEL[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedModules.map((module) => {
              const row = cells.filter((c) => c.module === module)
              const moduleActive = filter.modules.includes(module)
              return (
                <tr key={module} className="border-t border-line-200 text-[12px] transition hover:bg-line-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={clsx('inline-block h-1 w-1 rounded-full transition', moduleActive ? 'bg-brand' : 'bg-line-400')} />
                      <span className="num-display text-[11px] text-line-800">{module}</span>
                    </div>
                  </td>
                  {DIMENSIONS.map((dim) => {
                    const cell = row.find((c) => c.dimension === dim)!
                    return (
                      <td key={dim} className="border-l border-line-200 px-2 py-2">
                        <MatrixCell score={cell.score} dist={cell.dist} highRisk={cell.high_risk_count} onClick={() => update({ modules: [module], dimensions: [dim] })} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MatrixCell({ score, dist, highRisk, onClick }: {
  score: number; dist: import('../utils').StatusDistribution; highRisk: number; onClick: () => void
}) {
  const color = scoreColor(score)
  const total = dist.total || 1
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col items-start gap-1 rounded-[5px] border border-line-200 bg-white p-1.5 text-left transition hover:-translate-y-0.5 hover:border-line-400 hover:shadow-card"
      style={{ boxShadow: `inset 2px 0 0 0 ${color}` }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="num-display text-[20px] font-semibold leading-none" style={{ color }}>{score}</span>
          <span className="num-display text-[9px] text-line-500">/100</span>
        </div>
        {highRisk > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold" style={{ background: '#C7000B12', color: '#C7000B', boxShadow: 'inset 0 0 0 1px #C7000B40' }} title={`${highRisk} 个高风险 API`}>
            ⚠ {highRisk}
          </span>
        )}
      </div>
      <div className="flex h-1 w-full overflow-hidden rounded-sm bg-line-200">
        {STATUS_ORDER.map((s) => {
          const v = dist[s]
          if (!v) return null
          return <span key={s} title={`${STATUS_LABEL[s]} ${v}`} style={{ width: `${(v / total) * 100}%`, background: STATUS_COLOR[s] }} />
        })}
      </div>
      <div className="num-display text-[9px] text-line-600">
        {dist.total} · <span className="text-ok">{dist.aligned}</span> / <span className="text-brand-500">{dist.pending + dist.unsupported}</span> / <span className="text-line-500">{dist.untested}</span>
      </div>
    </button>
  )
}
