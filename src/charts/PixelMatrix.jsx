import { useMemo } from 'react';
import EChart, { colors } from '../components/EChart';
import { MODULES, DIMENSIONS, STATUS_META, moduleRate } from '../data';

const STATUS_COLORS = {
  aligned: colors.aligned,
  reviewed: colors.reviewed,
  fixing: colors.fixing,
  unsupported: colors.unsupported,
  untested: colors.untested,
};

export default function PixelMatrix({ apis, onFocus }) {
  const seriesData = useMemo(() => {
    const data = [];
    let y = 0;
    MODULES.forEach(mod => {
      const list = apis.filter(a => a.module === mod.key);
      list.forEach((a, x) => {
        const statuses = DIMENSIONS.map(d => a.dims[d.key]);
        // each api rendered as a 2x2 quad block
        data.push({
          value: [x, y, a, statuses],
          itemStyle: { color: 'transparent', borderColor: colors.panel, borderWidth: 1 },
        });
      });
      y += 1;
    });
    return data;
  }, [apis]);

  const customRender = (params, api) => {
    const x = api.value(0);
    const y = api.value(1);
    const a = api.value(2);
    const statuses = api.value(3);
    const size = 14;
    const gap = 2;
    const coord = api.coord([x, y]);
    const x0 = coord[0] - size / 2;
    const y0 = coord[1] - size / 2;
    const rects = [];
    const positions = [
      [0, 0], [1, 0], [0, 1], [1, 1],
    ];
    positions.forEach(([px, py], i) => {
      rects.push({
        type: 'rect',
        shape: {
          x: x0 + px * (size / 2 + 0.5),
          y: y0 + py * (size / 2 + 0.5),
          width: size / 2 - 0.5,
          height: size / 2 - 0.5,
        },
        style: { fill: STATUS_COLORS[statuses[i]] || colors.untested },
      });
    });
    return {
      type: 'group',
      children: rects,
      style: { cursor: 'pointer' },
      onclick: () => onFocus && onFocus(a),
    };
  };

  // Since ECharts custom series click handling is limited, use a simpler heatmap approach
  // where each API is a cell colored by its "worst" dimension status
  const heatData = useMemo(() => {
    const data = [];
    let y = 0;
    MODULES.forEach(mod => {
      const list = apis.filter(a => a.module === mod.key);
      list.forEach((a, x) => {
        const statuses = DIMENSIONS.map(d => a.dims[d.key]);
        const worst = statuses.includes('fixing') ? 'fixing'
          : statuses.includes('unsupported') ? 'unsupported'
          : statuses.includes('untested') ? 'untested'
          : statuses.includes('reviewed') ? 'reviewed'
          : 'aligned';
        data.push({
          value: [x, y, a, worst],
          itemStyle: { color: STATUS_COLORS[worst] },
        });
      });
      y += 1;
    });
    return data;
  }, [apis]);

  const maxX = Math.max(...heatData.map(d => d.value[0]), 0) + 1;
  const option = {
    grid: { top: 8, right: 60, bottom: 8, left: 140 },
    visualMap: {
      show: false,
      min: 0,
      max: 1,
    },
    xAxis: { type: 'category', show: false, data: Array.from({ length: maxX }, (_, i) => i) },
    yAxis: {
      type: 'category',
      data: MODULES.map(m => m.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.fg2,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        formatter: (val, idx) => {
          const count = apis.filter(a => a.module === MODULES[idx].key).length;
          return `${val}\n{count|${count} API}`;
        },
        rich: {
          count: { fontSize: 10, color: colors.fg4, lineHeight: 14 },
        },
      },
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: { show: false },
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
        const a = p.data.value[2];
        const dims = DIMENSIONS.map(d => ({
          name: d.name,
          status: STATUS_META[a.dims[d.key]].short,
          color: STATUS_COLORS[a.dims[d.key]],
        }));
        return `<div style="font-weight:500;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px">${a.name}</div>
                <div style="color:${colors.fg4};margin-bottom:4px">${a.level} · ${a.freq?.toLocaleString()} calls</div>
                ${dims.map(d => `<div style="display:flex;justify-content:space-between;gap:12px"><span>${d.name}</span><span style="color:${d.color}">${d.status}</span></div>`).join('')}
                <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1)">用例 <b>${a.casePass}/${a.caseTotal}</b></div>`;
      },
    },
  };

  return <EChart option={option} style={{ height: MODULES.length * 28 + 16 }} />;
}
