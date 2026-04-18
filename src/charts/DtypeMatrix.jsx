import EChart, { colors } from '../components/EChart';
import { DTYPES, DTYPE_MATRIX } from '../data';

const getColor = v => {
  if (v >= 0.85) return colors.aligned;
  if (v >= 0.65) return colors.reviewed;
  if (v >= 0.40) return '#c9a03a';
  return colors.fixing;
};

export default function DtypeMatrix() {
  const xData = DTYPES;
  const yData = DTYPE_MATRIX.map(r => r.dim.name);
  const data = [];
  DTYPE_MATRIX.forEach((row, y) => {
    DTYPES.forEach((dt, x) => {
      data.push([x, y, row.cells[dt]]);
    });
  });

  const option = {
    grid: { top: 8, right: 8, bottom: 24, left: 70 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.fg3, fontSize: 10, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    },
    yAxis: {
      type: 'category',
      data: yData,
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.fg2, fontSize: 10, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: [colors.fixing, '#c9a03a', colors.reviewed, colors.aligned],
      },
    },
    series: [{
      type: 'heatmap',
      data,
      label: {
        show: true,
        formatter: p => (p.data[2] * 100).toFixed(0),
        fontSize: 10,
        fontWeight: 500,
        color: '#fff',
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      },
      itemStyle: {
        borderColor: colors.panel,
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: { borderColor: colors.fg, borderWidth: 1.5 },
      },
    }],
    tooltip: {
      formatter(p) {
        const v = p.data[2];
        return `<div style="font-weight:500;margin-bottom:4px">${yData[p.data[1]]} · ${xData[p.data[0]]}</div>
                <div>对齐率 <b>${(v * 100).toFixed(1)}%</b></div>`;
      },
    },
  };

  return <EChart option={option} style={{ height: 180 }} />;
}
