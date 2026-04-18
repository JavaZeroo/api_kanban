import EChart, { colors } from '../components/EChart';

export default function HeroGauge({ rate, rawRate }) {
  const option = {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: '90%',
      center: ['50%', '70%'],
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 14,
          color: [
            [rate, colors.npu],
            [1, colors.lineSoft],
          ],
        },
      },
      pointer: { show: false },
      axisTick: {
        distance: -20,
        length: 4,
        lineStyle: { color: colors.line, width: 1 },
      },
      splitLine: {
        distance: -20,
        length: 8,
        lineStyle: { color: colors.line, width: 1 },
      },
      axisLabel: {
        distance: -34,
        color: colors.fg3,
        fontSize: 9,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        formatter: v => v.toFixed(0),
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color: colors.fg,
        fontSize: 44,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontWeight: 500,
        offsetCenter: [0, '-10%'],
      },
      data: [{ value: parseFloat((rate * 100).toFixed(1)) }],
    }, {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: '72%',
      center: ['50%', '70%'],
      axisLine: {
        lineStyle: {
          width: 2,
          color: [[rawRate, colors.fg3], [1, 'transparent']],
        },
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
    }],
  };

  return <EChart option={option} style={{ height: 180 }} />;
}
