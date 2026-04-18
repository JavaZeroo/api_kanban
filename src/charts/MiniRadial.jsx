import EChart, { colors } from '../components/EChart';

export default function MiniRadial({ rate, size = 64, color = colors.npu }) {
  const option = {
    series: [{
      type: 'pie',
      radius: ['72%', '90%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center',
        formatter: `{c}%`,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        color: colors.fg,
      },
      labelLine: { show: false },
      data: [
        { value: (rate * 100).toFixed(0), itemStyle: { color } },
        { value: (100 - rate * 100).toFixed(0), itemStyle: { color: colors.lineSoft } },
      ],
      animationType: 'scale',
    }],
  };

  return <EChart option={option} style={{ height: size, width: size }} />;
}
