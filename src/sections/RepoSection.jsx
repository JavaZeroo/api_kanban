import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table } from 'antd';
import { REPOS, REPO_API_MAP, STATUS_META } from '../data';
import { RepoBubbles } from '../charts';
import LevelFilter from '../components/LevelFilter';
import RepoDetailModal from '../components/RepoDetailModal';

const BLOCKING_APIS = [
  { api: 'torch.nn.functional.scaled_dot_product_attention', n: 7, freq: '3.9M', s: 'aligned' },
  { api: 'torch.nn.MultiheadAttention',                      n: 6, freq: '2.5M', s: 'aligned' },
  { api: 'torch.nn.functional.conv1d',                          n: 5, freq: '2.3M', s: 'fixing'   },
  { api: 'torch.linalg.svd',                                 n: 4, freq: '180k', s: 'fixing'   },
  { api: 'torch.fft.fft2',                                   n: 4, freq: '95k',  s: 'untested' },
  { api: 'torch.cumsum',                                     n: 3, freq: '1.2M', s: 'fixing'   },
  { api: 'torch.nn.functional.grid_sample',                  n: 3, freq: '340k', s: 'reviewed' },
  { api: 'torch.einsum',                                     n: 3, freq: '1.1M', s: 'aligned'  },
];

const PAGE_SIZE = 10;

const REPO_APIS_INDEX = REPOS.map(repo => {
  const shortName = repo.name.split('/').pop();
  const repoApis = REPO_API_MAP[shortName] || REPO_API_MAP[repo.name];
  return { repo, repoApis };
});

function computeFilteredRepos(filteredApiNames) {
  return REPO_APIS_INDEX.map(({ repo, repoApis }) => {
    if (!repoApis) return { ...repo, apiUsed: 0, apiAligned: 0, missing: 0, rate: 0 };

    let apiUsed = 0;
    let apiAligned = 0;

    repoApis.forEach(entry => {
      if (!filteredApiNames.has(entry.name)) return;
      apiUsed++;
      if (!entry.fixing) apiAligned++;
    });

    const missing = apiUsed - apiAligned;
    const rate = apiUsed ? apiAligned / apiUsed : 0;

    return { ...repo, apiUsed, apiAligned, missing, rate };
  }).filter(r => r.apiUsed > 0);
}

export default function RepoSection({ onFocus, levelFilter, filtered = [] }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [detailRepo, setDetailRepo] = useState(null);

  const filteredApiNames = useMemo(() => new Set(filtered.map(a => a.name)), [filtered]);

  const dynamicRepos = useMemo(() => computeFilteredRepos(filteredApiNames), [filteredApiNames]);

  const avgRepoRate = dynamicRepos.length
    ? dynamicRepos.reduce((s, r) => s + r.rate, 0) / dynamicRepos.length
    : 0;
  const fullyGreenRepos = dynamicRepos.filter(r => r.rate >= 0.95).length;

  const totalApiUsed = dynamicRepos.reduce((s, r) => s + r.apiUsed, 0);
  const totalApiAligned = dynamicRepos.reduce((s, r) => s + r.apiAligned, 0);
  const totalMissing = totalApiUsed - totalApiAligned;
  const avgRate = totalApiUsed ? (totalApiAligned / totalApiUsed * 100).toFixed(1) : '0.0';

  const totalPages = Math.ceil(dynamicRepos.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pagedRepos = dynamicRepos.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

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
          <span className="title">下游 repo 开箱可用度</span>
          {levelFilter ? <LevelFilter {...levelFilter} /> : null}
        </div>
        <span className="right mono">{dynamicRepos.length} 项目 · 均值 {(avgRepoRate * 100).toFixed(0)}% · {fullyGreenRepos} 项 ≥95%</span>
      </div>
      <Row style={{ background: 'var(--panel)' }}>
        <Col span={16}>
          <Card className="block" bordered={false} style={{ borderRight: '1px solid var(--line)', height: '100%' }} bodyStyle={{ padding: '14px 16px', height: '100%' }}>
            <RepoBubbles repos={pagedRepos} onFocus={setDetailRepo} />
            <div style={{ marginTop: 10, padding: '8px 0', borderTop: '1px dashed var(--line)', borderBottom: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <span style={{ color: 'var(--fg-3)' }}>第 {safePage + 1} / {totalPages} 页 · 本页 {pagedRepos.length} 个</span>
              <div className="repo-pager">
                <button disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>←</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={i === safePage ? 'active' : ''}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 2px', fontFamily: 'var(--font-mono)' }}>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>生态去重 torch API</div><div style={{ fontSize: 15, marginTop: 2 }}>{totalApiUsed.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>无阻塞</div><div style={{ fontSize: 15, marginTop: 2, color: 'var(--s-aligned)' }}>{totalApiAligned.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>阻塞</div><div style={{ fontSize: 15, marginTop: 2, color: 'var(--s-fixing)' }}>{totalMissing.toLocaleString()}</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>平均可用率</div><div style={{ fontSize: 15, marginTop: 2 }}>{avgRate}%</div></div>
              <div><div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>≥95% 可用率仓库占比</div><div style={{ fontSize: 15, marginTop: 2 }}>{fullyGreenRepos}/{dynamicRepos.length} = {dynamicRepos.length ? (fullyGreenRepos / dynamicRepos.length * 100).toFixed(1) : '0.0'}%</div></div>
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
      {detailRepo && <RepoDetailModal repo={detailRepo} onClose={() => setDetailRepo(null)} filteredApiNames={filteredApiNames} />}
    </>
  );
}
