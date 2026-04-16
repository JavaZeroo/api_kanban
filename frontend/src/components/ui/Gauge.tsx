import { scoreColor } from '../../utils'

interface Props {
  value: number
  max?: number
  size?: number
  thickness?: number
  label?: string
}

export function Gauge({ value, max = 100, size = 120, thickness = 10, label }: Props) {
  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const startAngle = -220
  const endAngle = 40
  const totalArc = endAngle - startAngle
  const pct = Math.max(0, Math.min(1, value / max))
  const progressAngle = startAngle + totalArc * pct
  const color = scoreColor(value)

  const polarToXY = (angle: number) => {
    const a = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
  }

  const arcPath = (a1: number, a2: number) => {
    const p1 = polarToXY(a1)
    const p2 = polarToXY(a2)
    const large = a2 - a1 > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#E5E5E5" strokeWidth={thickness} strokeLinecap="round" />
        <path d={arcPath(startAngle, progressAngle)} fill="none" stroke="url(#gauge-grad)" strokeWidth={thickness} strokeLinecap="round" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = startAngle + totalArc * t
          const p = polarToXY(a)
          const rad = (a * Math.PI) / 180
          const inner = {
            x: cx + (radius - thickness * 0.8) * Math.cos(rad),
            y: cy + (radius - thickness * 0.8) * Math.sin(rad),
          }
          return <line key={t} x1={inner.x} y1={inner.y} x2={p.x} y2={p.y} stroke="#D9D9D9" strokeWidth={1} />
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
        <div className="num-display text-[32px] font-semibold leading-none" style={{ color }}>{Math.round(value)}</div>
        {label && <div className="mt-1 hud-label text-[9px]">{label}</div>}
      </div>
    </div>
  )
}
