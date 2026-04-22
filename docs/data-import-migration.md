# 数据导入功能文档

## 1. 数据模型

### 1.1 核心枚举

| 枚举 | 可选值 | 说明 |
|------|--------|------|
| `AlignmentStatus` | `fully_aligned` / `diff_reviewed` / `diff_unreviewed` / `not_tested` | 对齐状态 |
| `TestDimension` | `function` / `precision` / `memory` / `determinism` | 测试维度 |
| `ApiCategory` | `distributed` / `framework` / `operator` / `utility` | API 分类 |
| `TestResult` | `pass` / `fail` / `skip` | 单条用例结果 |

### 1.2 导入数据结构 (`ImportData`)

```ts
interface ImportData {
  apiName: string;              // 必填，API 名称
  module: string;               // 必填，所属模块，如 torch.Tensor
  dimension: TestDimension;     // 必填，测试维度
  status: AlignmentStatus;      // 必填，对齐状态
  pytorchDocUrl?: string;       // 可选
  pytorchVersion?: string;      // 可选
  category?: ApiCategory;       // 可选，默认按 module 推导
  standard?: string;            // 可选，对齐标准（精度/内存维度）
  actualError?: string;         // 可选，实际误差（精度/内存维度）
  dataSource?: string;          // 可选，数据来源
  traceabilityLink?: string;    // 可选，追溯链接
  testCases?: Array<{           // 可选，测试用例列表
    name: string;
    result: TestResult;
    errorMessage?: string;
    codeSnippet?: string;
    source?: string;            // 'community' 或 'torch_npu'
  }>;
  difference?: {                // 可选，差异说明
    description: string;
    reviewer?: string;
    reviewTime?: string;
  };
}
```

### 1.3 存储中的 API 结构 (`ApiInfo`)

```ts
interface ApiInfo {
  id: string;                   // 由 `${module}.${apiName}` 组合生成
  name: string;
  module: string;
  dimensions: {
    function: DimensionInfo;
    precision: DimensionInfo;
    memory: DimensionInfo;
    determinism: DimensionInfo;
  };
  lastUpdated: string;          // ISO 8601
  // ... 其他可选元数据字段
}

interface DimensionInfo {
  status: AlignmentStatus;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate?: number;
  testCases: TestCase[];
  standard?: string;
  actualError?: string;
  difference?: DifferenceDetail;
  communityPassRate?: number;   // 仅 function 维度
  torchNpuPassRate?: number;    // 仅 function 维度
}
```

---

## 2. 输入格式与解析

### 2.1 JSON 格式

- 支持**数组**或**单个对象**。
- 通过标准 `JSON.parse` 解析，失败后直接报错。

**示例：**
```json
[
  {
    "apiName": "example_api",
    "module": "torch.Tensor",
    "dimension": "precision",
    "status": "fully_aligned",
    "standard": "FP32",
    "actualError": "0.0003",
    "testCases": [
      { "name": "test_precision_fp32", "result": "pass", "source": "community" }
    ]
  }
]
```

### 2.2 CSV 格式

- 第一行为表头，必填列：`apiName`, `module`, `dimension`, `status`。
- 采用简单逗号分割（`,`），不处理引号包裹或转义逗号。
- **限制**：CSV 不支持导入 `testCases` 数组与 `difference` 对象，仅适合导入标量字段。

**示例：**
```csv
apiName,module,dimension,status,pytorchDocUrl,pytorchVersion,category,standard,actualError,dataSource
example_api,torch.Tensor,precision,fully_aligned,https://...,2.3,operator,FP32,0.0003,自动化测试
```

---

## 3. 核心导入逻辑 (`importData`)

### 3.1 逐条处理流程

对每条 `ImportData` 记录执行以下操作：

1. **必填校验**
   - `apiName`, `module`, `dimension`, `status` 必须存在。
   - `dimension` 必须在 `[function, precision, memory, determinism]` 之中。
   - `status` 必须在 `[fully_aligned, diff_reviewed, diff_unreviewed, not_tested]` 之中。
   - 任一校验失败，计入 `failed`，错误信息写入 `errors`。

2. **查找或创建 API**
   - API ID 规则：`` `${module}.${apiName}` ``。
   - 若已存在：读取该 API 对象。
   - 若不存在：创建新 API，四个维度初始化为空状态（`status: 'not_tested'`, `totalCases: 0`, `testCases: []`），`category` 按 `module` 自动推导。

3. **更新目标维度**
   - 将记录中的 `status` 写入对应维度。

4. **处理测试用例（`testCases`）**
   - 若提供了 `testCases`：
     - 为用例生成 ID：`` `${apiId}-${dimension}-${index}` ``。
     - 统计 `totalCases`、`passedCases`、`failedCases`，计算 `passRate`。
     - 若维度为 `function`，额外按 `source` 分组统计：
       - `communityPassRate`：`source === 'community'` 的用例通过率。
       - `torchNpuPassRate`：`source === 'torch_npu'` 的用例通过率。

5. **处理差异与标准**
   - `difference` -> 写入维度。
   - `standard` / `actualError` -> 写入维度（允许清空或覆盖）。

6. **更新 API 元数据**
   - `lastUpdated` 设为当前时间（ISO 8601）。
   - 若记录中提供了 `dataSource`、`traceabilityLink`、`pytorchVersion`、`category`，则覆盖原值。

7. **持久化**
   - 每次处理完一条记录后，调用 `saveAllApis` 将完整 API 列表写回存储。

### 3.2 返回值

```ts
{
  success: number;   // 成功导入/更新的记录数
  failed: number;    // 校验或异常失败的记录数
  skipped: number;   // 当前实现中始终为 0
  errors: string[];  // 每条失败记录的错误描述，含行号信息
}
```

---

## 4. 关键行为约定

| 场景 | 行为 |
|------|------|
| API 已存在 | 仅更新目标维度及提供的元数据，其余维度保持不变。 |
| API 不存在 | 自动创建，未提及的维度保持默认空状态。 |
| `testCases` 为空或未提供 | 不覆盖已有 `testCases`，也不重置用例统计。 |
| `status = 'not_tested'` | 维度状态更新，但用例统计仅在有 `testCases` 时才会变化。 |
| `standard` / `actualError` 未提供 | 不覆盖已有值；若要清空需显式传空字符串。 |

---

## 5. 错误处理

- **JSON 解析失败**：拦截 `JSON.parse` 异常，提示解析错误。
- **CSV 格式错误**：缺少表头、无数据行、缺少必填列均抛出明确错误。
- **单条记录错误**：不影响其他记录继续导入。所有单条错误汇总后统一返回。

---

## 6. 迁移要点

若将本功能迁移至其他项目，需保留或替换以下模块：

1. **类型定义**：`api-alignment.ts` 中的 `ImportData`、`ApiInfo`、`DimensionInfo` 等。
2. **导入核心函数**：`storage.ts` 中的 `importData`（含 `getAllApis` / `saveAllApis`）。
3. **存储层**：当前基于 `localStorage`；迁移时可替换为后端 API 或 IndexedDB，但需保持 `getAllApis` / `saveAllApis` 的接口契约。
4. **解析层**：JSON 与 CSV 的解析逻辑（`processJsonData` / `processCsvData`）。
5. **ID 生成规则**：`` `${module}.${apiName}` `` 必须全局唯一且稳定。
