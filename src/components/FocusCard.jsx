import { useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { DIMENSIONS, STATUS_META } from '../data';
import { colors } from './EChart';

export default function FocusCard({ focus, onClose }) {
  const navigate = useNavigate();
  if (!focus?.name) return null;
  return (
    <Card
      size="small"
      style={{
        position: 'fixed',
        right: 16,
        top: 56,
        width: 360,
        zIndex: 80,
        boxShadow: '0 12px 28px rgba(0,0,0,0.1)',
        borderColor: 'var(--line-hard)',
      }}
      title={
        <div>
          <div className="mono" style={{ fontSize: 10, color: colors.fg3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {focus.module} · {focus.level} · {focus.freq?.toLocaleString()} calls
          </div>
          <div className="mono" style={{ fontSize: 13.5, color: colors.fg, marginTop: 3, fontWeight: 500 }}>
            {focus.name}
          </div>
        </div>
      }
      extra={
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} style={{ color: colors.fg3 }} />
      }
    >
      <Row gutter={[2, 2]} style={{ marginTop: 4 }}>
        {DIMENSIONS.map((d) => (
          <Col span={6} key={d.key}>
            <div style={{ background: 'var(--panel)', padding: '7px 8px', border: '1px solid var(--line-soft)' }}>
              <div className="mono" style={{ fontSize: 9.5, color: colors.fg3 }}>{d.name}</div>
              <div className="mono" style={{ fontSize: 10.5, marginTop: 3, color: `var(--s-${focus.dims[d.key]})` }}>
                ● {STATUS_META[focus.dims[d.key]].short}
              </div>
            </div>
          </Col>
        ))}
      </Row>
      <div className="mono" style={{ marginTop: 10, fontSize: 11, color: colors.fg3 }}>
        用例 <b style={{ color: colors.fg }}>{focus.casePass}/{focus.caseTotal}</b> · 更新 {focus.updatedAt} by {focus.updatedBy}
      </div>
      <Button type="primary" block onClick={() => navigate(`/api/${encodeURIComponent(focus.name)}`)} style={{ marginTop: 12, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11 }}>
        → 查看详情页
      </Button>
    </Card>
  );
}
