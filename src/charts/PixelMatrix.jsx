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

  const visibleModules = useMemo(() => {
    return MODULES.filter(mod => apis.some(a => a.module === mod.key));
  }, [apis]);

  if (!visibleModules.length) {
    return (
      <div className="pxmat-empty">
        <b>没有匹配的 API</b>
        <span>调整搜索词或等级筛选后再查看。</span>
      </div>
    );
  }

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
