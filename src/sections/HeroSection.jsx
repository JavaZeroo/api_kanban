import { useMemo } from 'react';
import { APIS, REPOS, TREND_30D, DIMENSIONS, overallAlignment, weightedAlignment } from '../data';
import { HeroGauge } from '../charts';

function buildStats(list) {
  const stats = { total: list.length, aligned: 0, fixing: 0, untested: 0 };

  list.forEach(api => {
    const dims = DIMENSIONS.map(d => api.dims[d.key]);
    if (dims.every(v => v === 'untested' || v === 'unsupported')) stats.untested++;
    else if (dims.some(v => v === 'fixing')) stats.fixing++;
    else if (dims.every(v => v === 'aligned' || v === 'reviewed')) stats.aligned++;
    else stats.untested++;
  });

  return stats;
}

export default function HeroSection({ filtered = [] }) {
  const ov = useMemo(() => overallAlignment(filtered), [filtered]);
  const wv = useMemo(() => weightedAlignment(filtered), [filtered]);

  const totalCases = filtered.reduce((s, a) => s + a.caseTotal, 0);
  const l0         = filtered.filter(a => a.level === 'L0');
  const l01        = filtered.filter(a => a.level === 'L0' || a.level === 'L1');
  const change30d  = (wv.rate - TREND_30D[0].weighted) * 100;

  const l0Stats   = buildStats(l0);
  const l01Stats  = buildStats(l01);
  const allStats  = buildStats(filtered);

  const l01Covered = l01.filter(a => DIMENSIONS.every(d => a.dims[d.key] !== 'untested'));
  const l01Aligned = l01.filter(a => DIMENSIONS.every(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed'));

  return (
    <section className="hero-solo">
      <div className="hero-solo-grid">
        <div className="hero-main">
          <div className="hero-eyebrow">
            <span className="tag npu">torch_npu</span>
            <span className="mono dim">昇腾 910B · CANN 9.0.0 · torch 2.7.0</span>
          </div>
          <h1 className="hero-h1">PyTorch on NPU · API 一致性总览</h1>
          <p className="hero-lede">
            全量 <b>{APIS.length}</b> API · <b>{totalCases.toLocaleString()}</b> 用例 · 每日自动回归 · 覆盖 <b>{REPOS.length}</b> 个主流开源仓库
          </p>
          <div className="hero-gauge-legend">
            <div className="hero-gauge-legend-row">
              <span><span className="sw" style={{ background: 'var(--npu)' }} />加权</span>
              <b>{(wv.rate * 100).toFixed(1)}%</b>
            </div>
            <div className="hero-gauge-legend-row">
              <span><span className="sw" style={{ background: 'var(--fg-3)', border: '1px dashed var(--fg-3)' }} />平均</span>
              <b>{(ov.rate * 100).toFixed(1)}%</b>
            </div>
            <div className="hero-gauge-legend-row">
              <span><span className="sw" style={{ background: 'var(--s-aligned)' }} />30d</span>
              <b style={{ color: change30d >= 0 ? 'var(--s-aligned)' : 'var(--s-fixing)' }}>{change30d >= 0 ? '+' : ''}{change30d.toFixed(1)}pp</b>
            </div>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-gauge-row">
            <HeroGauge stats={l0Stats} label="L0" />
            <HeroGauge stats={l01Stats} label="L0+L1" />
            <HeroGauge stats={allStats} label="全量" />
          </div>
        </div>
        <div className="hero-action-grid">
          <div className="hero-action-card">
            <span>所有 API 总数</span>
            <b>{APIS.length.toLocaleString()}</b>
            <em>全量</em>
          </div>
          <div className="hero-action-card">
            <span>L0+L1 API 总数</span>
            <b>{l01.length.toLocaleString()}</b>
            <em>{APIS.length ? (l01.length / APIS.length * 100).toFixed(1) : '0.0'}% / 全量</em>
          </div>
          <div className="hero-action-card">
            <span>L0+L1 已覆盖 API</span>
            <b>{l01Covered.length.toLocaleString()}</b>
            <em>{l01.length ? (l01Covered.length / l01.length * 100).toFixed(1) : '0.0'}% / L0+L1</em>
          </div>
          <div className="hero-action-card">
            <span>L0+L1 一致性对齐 API</span>
            <b>{l01Aligned.length.toLocaleString()}</b>
            <em>{l01.length ? (l01Aligned.length / l01.length * 100).toFixed(1) : '0.0'}% / L0+L1</em>
          </div>
        </div>
      </div>
    </section>
  );
}
