import clsx from 'clsx'
import type { StatusDistribution } from '../../utils'
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '../../types'

interface Props {
  dist: StatusDistribution
  height?: number
  showLabels?: boolean
  rounded?: boolean
  className?: string
}

export function StackedBar({ dist, height = 8, showLabels = false, rounded = true, className }: Props) {
  const total = dist.total || 1
  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('relative flex overflow-hidden', rounded && 'rounded-full')} style={{ height, background: '#F0F0F0' }}>
        {STATUS_ORDER.map((s) => {
          const v = dist[s]
          if (!v) return null
          return <div key={s} style={{ width: `${(v / total) * 100}%`, background: STATUS_COLOR[s] }} title={`${STATUS_LABEL[s]} · ${v} (${((v / total) * 100).toFixed(0)}%)`} />
        })}
      </div>
      {showLabels && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-line-700">
          {STATUS_ORDER.map((s) =>
            dist[s] ? (
              <span key={s} className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]} {dist[s]}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
