import EChart, { colors } from '../components/EChart';

export default function DualTrend({ data }) {
  const min = 0.45, max = 0.95;
  const option = {
    grid: { top: 10, right: 60, bottom: 24, left: 6 },
    xAxis: {
      type: 'category',
      data: data.map((_, i) => i === data.length - 1 ? '今天' : `-${data.length - 1 - i}d`),
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.fg4, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", interval: 6 },
    },
    yAxis: {
      type: 'value',
      min, max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.lineSoft, type: 'dashed' } },
      axisLabel: {
        color: colors.fg4, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        formatter: v => (v * 100).toFixed(0) + '%',
      },
    },
    series: [
      {
        type: 'line',
        name: '加权',
        data: data.map(d => d.weighted),
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1.6, color: colors.npu },
        endLabel: { show: false },
      },
      {
        type: 'line',
        name: '平均',
        data: data.map(d => d.rate),
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1, color: colors.fg3, type: 'dashed' },
      },
      {
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: colors.cuda, width: 1.2 },
          label: {
            show: true,
            position: 'end',
            formatter: 'CUDA 基准 100%',
            color: colors.cuda,
            fontSize: 9,
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          },
          data: [{ yAxis: 1.0 }],
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const d = data[params[0].dataIndex];
        const day = params[0].dataIndex === data.length - 1 ? '今天' : `${data.length - 1 - params[0].dataIndex}天前`;
        return `<div style="font-weight:500;margin-bottom:4px">${day}</div>
                <div style="color:${colors.npu}">加权 ${(d.weighted * 100).toFixed(1)}%</div>
                <div style="color:${colors.fg3}">平均 ${(d.rate * 100).toFixed(1)}%</div>
                <div style="color:${colors.aligned};text-align:right;margin-top:2px">+${d.newlyAligned}</div>`;
      },
    },
  };

  return <EChart option={option} style={{ height: 150 }} />;
}
