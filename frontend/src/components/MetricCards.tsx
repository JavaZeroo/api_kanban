import { useMemo } from 'react'
import type { ApiRecord } from '../types'
import { DIMENSIONS, DIMENSION_LABEL, STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '../types'
import {
  coverageRate,
  countHighRisk,
  dimensionHealthScore,
  distOfDimension,
  freshness24hRate,
  globalHealthScore,
  noSourceUrlCount,
  stale7dCount,
} from '../utils'
import { Gauge } from './ui/Gauge'

interface Props {
  list: ApiRecord[]
}

export function MetricCards({ list }: Props) {
  const m = useMemo(() => {
    const total = list.length
    const tested = list.filter((a) =>
      DIMENSIONS.some((d) => a.dimensions[d].status !== 'untested'),
    ).length
    const score = globalHealthScore(list)
    const dimScore: Record<string, number> = {}
    const dimCov: Record<string, number> = {}
    for (const d of DIMENSIONS) {
      dimScore[d] = dimensionHealthScore(list, d)
      dimCov[d] = coverageRate(distOfDimension(list, d))
    }
    const agg: Record<string, number> = { aligned: 0, reviewed: 0, pending: 0, unsupported: 0, untested: 0 }
    for (const api of list) {
      for (const d of DIMENSIONS) agg[api.dimensions[d].status]++
    }
    return {
      total,
      tested,
      untested: total - tested,
      score,
      scoreDelta: 3,
      dimScore,
      dimCov,
      agg,
      aggTotal: total * DIMENSIONS.length,
      highRisk: countHighRisk(list),
      newHighRisk: 8,
      regress: 3,
      fresh24h: freshness24hRate(list),
      stale7d: stale7dCount(list),
      noSourceUrl: noSourceUrlCount(list),
    }
  }, [list])

  return (
    <div className="mt-4 grid grid-cols-12 gap-3">
      {/* Alignment Score */}
      <Card className="col-span-12 md:col-span-4 xl:col-span-3" id="M.01" hud>
        <div className="hud-label mb-1">ALIGNMENT · SCORE</div>
        <div className="flex h-[132px] items-center gap-3">
          <Gauge value={m.score} size={128} thickness={10} label="SCORE" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="hud-label text-[8px]">DELTA / PREV</div>
            <div className="flex items-baseline gap-1">
              <span className="num-display text-[20px] font-semibold text-ok">+{m.scoreDelta}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="mb-1">
                <path d="M5 14l7-7 7 7" stroke="#61B230" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-1 h-px bg-line-200" />
            <StatRow label="TOTAL" value={m.total} />
            <StatRow label="TESTED" value={m.tested} valueClass="text-ok" />
            <StatRow label="UNTESTED" value={m.untested} valueClass="text-line-600" />
          </div>
        </div>
      </Card>

      {/* 四维覆盖率 */}
      <Card className="col-span-12 md:col-span-8 xl:col-span-4" id="M.02">
        <div className="mb-2 flex items-center justify-between">
          <div className="hud-label">DIMENSION · COVERAGE</div>
          <div className="text-[10px] text-line-600">非未测试 / 全量</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DIMENSIONS.map((d) => {
            const cov = m.dimCov[d]
            const sc = m.dimScore[d]
            const cls = sc >= 80 ? '#61B230' : sc >= 60 ? '#FCC800' : '#D53C44'
            return (
              <div key={d} className="group rounded-[7px] border border-line-200 bg-line-50 p-2.5 transition hover:border-line-400 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-line-800">{DIMENSION_LABEL[d]}</span>
                  <span className="num-display text-[10px]" style={{ color: cls }}>{sc}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="num-display text-[26px] font-semibold leading-none text-line-950">{Math.round(cov * 100)}</span>
                  <span className="text-[11px] text-line-600">%</span>
                </div>
                <div className="mt-2 h-[3px] overflow-hidden rounded-sm bg-line-200">
                  <div className="h-full" style={{ width: `${cov * 100}%`, background: 'linear-gradient(90deg, #115CAA 0%, #61B230 100%)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 状态分布 */}
      <Card className="col-span-12 md:col-span-6 xl:col-span-3" id="M.03">
        <div className="mb-2 flex items-center justify-between">
          <div className="hud-label">STATUS · DISTRIBUTION</div>
          <div className="num-display text-[10px] text-line-600">{m.aggTotal} REC</div>
        </div>
        <div className="mt-1 space-y-[7px]">
          {STATUS_ORDER.map((s) => {
            const v = m.agg[s]
            const pct = m.aggTotal ? (v / m.aggTotal) * 100 : 0
            return (
              <div key={s} className="flex items-center gap-2 text-[11px]">
                <span className="inline-block h-2 w-2 rounded-[1px]" style={{ background: STATUS_COLOR[s] }} />
                <span className="w-[64px] text-line-700">{STATUS_LABEL[s]}</span>
                <div className="flex-1">
                  <div className="relative h-[5px] overflow-hidden rounded-sm bg-line-200">
                    <div className="h-full" style={{ width: `${pct}%`, background: STATUS_COLOR[s] }} />
                  </div>
                </div>
                <span className="num-display w-[30px] text-right text-line-900">{v}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 高风险 */}
      <Card className="col-span-6 md:col-span-3 xl:col-span-2" id="M.04" accent="#C7000B">
        <div className="hud-label flex items-center gap-1.5 text-brand">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand">
            <span className="pulse-dot absolute inset-0 rounded-full bg-brand" />
          </span>
          HIGH · RISK
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="num-display text-[36px] font-bold leading-none text-brand">{m.highRisk}</span>
          <span className="text-[11px] text-line-600">/ {m.total}</span>
        </div>
        <div className="mt-2.5 space-y-[3px] text-[10px]">
          <DetailLine label="NEW" value={`+${m.newHighRisk}`} valueClass="text-brand-500" />
          <DetailLine label="REGRESS" value={m.regress} valueClass="text-brand-400" />
        </div>
      </Card>

      {/* 数据新鲜度 */}
      <Card className="col-span-6 md:col-span-3 xl:col-span-2" id="M.05">
        <div className="hud-label">FRESHNESS · 24H</div>
        <div className="mt-2.5 flex items-baseline gap-0.5">
          <span className="num-display text-[36px] font-bold leading-none text-info">{Math.round(m.fresh24h * 100)}</span>
          <span className="text-[14px] text-line-600">%</span>
        </div>
        <div className="text-[10px] text-line-600">24h 内更新占比</div>
        <div className="mt-2 space-y-[3px] text-[10px]">
          <DetailLine label="STALE 7D" value={m.stale7d} />
          <DetailLine label="NO SRC URL" value={m.noSourceUrl} valueClass="text-hi-600" />
        </div>
      </Card>
    </div>
  )
}

function StatRow({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="hud-label text-[8.5px]">{label}</span>
      <span className={`num-display text-line-900 ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

function DetailLine({ label, value, valueClass }: { label: string; value: number | string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="hud-label text-[8.5px]">{label}</span>
      <span className={`num-display text-line-800 ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

function Card({ children, className, accent, id, hud }: {
  children: React.ReactNode; className?: string; accent?: string; id?: string; hud?: boolean
}) {
  return (
    <div
      className={`glass-card glass-card-hover ${hud ? 'hud-corners' : ''} px-3.5 py-3 ${className ?? ''}`}
      style={accent ? { background: `linear-gradient(180deg, ${accent}0A 0%, #FFFFFF 100%)`, borderColor: `${accent}25` } : undefined}
    >
      {id && <span className="panel-id">{id}</span>}
      {children}
    </div>
  )
}
