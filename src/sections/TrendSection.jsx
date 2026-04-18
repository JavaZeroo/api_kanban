import { Card, Row, Col } from 'antd';
import { TREND_30D, VELOCITY, DIFF_FEED } from '../data';
import { DualTrend, VelocityBars, DiffFeed } from '../charts';

export default function TrendSection() {
  const lastWeek = VELOCITY[VELOCITY.length - 1];
  return (
    <>
      <div className="sec-head">
        <span className="idx">§3</span>
        <div>
          <span className="title">趋势 · 速度</span>
          <span className="sub">加权对齐率 = Σ(已对齐 API 调用频次) / Σ(全部调用频次)</span>
        </div>
        <span className="right mono">近 30 天 · 近 12 周</span>
      </div>
      <Row style={{ background: 'var(--panel)' }}>
        <Col span={10}>
          <Card className="block" bordered={false} style={{ borderRight: '1px solid var(--line)', height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <div className="block-header">
              <div className="block-title">对齐率 vs CUDA · <b>30d</b></div>
              <div className="block-meta">
                <span style={{ color: 'var(--npu)', fontWeight: 500 }}>━</span> 加权 &nbsp;
                <span style={{ color: 'var(--fg-3)' }}>- -</span> 平均 &nbsp;
                <span style={{ color: 'var(--cuda)', fontWeight: 500 }}>━</span> CUDA
              </div>
            </div>
            <DualTrend data={TREND_30D} />
          </Card>
        </Col>
        <Col span={7}>
          <Card className="block" bordered={false} style={{ borderRight: '1px solid var(--line)', height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <div className="block-header">
              <div className="block-title">每周净进展 <b>12w</b></div>
              <div className="block-meta">绿=新对齐 橙=已评审 红=回退</div>
            </div>
            <VelocityBars />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
              <span>本周 +{lastWeek.aligned + lastWeek.reviewed} / {lastWeek.fixing}</span>
              <span>均值 +14/周</span>
            </div>
          </Card>
        </Col>
        <Col span={7}>
          <Card className="block" bordered={false} style={{ height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <div className="block-header">
              <div className="block-title">今日 diff <b>{DIFF_FEED.length}</b> 条</div>
              <div className="block-meta">+新对齐 −回退 ~评审</div>
            </div>
            <DiffFeed />
          </Card>
        </Col>
      </Row>
    </>
  );
}
