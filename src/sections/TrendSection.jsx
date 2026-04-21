import { TREND_30D, DIFF_FEED } from '../data';
import { DIMENSIONS } from '../data/constants';
import { DualTrend, VelocityBars, DiffFeed } from '../charts';
import LevelFilter from '../components/LevelFilter';

const DIM_COLORS = {
  func: 'oklch(0.65 0.18 45)',
  prec: 'oklch(0.60 0.17 280)',
  mem:  'oklch(0.58 0.16 150)',
  det:  'oklch(0.62 0.16 75)',
  apiConsistency: 'oklch(0.72 0.14 300)',
};

export default function TrendSection({ levelFilter }) {
  const adds = DIFF_FEED.filter(d => d.type === 'add').length;
  const reviews = DIFF_FEED.filter(d => d.type === 'mod').length;
  const regressions = DIFF_FEED.filter(d => d.type === 'del').length;

  return (
    <>
      <div className="sec-head">
        <span className="idx">§3</span>
        <div className="sec-head-title">
          <span className="title">趋势 · 迭代速度</span>
          {levelFilter ? <LevelFilter {...levelFilter} /> : null}
        </div>
        <span className="right mono">30 天 · 12 周</span>
      </div>
      <section className="trend-section-grid">
        <div className="block trend-card trend-card-main">
          <div className="block-header">
            <div className="block-title">Dimension Alignment · <b>30d</b></div>
            <div className="block-meta">
              <span style={{ color: DIM_COLORS.apiConsistency, fontWeight: 600 }}>━</span>{' '}
              <span style={{ color: DIM_COLORS.apiConsistency }}>API一致</span>
              {DIMENSIONS.map(d => (
                <span key={d.key} style={{ marginLeft: 8 }}>
                  <span style={{ color: DIM_COLORS[d.key] }}>- -</span> {d.name}
                </span>
              ))}
            </div>
          </div>
          <DualTrend data={TREND_30D} />
        </div>

        <div className="block trend-card trend-card-velocity">
          <div className="block-header">
            <div className="block-title">Weekly net progress · <b>12w</b></div>
            <div className="block-meta">green=aligned orange=reviewed red=regressed</div>
          </div>
          <VelocityBars />
        </div>

        <div className="block trend-card trend-card-feed">
          <div className="block-header">
            <div className="block-title">Today diff · <b>{DIFF_FEED.length}</b></div>
            <div className="block-meta">+{adds} aligned · ~{reviews} reviewed · -{regressions} regressions</div>
          </div>
          <DiffFeed />
        </div>
      </section>
    </>
  );
}
