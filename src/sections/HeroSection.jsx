import { useMemo } from 'react';
import { Progress, Tag, Space, Row, Col } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { APIS, REPOS, TREND_30D, DIMENSIONS, overallAlignment, weightedAlignment } from '../data';
import { HeroGauge } from '../charts';
import { colors } from '../components/EChart';

export default function HeroSection({ filtered = [] }) {
  const ov = useMemo(() => overallAlignment(filtered), [filtered]);
  const wv = useMemo(() => weightedAlignment(filtered), [filtered]);

  const totalCases    = filtered.reduce((s, a) => s + a.caseTotal, 0);
  const passCases     = filtered.reduce((s, a) => s + a.casePass, 0);
  const fixingCount   = filtered.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'fixing').length, 0);
  const reviewedCount = filtered.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'reviewed').length, 0);
  const untestedCount = filtered.reduce((s, a) => s + DIMENSIONS.filter(d => a.dims[d.key] === 'untested').length, 0);
  const l0            = filtered.filter(a => a.level === 'L0');
  const l0Aligned     = l0.filter(a => DIMENSIONS.every(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed')).length;
  const totalDims     = filtered.length * DIMENSIONS.length || 1;
  const change30d     = (wv.rate - TREND_30D[0].weighted) * 100;

  return (
    <ProCard className="hero-solo" bodyStyle={{ padding: '28px 28px 24px' }} bordered={false}>
      <Row gutter={40} align="middle">
        <Col flex="360px">
          <HeroGauge rate={wv.rate} rawRate={ov.rate} />
          <div className="hero-gauge-legend">
            <span><span className="sw" style={{ background: colors.npu }} />加权 {(wv.rate * 100).toFixed(1)}%</span>
            <span><span className="sw" style={{ background: colors.fg3, border: '1px dashed ' + colors.fg3 }} />平均 {(ov.rate * 100).toFixed(1)}%</span>
            <span><span className="sw" style={{ background: colors.aligned }} />30d {change30d >= 0 ? '+' : ''}{change30d.toFixed(1)}pp</span>
          </div>
        </Col>
        <Col flex="auto">
          <Space align="center" style={{ marginBottom: 12 }}>
            <Tag color={colors.npu} style={{ color: '#fff' }}>torch_npu</Tag>
            <span className="mono dim">昇腾 910B · CANN 8.1.RC2 · torch 2.7.0</span>
            <Tag icon={<span className="dot" />} style={{ marginLeft: 'auto', borderColor: colors.line }}>
              <span style={{ color: colors.fg2 }}>在线 · 日更</span>
            </Tag>
          </Space>
          <h1 className="hero-h1">PyTorch on NPU · API 一致性总览</h1>
          <p className="hero-lede">
            全量 <b>{APIS.length}</b> API · <b>{totalCases.toLocaleString()}</b> 用例 · 每日自动回归 · 覆盖 <b>{REPOS.length}</b> 个主流开源仓库
          </p>
          <div className="hero-kpi-row">
            <ProCard bodyStyle={{ padding: '10px 12px' }} bordered={false}>
              <div className="kpi-k">L0 就绪</div>
              <div className="kpi-v">{l0Aligned}<span className="dim mono" style={{ fontSize: 14 }}>/{l0.length}</span></div>
              <Progress percent={l0Aligned / (l0.length || 1) * 100} showInfo={false} strokeColor="#d4871a" size={{ height: 3 }} style={{ marginTop: 6 }} />
            </ProCard>
            <ProCard bodyStyle={{ padding: '10px 12px' }} bordered={false}>
              <div className="kpi-k">已评审接受</div>
              <div className="kpi-v" style={{ color: colors.reviewed }}>{reviewedCount}</div>
              <Progress percent={reviewedCount / totalDims * 100} showInfo={false} strokeColor="#8fa65c" size={{ height: 3 }} style={{ marginTop: 6 }} />
            </ProCard>
            <ProCard bodyStyle={{ padding: '10px 12px' }} bordered={false}>
              <div className="kpi-k">待修复差异</div>
              <div className="kpi-v" style={{ color: colors.fixing }}>{fixingCount}</div>
              <Progress percent={fixingCount / totalDims * 100} showInfo={false} strokeColor="#c94a4a" size={{ height: 3 }} style={{ marginTop: 6 }} />
            </ProCard>
            <ProCard bodyStyle={{ padding: '10px 12px' }} bordered={false}>
              <div className="kpi-k">未测试</div>
              <div className="kpi-v dim">{untestedCount}</div>
              <Progress percent={untestedCount / totalDims * 100} showInfo={false} strokeColor="#999" size={{ height: 3 }} style={{ marginTop: 6 }} />
            </ProCard>
            <ProCard bodyStyle={{ padding: '10px 12px' }} bordered={false}>
              <div className="kpi-k">用例通过</div>
              <div className="kpi-v">{(passCases / (totalCases || 1) * 100).toFixed(1)}<span style={{ fontSize: 12, color: colors.fg3 }}>%</span></div>
              <Progress percent={passCases / (totalCases || 1) * 100} showInfo={false} strokeColor="#5a9a6e" size={{ height: 3 }} style={{ marginTop: 6 }} />
            </ProCard>
          </div>
        </Col>
      </Row>
    </ProCard>
  );
}
