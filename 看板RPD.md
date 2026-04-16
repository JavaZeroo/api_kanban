# API 一致性看护看板 PRD

## 1. 文档信息

| 项     | 内容                   |
| ----- | -------------------- |
| 文档名称  | API 一致性看护看板 PRD      |
| 产品版本  | v1.0                 |
| 对应项目  | NPU PyTorch API 对齐看板 |
| 页面优先级 | P0                   |
| 目标阶段  | MVP                  |
| 适用范围  | Web 平台首页看板页 / 全局看板页  |
| 设计依据  | 需求文档 v0.3            |

---

# 2. 项目背景

当前 torch_npu 在 PyTorch NPU 后端适配过程中，需要持续对比 CUDA 后端在 **功能、精度、内存、确定性** 四个维度上的表现，并以 API 为核心对象进行专项管理。现阶段主要通过表格维护 API 进展，但存在以下问题：

1. 每个 API 存在多维状态，表格难以直观表达整体健康度
2. 状态更新依赖人工维护，不及时、不准确
3. 数据来源分散，缺乏统一入口与证据链
4. 无法快速识别高风险 API、回归 API、长期未更新 API
5. 难以完成从全局总览到单个 API 证据的高效下钻

需求文档已明确该平台需要围绕 API 维度，展示 NPU 与 CUDA 在四个测试维度上的对齐情况，并支持可溯源展示。

---

# 3. 产品目标

## 3.1 页面目标

构建一个面向开发、测试、管理三类角色的 **API 一致性看护看板页**，替代单纯透视表，支持用户快速完成以下任务：

1. 看懂整体对齐健康度
2. 快速识别当前风险集中区域
3. 快速定位具体 API 问题
4. 查看状态依据、数据来源、评审信息与更新时间
5. 追踪最近变化与回归情况

## 3.2 成功标准

用户进入页面后，应能在 30 秒内回答以下问题：

* 当前整体进展如何
* 哪个维度问题最多
* 哪些模块最落后
* 哪些 API 最值得优先处理
* 当前结论是否可信、是否可追溯

---

# 4. 用户与核心场景

| 角色    | 核心诉求                   | 页面关注点                       |
| ----- | ---------------------- | --------------------------- |
| 开发者   | 查询某个 API 是否可安全使用       | API 当前四维状态、差异说明、评审结论、最新测试结果 |
| 测试工程师 | 找到缺口 API、未测 API、失败 API | 风险榜单、模块矩阵、未测试列表、最近变更        |
| 项目管理者 | 评估整体进度与风险              | 全局指标、趋势变化、模块健康度、高风险 API 数量  |

这些角色与场景均与原始文档一致。

---

# 5. 页面定位与设计原则

## 5.1 页面定位

该页面不是静态报表页，而是 **专项运营看板页**。
核心价值不是“展示有多少”，而是“让用户知道哪里要处理、为什么、依据是什么”。

## 5.2 设计原则

### 1）先看全局，再看问题，再看证据

页面结构需支持三层认知路径：

* 第一层：整体健康度
* 第二层：问题集中在哪
* 第三层：证据与明细是什么

### 2）状态不仅展示结果，还展示可信度

同样是“完全对齐”，可能存在：

* 最近 CI 刚验证
* 半年前人工填过
* 没有 source_url
* case 数极少

因此页面必须展示数据新鲜度和来源。

### 3）异常优先

页面首屏应优先突出：

* 待修复
* 不支持
* 未测试
* 最近回归
* 长期未更新

### 4）支持快速下钻

所有核心图块必须可点击并联动 API 列表。

---

# 6. 页面范围

## 6.1 本期范围（P0）

根据原始文档 P0 范围，看板页需覆盖：全局看板、API 搜索、基础状态总览。

本 PRD 中看板页范围包括：

1. 顶部筛选栏
2. 全局指标区
3. 四维态势区
4. 模块 × 维度矩阵
5. 风险焦点区
6. 最近变更流
7. API 一致性矩阵列表
8. 快速展开层
9. 跳转 API 详情页

## 6.2 非本期范围

以下能力保留接口与入口，不在本期完整实现：

