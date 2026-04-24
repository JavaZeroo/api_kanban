import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Tag } from 'antd';
import { REPOS, STATUS_META } from '../data';
import { RepoBubbles } from '../charts';
import LevelFilter from '../components/LevelFilter';

const BLOCKING_APIS = [
  { api: 'torch.nn.functional.scaled_dot_product_attention', n: 7, freq: '3.9M', s: 'reviewed' },
  { api: 'torch.nn.MultiheadAttention',                      n: 6, freq: '2.5M', s: 'reviewed' },
  { api: 'torch.distributions.Normal',                       n: 5, freq: '420k', s: 'fixing'   },
  { api: 'torch.linalg.svd',                                 n: 4, freq: '180k', s: 'fixing'   },
  { api: 'torch.fft.fft2',                                   n: 4, freq: '95k',  s: 'untested' },
  { api: 'torch.cumsum',                                     n: 3, freq: '1.2M', s: 'fixing'   },
  { api: 'torch.nn.functional.grid_sample',                  n: 3, freq: '340k', s: 'reviewed' },
  { api: 'torch.einsum',                                     n: 3, freq: '1.1M', s: 'aligned'  },
];

export default function RepoSection({ onFocus, levelFilter }) {
  const avgRepoRate     = REPOS.reduce((s, r) => s + r.rate, 0) / REPOS.length;
  const fullyGreenRepos = REPOS.filter(r => r.rate >= 0.95).length;
  const totalUsed    = REPOS.reduce((s, r) => s + r.apiUsed, 0);
  const totalAligned = REPOS.reduce((s, r) => s + r.apiAligned, 0);
  const totalMissing = REPOS.reduce((s, r) => s + r.missing, 0);

  const columns = [
    { title: 'API', dataIndex: 'api', key: 'api', render: v => <span className="mono" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, display: 'inline-block' }}>{v}</span> },
    { title: '项目', dataIndex: 'n', key: 'n', align: 'right', className: 'num' },
    { title: '频次', dataIndex: 'freq', key: 'freq', align: 'right', className: 'num' },
    {
      title: '状态',
      dataIndex: 's',
      key: 's',
      render: s => (
        <span>
          <span style={{ color: `var(--s-${s})`, fontSize: 10.5 }}>●</span>{' '}
          <span style={{ fontSize: 10.5 }}>{STATUS_META[s].short}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="sec-head">
        <span className="idx">§2</span>
        <div className="sec-head-title">
          <span className="title">下游 repo 可用性</span>
          {levelFilter ? <LevelFilter {...levelFilter} /> : null}
        </div>
        <span className="right mono">10 项目 · 均值 {(avgRepoRate * 100).toFixed(0)}% · {fullyGreenRepos} 项 ≥95%</span>
      </div>
      <Row style={{ background: 'var(--panel)' }}>
        <Col span={16}>
          <Card className="block" bordered={false} style={{ borderRight: '1px solid var(--line)', height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <RepoBubbles repos={REPOS} onFocus={onFocus} />
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, fontFamily: 'var(--font-mono)' }}>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>加权项目总API</div><div style={{ fontSize: 15, marginTop: 2 }}>{totalUsed.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>可跑</div><div style={{ fontSize: 15, marginTop: 2, color: 'var(--s-aligned)' }}>{totalAligned.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>阻塞</div><div style={{ fontSize: 15, marginTop: 2, color: 'var(--s-fixing)' }}>{totalMissing.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>全绿发版可能性</div><div style={{ fontSize: 15, marginTop: 2 }}>{(fullyGreenRepos / REPOS.length * 100).toFixed(0)}%</div></div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="block" bordered={false} style={{ height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <div className="block-header">
              <div className="block-title">阻塞 API top <b>热点</b></div>
              <div className="block-meta">跨项目出现次数</div>
            </div>
            <Table
              columns={columns}
              dataSource={BLOCKING_APIS.map((h, i) => ({ ...h, key: i }))}
              pagination={false}
              size="small"
              className="htab"
              style={{ fontFamily: 'var(--font-mono)' }}
              onRow={record => ({
                onClick: () => navigate(`/api/${encodeURIComponent(record.api)}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

