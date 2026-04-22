import { useMemo } from 'react';
import { PixelMatrix } from '../charts';
import { DIMENSIONS } from '../data';
import LevelFilter from '../components/LevelFilter';

const hasBlocking = (api) => DIMENSIONS.some(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported');
const isReady = (api) => DIMENSIONS.every(d => api.dims[d.key] === 'aligned' || api.dims[d.key] === 'reviewed');

export default function MatrixSection({ filtered, onFocus, levelFilter }) {
  const matrixStats = useMemo(() => {
    const blocked = filtered.filter(hasBlocking);
    const ready = filtered.filter(isReady);
    const blockedDims = filtered.reduce((sum, api) => (
      sum + DIMENSIONS.filter(d => api.dims[d.key] === 'fixing' || api.dims[d.key] === 'unsupported').length
    ), 0);

    return { blocked, blockedDims, ready };
  }, [filtered]);

  return (
    <>
      <div className="sec-head">
        <span className="idx">§4</span>
        <div className="sec-head-title">
          <span className="title">全量 API 对齐矩阵</span>
          {levelFilter ? <LevelFilter {...levelFilter} /> : null}
        </div>
        <div className="pxmat-legend">
          <span><span className="swatch" style={{ background: 'var(--s-aligned)' }} />完全对齐</span>
          <span><span className="swatch" style={{ background: 'var(--s-fixing)' }} />待修复</span>
          <span><span className="swatch" style={{ background: 'var(--s-untested)', border: '1px solid var(--line)' }} />未测试</span>
        </div>
      </div>
      <section className="matrix-section">
        <div className="matrix-toolbar">
          <div className="matrix-stat-grid">
            <div className="matrix-stat">
              <span>当前可见</span>
              <b>{filtered.length.toLocaleString()}</b>
              <em>按筛选条件</em>
            </div>
            <div className="matrix-stat hot">
              <span>阻塞维度</span>
              <b>{matrixStats.blockedDims.toLocaleString()}</b>
              <em>{matrixStats.blocked.length.toLocaleString()} 个 API 待修复</em>
            </div>
            <div className="matrix-stat good">
              <span>发版可用</span>
              <b>{matrixStats.ready.length.toLocaleString()}</b>
              <em>{filtered.length ? (matrixStats.ready.length / filtered.length * 100).toFixed(1) : '0.0'}% / 当前范围</em>
            </div>
          </div>
        </div>
        <div className="matrix-body">
          <PixelMatrix apis={filtered} onFocus={onFocus} />
        </div>
      </section>
    </>
  );
}
