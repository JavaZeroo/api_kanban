import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Row, Col, Collapse } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, LinkOutlined } from '@ant-design/icons';
import { APIS, DIMENSIONS, STATUS_META, MODULES, API_REUSE_MAP } from '../data';
import { colors } from '../components/EChart';
import MiniRadial from '../charts/MiniRadial';

const DIM_COLORS = [colors.npu, '#7a5ac8', '#3a9aaa', '#c85a8a'];

function DimCard({ dim, api, color }) {
  const s = api.dims[dim.key];
  const meta = STATUS_META[s];
  const passRate = s === 'aligned' ? 100 : s === 'reviewed' ? 85 : s === 'fixing' ? 40 : s === 'unsupported' ? 0 : null;
  const isPrecOrMem = dim.key === 'prec' || dim.key === 'mem';

  return (
    <Card
      variant="borderless"
      style={{ background: 'var(--panel)', border: '1px solid var(--line-soft)' }}
      styles={{ body: { padding: '16px 18px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, display: 'grid', placeItems: 'center',
          background: color, color: '#fff', fontFamily: 'var(--font-mono)',
          fontSize: 16, fontWeight: 600, borderRadius: 3, flexShrink: 0,
        }}>
          {dim.letter}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: colors.fg }}>{dim.name}</div>
          <div className="mono dim" style={{ fontSize: 10, marginTop: 2 }}>{dim.desc}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 2,
            fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
            background: `var(--s-${s}-dim, var(--line-soft))`,
            color: `var(--s-${s}, var(--fg-3))`,
          }}>
            {meta.short}
          </span>
        </div>
      </div>

      {passRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: '1px dashed var(--line-soft)', borderBottom: '1px dashed var(--line-soft)' }}>
          <MiniRadial rate={passRate / 100} size={56} color={color} />
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, color: colors.fg, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {passRate}<span style={{ fontSize: 13, color: colors.fg3 }}>%</span>
            </div>
            <div className="mono dim" style={{ fontSize: 10, marginTop: 2 }}>
              {meta.label}
            </div>
          </div>
        </div>
      )}

      {isPrecOrMem && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--line-soft)' }}>
          <div>
            <div className="mono dim" style={{ fontSize: 9.5 }}>对齐标准</div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: colors.fg, marginTop: 3 }}>
              {dim.key === 'prec' ? 'atol≤1e-5, rtol≤1e-4' : '峰值 ≤ 1.1× 参考'}
            </div>
          </div>
          <div>
            <div className="mono dim" style={{ fontSize: 9.5 }}>实际误差</div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: s === 'aligned' ? colors.aligned : s === 'fixing' ? colors.fixing : colors.fg3, marginTop: 3 }}>
              {s === 'aligned' ? '在标准内' : s === 'fixing' ? '超出标准' : '—'}
            </div>
          </div>
        </div>
      )}

      {s === 'reviewed' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--s-reviewed-dim, rgba(168,154,74,0.08))',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: colors.fg, marginBottom: 4 }}>差异说明</div>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该 API 在 NPU 上存在已知差异，已通过评审确认可接受。{api.updatedBy ? `评审人: ${api.updatedBy}` : ''}{api.updatedAt ? ` · ${api.updatedAt}` : ''}
          </div>
        </div>
      )}

      {s === 'fixing' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--s-fixing-dim, rgba(201,74,74,0.08))',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: colors.fixing, marginBottom: 4 }}>待修复</div>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该维度存在未对齐差异，正在修复中。{api.updatedBy ? `负责人: ${api.updatedBy}` : ''}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ApiDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || '');
  const api = APIS.find(a => a.name === decodedName);

  if (!api) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontFamily: 'var(--font-mono)', color: colors.fg4 }}>404</div>
          <div className="mono dim" style={{ fontSize: 13, marginTop: 8 }}>API 未找到: {decodedName}</div>
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/apis')}
            style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 11 }}
          >
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const mod = MODULES.find(m => m.key === api.module);
  const alignedDims = DIMENSIONS.filter(d => api.dims[d.key] === 'aligned' || api.dims[d.key] === 'reviewed').length;
  const overallRate = alignedDims / DIMENSIONS.length;

  const collapseItems = [{
    key: 'cases',
    label: <span className="mono" style={{ fontSize: 11 }}>测试用例 ({api.caseTotal})</span>,
    children: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 2 }}>
          <div className="mono dim" style={{ fontSize: 9.5 }}>通过</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: colors.aligned, marginTop: 2 }}>{api.casePass}</div>
        </div>
        <div style={{ padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 2 }}>
          <div className="mono dim" style={{ fontSize: 9.5 }}>失败</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: colors.fixing, marginTop: 2 }}>{api.caseTotal - api.casePass}</div>
        </div>
        <div style={{ padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 2 }}>
          <div className="mono dim" style={{ fontSize: 9.5 }}>通过率</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: colors.fg, marginTop: 2 }}>
            {api.caseTotal > 0 ? (api.casePass / api.caseTotal * 100).toFixed(0) : '—'}<span style={{ fontSize: 10, color: colors.fg3 }}>{api.caseTotal > 0 ? '%' : ''}</span>
          </div>
        </div>
      </div>
    ),
  }];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="sec-head">
        <span className="idx">API</span>
        <div>
          <span className="title">{api.name}</span>
          <span className="sub">{api.module} · {api.level} · {api.freq?.toLocaleString()} calls</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
          >
            首页
          </Button>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/apis')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
          >
            列表
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line-soft)', border: '1px solid var(--line-soft)', marginBottom: 20 }}>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API 名称</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: colors.fg, marginTop: 4 }}>{api.name}</div>
          </Card>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>所属模块</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Tag bordered={false} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{api.module}</Tag>
              {mod && <span className="mono dim" style={{ fontSize: 10 }}>权重 {mod.weight}</span>}
            </div>
          </Card>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>级别 / 频次</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: colors.fg, marginTop: 4 }}>
              {api.level} · {api.freq?.toLocaleString()} calls
            </div>
          </Card>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>总体对齐</div>
            <div style={{ marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: colors.fg }}>
                {(overallRate * 100).toFixed(0)}<span style={{ fontSize: 10, color: colors.fg3 }}>%</span>
              </span>
              <span className="mono dim" style={{ fontSize: 10, marginLeft: 6 }}>({alignedDims}/{DIMENSIONS.length})</span>
            </div>
          </Card>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>最后更新</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: colors.fg, marginTop: 4 }}>
              {api.updatedAt || '—'} · {api.updatedBy || '—'}
            </div>
          </Card>
          <Card variant="borderless" styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 0 }}>
            <div className="mono dim" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PyTorch 版本</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: colors.fg, marginTop: 4 }}>
              2.7.0
            </div>
          </Card>
        </div>

        {API_REUSE_MAP[api.name] && (
          <Card
            variant="borderless"
            style={{ background: 'var(--panel)', border: '1px solid var(--line-soft)', marginBottom: 20 }}
            styles={{ body: { padding: '14px 18px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                display: 'inline-block', width: 20, height: 20, lineHeight: '20px',
                textAlign: 'center', background: colors.npu, color: '#fff',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, borderRadius: 2,
              }}>R</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: colors.fg }}>复用测试用例</span>
              <span className="mono dim" style={{ fontSize: 10 }}>
                以下 API 与 {api.name} 共享底层实现，测试用例可复用
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {API_REUSE_MAP[api.name].map(refName => {
                const refApi = APIS.find(a => a.name === refName);
                const refAligned = refApi && DIMENSIONS.every(d => refApi.dims[d.key] === 'aligned' || refApi.dims[d.key] === 'reviewed');
                return (
                  <Tag
                    key={refName}
                    bordered={false}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10.5,
                      background: refAligned ? 'var(--s-aligned-dim, rgba(61,153,102,0.1))' : 'var(--line-soft)',
                      color: refAligned ? colors.aligned : colors.fg,
                      border: `1px solid ${refAligned ? 'var(--s-aligned, #3d9966)' : 'var(--line-soft)'}`,
                      padding: '2px 8px',
                    }}
                  >
                    <span style={{ color: refAligned ? colors.aligned : colors.fg3, fontSize: 9, marginRight: 4 }}>●</span>
                    {refName}
                  </Tag>
                );
              })}
            </div>
          </Card>
        )}

        <div style={{ marginBottom: 8 }}>
          <div className="sec-head" style={{ margin: 0 }}>
            <span className="idx">§D</span>
            <div>
              <span className="title">四维度测试详情</span>
              <span className="sub">功能 / 精度 / 内存 / 确定性</span>
            </div>
            <span className="right mono">独立打分</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {DIMENSIONS.map((d, i) => (
            <DimCard key={d.key} dim={d} api={api} color={DIM_COLORS[i]} />
          ))}
        </div>

        <Card variant="borderless" style={{ border: '1px solid var(--line-soft)' }} styles={{ body: { padding: '12px 16px' } }}>
          <Collapse
            items={collapseItems}
            bordered={false}
            ghost
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </Card>
      </div>
    </div>
  );
}
