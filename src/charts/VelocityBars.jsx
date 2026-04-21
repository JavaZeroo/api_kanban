import { useRef, useEffect, useState } from 'react';
import { VELOCITY } from '../data';

function useContainerSize(ref, fallbackW, fallbackH) {
  const [size, setSize] = useState({ width: fallbackW, height: fallbackH });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return size;
}

export default function VelocityBars() {
  const containerRef = useRef(null);
  const { width: w, height: h } = useContainerSize(containerRef, 360, 80);
  const pad = { t: 10, r: 6, b: 18, l: 6 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const barW = iw / VELOCITY.length - 2;
  const maxPos = Math.max(1, Math.max(...VELOCITY.flatMap(v => [v.aligned + v.reviewed])));
  const maxNeg = Math.max(1, Math.max(...VELOCITY.flatMap(v => [Math.abs(v.fixing)])));
  const ratio = maxPos / (maxPos + maxNeg);
  const clamped = Math.min(0.8, Math.max(0.2, ratio));
  const y0 = pad.t + ih * clamped;
  const scaleUp = v => (v / maxPos) * (ih * clamped);
  const scaleDn = v => (v / maxNeg) * (ih * (1 - clamped));
  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={pad.l} x2={w - pad.r} y1={y0} y2={y0} stroke="var(--line-hard)" />
        {VELOCITY.map((v, i) => {
          const x = pad.l + i * (iw / VELOCITY.length);
          const alignedH  = scaleUp(v.aligned);
          const reviewedH = scaleUp(v.reviewed);
          const fixingH   = scaleDn(Math.abs(v.fixing));
          return (
            <g key={i}>
              <rect x={x} y={y0 - alignedH - reviewedH} width={barW} height={alignedH}  fill="var(--s-aligned)" />
              <rect x={x} y={y0 - reviewedH}            width={barW} height={reviewedH} fill="var(--s-reviewed)" />
              <rect x={x} y={y0}                        width={barW} height={fixingH}   fill="var(--s-fixing)" />
              {i % 2 === 0 && <text x={x + barW / 2} y={h - 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--fg-4)">W{i + 1}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
