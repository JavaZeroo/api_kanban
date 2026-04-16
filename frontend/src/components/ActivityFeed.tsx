import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ACTIVITY_EVENTS } from '../mock/data'
import { formatRelative, sortedActivities } from '../utils'
import { STATUS_COLOR, STATUS_LABEL } from '../types'
import type { ActivityEvent, ActivityType, DataSource } from '../types'
import { DIMENSION_LABEL } from '../types'
import { SectionHeader } from './ui/SectionHeader'

const SOURCE_LABEL: Record<DataSource, string> = { ci: 'CI', manual: '人工', import: '导入' }
const SOURCE_COLOR: Record<DataSource, string> = { ci: '#115CAA', manual: '#8C8C8C', import: '#A6A6A6' }
const TYPE_META: Record<ActivityType, { label: string; color: string; icon: string }> = {
  regression: { label: '回归', color: '#C7000B', icon: '↓' },
  status_changed: { label: '状态变更', color: '#FCC800', icon: '⇄' },
  ci_reported: { label: 'CI 上报', color: '#115CAA', icon: '▲' },
  case_added: { label: '新增用例', color: '#8C8C8C', icon: '+' },
  reviewed: { label: '评审完成', color: '#FCC800', icon: '✓' },
  fixed: { label: '修复完成', color: '#61B230', icon: '↑' },
}

export function ActivityFeed() {
  const events = useMemo(() => sortedActivities(ACTIVITY_EVENTS), [])
  const [srcFilter, setSrcFilter] = useState<DataSource | 'all'>('all')
  const list = events.filter((e) => srcFilter === 'all' || e.data_source === srcFilter)

  return (
    <div className="glass-card relative h-full p-4">
      <span className="panel-id">S.06</span>
      <SectionHeader
        code="S.06"
        title="最近变更流"
        subtitle="时间倒序 · 回归高警示 / 修复正向"
        right={
          <div className="flex gap-1 rounded-[5px] border border-line-300 bg-white p-0.5 text-[9.5px]">
            {(['all', 'ci', 'manual', 'import'] as const).map((k) => (
              <button key={k} onClick={() => setSrcFilter(k)} className={clsx('rounded-[3px] px-2 py-0.5 transition', srcFilter === k ? 'bg-brand-50 text-brand' : 'text-line-600 hover:text-line-900')}>
                {k === 'all' ? '全部' : SOURCE_LABEL[k]}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-line-300 via-line-200 to-transparent" />
        <div className="space-y-2.5">
          {list.map((e) => <FeedRow key={e.event_id} e={e} />)}
          {list.length === 0 && <div className="py-8 text-center text-[11px] text-line-600">暂无事件</div>}
        </div>
      </div>
    </div>
  )
}

function FeedRow({ e }: { e: ActivityEvent }) {
  const meta = TYPE_META[e.event_type]
  const isNeg = e.event_type === 'regression'
  const isPos = e.event_type === 'fixed'
  return (
    <div className={clsx(
      'relative flex gap-3 rounded-md border px-2.5 py-2 pl-5 transition',
      isNeg ? 'border-brand-300 bg-brand-50' : isPos ? 'border-ok-200 bg-ok-50' : 'border-transparent bg-line-50 hover:border-line-300 hover:bg-white hover:shadow-card',
    )}>
      <span className="absolute left-[3px] top-3 flex h-2.5 w-2.5 items-center justify-center rounded-full ring-4 ring-white" style={{ background: meta.color }}>
        <span className="text-[8px] font-bold text-white">{meta.icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-mono text-line-950">{e.api_name}</span>
          <span className="text-line-400">·</span>
          <span className="text-line-700">{DIMENSION_LABEL[e.dimension]}</span>
          <span className="chip text-[9px]" style={{ background: `${meta.color}12`, color: meta.color, boxShadow: `inset 0 0 0 1px ${meta.color}30` }}>
            {meta.label}
          </span>
        </div>
        {(e.from_status || e.to_status) && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            {e.from_status && <span className="chip" style={{ background: `${STATUS_COLOR[e.from_status]}15`, color: STATUS_COLOR[e.from_status] }}>{STATUS_LABEL[e.from_status]}</span>}
            {e.from_status && e.to_status && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5 5 5-5 5" stroke={meta.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            {e.to_status && <span className="chip" style={{ background: `${STATUS_COLOR[e.to_status]}18`, color: STATUS_COLOR[e.to_status], boxShadow: `inset 0 0 0 1px ${STATUS_COLOR[e.to_status]}40` }}>{STATUS_LABEL[e.to_status]}</span>}
            {e.comment && <span className="truncate text-line-600">· {e.comment}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 text-[10px]">
        <span className="chip text-[9px]" style={{ background: `${SOURCE_COLOR[e.data_source]}12`, color: SOURCE_COLOR[e.data_source] }}>
          {SOURCE_LABEL[e.data_source]}
        </span>
        <span className="tabular text-line-600">{formatRelative(e.event_time)}</span>
        <span className="text-line-500">{e.updated_by}</span>
      </div>
    </div>
  )
}
