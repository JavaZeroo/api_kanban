import { useState, useRef } from 'react';
import { DIMENSIONS } from '../data/constants';

const DIM_COLORS = {
  func: 'oklch(0.65 0.18 45)',
  prec: 'oklch(0.60 0.17 280)',
  mem:  'oklch(0.58 0.16 150)',
  det:  'oklch(0.62 0.16 75)',
  apiConsistency: 'oklch(0.72 0.14 300)',
};

const LINES = [
  ...DIMENSIONS.map(d => ({ key: d.key, label: d.name, color: DIM_COLORS[d.key] })),
  { key: 'apiConsistency', label: 'API一致', color: DIM_COLORS.apiConsistency },
];

export default function DualTrend({ data }) {
  const w = 800, h = 150, pad = { t: 8, r: 60, b: 20, l: 6 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = data.flatMap(d => LINES.map(l => d[l.key]));
  const dataMin = Math.min(...vals), dataMax = Math.max(...vals);
  const span = Math.max(0.05, dataMax - dataMin);
  const minRaw = dataMin - span * 0.35;
  const maxRaw = Math.min(1, dataMax + span * 0.25);
  const min = Math.max(0, Math.floor(minRaw * 20) / 20);
  const max = Math.min(1, Math.ceil(maxRaw * 20) / 20);
  const step = (max - min) >= 0.25 ? 0.1 : 0.05;
  const ticks = [];
  for (let t = min; t <= max + 1e-6; t += step) ticks.push(Number(t.toFixed(2)));
  const x = i => pad.l + (i / (data.length - 1)) * iw;
  const y = v => pad.t + (1 - (v - min) / (max - min)) * ih;
  const linePaths = LINES.map(l =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[l.key]).toFixed(1)}`).join(' ')
  );
  const [hv, setHv] = useState(null);
  const ref = useRef(null);
  const onMove = e => {
    const r = ref.current.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * w;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((mx - pad.l) / iw * (data.length - 1))));
    setHv(idx);
  };
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
      onMouseMove={onMove} onMouseLeave={() => setHv(null)}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" strokeDasharray="1 2" />
          <text x={w - pad.r + 4} y={y(t) + 3} fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-4)">{(t * 100).toFixed(0)}%</text>
        </g>
      ))}
      {[0, 7, 14, 21, 29].map(i => (
        <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-4)">
          {i === 29 ? '今天' : `-${29 - i}d`}
        </text>
      ))}
      {LINES.map((l, i) => (
        <path key={l.key} d={linePaths[i]} fill="none" stroke={l.color} strokeWidth={l.key === 'apiConsistency' ? 2.2 : 1.2} strokeDasharray={l.key === 'apiConsistency' ? undefined : '4 3'} strokeLinejoin="round" />
      ))}
      {LINES.map(l => (
        <circle key={`ep-${l.key}`} cx={x(data.length - 1)} cy={y(data[data.length - 1][l.key])} r={l.key === 'apiConsistency' ? 3.5 : 2} fill={l.color} />
      ))}
      {hv !== null && (
        <g>
          <line x1={x(hv)} x2={x(hv)} y1={pad.t} y2={h - pad.b} stroke="var(--fg-3)" strokeDasharray="1 2" />
          <g transform={`translate(${Math.min(x(hv) + 6, w - 160)}, ${pad.t + 4})`}>
            <rect width="150" height={14 + LINES.length * 13} fill="var(--fg)" rx="2" />
            <text x="8" y="14" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--bg-1)">{29 - hv === 0 ? '今天' : `${29 - hv}天前`}</text>
            {LINES.map((l, i) => (
              <text key={l.key} x="8" y={28 + i * 13} fontFamily="var(--font-mono)" fontSize="10" fill={l.color}>
                {l.label} {(data[hv][l.key] * 100).toFixed(1)}%
              </text>
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}
