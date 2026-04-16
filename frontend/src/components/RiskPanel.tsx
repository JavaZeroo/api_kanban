import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ApiRecord } from '../types'
import { DIMENSIONS, DIMENSION_LABEL } from '../types'
import { formatRelative, topFixPending, topReviewedDiffs, topUntested } from '../utils'
import { StatusChip } from './ui/StatusChip'
import { SectionHeader } from './ui/SectionHeader'

interface Props {
  list: ApiRecord[]
}

type Tab = 'pending' | 'untested' | 'regress' | 'reviewed'

const TABS: { key: Tab; label: string; accent: string }[] = [
  { key: 'pending', label: '待修复 TOP', accent: '#D53C44' },
  { key: 'untested', label: '未测试 TOP', accent: '#A6A6A6' },
  { key: 'regress', label: '最近回归', accent: '#C7000B' },
  { key: 'reviewed', label: '已评审差异', accent: '#FCC800' },
]

export function RiskPanel({ list }: Props) {
  const [tab, setTab] = useState<Tab>('pending')
  const pending = useMemo(() => topFixPending(list, 6), [list])
  const untested = useMemo(() => topUntested(list, 6), [list])
  const reviewed = useMemo(() => topReviewedDiffs(list, 6), [list])

  return (
    <div className="glass-card relative h-full p-4">
      <span className="panel-id">S.05</span>
      <SectionHeader code="S.05" title="风险焦点" subtitle="按 待修复 / 未测试 / 回归 / 已评审差异 聚焦" />

      <div className="mb-3 flex flex-wrap gap-1 border-b border-line-200">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx('relative px-3 py-1.5 text-[12px] transition', active ? 'text-line-950' : 'text-line-600 hover:text-line-800')}
            >
              {t.label}
              {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: t.accent }} />}
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {tab === 'pending' && pending.map((p, i) => (
          <RiskRow key={`${p.api.api_name}-${p.dim}`} index={i + 1} title={p.api.api_name} subtitle={`${p.api.api_module} · ${DIMENSION_LABEL[p.dim]}`} badgeColor="#D53C44"
            right={<div className="flex items-center gap-2"><StatusChip status="pending" short /><span className="tabular text-[11px] text-brand-500">{p.rec.fail_count} fail</span><span className="tabular text-[10px] text-line-600">{formatRelative(p.api.updated_at)}</span></div>}
          />
        ))}
        {tab === 'untested' && untested.map((api, i) => {
          const ucount = DIMENSIONS.filter((d) => api.dimensions[d].status === 'untested').length
          return (
            <RiskRow key={api.api_name} index={i + 1} title={api.api_name} subtitle={api.api_module} badgeColor="#A6A6A6"
              right={<div className="flex items-center gap-2">
                <span className={clsx('chip text-[10px]', api.api_level === 'L0' ? 'bg-brand-50 text-brand' : 'bg-line-100 text-line-700')}>{api.api_level}</span>
                <span className="text-[11px] text-line-700">未测维度 <span className="tabular text-line-900">{ucount}</span>/4</span>
                <span className="tabular text-[10px] text-line-600">{formatRelative(api.updated_at)}</span>
              </div>}
            />
          )
        })}
        {tab === 'regress' && (
          <div className="space-y-1.5">
            <RegressRow api="F.scaled_dot_product_attention" module="torch.nn.functional" dim="功能" from="完全对齐" to="待修复" at="1 小时前" />
            <RegressRow api="F.gelu" module="torch.nn.functional" dim="精度" from="完全对齐" to="待修复" at="5 小时前" />
            <RegressRow api="Tensor.sort" module="torch.Tensor" dim="确定性" from="完全对齐" to="待修复" at="2 天前" />
          </div>
        )}
        {tab === 'reviewed' && reviewed.map((r, i) => (
          <RiskRow key={`${r.api.api_name}-${r.dim}`} index={i + 1} title={r.api.api_name} subtitle={`${DIMENSION_LABEL[r.dim]} · ${r.rec.deviation_note ?? '无说明'}`} badgeColor="#FCC800"
            right={<div className="flex flex-col items-end gap-0.5"><span className="text-[11px] text-line-900">{r.rec.reviewer}</span><span className="text-[10px] tabular text-line-600">{r.rec.reviewed_at ? formatRelative(r.rec.reviewed_at) : ''}</span></div>}
          />
        ))}
      </div>
    </div>
  )
}

function RiskRow({ index, title, subtitle, badgeColor, right }: { index: number; title: string; subtitle: string; badgeColor: string; right: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 rounded-md border border-transparent bg-line-50 px-2 py-1.5 transition hover:border-line-300 hover:bg-white hover:shadow-card">
      <span className="flex h-5 w-5 items-center justify-center rounded font-mono text-[10px]" style={{ color: badgeColor, background: `${badgeColor}15`, boxShadow: `inset 0 0 0 1px ${badgeColor}35` }}>
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[12px] text-line-900">{title}</div>
        <div className="truncate text-[10px] text-line-600">{subtitle}</div>
      </div>
      {right}
    </div>
  )
}

function RegressRow({ api, module, dim, from, to, at }: { api: string; module: string; dim: string; from: string; to: string; at: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-brand-300 bg-brand-50 px-2 py-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="#C7000B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[12px] text-line-950">{api}</div>
        <div className="truncate text-[10px] text-line-700">{module} · {dim}</div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px]">
        <span className="chip bg-ok-50 text-ok-600">{from}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14m-5-5 5 5-5 5" stroke="#C7000B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="chip bg-brand-50 text-brand">{to}</span>
      </div>
      <span className="text-[10px] tabular text-line-600">{at}</span>
    </div>
  )
}
