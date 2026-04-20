import { useMemo } from 'react';
import { APIS, REPOS, TREND_30D, DIMENSIONS, STATUS_META, overallAlignment, weightedAlignment } from '../data';
import { HeroGauge } from '../charts';

function buildStats(list) {
  const totalDims     = list.length * DIMENSIONS.length || 1;
  const alignedCount  = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'aligned').length, 0);
  const reviewedCount = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'reviewed').length, 0);
  const fixingCount   = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'fixing').length, 0);
  const untestedCount = list.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'untested').length, 0);
  return { total: totalDims, aligned: alignedCount, partial: reviewedCount, fixing: fixingCount, untested: untestedCount };
}

const STATUS_RISK = { fixing: 5, unsupported: 5, untested: 2, reviewed: 0.5, aligned: 0 };
const LEVEL_WEIGHT = { L0: 6, L1: 3, L2: 1 };

function formatFreq(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}k`;
  return `${value}`;
}

export default function HeroSection({ filtered = [], onFocus }) {
  const ov = useMemo(() => overallAlignment(filtered), [filtered]);
  const wv = useMemo(() => weightedAlignment(filtered), [filtered]);

  const totalCases = filtered.reduce((s, a) => s + a.caseTotal, 0);
  const readyApis  = filtered.filter(a => DIMENSIONS.every(d => {
    const status = a.dims[d.key];
    return status === 'aligned' || status === 'reviewed';
  }));
  const l0         = filtered.filter(a => a.level === 'L0');
  const l01        = filtered.filter(a => a.level === 'L0' || a.level === 'L1');
  const change30d  = (wv.rate - TREND_30D[0].weighted) * 100;

  const l0Stats   = buildStats(l0);
  const l01Stats  = buildStats(l01);
  const allStats  = buildStats(filtered);
  const blockedWeight = Math.max(0, wv.total - wv.aligned);

  const topRiskModule = useMemo(() => {
    const byModule = new Map();
    filtered.forEach(api => {
      const riskDims = DIMENSIONS.reduce((sum, d) => {
        const status = api.dims[d.key];
        return sum + (status === 'fixing' || status === 'untested' || status === 'unsupported' ? 1 : 0);
      }, 0);
      if (!riskDims) return;
      const current = byModule.get(api.module) || { module: api.module, riskDims: 0, apis: 0, freq: 0 };
      current.riskDims += riskDims;
      current.apis += 1;
      current.freq += api.freq;
      byModule.set(api.module, current);
    });
    return [...byModule.values()].sort((a, b) => b.freq - a.freq || b.riskDims - a.riskDims)[0];
  }, [filtered]);

  const releaseQueue = useMemo(() => {
    return filtered
      .map(api => {
        const issues = DIMENSIONS
          .map(d => ({ dim: d, status: api.dims[d.key] }))
          .filter(item => item.status !== 'aligned')
          .sort((a, b) => (STATUS_RISK[b.status] || 0) - (STATUS_RISK[a.status] || 0));
        const score = issues.reduce((sum, item) => sum + (STATUS_RISK[item.status] || 0), 0) * (LEVEL_WEIGHT[api.level] || 1) * Math.log10(api.freq + 10);
        return { api, issues, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || b.api.freq - a.api.freq)
      .slice(0, 3);
  }, [filtered]);

  const focusRisk = (api) => {
    if (onFocus) onFocus(api);
  };

  const focusRiskKeyDown = (event, api) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    focusRisk(api);
  };

  return (
    <section className="hero-solo">
      <div className="hero-solo-grid">
        <div className="hero-main">
          <div className="hero-eyebrow">
            <span className="tag npu">torch_npu</span>
            <span className="mono dim">昇腾 910B · CANN 8.1.RC2 · torch 2.7.0</span>
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
          <div className="hero-action-grid">
            <div className="hero-action-card">
              <span>发版可用 API</span>
              <b>{readyApis.length.toLocaleString()}</b>
              <em>{filtered.length ? (readyApis.length / filtered.length * 100).toFixed(1) : '0.0'}% / 当前筛选</em>
            </div>
            <div className="hero-action-card hot">
              <span>待修复维度</span>
              <b>{allStats.fixing.toLocaleString()}</b>
              <em>{blockedWeight.toLocaleString()} weighted calls blocked</em>
            </div>
            <div className="hero-action-card">
              <span>未测试维度</span>
              <b>{allStats.untested.toLocaleString()}</b>
              <em>{allStats.total ? (allStats.untested / allStats.total * 100).toFixed(1) : '0.0'}% coverage gap</em>
            </div>
            <div className="hero-action-card module">
              <span>优先模块</span>
              <b>{topRiskModule?.module || 'clear'}</b>
              <em>{topRiskModule ? `${topRiskModule.apis} APIs · ${topRiskModule.riskDims} risk dims` : 'no active risk in filter'}</em>
            </div>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-gauge-row">
            <HeroGauge stats={l0Stats} label="L0" />
            <HeroGauge stats={l01Stats} label="L0+L1" />
            <HeroGauge stats={allStats} label="全量" />
          </div>
          <div className="hero-risk-panel">
            <div className="hero-risk-head">
              <span>Release risk queue</span>
              <b>{releaseQueue.length ? `${releaseQueue.length} highest impact` : 'clear'}</b>
            </div>
            <div className="hero-risk-list">
              {releaseQueue.map(({ api, issues }, i) => (
                <div
                  className="hero-risk-row"
                  key={api.name}
                  role="button"
                  tabIndex={0}
                  title={`查看 ${api.name} 对齐详情`}
                  onClick={() => focusRisk(api)}
                  onKeyDown={(event) => focusRiskKeyDown(event, api)}
                >
                  <span className="hero-risk-rank">{String(i + 1).padStart(2, '0')}</span>
                  <span className="hero-risk-api">
                    <b>{api.name}</b>
                    <em>{api.module} · {api.level} · {formatFreq(api.freq)} calls</em>
                  </span>
                  <span className="hero-risk-status">
                    {issues.slice(0, 3).map(({ dim, status }) => (
                      <i key={dim.key} style={{ color: `var(--s-${status})` }}>
                        {dim.letter}:{STATUS_META[status].short}
                      </i>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
