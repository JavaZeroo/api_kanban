import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, GaugeChart, ScatterChart, HeatmapChart, CustomChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  MarkLineComponent, MarkAreaComponent, DataZoomComponent, VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo } from 'react';

echarts.use([
  LineChart, BarChart, PieChart, GaugeChart, ScatterChart, HeatmapChart, CustomChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  MarkLineComponent, MarkAreaComponent, DataZoomComponent, VisualMapComponent,
  CanvasRenderer,
]);

const THEME_COLORS = {
  npu: '#e88c3a',
  cuda: '#4a9e6a',
  aligned: '#3d9966',
  reviewed: '#a89a4a',
  fixing: '#c94a4a',
  unsupported: '#6a6a7a',
  untested: '#d4d4d0',
  fg: '#2a2a35',
  fg2: '#555560',
  fg3: '#888890',
  fg4: '#b0b0b8',
  line: '#e0e0dc',
  lineSoft: '#ececea',
  panel: '#ffffff',
  bg: '#f8f8f6',
};

const commonTooltip = {
  backgroundColor: THEME_COLORS.fg,
  borderColor: THEME_COLORS.fg,
  textStyle: { color: '#f8f8f6', fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11 },
  padding: [8, 10],
  extraCssText: 'border-radius:2px;box-shadow:0 4px 12px rgba(0,0,0,0.15);',
};

export const colors = THEME_COLORS;

export default function EChart({ option, style, notMerge = false, lazyUpdate = false, onEvents }) {
  const mergedOption = useMemo(() => {
    if (option.tooltip === false) {
      return option;
    }
    return {
      tooltip: { ...commonTooltip, ...(option.tooltip || {}) },
      ...option,
    };
  }, [option]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={mergedOption}
      notMerge={notMerge}
      lazyUpdate={lazyUpdate}
      style={{ width: '100%', height: 200, ...style }}
      onEvents={onEvents}
    />
  );
}
