import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Button } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { APIS, DIMENSIONS, STATUS_META, MODULES, API_REUSE_MAP } from '../data';
import { colors } from '../components/EChart';

const DIM_COLORS = [colors.npu, '#7a5ac8', '#3a9aaa', '#c85a8a'];

function RawValueBadge({ val }) {
  if (!val || val === '') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2,
        fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
        background: 'var(--line-soft)', color: 'var(--fg-3)',
      }}>
        <span style={{ fontSize: 8 }}>○</span> 未测试
      </span>
    );
  }
  if (val === '√') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2,
        fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
        background: 'var(--s-aligned-dim, rgba(61,153,102,0.1))', color: 'var(--s-aligned, #3d9966)',
      }}>
        <span style={{ fontSize: 8 }}>●</span> 对齐
      </span>
    );
  }
  if (val === '√-旧标准对齐') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2,
        fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
        background: 'var(--s-reviewed-dim, rgba(168,154,74,0.1))', color: 'var(--s-reviewed, #a89a4a)',
      }}>
        <span style={{ fontSize: 8 }}>◐</span> 旧标准对齐
      </span>
    );
  }
  if (val === 'x') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2,
        fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
        background: 'var(--s-fixing-dim, rgba(201,74,74,0.1))', color: 'var(--s-fixing, #c94a4a)',
      }}>
        <span style={{ fontSize: 8 }}>✕</span> 未对齐
      </span>
    );
  }
  if (String(val).startsWith('DTS')) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 2,
        fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
        background: 'var(--s-fixing-dim, rgba(201,74,74,0.1))', color: 'var(--s-fixing, #c94a4a)',
      }}>
        <span style={{ fontSize: 8 }}>◎</span> {val}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 2,
      fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)',
      background: 'var(--line-soft)', color: 'var(--fg-2)',
    }}>
      {val}
    </span>
  );
}

function DimCard({ dim, api, color }) {
  const s = api.dims[dim.key];
  const raw = api.rawDims?.[dim.key] || '';
  const meta = STATUS_META[s];

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
          <RawValueBadge val={raw} />
        </div>
      </div>

      {/* 原始值展示 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 14, padding: '12px 0', borderTop: '1px dashed var(--line-soft)', borderBottom: '1px dashed var(--line-soft)',
      }}>
        <div>
          <div className="mono dim" style={{ fontSize: 9.5, marginBottom: 4 }}>Excel 原始值</div>
          <div className="mono" style={{
            fontSize: raw.startsWith('DTS') ? 12 : 20, fontWeight: 500,
            color: raw === '√' ? colors.aligned : raw === 'x' ? colors.fixing : raw.startsWith('DTS') ? colors.fixing : raw === '√-旧标准对齐' ? colors.reviewed : colors.fg3,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
          }}>
            {raw || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono dim" style={{ fontSize: 9.5, marginBottom: 4 }}>映射状态</div>
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

      {/* DTS 编号链接 */}
      {raw.startsWith('DTS') && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--s-fixing-dim, rgba(201,74,74,0.08))',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: colors.fixing, marginBottom: 4 }}>待修复</div>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该维度存在未对齐差异，已创建 DTS 工单追踪。{api.updatedBy ? `负责人: ${api.updatedBy}` : ''}
          </div>
        </div>
      )}

      {raw === '√-旧标准对齐' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--s-reviewed-dim, rgba(168,154,74,0.08))',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: colors.fg, marginBottom: 4 }}>差异说明</div>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该 API 在 NPU 上按旧标准对齐，已通过评审确认可接受。{api.updatedBy ? `评审人: ${api.updatedBy}` : ''}{api.updatedAt ? ` · ${api.updatedAt}` : ''}
          </div>
        </div>
      )}

      {raw === 'x' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--s-fixing-dim, rgba(201,74,74,0.08))',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, color: colors.fixing, marginBottom: 4 }}>未对齐</div>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该维度测试未通过，存在功能/精度/性能差异。
          </div>
        </div>
      )}

      {raw === '' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 2,
          background: 'var(--bg-1)',
          border: '1px solid var(--line-soft)',
        }}>
          <div className="mono dim" style={{ fontSize: 10, lineHeight: 1.5 }}>
            该维度尚未进行测试。
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

      </div>
    </div>
  );
}
