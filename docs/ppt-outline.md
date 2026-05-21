# PyTorch on NPU API 一致性看板 — 从零搭建全记录

> PPT 文字大纲，可直接导入 Gamma / MindShow 等工具一键生成

---

## Slide 1 · 封面

**标题**: PyTorch on NPU · API 一致性看板

**副标题**: 用 AI Agent 从零搭建生产级数据看板 — 工具链、Skills、Prompt 全揭秘

**信息**: 昇腾 NPU × PyTorch 2.7 × 5,501 API 对齐追踪

---

## Slide 2 · 背景与目标

**一句话**: PyTorch 2.7 全量 5,501 个 API 要在昇腾 NPU 上与 CUDA 逐一对齐，覆盖 4 个维度（功能/精度/内存/确定性），下游 56 个开源仓库能否跑起来全看这层。

**痛点**: 数据散落 3 个 Excel，没人能一眼看清全局。

**目标**: 一个页面 → 逐层下钻 → 从「哪个维度最差」定位到「具体哪个 API 哪一维有问题」。

---

## Slide 3 · 看板五大功能（API 目的用途）

| 模块 | 做什么 | 一句话 |
|------|--------|--------|
| **Hero 总览** | L0 / L0+L1 / 全量 三级环形仪表盘 + 加权对齐率 + 30d 变化 | 一眼看全局 |
| **Dim 四维拆解** | 功能/精度/内存/确定性各自对齐率 + 分布 + 趋/56 全绿 | 下游能不能跑 |
| **Trend 趋势** | 30d 多线趋势 + 12 周迭代速度 + 每日变更流 | 进度可追踪 |

---
势 | 主攻方向：精度 3 fixing + 显存 59 fixing |
| **Matrix 对齐矩阵** | 5,501 API 像素级可视化，hover 详情，点击浮层 | 每个 API 一行像素 |
| **Repo 仓库可用性** | 56 仓库按 stars 排序，生态可用率 95.1%，32
## Slide 4 · 怎么使用

**全局交互**:
- ScopeBar 实时统计当前范围
- L0/L1/L2 筛选 + CANN 版本切换（8.0 / 9.0 / 9.0.RC1）

**下钻链路**:
- 矩阵像素 → FocusCard 浮层 → `/api/:name` 详情页（元信息 + 四维卡片 + DTS 工单 + 复用用例）
- `/apis` 列表页：全量搜索、筛选、排序、分页

**数据导入**: JSON/CSV 导入 → 逐条更新维度状态；postMessage 外部控制编辑模式

---

## Slide 5 · 从零搭建：Agent 工具链（核心）

**主力**: **Claude Code**（VS Code IDE 集成），项目初始化阶段使用 **Claude Opus 4.6** 模型，中后期维护使用**K2.6**和**DeepSeekV4 pro**

```
Claude Code (Opus 4.6)
  ├── CLI 模式       → 直接读写文件、执行命令、git 操作
  ├── Plan Mode      → 复杂需求先出架构方案，确认后再写代码
  ├── 子 Agent       → Explore（代码探索）、Plan（架构设计）
  └── Skills（项目内置 2 个）:
       ├── frontend-design      → 前端组件/页面设计
       └── excel-data-analyzer  → Excel 数据分析、统计、交叉验证
```

**设计风格**: 整体 UI 沿用海外主流设计趋势 — 暗色主题、CSS 变量体系、纯 SVG/DOM 图表、系统默认字体，无国内常见的花哨渐变和大圆角。

**Skills 使用场景**:
- `frontend-design`：每次新增图表组件或调整布局时调用，确保产出符合设计规范
- `excel-data-analyzer`：数据对齐阶段反复使用，扫描 Excel 源文件、统计各列分布、验证数字一致性

**开发常用 CLI 命令**:

| 命令 | 用途 |
|------|------|
| `/compact` | 压缩上下文，对话过长时释放 token，保留关键信息不丢失 |
| `/clear` | 清空对话，切换任务前重置上下文 |
| `/init` | 初始化项目 CLAUDE.md，生成 Agent 长期记忆文件 |
| `/plan` | 进入 Plan Mode，复杂需求先出方案再编码 |
| `! npm run dev` | `!` 前缀直接在终端执行，Agent 实时读取输出 |
| `! node data/import.mjs` | 重新从 XLSX 生成 API 数据 |

**辅助**: Gemini（补全）+ VS Code 诊断

---

## Slide 6 · 从零搭建：Spec 驱动的项目启动

**第一步不是写代码，是写 Spec（规格文档）**

启动流程：
```
需求描述 → Spec 文档（api-spec.md）→ 技术方案 → 开始编码
```

**api-spec.md 内容**:
- 数据模型定义（API 对象结构、字段类型、状态枚举）
- RESTful 接口规格（7 个接口的请求/响应格式）
- Excel 导入处理规则（与 import.mjs 一致的状态映射）

**为什么先写 Spec**:
- Agent 需要**明确的数据结构和接口约定**才能写出正确的代码
- Spec 是 Agent 系统提示词的前身 — 后续的 `agent-prompt.md`（441 行）就是 Spec 的持续演进版
- 避免 Agent 反复猜测数据字段导致返工
![alt text](image.png)

---

## Slide 7 · 从零搭建：开发全景（8 Phase / 48 commit）

