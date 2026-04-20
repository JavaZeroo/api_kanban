import { TREND_30D, VELOCITY, DIFF_FEED } from '../data';
import { DualTrend, VelocityBars, DiffFeed } from '../charts';

export default function TrendSection() {
  const lastWeek = VELOCITY[VELOCITY.length - 1];
  const current = TREND_30D[TREND_30D.length - 1];
  const previous = TREND_30D[0];
  const gain30d = (current.weighted - previous.weighted) * 100;
  const net12w = VELOCITY.reduce((sum, week) => sum + week.aligned + week.reviewed + week.fixing, 0);
  const adds = DIFF_FEED.filter(d => d.type === 'add').length;
  const reviews = DIFF_FEED.filter(d => d.type === 'mod').length;
  const regressions = DIFF_FEED.filter(d => d.type === 'del').length;

  return (
    <>
      <div className="sec-head">
        <span className="idx">§3</span>
        <div>
          <span className="title">Trend · Velocity</span>
        </div>
        <span className="right mono">30 days · 12 weeks</span>
      </div>
      <section className="trend-section-grid">
        <div className="block trend-card trend-card-main">
          <div className="block-header">
            <div className="block-title">Alignment vs CUDA · <b>30d</b></div>
            <div className="block-meta">
              <span style={{ color: 'var(--npu)', fontWeight: 500 }}>━</span> weighted &nbsp;
              <span style={{ color: 'var(--fg-3)' }}>- -</span> average &nbsp;
              <span style={{ color: 'var(--cuda)', fontWeight: 500 }}>━</span> CUDA
            </div>
          </div>
          <DualTrend data={TREND_30D} />
          <div className="trend-kpis">
            <div>
              <span>Weighted</span>
              <b>{(current.weighted * 100).toFixed(1)}%</b>
            </div>
            <div>
              <span>30d Change</span>
              <b className={gain30d >= 0 ? 'good' : 'bad'}>{gain30d >= 0 ? '+' : ''}{gain30d.toFixed(1)}pp</b>
            </div>
            <div>
              <span>Average</span>
              <b>{(current.rate * 100).toFixed(1)}%</b>
            </div>
          </div>
        </div>

        <div className="block trend-card trend-card-feed">
          <div className="block-header">
            <div className="block-title">Today diff · <b>{DIFF_FEED.length}</b></div>
            <div className="block-meta">+{adds} aligned · ~{reviews} reviewed · -{regressions} regressions</div>
          </div>
          <DiffFeed />
        </div>

        <div className="block trend-card trend-card-velocity">
          <div className="block-header">
            <div className="block-title">Weekly net progress · <b>12w</b></div>
            <div className="block-meta">green=aligned orange=reviewed red=regressed</div>
          </div>
          <div className="trend-velocity-row">
            <VelocityBars />
            <div className="trend-velocity-stats">
              <div>
                <span>This week</span>
                <b>+{lastWeek.aligned + lastWeek.reviewed}</b>
                <em>{lastWeek.fixing}</em>
              </div>
              <div>
                <span>12w net</span>
                <b className={net12w >= 0 ? 'good' : 'bad'}>{net12w >= 0 ? '+' : ''}{net12w}</b>
                <em>items</em>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
