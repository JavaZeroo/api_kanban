# NPU PyTorch API 一致性看护看板 · 前端原型

面向 torch_npu 团队的 API 对齐看护看板前端。纯前端原型，数据全部来自 `src/mock/data.ts`，
后端接口按 PRD 第 13 节预留，对接时替换 `mock` 即可。

## 技术栈

- Vite 5 + React 18 + TypeScript 5
- Tailwind CSS 3（自定义深色主题）
- 无额外图表库：指标 / 进度 / 矩阵 / 变更流均用纯 SVG + CSS 手绘，无 runtime 依赖膨胀

## 运行

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # 产物到 frontend/dist
npm run preview
```

## 页面结构

对应 `看板RPD.md` 第 6.1 节 P0 范围：

```
Header（标题 / 快照 / 数据更新时间 / 导出 / Diff 入口）
└─ FilterBar        搜索 / 模块 / Level / 维度 / 状态 / 来源 / 风险 / 最近变更
└─ MetricCards      总分 Gauge / 四维覆盖率 / 状态分布 / 高风险 / 数据新鲜度
└─ DimensionStatus  四维堆叠条（点击下钻）
└─ ModuleMatrix     模块×维度复合格子：分数 + 迷你堆叠条 + 风险角标
└─ RiskPanel        待修复 / 未测试 / 回归 / 已评审差异 四榜单（Tab 切换）
└─ ActivityFeed     时间倒序变更流，from→to 状态箭头，来源徽标
└─ ApiTable         四维状态复合单元格 + Score 圆环 + 行展开四维证据
```

## 设计思路：如何与透视表拉开差距

透视表的本质缺陷是"单格只能表达一维信息 + 一种颜色"。本看板在每个信息单元上做了
复合表达：

1. **状态 + 可信度 + 数据新鲜度** 三位一体
   - 状态芯片颜色 = 对齐状态
   - 芯片后的圆点 = 最近运行时间分级（24h / 7d / 30d / 30d+）
   - reviewed 标志额外用 ✓ 徽标突出
2. **矩阵复合格子**：每格同时承载分数、状态分布（迷你堆叠条）、风险角标，避开单一热力图
3. **回归与修复方向感**：变更流的 from→to 使用箭头和警示/正向配色，拉开普通"状态列"
4. **异常优先**：高风险卡片独立配色 + 脉动点；最近变更流中 regression 事件整行高亮
5. **证据链**：行展开层 = 评审结论 + Top 失败用例 + 用例通过率条 + 溯源链接
6. **下钻联动**：指标卡 / 态势条 / 矩阵格子点击直接更新全局筛选，全页面联动

## 目录

```
src/
├── App.tsx              页面装配
├── main.tsx             入口
├── index.css            Tailwind + 深色主题 + 自定义类
├── types.ts             类型定义、状态/维度常量、配色
├── utils.ts             聚合 / 过滤 / 排序 / 新鲜度 / 矩阵构造 / selectors
├── store.tsx            FilterContext（全局筛选 state）
├── mock/data.ts         38 条 API + 10 条变更事件的 Mock 数据
└── components/
    ├── Header.tsx
    ├── FilterBar.tsx
    ├── MetricCards.tsx
    ├── DimensionStatus.tsx
    ├── ModuleMatrix.tsx
    ├── RiskPanel.tsx
    ├── ActivityFeed.tsx
    ├── ApiTable.tsx
    └── ui/
        ├── StatusChip.tsx
        ├── StackedBar.tsx
        └── Gauge.tsx
```

## 后端对接预留

按 PRD §13，仅需实现以下接口并替换 `mock/data.ts`：

| 接口                                      | 当前 mock 等价项                 |
| ----------------------------------------- | -------------------------------- |
| `GET /api/dashboard/summary`              | `MetricCards` 内 `metrics` 聚合  |
| `GET /api/dashboard/module-matrix`        | `buildMatrix(list)`              |
| `GET /api/dashboard/risk-panels`          | `topFixPending / topUntested / …`|
| `GET /api/dashboard/activity-feed`        | `ACTIVITY_EVENTS`                |
| `GET /api/apis`                           | `API_RECORDS` + `applyFilter`    |
| `GET /api/apis/{name}/summary-detail`     | 行展开 `ExpandedPanel`           |

替换方式：新建 `src/api/client.ts`，把 `utils.ts` 中派生函数的调用点改为异步 `useEffect`
加载即可，其余组件无需动。
