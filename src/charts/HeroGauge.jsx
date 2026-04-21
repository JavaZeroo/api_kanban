import { colors } from '../components/EChart';

function arcPath(startDeg, endDeg, r) {
  const rad = Math.PI / 180;
  const cx = 70, cy = 70;
  const x1 = cx + r * Math.cos(rad * startDeg);
  const y1 = cy + r * Math.sin(rad * startDeg);
  const x2 = cx + r * Math.cos(rad * endDeg);
  const y2 = cy + r * Math.sin(rad * endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function HeroGauge({ rate = 0, rawRate, stats, label = '' }) {
  const size = 140, cx = 70, cy = 70, r = 53, tk = 12;
  const startDeg = 210, endDeg = 510, totalDeg = endDeg - startDeg;

  const aligned  = stats ? stats.aligned : 0;
  const fixing   = stats ? stats.fixing : 0;
  const untested = stats ? stats.untested : 0;
  const total    = stats ? stats.total : 0;

  const segments = stats ? [
    { key: 'aligned',  name: '对齐', val: aligned,  color: 'var(--s-aligned)' },
    { key: 'fixing',   name: '待修', val: fixing,   color: 'var(--s-fixing)' },
    { key: 'untested', name: '未测', val: untested, color: 'var(--s-untested)' },
  ] : [];

  let curDeg = startDeg;
  const segPaths = segments.map((seg, i) => {
    if (seg.val === 0) return null;
    const segDeg = (seg.val / total) * totalDeg;
    const path = arcPath(curDeg, curDeg + segDeg, r);
    curDeg += segDeg;
    return { path, color: seg.color, key: i };
  });

  return (
    <article className="hero-gauge-col" aria-label={`${label || 'API'} 一致性达成 ${(rate * 100).toFixed(1)}%`}>
      {label && (
        <div className="hero-gauge-head">
          <div>
            <span>API 指标</span>
            <b>{label}</b>
          </div>
          {stats && (
            <strong>{aligned.toLocaleString()}<span>/{total.toLocaleString()}</span></strong>
          )}
        </div>
      )}

      <svg className="hero-gauge-svg" viewBox={`0 0 ${size} ${size}`}>
        <path d={arcPath(startDeg, endDeg, r)} fill="none" stroke="var(--bg-2)" strokeWidth={tk} strokeLinecap="round" />
        {segPaths.filter(Boolean).map(s => (
          <path key={s.key} d={s.path} fill="none" stroke={s.color} strokeWidth={tk} strokeLinecap="round" />
        ))}
        <text className="hero-gauge-rate" x={cx} y={cy + 2} textAnchor="middle">
          {(rate * 100).toFixed(1)}%
        </text>
        <text className="hero-gauge-caption" x={cx} y={cy + 22} textAnchor="middle">达成率</text>
      </svg>

      {stats && (
        <>
          <div className="hero-ring-stack" aria-hidden="true">
            {segments.map(seg => (
              <span
                key={seg.key}
                style={{
                  width: `${total ? (seg.val / total) * 100 : 0}%`,
                  background: seg.color,
                  border: seg.key === 'untested' ? '1px solid var(--line)' : undefined,
                }}
              />
            ))}
          </div>

          <div className="hero-ring-detail" title={`对齐 ${aligned} API · 待修 ${fixing} API · 未测 ${untested} API · 合计 ${total} API`}>
            {segments.map(seg => (
              <span key={seg.key}>
                <i className="d" style={{ background: seg.color, border: seg.key === 'untested' ? '1px solid var(--line)' : undefined }} />
                <em>{seg.name}</em>
                <b>{seg.val.toLocaleString()}</b>
              </span>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
