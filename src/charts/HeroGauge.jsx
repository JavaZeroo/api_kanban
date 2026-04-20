export default function HeroGauge({ stats, label }) {
  const size = 100, cx = size / 2, cy = size / 2, r = 38, tk = 7;
  const startDeg = 210, endDeg = 510, totalDeg = endDeg - startDeg;
  const { total, aligned, partial, fixing, untested } = stats;
  const rate = (aligned + partial) / total;

  const arcPath = (s, e, rr) => {
    const sa = (s - 90) * Math.PI / 180;
    const ea = (e - 90) * Math.PI / 180;
    const large = Math.abs(e - s) > 180 ? 1 : 0;
    return `M ${cx + rr * Math.cos(sa)} ${cy + rr * Math.sin(sa)} A ${rr} ${rr} 0 ${large} 1 ${cx + rr * Math.cos(ea)} ${cy + rr * Math.sin(ea)}`;
  };

  const segments = [
    { val: aligned, color: 'var(--s-aligned)' },
    { val: partial, color: 'var(--s-reviewed)' },
    { val: fixing, color: 'var(--s-fixing)' },
    { val: untested, color: 'var(--s-untested)' },
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
    <div className="hero-gauge-col">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '110px', height: 'auto' }}>
        <path d={arcPath(startDeg, endDeg, r)} fill="none" stroke="var(--bg-2)" strokeWidth={tk} strokeLinecap="butt" />
        {segPaths.filter(Boolean).map(s => (
          <path key={s.key} d={s.path} fill="none" stroke={s.color} strokeWidth={tk} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy + 2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="16" fontWeight="500" fill="var(--fg)" style={{ letterSpacing: '-0.02em' }}>
          {(rate * 100).toFixed(1)}%
        </text>
      </svg>
      <div className="ring-label">{label}</div>
      <div className="hero-ring-detail" title={`对齐 ${aligned} · 复核 ${partial} · 待修 ${fixing} · 未测 ${untested} · 合计 ${total}`}>
        <span><i className="d" style={{ background: 'var(--s-aligned)' }} />{aligned}</span>
        <span><i className="d" style={{ background: 'var(--s-reviewed)' }} />{partial}</span>
        <span><i className="d" style={{ background: 'var(--s-fixing)' }} />{fixing}</span>
        <span><i className="d" style={{ background: 'var(--s-untested)', border: '1px solid var(--line)' }} />{untested}</span>
      </div>
    </div>
  );
}