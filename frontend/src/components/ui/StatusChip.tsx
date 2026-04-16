import clsx from 'clsx'
import type { AlignStatus } from '../../types'
import { STATUS_COLOR, STATUS_LABEL, STATUS_SHORT } from '../../types'

interface Props {
  status: AlignStatus
  short?: boolean
  size?: 'xs' | 'sm'
  solid?: boolean
  className?: string
}

export function StatusChip({ status, short, size = 'xs', solid, className }: Props) {
  const color = STATUS_COLOR[status]
  const label = short ? STATUS_SHORT[status] : STATUS_LABEL[status]
  if (solid) {
    return (
      <span
        className={clsx('chip font-semibold', size === 'xs' ? 'text-[10px]' : 'text-[11px]', className)}
        style={{ background: color, color: '#fff' }}
      >
        {label}
      </span>
    )
  }
  return (
    <span
      className={clsx('chip', size === 'xs' ? 'text-[10px]' : 'text-[11px]', className)}
      style={{
        background: `${color}15`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}40`,
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