* Repo 兼容性分析
* 完整 Diff 版本对比页
* 趋势分析页
* 后台编辑页
* 导出能力的完整控制面板

---

# 7. 页面整体信息架构

## 7.1 页面结构总览

从上到下分为 6 个区块：

1. 页面标题 + 视图控制区
2. 筛选区
3. 全局指标区
4. 四维态势与模块矩阵区
5. 风险焦点与最近变更区
6. API 一致性矩阵列表区

## 7.2 页面层级示意

```text
页面头部
├─ 标题 / 版本快照 / 更新时间 / 视图切换
筛选区
├─ API 搜索 / 模块 / Level / 状态 / 维度 / 来源 / 风险筛选
全局指标区
├─ API 总数 / 健康分 / 四维覆盖率 / 高风险 API / 数据新鲜度 / 最近变更
态势区
├─ 四维状态分布
├─ 模块 × 维度健康矩阵
问题区
├─ 风险榜单
├─ 最近变更流
列表区
├─ API 一致性矩阵列表
├─ 行展开详情
```

---

# 8. 前端页面设计

---

## 8.1 页面头部

### 展示内容

* 页面标题：API 一致性看护看板
* 副标题：展示 torch_npu 与 CUDA 在功能/精度/内存/确定性四维上的对齐状态
* 数据更新时间：最近一次数据同步时间
* 快照选择器：当前版本 / 当前日期
* 视图切换入口：当前视图、Diff 对比（置灰或预告）

### 设计要求

* 页面标题固定在左上
* 右侧显示更新时间与快照信息
* 页面头部固定，不随列表滚动消失

### 前端展示数据

| 字段              | 类型       | 说明                |
| --------------- | -------- | ----------------- |
| snapshot_id     | string   | 当前快照标识            |
| snapshot_label  | string   | 如：main-2026-04-15 |
| data_updated_at | datetime | 数据聚合更新时间          |
| total_api_count | number   | 总 API 数           |

---

## 8.2 顶部筛选栏

### 目标

为用户提供快速收敛范围的操作能力。

### 筛选项设计

| 筛选项       | 组件形式    | 说明                                 |
| --------- | ------- | ---------------------------------- |
| API 名称    | 搜索输入框   | 支持模糊搜索                             |
| 模块        | 多选下拉    | 如 torch.Tensor、torch.nn.functional |
| API Level | 单选/多选下拉 | L0/L1/L2/待定                        |
| 维度        | Tab/多选  | 功能、精度、内存、确定性                       |
| 状态        | 多选下拉    | 完全对齐、已评审差异、待修复、不支持、未测试             |
| 数据来源      | 多选下拉    | manual / ci / import               |
| 最近更新时间    | 日期范围    | 支持最近7天、30天、自定义                     |
| 风险视图      | Switch  | 仅看风险 API                           |
| 最近变更      | Switch  | 仅看最近有变化 API                        |

### 交互规则

* 所有筛选项联动影响下方全部模块
* 页面刷新保留 URL 查询参数
* 支持一键重置
* 默认视图：展示全部 API

### 前端展示数据

筛选项使用来自后台的枚举与聚合：

| 字段                | 类型       |
| ----------------- | -------- |
| module_options    | string[] |
| level_options     | string[] |
| dimension_options | string[] |
| status_options    | string[] |
| source_options    | string[] |

---

## 8.3 全局指标区

### 目标

让用户一眼看清当前整体健康度与风险规模。

### 布局建议

PC 端采用 6 张核心卡片，2 行展示。

### 卡片设计

#### 卡片 1：API 总数

显示：

* 总 API 数
* 已覆盖 API 数
* 未覆盖 API 数

字段：

* total_api_count
* tested_api_count
* untested_api_count

#### 卡片 2：一致性总分

显示：

* 全局健康分
* 相比上次快照变化值

字段：

* alignment_score
* alignment_score_delta

说明：
建议以加权方式计算，便于管理视角判断。

#### 卡片 3：四维覆盖率

显示：

* 功能覆盖率
* 精度覆盖率
* 内存覆盖率
* 确定性覆盖率

字段：

* function_coverage_rate
* accuracy_coverage_rate
* memory_coverage_rate
* determinism_coverage_rate

