import { useMemo } from 'react';
import { APIS, REPOS, TREND_30D, DIMENSIONS, overallAlignment, weightedAlignment } from '../data';
import { HeroGauge } from '../charts';
import { colors } from '../components/EChart';

function buildStats(list) {
  const totalDims     = list.length * DIMENSIONS.length || 1;
  const alignedCount  = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'aligned').length, 0);
  const reviewedCount = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'reviewed').length, 0);
  const fixingCount   = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'fixing').length, 0);
  const untestedCount = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'untested').length, 0);
  return { total: totalDims, aligned: alignedCount, partial: reviewedCount, fixing: fixingCount, untested: untestedCount };
}

export default function HeroSection({ filtered = [] }) {
  const ov = useMemo(() => overallAlignment(filtered), [filtered]);
  const wv = useMemo(() => weightedAlignment(filtered), [filtered]);

  const totalCases = filtered.reduce((s, a) => s + a.caseTotal, 0);
  const passCases  = filtered.reduce((s, a) => s + a.casePass, 0);
  const l0         = filtered.filter(a => a.level === 'L0');
  const l01        = filtered.filter(a => a.level === 'L0' || a.level === 'L1');
  const change30d  = (wv.rate - TREND_30D[0].weighted) * 100;

  const l0Stats   = buildStats(l0);
  const l01Stats  = buildStats(l01);
  const allStats  = buildStats(filtered);

  const l01Covered = l01.filter(a => DIMENSIONS.every(d => a.dims[d.key] !== 'untested'));
  const l01Aligned = l01.filter(a => DIMENSIONS.every(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed'));
  const l0Aligned  = l0.filter(a => DIMENSIONS.every(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed')).length;

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
        <div className="hero-side">
          <div className="hero-gauge-row">
            <HeroGauge rate={l0Stats.aligned / l0Stats.total} rawRate={l0Stats.aligned / l0Stats.total} />
            <HeroGauge rate={l01Stats.aligned / l01Stats.total} rawRate={l01Stats.aligned / l01Stats.total} />
            <HeroGauge rate={wv.rate} rawRate={ov.rate} />
          </div>
          <div className="hero-gauge-legend">
            <span><span className="sw" style={{ background: colors.npu }} />加权 {(wv.rate * 100).toFixed(1)}%</span>
            <span><span className="sw" style={{ background: colors.fg3, border: '1px dashed ' + colors.fg3 }} />平均 {(ov.rate * 100).toFixed(1)}%</span>
            <span><span className="sw" style={{ background: colors.aligned }} />30d {change30d >= 0 ? '+' : ''}{change30d.toFixed(1)}pp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
