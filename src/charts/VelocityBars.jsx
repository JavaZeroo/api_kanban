import EChart, { colors } from '../components/EChart';
import { VELOCITY } from '../data';

export default function VelocityBars() {
  const option = {
    grid: { top: 10, right: 6, bottom: 18, left: 6 },
    xAxis: {
      type: 'category',
      data: VELOCITY.map((_, i) => `W${i + 1}`),
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.fg4, fontSize: 8.5, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", interval: 1 },
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    series: [
      {
        type: 'bar',
        name: '新对齐',
        stack: 'total',
        data: VELOCITY.map(v => v.aligned),
        itemStyle: { color: colors.aligned },
        barWidth: '70%',
      },
      {
        type: 'bar',
        name: '已评审',
        stack: 'total',
        data: VELOCITY.map(v => v.reviewed),
        itemStyle: { color: colors.reviewed },
      },
      {
        type: 'bar',
        name: '回退',
        stack: 'total',
        data: VELOCITY.map(v => v.fixing),
        itemStyle: { color: colors.fixing },
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const w = params[0].name;
        const aligned = params.find(p => p.seriesName === '新对齐')?.value || 0;
        const reviewed = params.find(p => p.seriesName === '已评审')?.value || 0;
        const fixing = params.find(p => p.seriesName === '回退')?.value || 0;
        return `<div style="font-weight:500;margin-bottom:4px">${w}</div>
                <div style="color:${colors.aligned}">新对齐 ${aligned}</div>
                <div style="color:${colors.reviewed}">已评审 ${reviewed}</div>
                <div style="color:${colors.fixing}">回退 ${Math.abs(fixing)}</div>`;
      },
    },
  };

  return <EChart option={option} style={{ height: 80 }} />;
}
