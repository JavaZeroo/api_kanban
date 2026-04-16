import { useMemo } from 'react'
import type { ApiRecord } from '../types'
import { DIMENSIONS, DIMENSION_LABEL, STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '../types'
import { coverageRate, distOfDimension } from '../utils'
import { useFilter } from '../store'
import clsx from 'clsx'
import { SectionHeader } from './ui/SectionHeader'

interface Props {
  list: ApiRecord[]
}

export function DimensionStatus({ list }: Props) {
  const rows = useMemo(
    () => DIMENSIONS.map((d) => {
      const dist = distOfDimension(list, d)
      return { dim: d, dist, cov: coverageRate(dist) }
    }),
    [list],
  )
  const { toggleDimension, toggleStatus, filter } = useFilter()

  return (
    <div className="glass-card relative h-full p-4">
      <span className="panel-id">S.03</span>
      <SectionHeader
        code="S.03"
        title="四维态势"
        subtitle="横向堆叠 · 点击维度或状态段进行下钻"
        right={
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9.5px]">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-line-700">
                <span className="h-1.5 w-1.5 rounded-[1px]" style={{ background: STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        }
      />

      <div className="space-y-3">
        {rows.map(({ dim, dist, cov }) => {
          const total = dist.total || 1
          const active = filter.dimensions.includes(dim)
          return (
            <div key={dim} className="group">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => toggleDimension(dim)}
                  className={clsx(
                    'flex items-center gap-2 font-medium transition',
                    active ? 'text-brand' : 'text-line-800 hover:text-line-950',
                  )}
                >
                  <span className="inline-block h-1 w-1 rounded-full" style={{ background: active ? '#C7000B' : '#D9D9D9' }} />
                  {DIMENSION_LABEL[dim]}
                </button>
                <div className="flex items-center gap-3">
                  <span className="hud-label text-[8.5px]">COV</span>
                  <span className="num-display text-[12px] font-semibold text-line-900">{Math.round(cov * 100)}%</span>
                  <span className="num-display text-[10px] text-line-600">{dist.total} APIS</span>
                </div>
              </div>
              <div className="flex h-7 overflow-hidden rounded-md bg-line-200">
                {STATUS_ORDER.map((s) => {
                  const v = dist[s]
                  if (!v) return null
                  const pct = (v / total) * 100
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className="group/seg relative transition hover:brightness-110"
                      style={{ width: `${pct}%`, background: STATUS_COLOR[s] }}
                      title={`${DIMENSION_LABEL[dim]} · ${STATUS_LABEL[s]}：${v} 个 (${pct.toFixed(0)}%)`}
                    >
                      {pct > 12 && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            color: s === 'reviewed' ? '#333' : '#fff',
                            textShadow: s === 'reviewed' ? 'none' : '0 1px 2px rgba(0,0,0,0.2)',
                          }}
                        >
                          {v}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
