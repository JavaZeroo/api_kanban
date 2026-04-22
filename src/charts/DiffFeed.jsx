import { Timeline } from 'antd';
import { DIFF_FEED, STATUS_META } from '../data';
import { colors } from '../components/EChart';

const DIM_NAMES = { func: '功能', prec: '精度', mem: '内存', det: '确定性' };
const TYPE_COLOR = { add: colors.aligned, del: colors.fixing, mod: colors.reviewed };
const TYPE_LABEL = { add: '+', del: '−', mod: '~' };

export default function DiffFeed() {
  const items = DIFF_FEED.map((d, i) => {
    const shortS = s => STATUS_META[s]?.short || s;
    return {
      key: i,
      dot: <span style={{ color: TYPE_COLOR[d.type], fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{TYPE_LABEL[d.type]}</span>,
      children: (
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11, lineHeight: 1.6, color: colors.fg2 }}>
          <span style={{ color: colors.fg4, fontSize: 10.5, marginRight: 8 }}>{d.t}</span>
          <span style={{ color: colors.fg }}>{d.api}</span>
          <span style={{ padding: '0 5px', borderRadius: 2, fontSize: 9.5, color: colors.fg3, background: colors.lineSoft, margin: '0 4px' }}>{DIM_NAMES[d.dim]}</span>
          <span style={{ color: colors.fg4 }}>{shortS(d.from)}</span>
          <span style={{ color: colors.fg4, margin: '0 3px' }}>→</span>
          <span style={{ color: TYPE_COLOR[d.type] }}>{shortS(d.to)}</span>
          <span style={{ color: colors.fg3, fontSize: 10, marginLeft: 8 }}>{d.usr}</span>
        </div>
      ),
    };
  });

  return (
    <Timeline
      items={items}
      style={{ padding: '8px 0', maxHeight: 240, overflow: 'auto' }}
    />
  );
}