#### 卡片 4：状态分布

显示：

* 完全对齐数
* 已评审差异数
* 待修复数
* 不支持数
* 未测试数

字段：

* aligned_count
* reviewed_diff_count
* fix_pending_count
* unsupported_count
* untested_count

#### 卡片 5：高风险 API

显示：

* 高风险 API 总数
* 最近新增高风险数
* 最近回归数

字段：

* high_risk_api_count
* new_high_risk_count
* regress_count

#### 卡片 6：数据新鲜度

显示：

* 24h 内更新 API 占比
* 7 天未更新 API 数
* 无来源链接记录数

字段：

* fresh_24h_rate
* stale_7d_count
* no_source_url_count

### 设计要求

* 每张卡片需支持点击筛选
* 卡片右上角可展示趋势箭头
* 高风险和回归卡片用高警示视觉
* 数据新鲜度卡片需与状态卡片明确区分

---

## 8.4 四维态势区

### 目标

回答“当前问题主要集中在哪个维度”。

### 模块 1：四维状态分布条

#### 展示形式

横向堆叠条图，每个维度一条。

#### 每条显示

* 完全对齐占比
* 已评审差异占比
* 待修复占比
* 不支持占比
* 未测试占比

#### 字段

```json
[
  {
    "dimension": "功能",
    "aligned_count": 120,
    "reviewed_diff_count": 10,
    "fix_pending_count": 8,
    "unsupported_count": 2,
    "untested_count": 15
  }
]
```

#### 交互

* 点击某个维度条中的某段状态，筛选对应 API 列表
* Hover 显示具体数量、占比、最近更新时间

---

## 8.5 模块 × 维度健康矩阵

### 目标

回答“哪个模块卡在哪个维度”。

### 展示形式

二维矩阵：

* 行：模块
* 列：功能、精度、内存、确定性

### 每个格子展示内容

建议每格包含：

* 健康分
* 风险数角标
* 小型状态条

示例：

* torch.Tensor × 精度：72 分，5 个风险 API
* torch.nn.functional × 内存：35 分，12 个未测 API

### 字段

```json
[
  {
    "module": "torch.Tensor",
    "dimension": "精度",
    "score": 72,
    "api_count": 56,
    "high_risk_count": 5,
    "aligned_count": 38,
    "reviewed_diff_count": 6,
    "fix_pending_count": 4,
    "unsupported_count": 1,
    "untested_count": 7
  }
]
```

### 交互规则

* 点击格子：筛选“模块 + 维度”
* Hover：弹出该模块该维度的状态分布和 Top 风险 API
* 支持按分数排序模块

### 视觉要求

* 不是单一纯色热力格
* 建议用“分数 + 小型堆叠条 + 风险角标”的复合表达
* 这样可明显区别于透视表

---

## 8.6 风险焦点区

### 目标

把最需要关注的问题自动暴露出来。

### 子模块设计

#### 模块 1：待修复差异 TOP API

展示：

* API 名称
* 模块
* 所属维度
* 当前状态
* fail 数
* 最近更新时间

字段：

* api_name
* module
* dimension
* status
* fail_case_count
* updated_at

#### 模块 2：未测试 TOP API

展示：

* API 名称
* module
* 未测试维度数量
* API Level
* 最近更新时间

字段：

* api_name
* module
* untested_dimension_count
* api_level
* updated_at

#### 模块 3：最近回归 API

展示：

* API 名称
* 变化前状态
* 当前状态
* 变化维度
* 变化时间

字段：

* api_name
* dimension
* from_status
* to_status
* changed_at

#### 模块 4：已评审差异 API

展示：

* API 名称
* 维度
* 差异说明摘要
* reviewer
* reviewed_at

字段：

* api_name
* dimension
* deviation_note
* reviewer
* reviewed_at

### 交互规则

* 点击任一项可跳详情页
* Hover 展示更多摘要
* 支持“查看更多”进入完整问题列表

---

## 8.7 最近变更流

### 目标

回答“最近发生了什么变化”。

### 展示形式

时间倒序活动流。

### 每条记录展示内容

* 时间
* API 名称
* 维度
* 变更类型
* 操作人
* 来源
* 可选说明
* source_url 链接

