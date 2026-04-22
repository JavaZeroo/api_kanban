import EChart, { colors } from '../components/EChart';
import { DIMENSIONS } from '../data';

export default function ImpactScatter({ apis, onFocus }) {
  const points = apis.map(a => {
    const ok = DIMENSIONS.filter(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed').length;
    return { a, y: ok / 4, x: Math.log10(Math.max(1, a.freq)) };
  });

  const xMin = 2, xMax = 7;
  const danger = points.filter(p => p.x > 5.5 && p.y < 0.5);

  const dataL0 = points.filter(p => p.a.level === 'L0').map(p => ({ value: [p.x, p.y, p.a], symbolSize: 6.4 }));
  const dataL1 = points.filter(p => p.a.level === 'L1').map(p => ({ value: [p.x, p.y, p.a], symbolSize: 4.4 }));
  const dataL2 = points.filter(p => p.a.level === 'L2').map(p => ({ value: [p.x, p.y, p.a], symbolSize: 4.4 }));

  const option = {
    grid: { top: 16, right: 24, bottom: 28, left: 42 },
    xAxis: {
      type: 'value',
      min: xMin, max: xMax,
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.lineSoft, type: 'dashed' } },
      axisLabel: {
        color: colors.fg4, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        formatter: v => `10^{${v}}`,
      },
      name: '调用频次 →',
      nameLocation: 'end',
      nameTextStyle: { color: colors.fg3, fontSize: 9.5, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    },
    yAxis: {
      type: 'value',
      min: 0, max: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.lineSoft, type: 'dashed' } },
      axisLabel: {
        color: colors.fg4, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        formatter: v => (v * 100).toFixed(0) + '%',
      },
      name: '↑ 单 API 对齐度',
      nameLocation: 'end',
      nameTextStyle: { color: colors.fg3, fontSize: 9.5, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    },
    series: [
      {
        type: 'scatter',
        name: 'L0',
        data: dataL0,
        itemStyle: { color: colors.npu },
      },
      {
        type: 'scatter',
        name: 'L1',
        data: dataL1,
        itemStyle: { color: colors.fg2, opacity: 0.7 },
      },
      {
        type: 'scatter',
        name: 'L2',
        data: dataL2,
        itemStyle: { color: colors.fg3, opacity: 0.4 },
      },
      {
        type: 'scatter',
        markArea: {
          silent: true,
          itemStyle: { color: colors.fixing + '24' },
          label: {
            show: true,
            position: 'insideTopLeft',
            formatter: `⚠ 高频 · 对齐差 (${danger.length})`,
            color: colors.fixing,
            fontSize: 9.5,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          },
          data: [[{ xAxis: 5.5, yAxis: 0.5 }, { xAxis: xMax, yAxis: 0 }]],
        },
      },
    ],
    legend: {
      data: ['L0', 'L1', 'L2'],
      left: 50, top: 8,
      textStyle: { color: colors.fg2, fontSize: 9.5, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
      itemWidth: 8, itemHeight: 8,
    },
    tooltip: {
      formatter(p) {
        const a = p.data.value[2];
        const ok = DIMENSIONS.filter(d => a.dims[d.key] === 'aligned' || a.dims[d.key] === 'reviewed').length;
        return `<div style="font-weight:500;margin-bottom:4px">${a.name}</div>
                <div style="display:flex;justify-content:space-between;gap:12px"><span>对齐</span><b>${(ok / 4 * 100).toFixed(0)}% (${ok}/4)</b></div>
                <div style="display:flex;justify-content:space-between;gap:12px"><span>频次</span><b>${a.freq.toLocaleString()}</b></div>`;
      },
    },
  };

  return <EChart option={option} style={{ height: 260 }} />;
}
