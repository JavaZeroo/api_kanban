import { Card, Progress, Space, Tag, Avatar as AntAvatar } from 'antd';
import { colors } from '../components/EChart';

const getColor = r => {
  if (r >= 0.95) return colors.aligned;
  if (r >= 0.85) return '#5a9e3a';
  if (r >= 0.75) return colors.reviewed;
  if (r >= 0.6) return '#c9a03a';
  return colors.fixing;
};

export default function RepoBubbles({ repos, onFocus }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
      {repos.map(r => {
        const [org, name] = r.name.split('/');
        const rateColor = getColor(r.rate);
        return (
          <Card
            key={r.name}
            size="small"
            bordered
            style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            bodyStyle={{ padding: '12px' }}
            onClick={() => window.open(`https://github.com/${r.name}`, '_blank')}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${r.rate * 100}%`, background: rateColor }} />
            <Space align="center" style={{ marginTop: 4 }}>
              <AntAvatar
                size="small"
                style={{
                  background: `linear-gradient(135deg, hsl(${(name.charCodeAt(0) * 7) % 360} 40% 45%), hsl(${(name.charCodeAt(1) * 11) % 360} 40% 55%))`,
                  fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {name[0].toUpperCase()}
              </AntAvatar>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10.5, color: colors.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org}</span>
            </Space>
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13, color: colors.fg, fontWeight: 500, marginTop: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 22, fontWeight: 500, color: rateColor, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}>
                {(r.rate * 100).toFixed(0)}<span style={{ fontSize: 10, color: colors.fg3 }}>%</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, color: colors.fg3, marginLeft: 'auto' }}>★{r.stars}</div>
            </div>
            <Progress
              percent={r.apiAligned / r.apiUsed * 100}
              showInfo={false}
              strokeColor={rateColor}
              trailColor={colors.fixing + '24'}
              size={{ height: 6 }}
              style={{ marginTop: 6, marginBottom: 4 }}
            />
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 9, color: colors.fg3, display: 'flex', justifyContent: 'space-between',
            }}>
              <span>可用 <b style={{ color: colors.fg, fontWeight: 500 }}>{r.apiAligned}</b></span>
              <span>阻塞 <b style={{ color: r.missing > 20 ? colors.fixing : colors.fg, fontWeight: 500 }}>{r.missing}</b></span>
              <span>/{r.apiUsed}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