### 变更类型

* 状态更新
* CI 新上报
* 新增测试用例
* 完成评审
* 从已测变为回归
* 从待修复变为完全对齐

### 字段

```json
[
  {
    "event_time": "2026-04-15T10:32:00",
    "api_name": "Tensor.to",
    "dimension": "精度",
    "event_type": "status_changed",
    "from_status": "有差异（待修复）",
    "to_status": "有差异（已评审）",
    "updated_by": "zhangsan",
    "data_source": "manual",
    "source_url": "",
    "comment": "硬件限制，不再优化"
  }
]
```

### 交互规则

* 支持按来源过滤：manual / ci / import
* 点击事件跳转 API 详情页对应维度
* source_url 可直接打开

### 视觉要求

* 强调“变化方向”
* 回归类事件使用高警示样式
* 已完成修复使用正向样式

---

## 8.8 API 一致性矩阵列表

### 目标

在同一屏中提供高密度但可读的 API 状态总览。

### 列表展示列

| 列名        | 是否必显 | 说明               |
| --------- | ---- | ---------------- |
| API 名称    | 是    | 支持点击             |
| 所属模块      | 是    | 可筛选              |
| API Level | 是    | L0/L1/L2         |
| 功能状态      | 是    | 状态芯片 + 通过率       |
| 精度状态      | 是    | 状态芯片 + 通过率       |
| 内存状态      | 是    | 状态芯片 + 通过率       |
| 确定性状态     | 是    | 状态芯片 + 通过率       |
| 一致性得分     | 是    | 0~100            |
| 风险标签      | 是    | 高风险/回归/stale/已评审 |
| 数据来源      | 是    | manual/ci/import |
| 最近更新时间    | 是    | yyyy-mm-dd hh:mm |
| 操作        | 是    | 展开/跳详情           |

### 四维状态单元格展示规范

每个维度单元格展示 3 层信息：

1. 状态颜色
2. 状态文本
3. 简要指标（通过率 / case 数 / 已评审标识）

示例：

* 功能：完全对齐｜98%｜120 cases
* 精度：已评审差异｜91%｜reviewed
* 内存：未测试｜0 cases
* 确定性：待修复｜3 fail

### 字段结构建议

```json
{
  "api_name": "Tensor.to",
  "api_module": "torch.Tensor",
  "api_level": "L0",
  "alignment_score": 84,
  "risk_tags": ["已评审差异", "内存未测试"],
  "data_source_summary": ["ci", "manual"],
  "updated_at": "2026-04-15T11:00:00",
  "dimensions": {
    "function": {
      "status": "完全对齐",
      "pass_rate": 0.98,
      "case_total": 120,
      "fail_count": 0,
      "reviewed": false
    },
    "accuracy": {
      "status": "有差异（已评审）",
      "pass_rate": 0.91,
      "case_total": 60,
      "fail_count": 2,
      "reviewed": true
    },
    "memory": {
      "status": "未测试",
      "pass_rate": null,
      "case_total": 0,
      "fail_count": 0,
      "reviewed": false
    },
    "determinism": {
      "status": "完全对齐",
      "pass_rate": 1.0,
      "case_total": 15,
      "fail_count": 0,
      "reviewed": false
    }
  }
}
```

### 交互规则

* 支持按列排序：名称、得分、更新时间、风险等级
* 点击 API 名称进入详情页
* 点击单元格进入该 API 的该维度详情
* 行展开可查看简版明细

---

## 8.9 行展开层设计

### 目标

让用户不离开列表页也能看到关键证据。

### 展开内容

分成四个小卡片，对应四个维度。

每个维度卡片展示：

* 当前状态
* 差异说明
* reviewer
* reviewed_at
* 最新 source_url
* case 汇总：pass / fail / error / skip
* 最近运行时间
* Top 3 失败 case
* 是否有代码片段

### 字段

直接基于文档中 API 对齐记录与测试用例字段展开。