| Phase | 内容 | 关键产出 |
|-------|------|---------|
| **P1 Spec + 脚手架** | api-spec.md → Vite+React 初始化 | 项目骨架 |
| **P2 数据层** | 3 个 Excel → import.mjs → apis.js + REPOS | 5,522 条 API 数据 |
| **P3 核心仪表盘** | Hero + Dim + Matrix + Repo + Trend | 5 大区块全部上线 |
| **P4 详情页** | /apis 列表 + /api/:name 详情 + 路由 | 下钻链路贯通 |
| **P5 交互增强** | 导入/筛选/ScopeBar/FocusCard/快捷键 | 操作体验闭环 |
| **P6 版本+生态** | CANN 版本选择器 + 数据对齐修正 | 多版本支持 |
| **P7 视觉优化** | ECharts→纯 SVG、缩小仪表盘、去字体 | 性能 + 视觉 |
| **P8 上游合并** | 同步 upstream，解决冲突 | 协作流程跑通 |

---

## Slide 8 · Prompt 经验：数据层

**经典提示词**:

> "从 Excel 导入真实 API 数据：读取 2.7全量API.xlsx 和 Q1 2357 API 0416.xlsx，合并生成 apis.js。状态映射规则：√→aligned, √-旧标准对齐→reviewed, x/DTS编号→fixing, 空→untested"

**产出**: `data/import.mjs` + `src/data/apis.js`（5,522 条 API）

**经验**:
- 映射规则**逐条写死**，不留给 Agent 猜测空间
- 提前告知「数据可能为 null」→ Agent 会自动加防御
- 两个 Excel 分开导入再合并，不要一次性全塞给 Agent
- 数据对齐必须**脚本化**（`node -e "XLSX.readFile(...)"`），不靠 Agent 推理

---

## Slide 9 · Prompt 经验：可视化层 + 架构决策

**场景：ECharts → 纯 SVG**

> "将 HeroGauge 从 ECharts 改为纯 SVG 弧形实现，修复重影问题"

原因：ECharts pie label 与 DOM 文字两层渲染，z-index 无效。纯 SVG 就是 arc path + text，完全可控。

**场景：antd 使用边界（关键约束）**

> "antd 仅用于 Table/Card/Tag/Drawer 等功能组件，布局不用 Row/Col"

原因：antd Row/Col 与原生 CSS 混用直接白屏。这条约束避免了无数次返工。

**核心经验**:
- **把「不做什么」写进 Agent 上下文**比「要做什么」更重要
- 技术约束必须附带**原因**，Agent 不理解原因会反复碰壁
- 简单图表用纯 SVG/DOM 的决策要**一开始就写入 Agent prompt**

---

## Slide 10 · Prompt 经验：数据对齐攻坚战

**问题**: Excel 数据与前端显示对不上（5,450 vs 5,522 vs 5,501）

**解决** — `excel-data-analyzer` Skill 反复调用:

```
1. 扫描 Excel 源文件 → 提取各列实际分布
2. 确定基准：Q1 2357 API 0416.xlsx → L0+L1，2.7全量API.xlsx → 全量
3. 按维度/列逐个统计 → 输出各值分布
4. 更新所有硬编码点（全局常量 → 环图 → 百分比 → 四维度）
5. 验证一致性：全量=L0+L1+L2，环图=卡片，维度总和=2357
```

**教训**: 脏数据源（删除/重复/空值/格式不一致）下，**硬编码标准值 + 脚本验证 > 动态计算容错**

---

## Slide 11 · Agent 系统提示词设计

**核心理念**: `agent-prompt.md`（441 行）= Agent 的长期记忆 = 每轮对话零成本启动

**12 段结构**:

```
1. 项目概述 + 关键数字
2. 技术栈 + 版本 + 约束（不能用什么）
3. 完整目录结构（200+ 行文件职责）
4. 数据层详解（API 结构、状态映射、模块、仓库）
5. 路由与组件树
6. 每个组件的 Props 接口 + 颜色规范
7. 5 个关键指标公式
8. 硬编码标准值表
9. 48 条历史提示词 + 对应 commit
10. 10 个 FAQ 修复记录（根因 + 解法）
11. Git 工作流
12. 10 条开发禁忌
```

**效果**: 新对话加载即进入开发，无需重新探索代码。

---


## Slide 12 · 成果

| 指标 | 数值 |
|------|------|
| 代码量 | ~4,000+ 行 |
| 组件 | 20 个 / 3 页面路由 |
| 数据 | 5,501 API × 4 维度 × 56 仓库 |
| 图表 | 11 种（环形/像素/折线/柱状/散点/热力/气泡/条形/迷你/变更流/仪表盘） |
| 周期 | 8 Phase / 48 commit |

**关键数据**: L0+L1 100% 覆盖，对齐率 99.4% | 生态可用率 95.1%，32/56 全绿

---

## Slide 13 · 总结

1. **Agent 工具链 = Claude Code + 内置 Skills（frontend-design + excel-data-analyzer）+ Spec 先行**
2. **架构约束前置** — "不做什么"比"做什么"更能防返工
3. **数据对齐是最大难点** — 脏数据源下硬编码 + 脚本验证最可靠
4. **Agent prompt（agent-prompt.md）是核心资产** — 写得越好，后续对话效率越高

---

## Slide 14 · Q&A

**项目**: github.com/ChanSinging/npu_api_dashboard

**技术栈**: React 18 + Vite 5 + Ant Design 5 + ECharts 6 + XLSX + Claude Code Agent
