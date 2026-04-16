import type { ReactNode } from 'react'

interface Props {
  code: string
  title: string
  subtitle?: string
  right?: ReactNode
  className?: string
}

export function SectionHeader({ code, title, subtitle, right, className }: Props) {
  return (
    <div className={`mb-3 flex items-start justify-between gap-4 ${className ?? ''}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="section-code">{code}</span>
          <span className="inline-block h-3 w-[2px] rounded-sm bg-brand" />
          <h2 className="text-[13px] font-medium tracking-[0.01em] text-line-950">{title}</h2>
        </div>
        {subtitle && (
          <div className="mt-1 pl-[52px] text-[11px] leading-snug text-line-600">{subtitle}</div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
