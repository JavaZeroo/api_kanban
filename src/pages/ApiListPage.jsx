import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Table, Input, Select, Tag, Button } from 'antd';
import { SearchOutlined, HomeOutlined } from '@ant-design/icons';
import { APIS, MODULES, DIMENSIONS, STATUS_META } from '../data';
import { colors } from '../components/EChart';

const STATUS_ORDER = ['aligned', 'reviewed', 'fixing', 'unsupported', 'untested'];
const STATUS_ICONS = {
  aligned: '●',
  reviewed: '●',
  fixing: '●',
  unsupported: '●',
  untested: '○',
};

function getApiOverallStatus(api) {
  const statuses = DIMENSIONS.map(d => api.dims[d.key]);
  if (statuses.every(s => s === 'aligned')) return 'aligned';
  if (statuses.some(s => s === 'fixing')) return 'fixing';
  if (statuses.some(s => s === 'reviewed')) return 'reviewed';
  if (statuses.some(s => s === 'unsupported')) return 'unsupported';
  return 'untested';
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '所有状态' },
  { value: 'aligned', label: STATUS_META.aligned.label },
  { value: 'reviewed', label: STATUS_META.reviewed.label },
  { value: 'fixing', label: STATUS_META.fixing.label },
  { value: 'unsupported', label: STATUS_META.unsupported.label },
  { value: 'untested', label: STATUS_META.untested.label },
];

const DIM_FILTER_OPTIONS = [
  { value: 'all', label: '所有维度' },
  ...DIMENSIONS.map(d => ({ value: d.key, label: d.name })),
];

export default function ApiListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key, def) => searchParams.get(key) || def;
  const [searchTerm, setSearchTerm] = useState(getParam('q', ''));
  const [moduleFilter, setModuleFilter] = useState(getParam('mod', 'all'));
  const [statusFilter, setStatusFilter] = useState(getParam('st', 'all'));
  const [dimFilter, setDimFilter] = useState(getParam('dim', 'all'));

  const syncUrl = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    let list = APIS;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.module.toLowerCase().includes(q));
    }
    if (moduleFilter !== 'all') list = list.filter(a => a.module === moduleFilter);
    if (statusFilter !== 'all') list = list.filter(a => getApiOverallStatus(a) === statusFilter);
    if (dimFilter !== 'all') list = list.filter(a => a.dims[dimFilter] !== 'untested');
    return list;
  }, [searchTerm, moduleFilter, statusFilter, dimFilter]);

  const columns = [
    {
      title: 'API',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="mono" style={{ color: colors.fg, fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      sorter: (a, b) => a.module.localeCompare(b.module),
      render: (text) => <Tag bordered={false} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{text}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 60,
      render: (text) => <span className="mono dim" style={{ fontSize: 10.5 }}>{text}</span>,
    },
    ...DIMENSIONS.map(d => ({
      title: d.name,
      key: d.key,
      width: 64,
      align: 'center',
      render: (_, record) => {
        const s = record.dims[d.key];
        return (
          <span
            title={STATUS_META[s]?.label}
            style={{ color: colors[s] || colors.untested, fontSize: 12, cursor: 'help' }}
          >
            {STATUS_ICONS[s] || '○'}
          </span>
        );
      },
    })),
    {
      title: '用例',
      key: 'cases',
      width: 80,
      align: 'right',
      render: (_, record) => (
        <span className="mono" style={{ fontSize: 10.5, color: colors.fg2 }}>
          {record.casePass}/{record.caseTotal}
        </span>
      ),
    },
    {
      title: '频次',
      dataIndex: 'freq',
      key: 'freq',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.freq - b.freq,
      render: (v) => <span className="mono dim" style={{ fontSize: 10.5 }}>{v?.toLocaleString()}</span>,
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 90,
      sorter: (a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''),
      render: (v) => <span className="mono dim" style={{ fontSize: 10 }}>{v || '—'}</span>,
    },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="sec-head">
        <span className="idx">API</span>
        <div>
          <span className="title">API 列表</span>
          <span className="sub">全量 {APIS.length} API · 搜索 · 筛选 · 排序</span>
        </div>
        <span className="right mono">
          <Button
            size="small"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
          >
            返回看板
          </Button>
        </span>
      </div>
      <div style={{ padding: '12px 16px', background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--fg-3)' }} />}
            placeholder="搜索 API 名称或模块..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); syncUrl({ q: e.target.value }); }}
            style={{ width: 260, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            allowClear
          />
          <Select
            value={moduleFilter}
            onChange={v => { setModuleFilter(v); syncUrl({ mod: v }); }}
            style={{ minWidth: 160 }}
            options={[{ value: 'all', label: '所有模块' }, ...MODULES.map(m => ({ value: m.key, label: m.name }))]}
          />
          <Select
            value={statusFilter}
            onChange={v => { setStatusFilter(v); syncUrl({ st: v }); }}
            style={{ minWidth: 140 }}
            options={STATUS_FILTER_OPTIONS}
          />
          <Select
            value={dimFilter}
            onChange={v => { setDimFilter(v); syncUrl({ dim: v }); }}
            style={{ minWidth: 120 }}
            options={DIM_FILTER_OPTIONS}
          />
          <span className="mono dim" style={{ marginLeft: 'auto', fontSize: 10.5 }}>
            {filtered.length} / {APIS.length}
          </span>
        </div>
      </div>
      <div style={{ background: 'var(--panel)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="name"
          size="small"
          pagination={{ pageSize: 30, showSizeChanger: false, showTotal: t => `${t} API` }}
          onRow={record => ({
            onClick: () => navigate(`/api/${encodeURIComponent(record.name)}`),
            style: { cursor: 'pointer' },
          })}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>
    </div>
  );
}
