import { useMemo, useState } from 'react';
import { PixelMatrix } from '../charts';
import { DIMENSIONS } from '../data';

const hasBlocking = (api) => DIMENSIONS.some(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported');
const hasUntested = (api) => DIMENSIONS.some(d => api.dims[d.key] === 'untested');
const isReady = (api) => DIMENSIONS.every(d => api.dims[d.key] === 'aligned' || api.dims[d.key] === 'reviewed');
const isPriority = (api) => (api.level === 'L0' || api.level === 'L1') && !isReady(api);

export default function MatrixSection({ filtered, onFocus }) {
  const [mode, setMode] = useState('all');
  const [moduleFocus, setModuleFocus] = useState(null);

  const matrixStats = useMemo(() => {
    const blocked = filtered.filter(hasBlocking);
    const untested = filtered.filter(hasUntested);
    const priority = filtered.filter(isPriority);
    const ready = filtered.filter(isReady);
    const blockedDims = filtered.reduce((sum, api) => (
      sum + DIMENSIONS.filter(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported').length
    ), 0);

    const byModule = new Map();
    filtered.forEach(api => {
      const blockDims = DIMENSIONS.filter(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported').length;
      const testGaps = DIMENSIONS.filter(d => api.dims[d.key] === 'untested').length;
      if (!blockDims && !testGaps) return;
      const current = byModule.get(api.module) || { module: api.module, apis: 0, risk: 0, freq: 0 };
      current.apis += 1;
      current.risk += blockDims * 2 + testGaps;
      current.freq += api.freq;
      byModule.set(api.module, current);
    });

    return {
      blocked,
      blockedDims,
      untested,
      priority,
      ready,
      modules: [...byModule.values()].sort((a, b) => b.risk - a.risk || b.freq - a.freq).slice(0, 5),
    };
  }, [filtered]);

  const visible = useMemo(() => {
    let list = filtered;
    if (mode === 'blocking') list = list.filter(hasBlocking);
    if (mode === 'priority') list = list.filter(isPriority);
    if (mode === 'untested') list = list.filter(hasUntested);
    if (moduleFocus) list = list.filter(api => api.module === moduleFocus);
    return list;
  }, [filtered, mode, moduleFocus]);

  const filterButtons = [
    { key: 'all', label: '全部', count: filtered.length },
    { key: 'blocking', label: '阻塞', count: matrixStats.blocked.length },
    { key: 'priority', label: 'L0/L1 风险', count: matrixStats.priority.length },
    { key: 'untested', label: '未测试', count: matrixStats.untested.length },
  ];

  return (
    <>
      <div className="sec-head">
        <span className="idx">§4</span>
        <div>
          <span className="title">全量 API 对齐矩阵</span>
        </div>
        <div className="pxmat-legend">
          <span><span className="swatch" style={{ background: 'var(--s-aligned)' }} />完全对齐</span>
          <span><span className="swatch" style={{ background: 'var(--s-reviewed)' }} />部分对齐</span>
          <span><span className="swatch" style={{ background: 'var(--s-fixing)' }} />待修复</span>
          <span><span className="swatch" style={{ background: 'var(--s-untested)', border: '1px solid var(--line)' }} />未测试</span>
        </div>
      </div>
      <section className="matrix-section">
        <div className="matrix-toolbar">
          <div className="matrix-stat-grid">
            <div className="matrix-stat">
              <span>当前可见</span>
              <b>{visible.length.toLocaleString()}</b>
              <em>{filtered.length.toLocaleString()} matched APIs</em>
            </div>
            <div className="matrix-stat hot">
              <span>阻塞维度</span>
              <b>{matrixStats.blockedDims.toLocaleString()}</b>
              <em>{matrixStats.blocked.length.toLocaleString()} APIs need fixes</em>
            </div>
            <div className="matrix-stat">
              <span>L0/L1 风险</span>
              <b>{matrixStats.priority.length.toLocaleString()}</b>
              <em>release-critical queue</em>
            </div>
            <div className="matrix-stat good">
              <span>发版可用</span>
              <b>{matrixStats.ready.length.toLocaleString()}</b>
              <em>{filtered.length ? (matrixStats.ready.length / filtered.length * 100).toFixed(1) : '0.0'}% in selection</em>
            </div>
          </div>

          <div className="matrix-controls">
            <div className="matrix-filter-row" aria-label="Matrix filter">
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  className={mode === btn.key ? 'active' : ''}
                  type="button"
                  onClick={() => setMode(btn.key)}
                >
                  <span>{btn.label}</span>
                  <b>{btn.count.toLocaleString()}</b>
                </button>
              ))}
            </div>
            <div className="matrix-module-row" aria-label="High risk modules">
              <button
                className={!moduleFocus ? 'active' : ''}
                type="button"
                onClick={() => setModuleFocus(null)}
              >
                所有模块
              </button>
              {matrixStats.modules.map(mod => (
                <button
                  key={mod.module}
                  className={moduleFocus === mod.module ? 'active' : ''}
                  type="button"
                  onClick={() => setModuleFocus(mod.module)}
                  title={`${mod.apis} APIs · risk score ${mod.risk}`}
                >
                  <span>{mod.module}</span>
                  <b>{mod.risk}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="matrix-body">
          <PixelMatrix apis={visible} onFocus={onFocus} />
        </div>
      </section>
    </>
  );
}