| 字段                                           | 说明     |
| -------------------------------------------- | ------ |
| status                                       | 当前维度状态 |
| deviation_note                               | 差异说明   |
| reviewer                                     | 评审人    |
| reviewed_at                                  | 评审时间   |
| source_url                                   | 可溯源链接  |
| pass_count/fail_count/error_count/skip_count | 用例结果统计 |
| latest_run_at                                | 最近运行时间 |
| top_failed_cases                             | 失败用例列表 |

---

# 9. 前端展示数据定义

下面是前端需要的主要数据对象。

---

## 9.1 全局概览数据

```json
{
  "snapshot_id": "main-2026-04-15",
  "data_updated_at": "2026-04-15T12:00:00",
  "total_api_count": 820,
  "tested_api_count": 650,
  "untested_api_count": 170,
  "alignment_score": 76,
  "alignment_score_delta": 3,
  "high_risk_api_count": 92,
  "new_high_risk_count": 8,
  "regress_count": 3,
  "fresh_24h_rate": 0.62,
  "stale_7d_count": 210,
  "no_source_url_count": 37
}
```

---

## 9.2 四维态势数据

```json
[
  {
    "dimension": "功能",
    "coverage_rate": 0.88,
    "aligned_count": 510,
    "reviewed_diff_count": 45,
    "fix_pending_count": 30,
    "unsupported_count": 10,
    "untested_count": 70
  }
]
```

---

## 9.3 模块矩阵数据

```json
[
  {
    "module": "torch.Tensor",
    "dimension": "内存",
    "score": 41,
    "api_count": 90,
    "high_risk_count": 16,
    "aligned_count": 32,
    "reviewed_diff_count": 5,
    "fix_pending_count": 6,
    "unsupported_count": 1,
    "untested_count": 46
  }
]
```

---

## 9.4 风险列表数据

```json
{
  "top_fix_pending": [],
  "top_untested": [],
  "recent_regressions": [],
  "reviewed_diffs": []
}
```

---

## 9.5 变更流数据

```json
[
  {
    "event_id": "evt_001",
    "event_time": "2026-04-15T10:32:00",
    "api_name": "Tensor.to",
    "api_module": "torch.Tensor",
    "dimension": "精度",
    "event_type": "status_changed",
    "from_status": "有差异（待修复）",
    "to_status": "有差异（已评审）",
    "updated_by": "zhangsan",
    "data_source": "manual",
    "source_url": "https://ci/job/123",
    "comment": "硬件限制，不再优化"
  }
]
```

---

## 9.6 API 列表数据

```json
{
  "total": 820,
  "page_no": 1,
  "page_size": 50,
  "list": []
}
```

---

# 10. 页面状态与样式规范

## 10.1 状态颜色规范

| 状态       | 颜色建议 | 说明       |
| -------- | ---- | -------- |
| 完全对齐     | 绿色   | 正向状态     |
| 有差异（已评审） | 黄色   | 可接受差异    |
| 有差异（待修复） | 橙红色  | 风险状态     |
| 不支持      | 深红色  | 明确不支持    |
| 未测试      | 灰色   | 数据缺失/未覆盖 |

## 10.2 风险标签规范

建议增加辅助标签，不与主状态混淆：

* 高风险
* 回归
* stale
* reviewed
* 无来源
* CI 最新

## 10.3 数据新鲜度显示

根据更新时间增加标签：

* 24h 内：新鲜
* 7 天内：正常
* 7 天以上：陈旧
* 30 天以上：高风险陈旧

---

# 11. 关键交互说明

## 11.1 页面联动

* 点击全局卡片 → 更新列表与图表
* 点击矩阵格子 → 自动带筛选条件下钻
* 点击风险榜单 → 跳详情或定位列表
* 点击变更流 → 进入对应 API 维度详情

## 11.2 Hover 信息层

以下对象必须有 Hover 浮层：

* 状态芯片
* 模块矩阵格子
* 风险标签
* 变更事件

Hover 展示内容优先级：

1. 状态说明
2. 用例统计
3. reviewer / reviewed_at
4. source_url
5. 最近运行时间

## 11.3 URL 状态持久化

筛选条件需同步到 URL，便于分享与回到当前视图。

---

# 12. 前端异常与空态设计

## 12.1 空数据

场景：

* 筛选后无结果
* 当前快照无数据

展示：

