export default function HeroGauge({ stats, label }) {
  const size = 140, cx = size / 2, cy = size / 2, r = 53, tk = 12;
  const startDeg = 210, endDeg = 510, totalDeg = endDeg - startDeg;
  const { total, aligned, fixing, untested } = stats;
  const rate = total ? aligned / total : 0;

  const arcPath = (s, e, rr) => {
    const sa = (s - 90) * Math.PI / 180;
    const ea = (e - 90) * Math.PI / 180;
    const large = Math.abs(e - s) > 180 ? 1 : 0;
    return `M ${cx + rr * Math.cos(sa)} ${cy + rr * Math.sin(sa)} A ${rr} ${rr} 0 ${large} 1 ${cx + rr * Math.cos(ea)} ${cy + rr * Math.sin(ea)}`;
  };

  const segments = [
    { key: 'aligned',  name: '对齐', val: aligned,  color: 'var(--s-aligned)' },
    { key: 'fixing',   name: '待修', val: fixing,   color: 'var(--s-fixing)' },
    { key: 'untested', name: '未测', val: untested, color: 'var(--s-untested)' },
  ];

  let curDeg = startDeg;
  const segPaths = segments.map((seg, i) => {
    if (seg.val === 0) return null;
    const segDeg = (seg.val / total) * totalDeg;
    const path = arcPath(curDeg, curDeg + segDeg, r);
    curDeg += segDeg;
    return { path, color: seg.color, key: i };
  });

  return (
    <article className="hero-gauge-col" aria-label={`${label} 一致性达成 ${(rate * 100).toFixed(1)}%`}>
      <div className="hero-gauge-head">
        <div>
          <span>API 指标</span>
          <b>{label}</b>
        </div>
        <strong>{aligned.toLocaleString()}<span>/{total.toLocaleString()}</span></strong>
      </div>

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
    </article>
  );
}
