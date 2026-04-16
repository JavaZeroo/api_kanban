import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { API_RECORDS } from '../mock/data'
import { allLevels, allModules } from '../utils'
import { useFilter } from '../store'
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type AlignStatus,
  type DataSource,
  type Dimension,
} from '../types'

const SOURCES: DataSource[] = ['ci', 'manual', 'import']
const SOURCE_LABEL: Record<DataSource, string> = {
  ci: 'CI',
  manual: '人工',
  import: '导入',
}

export function FilterBar() {
  const modules = allModules(API_RECORDS)
  const levels = allLevels(API_RECORDS)
  const {
    filter,
    update,
    reset,
    toggleModule,
    toggleLevel,
    toggleDimension,
    toggleStatus,
    toggleSource,
  } = useFilter()

  return (
    <div className="glass-card relative mt-4 px-4 py-3">
      <span className="hud-label absolute -top-[7px] left-4 bg-line-50 px-1.5">
        FILTER · S.00
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="#A6A6A6" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="#A6A6A6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={filter.keyword}
            onChange={(e) => update({ keyword: e.target.value })}
            placeholder="搜索 API 名称，如 Tensor.to / F.conv2d"
            className="h-8 w-[260px] rounded-md border border-line-300 bg-white pl-7 pr-3 text-[12px] text-line-900 placeholder:text-line-500 focus:border-brand/60 focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

        <MultiSelect label="模块" options={modules} selected={filter.modules} onToggle={toggleModule} />
        <MultiSelect label="Level" options={levels} selected={filter.levels} onToggle={toggleLevel} />
        <MultiSelect label="维度" options={DIMENSIONS} selected={filter.dimensions} onToggle={(v) => toggleDimension(v as Dimension)} renderLabel={(v) => DIMENSION_LABEL[v as Dimension]} />
        <MultiSelect label="状态" options={STATUS_ORDER} selected={filter.statuses} onToggle={(v) => toggleStatus(v as AlignStatus)} renderLabel={(v) => STATUS_LABEL[v as AlignStatus]} />
        <MultiSelect label="来源" options={SOURCES} selected={filter.sources} onToggle={(v) => toggleSource(v as DataSource)} renderLabel={(v) => SOURCE_LABEL[v as DataSource]} />

        <div className="divider-v" />
        <Switch label="只看风险" active={filter.onlyRisk} onClick={() => update({ onlyRisk: !filter.onlyRisk })} accent="#C7000B" />
        <Switch label="最近变更" active={filter.onlyRecent} onClick={() => update({ onlyRecent: !filter.onlyRecent })} accent="#115CAA" />

        <div className="ml-auto">
          <button onClick={reset} className="text-[11px] text-line-600 transition hover:text-line-900">
            重置筛选
          </button>
        </div>
      </div>
    </div>
  )
}

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  renderLabel?: (v: string) => string
}

function MultiSelect({ label, options, selected, onToggle, renderLabel }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition',
          selected.length
            ? 'border-brand/50 bg-brand-50 text-brand'
            : 'border-line-300 bg-white text-line-800 hover:border-line-400',
        )}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="rounded-sm bg-brand/10 px-1 text-[10px] tabular text-brand">
            {selected.length}
          </span>
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[160px] rounded-lg border border-line-300 bg-white p-1 shadow-card-hover">
          {options.map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={clsx(
                  'flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[12px] transition',
                  active ? 'bg-brand-50 text-brand' : 'text-line-800 hover:bg-line-100',
                )}
              >
                <span>{renderLabel ? renderLabel(opt) : opt}</span>
                {active && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SwitchProps {
  label: string
  active: boolean
  onClick: () => void
  accent: string
}

function Switch({ label, active, onClick, accent }: SwitchProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex h-8 items-center gap-2 rounded-md border px-2.5 text-[12px] transition',
        active
          ? 'border-line-300 bg-white text-line-900'
          : 'border-line-300 bg-white text-line-600 hover:border-line-400',
      )}
      style={active ? { boxShadow: `inset 0 0 0 1px ${accent}40` } : undefined}
    >
      <span
        className="relative inline-flex h-3.5 w-6 rounded-full transition"
        style={{ background: active ? accent : '#D9D9D9' }}
      >
        <span
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition"
          style={{ left: active ? 14 : 2 }}
        />
      </span>
      {label}
    </button>
  )
}
