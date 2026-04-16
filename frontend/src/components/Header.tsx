import { SNAPSHOT } from '../mock/data'
import { formatDateTime } from '../utils'

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line-300 bg-white/90 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand via-brand-500 to-brand-400" />
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3.5">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-brand/40" />
            <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-brand/40" />
            <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-brand/40" />
            <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-brand/40" />
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-brand-50">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path
                  d="M8 22 L8 10 L13 22 L13 10 M17 10 L23 10 M20 10 L20 22 M25 10 L25 22"
                  stroke="#C7000B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="absolute -right-1.5 -top-1.5 h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_8px_rgba(97,178,48,0.7)]">
              <span className="pulse-dot absolute inset-0 rounded-full bg-ok" />
            </div>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="hud-label text-brand">NPU · ALIGN · WATCH</span>
              <span className="rounded-[3px] border border-line-300 bg-line-50 px-1.5 py-[1px] font-mono text-[9px] tracking-wider text-line-700">
                v0.3
              </span>
            </div>
            <h1 className="mt-0.5 text-[15px] font-medium tracking-[0.005em] text-line-950">
              NPU PyTorch API 一致性看护看板
              <span className="ml-2 text-[11px] font-normal text-line-600">
                torch_npu × CUDA · 功能 / 精度 / 内存 / 确定性
              </span>
            </h1>
          </div>
        </div>

        {/* Right: metadata + actions */}
        <div className="flex items-center gap-3 text-[11px]">
          <MetaBlock label="UPDATED">
            <span className="num-display text-line-800">
              {formatDateTime(SNAPSHOT.data_updated_at)}
            </span>
          </MetaBlock>
          <div className="divider-v" />
          <MetaBlock label="SNAPSHOT">
            <span className="num-display text-brand">
              {SNAPSHOT.snapshot_label}
            </span>
          </MetaBlock>
          <div className="divider-v" />

          <button className="btn-ghost" disabled title="即将上线">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 3v18M15 3v18M3 9h18M3 15h18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            DIFF
          </button>
          <button className="btn-ghost">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            EXPORT
          </button>
        </div>
      </div>
    </header>
  )
}

function MetaBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="hud-label mb-1 text-[8.5px]">{label}</span>
      {children}
    </div>
  )
}
