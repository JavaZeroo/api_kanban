import EChart, { colors } from '../components/EChart';

export default function Spark({ data, color = colors.fg, height = 20, showArea, refLine }) {
  const option = {
    grid: { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: Math.min(...data) * 0.98, max: Math.max(...data) * 1.02 },
    series: [{
      type: 'line',
      data,
      showSymbol: false,
      smooth: false,
      lineStyle: { width: 1.5, color },
      areaStyle: showArea ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' },
          ],
        },
      } : undefined,
      markLine: refLine !== undefined ? {
        silent: true,
        symbol: 'none',
        lineStyle: { color: colors.line, type: 'dashed', width: 1 },
        data: [{ yAxis: refLine }],
      } : undefined,
    }],
  };

  return <EChart option={option} style={{ height }} />;
}
