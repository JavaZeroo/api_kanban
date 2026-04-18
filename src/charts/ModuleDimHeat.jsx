import EChart, { colors } from '../components/EChart';
import { MODULES } from '../data';

const getColor = r => {
  if (r > 0.85) return colors.aligned;
  if (r > 0.65) return colors.reviewed;
  if (r > 0.4) return '#c9a03a';
  return colors.fixing;
};

export default function ModuleDimHeat({ dimKey, apis }) {
  const rows = MODULES.map(m => {
    const sub = apis.filter(a => a.module === m.key);
    const aligned = sub.filter(a => a.dims[dimKey] === 'aligned' || a.dims[dimKey] === 'reviewed').length;
    return { mod: m, rate: sub.length ? aligned / sub.length : 0 };
  });

  const option = {
    grid: { top: 4, bottom: 4, left: 4, right: 32 },
    xAxis: { type: 'value', show: false, max: 1 },
    yAxis: {
      type: 'category',
      data: rows.map(r => r.mod.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series: [{
      type: 'bar',
      data: rows.map(r => ({
        value: r.rate,
        itemStyle: { color: getColor(r.rate), borderRadius: 1 },
      })),
      barWidth: 8,
      label: {
        show: true,
        position: 'right',
        formatter: p => (p.value * 100).toFixed(0),
        fontSize: 9,
        color: colors.fg3,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      },
    }],
  };

  return <EChart option={option} style={{ height: MODULES.length * 14 }} />;
}
