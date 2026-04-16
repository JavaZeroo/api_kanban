import { useMemo } from 'react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { MetricCards } from './components/MetricCards'
import { DimensionStatus } from './components/DimensionStatus'
import { ModuleMatrix } from './components/ModuleMatrix'
import { RiskPanel } from './components/RiskPanel'
import { ActivityFeed } from './components/ActivityFeed'
import { FilterProvider, useFilter } from './store'
import { API_RECORDS } from './mock/data'
import { applyFilter } from './utils'

function DashboardContent() {
  const { filter } = useFilter()
  const filtered = useMemo(() => applyFilter(API_RECORDS, filter), [filter])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1600px] px-6 pb-16 pt-2">
        <FilterBar />

        <MetricCards list={filtered} />

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 xl:col-span-5">
            <DimensionStatus list={filtered} />
          </div>
          <div className="col-span-12 xl:col-span-7">
            <ModuleMatrix list={filtered} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 xl:col-span-7">
            <RiskPanel list={filtered} />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <ActivityFeed />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[10px] border border-dashed border-line-300 bg-line-50 px-4 py-3">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="section-code">LINK</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#A6A6A6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-line-600">
              需要查看完整 API 列表与逐条详情？请前往 API 明细页
            </span>
          </div>
          <button className="btn-ghost" disabled>
            API DETAIL
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <footer className="mt-10 flex items-center justify-between border-t border-line-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="section-code">EOF</span>
            <span className="text-[10px] text-line-600">
              NPU PyTorch API 一致性看护看板 · 前端原型 v0.3 · HarmonyOS Sans
            </span>
          </div>
          <div className="hud-label text-[8.5px]">
            FRONTEND ONLY · BACKEND TBD · 看板专注可视化
          </div>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  )
}
