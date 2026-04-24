import { ProCard } from '@ant-design/pro-components';
import { DIMENSIONS, STATUS_META, TREND_30D, tally } from '../data';
import { MiniRadial, Spark } from '../charts';
import { colors } from '../components/EChart';
import LevelFilter from '../components/LevelFilter';

const DIM_COLORS = [colors.npu, '#7a5ac8', '#3a9aaa', '#c85a8a'];
const DIM_HINTS  = {
  func: '输出 shape/dtype/语义与 PyTorch 参考一致',
  prec: '四类精度标准：通信原语规约类 · 通信原语二进制一致 · 直调 API · 组合类 API',
  mem:  '无内存泄漏 · 三类内存标准：驱动总内存 · 框架持有总内存 · 最大激活内存',
  det:  '相同输入 ×10 次运行完全一致',
};

const STATUS_ORDER = ['aligned', 'reviewed', 'fixing', 'unsupported', 'untested'];
const STATUS_COLORS = {
  aligned: colors.aligned,
  reviewed: colors.reviewed,
  fixing: colors.fixing,
  unsupported: colors.unsupported,
  untested: colors.untested,
};

function StackedBar({ t, tot }) {
  const segments = STATUS_ORDER.map(key => ({
    key,
    width: (t[key] / tot) * 100,
    color: STATUS_COLORS[key],
  }));
  return (
    <div style={{ display: 'flex', height: 18, background: colors.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
      {segments.map(seg => (
        <div key={seg.key} style={{ width: `${seg.width}%`, background: seg.color }} />
      ))}
    </div>
  );
}

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
      <div className="dim-grid">
        {dimAgg.map(({ d, t, tot, rate, rawRate }, di) => {
          const dimColor = DIM_COLORS[di];
          const trend = TREND_30D.map((x, i) => x.rate + (di - 1.5) * 0.04 + Math.sin(i * 0.3 + di) * 0.02);
          const trendUp = trend[29] > trend[0];
          return (
            <ProCard key={d.key} bodyStyle={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }} bordered={false} className="dim-card">
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
                    <span style={{ color: trendUp ? colors.aligned : colors.fixing }}>
                      {trendUp ? '↑' : '↓'} {Math.abs((trend[29] - trend[0]) * 100).toFixed(1)}pp / 30d
                    </span>
                  </div>
                </div>
              </div>
              <div className="dim-stack-wrap">
                <StackedBar t={t} tot={tot} />
                <div className="dim-stack-legend">
                  {['aligned', 'reviewed', 'fixing', 'unsupported', 'untested'].map(k => (
                    <span key={k}><span className="d" style={{ background: k === 'untested' ? 'transparent' : `var(--s-${k})`, ...(k === 'untested' ? { border: '1px solid ' + colors.line } : {}) }} />{t[k]}</span>
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
            </ProCard>
          );
        })}
      </div>
    </>
  );
}