* 空态插图
* 当前筛选条件提示
* 一键清空筛选

## 12.2 加载态

* 首屏使用骨架屏
* 列表区域分页加载
* 图表区局部 loading

## 12.3 错误态

* 请求失败时展示重试按钮
* 对 source_url 打不开给出弱提示
* 对缺失 reviewer / reviewed_at 的“已评审差异”显示数据异常标志

---

# 13. 后端接口需求（面向前端）

这里重点不是后台实现细节，而是前端需要哪些接口。

## 13.1 获取看板概览

`GET /api/dashboard/summary`

返回：

* 全局指标
* 四维状态分布
* 数据更新时间

## 13.2 获取模块矩阵

`GET /api/dashboard/module-matrix`

参数：

* snapshot_id
* filters

返回：

* 模块 × 维度矩阵数据

## 13.3 获取风险榜单

`GET /api/dashboard/risk-panels`

返回：

* 待修复
* 未测试
* 回归
* 已评审差异

## 13.4 获取变更流

`GET /api/dashboard/activity-feed`

参数：

* time_range
* source
* module

## 13.5 获取 API 列表

`GET /api/apis`

参数：

* keyword
* modules
* levels
* dimensions
* statuses
* sources
* only_risk
* only_recent_changed
* sort_by
* page_no
* page_size

## 13.6 获取 API 行展开明细

`GET /api/apis/{api_name}/summary-detail`

返回：

* 四维简版明细
* case 汇总
* 最新 source_url
* reviewer 信息

---

# 14. 指标口径定义

为避免前后端与管理层认知不一致，需在 PRD 中明确口径。

## 14.1 一致性总分

以 API 为单位，基于四维状态加权计算。

建议权重值：

* 完全对齐 = 100
* 已评审差异 = 70
* 待修复 = 30
* 不支持 = 0
* 未测试 = 0

单 API 得分 = 四维平均
全局得分 = 所有 API 平均

## 14.2 高风险 API

满足任一条件即算高风险：

* 任一维度为“待修复”
* 任一维度为“不支持”
* L0/L1 API 存在“未测试”
* 近一次快照发生回归

## 14.3 覆盖率

某维度下，非“未测试”的 API 数 / 全部 API 数

## 14.4 回归

状态由更优变为更差，例如：

* 完全对齐 → 待修复
* 完全对齐 → 不支持
* 已评审差异 → 待修复

## 14.5 数据新鲜度

基于 updated_at / run_at / source_url 综合判断。

---

# 15. 埋点需求

前端建议补基础埋点，方便后续验证页面价值。

| 事件                  | 说明      |
| ------------------- | ------- |
| dashboard_view      | 页面曝光    |
| filter_changed      | 筛选修改    |
| matrix_cell_clicked | 模块矩阵点击  |
| risk_item_clicked   | 风险项点击   |
| api_row_expanded    | API 行展开 |
| api_detail_clicked  | 进入详情    |
| source_url_clicked  | 打开溯源链接  |

---

# 16. 验收标准

## 16.1 功能验收

* 支持按 API / 模块 / 维度 / 状态 / 来源筛选
* 全局指标、四维态势、模块矩阵、风险榜单、变更流、API 列表全部可正常展示
* 所有区块联动一致
* 列表可排序、分页、展开
* 行展开可展示 reviewer、reviewed_at、source_url、case 汇总

## 16.2 体验验收

* 首屏可快速识别当前健康度和风险规模
* 风险 API 可在 2 次点击内定位到明细
* 与传统表格相比，能直观看到“风险、变化、证据”

## 16.3 数据验收

* 状态口径一致
* 数量统计可对账
* source_url、updated_at、reviewer 字段准确显示
* 已评审差异必须有说明与评审信息，否则标记异常

---

# 17. MVP 实现建议

若需要控制首期复杂度，建议按以下顺序实现：

## 必做

1. 顶部筛选栏
2. 全局指标区
3. 四维态势区
4. 模块 × 维度矩阵
5. 风险焦点区
6. API 一致性矩阵列表
7. 行展开层

## 可后置

1. 最近变更流的高级筛选
2. 复杂 Hover 证据层
3. 快照差异高亮
4. 批量导出入口
