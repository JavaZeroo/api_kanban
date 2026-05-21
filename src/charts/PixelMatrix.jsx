import { useRef, useEffect, useState, useCallback } from 'react';
import { MODULES, DIMENSIONS, STATUS_META, moduleRate } from '../data';

const PIXEL = 7;
const GAP = 1.5;
const CELL = PIXEL + GAP;

const COLOR_MAP = {
  aligned: '#2da44e',
  fixing: '#cf222e',
  untested: '#d8d8d0',
};

const LABEL_MAP = {
  aligned: '完全对齐',
  fixing: '待修复',
  untested: '未测试',
};

function apiColor(api) {
  const dims = Object.values(api.dims);
  if (dims.some(d => d === 'fixing')) return 'fixing';
  if (dims.every(d => d === 'aligned' || d === 'reviewed')) return 'aligned';
  return 'untested';
}

function drawMatrix(canvas, container, layout) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = layout.totalH * dpr;
  canvas.style.width = container.clientWidth + 'px';
  canvas.style.height = layout.totalH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  layout.rows.forEach(({ list, rate, y, cols, labelW, cellsX, rateX, mod }) => {
    const rowCount = Math.ceil(list.length / cols);
    const textY = y + (rowCount * CELL) / 2 + 4;

    ctx.fillStyle = '#999';
    ctx.font = '500 11px monospace';
    ctx.textAlign = 'right';

    let label = mod.name;
    const avail = labelW - 12;
    if (ctx.measureText(label).width > avail) {
      while (label.length > 3 && ctx.measureText(label + '…').width > avail) {
        label = label.slice(0, -1);
      }
      label += '…';
    }
    ctx.fillText(label, labelW - 12, textY);

    list.forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cellsX + col * CELL;
      const py = y + row * CELL;
      const c = apiColor(a);
      ctx.fillStyle = COLOR_MAP[c];
      ctx.fillRect(x, py, PIXEL, PIXEL);
      if (c === 'untested') {
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, py, PIXEL, PIXEL);
      }
    });

    ctx.fillStyle = '#ccc';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText((rate.rate * 100).toFixed(0) + '%', rateX + 40, textY);
  });
}

export default function PixelMatrix({ apis, onFocus }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tip, setTip] = useState(null);
  const layoutRef = useRef(null);

  const visibleModules = MODULES
    .map(mod => ({ mod, list: apis.filter(a => a.module === mod.key), rate: moduleRate(apis, mod.key) }))
    .filter(row => row.list.length > 0);

  const buildLayout = useCallback(() => {
    if (!containerRef.current) return null;
    const containerW = containerRef.current.clientWidth;
    const labelW = 170;
    const rateW = 54;
    const cellsW = containerW - labelW - rateW - 20;
    const cols = Math.max(1, Math.floor(cellsW / CELL));

    const rows = [];
    let y = 0;
    visibleModules.forEach(({ mod, list, rate }) => {
      const rowCount = Math.ceil(list.length / cols);
      const rowH = rowCount * CELL + 4;
      rows.push({ mod, list, rate, y, h: rowH, cols, labelW, cellsX: labelW + 10, rateX: containerW - rateW });
      y += rowH;
    });
    return { rows, totalH: y, cols };
  }, [visibleModules]);

  useEffect(() => {
    const layout = buildLayout();
    layoutRef.current = layout;
    if (!layout || !canvasRef.current || !containerRef.current) return;
    drawMatrix(canvasRef.current, containerRef.current, layout);
  }, [buildLayout]);

  useEffect(() => {
    const onResize = () => {
      const layout = buildLayout();
      layoutRef.current = layout;
      if (!layout || !canvasRef.current || !containerRef.current) return;
      drawMatrix(canvasRef.current, containerRef.current, layout);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [buildLayout]);

  const handleMouseMove = useCallback((e) => {
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    for (const row of layout.rows) {
      if (my < row.y || my > row.y + row.h) continue;
      const col = Math.floor((mx - row.cellsX) / CELL);
      const line = Math.floor((my - row.y) / CELL);
      const idx = line * row.cols + col;
      if (idx >= 0 && idx < row.list.length) {
        found = { api: row.list[idx], color: apiColor(row.list[idx]) };
        break;
      }
    }

    if (found) {
      setTip(prev => {
        if (prev && prev.api === found.api) {
          return { ...prev, x: e.clientX, y: e.clientY };
        }
        return { x: e.clientX, y: e.clientY, api: found.api, color: found.color };
      });
    } else {
      setTip(null);
    }
  }, []);

  const handleClick = useCallback((e) => {
    const layout = layoutRef.current;
    if (!layout || !onFocus) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const row of layout.rows) {
      if (my < row.y || my > row.y + row.h) continue;
      const col = Math.floor((mx - row.cellsX) / CELL);
      const line = Math.floor((my - row.y) / CELL);
      const idx = line * row.cols + col;
      if (idx >= 0 && idx < row.list.length) {
        onFocus(row.list[idx]);
        break;
      }
    }
  }, [onFocus]);

  if (!visibleModules.length) {
    return (
      <div className="pxmat-empty">
        <b>没有匹配的 API</b>
        <span>调整搜索词或等级筛选后再查看。</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} onMouseLeave={() => setTip(null)} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'pointer' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {tip && (
        <div className="tip" style={{ left: tip.x + 16, top: tip.y + 16 }}>
          <div className="head">{tip.api.name}</div>
          <div className="row"><span>状态</span><b style={{ color: COLOR_MAP[tip.color] }}>{LABEL_MAP[tip.color]}</b></div>
          <div className="row"><span>等级 · 频次</span><b>{tip.api.level} · {tip.api.freq.toLocaleString()}</b></div>
          {DIMENSIONS.map(d => (
            <div key={d.key} className="row">
              <span>{d.name}</span>
              <b style={{ color: COLOR_MAP[tip.api.dims[d.key]] || '#999' }}>{STATUS_META[tip.api.dims[d.key]]?.label || tip.api.dims[d.key]}</b>
            </div>
          ))}
          {tip.api.dts?.length > 0 && (
            <div className="row"><span>DTS</span><b style={{ color: COLOR_MAP.fixing }}>{tip.api.dts.join(', ')}</b></div>
          )}
          <div className="row" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid oklch(0.4 0.01 260)' }}>
            <span>用例</span><b>{tip.api.casePass}/{tip.api.caseTotal}</b>
          </div>
        </div>
      )}
    </div>
  );
}
