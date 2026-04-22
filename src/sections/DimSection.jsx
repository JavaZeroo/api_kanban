import { DIMENSIONS, STATUS_META, TREND_30D, tally } from '../data';
import { MiniRadial, Spark } from '../charts';
import LevelFilter from '../components/LevelFilter';

const DIM_COLORS = ['var(--npu)', 'oklch(0.6 0.18 280)', 'oklch(0.6 0.15 195)', 'oklch(0.6 0.16 340)'];

export default function DimSection({ filtered, levelFilter }) {
  const dimAgg = DIMENSIONS.map(d => {
    const t   = tally(filtered, d.key);
    const tot = Object.values(t).reduce((a, b) => a + b, 0);
    return { d, t, tot, rate: tot ? (t.aligned + t.reviewed) / tot : 0, rawRate: tot ? t.aligned / tot : 0 };
  });

  return (
    <>
      <div className="sec-head">
        <span className="idx">§1</span>
        <div className="sec-head-title">
          <span className="title">四维度 深度拆解</span>
          {levelFilter ? <LevelFilter {...levelFilter} /> : null}
        </div>
        <span className="right mono">状态分布 · 趋势</span>
      </div>
      <section className="dim-grid">
        {dimAgg.map(({ d, t, tot, rate, rawRate }, di) => {
          const dimColor = DIM_COLORS[di];
          const trend = TREND_30D.map(x => x[d.key]);
          return (
            <div className="dim-card" key={d.key}>
              <div className="dim-card-head">
                <div className="dim-letter-big" style={{ background: dimColor }}>{d.letter}</div>
                <div style={{ flex: 1 }}>
                  <div className="dim-name">{d.name}</div>
                </div>
              </div>
              <div className="dim-metric">
                <MiniRadial rate={rate} size={64} color={dimColor} />
                <div style={{ flex: 1 }}>
                  <div className="dim-big">{(rate * 100).toFixed(1)}<span className="dim-unit">%</span></div>
                  <div className="dim-sub">
                    <span>严格: {(rawRate * 100).toFixed(1)}%</span>
                    <span className="dim" style={{ margin: '0 6px' }}>·</span>
                    <span style={{ color: trend[29] > trend[0] ? 'var(--s-aligned)' : 'var(--s-fixing)' }}>
                      {trend[29] > trend[0] ? '↑' : '↓'} {Math.abs((trend[29] - trend[0]) * 100).toFixed(1)}pp / 30d
                    </span>
                  </div>
                </div>
              </div>
              <div className="dim-stack-wrap">
                <div className="dim-stack">
                  {['aligned', 'reviewed', 'fixing', 'unsupported', 'untested'].map(k => (
                    <span key={k} style={{ width: `${tot ? t[k] / tot * 100 : 0}%`, background: `var(--s-${k})` }} title={`${STATUS_META[k].label} ${t[k]}`}>
                      {tot ? t[k] / tot > 0.08 && <em>{t[k]}</em> : null}
                    </span>
                  ))}
                </div>
                <div className="dim-stack-legend">
                  {['aligned', 'reviewed', 'fixing', 'unsupported', 'untested'].map(k => (
                    <span key={k}><span className="d" style={{ background: `var(--s-${k})`, ...(k === 'untested' ? { border: '1px solid var(--line)' } : {}) }} />{t[k]}</span>
                  ))}
                </div>
              </div>
              <div className="dim-trend">
                <div className="dim-trend-head">
                  <span className="dim-trend-label">30 天趋势</span>
                  <span className="dim-trend-val" style={{ color: dimColor }}>{(trend[29] * 100).toFixed(1)}%</span>
                </div>
                <Spark data={trend} color={dimColor} height={40} showArea />
                <div className="dim-trend-axis">
                  <span>30d 前</span><span>今天</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
