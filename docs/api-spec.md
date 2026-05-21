# NPU API 看板 — 后端接口规格文档

## 概述

黄区的 NPU API 看板提供数据服务，当前的数据源为 Excel 表格（全量 API 列表 + 测试结果），后端负责解析 Excel、存储、对外暴露 RESTful 接口。前端当前从静态 JS 文件读取数据，目标切换为调用本接口。

---

## 1. 基础信息

| 项目 | 说明 |
|------|------|
| 协议 | HTTPS |
| 格式 | JSON |
| 编码 | UTF-8 |
| 版本 | `/api/v1` |
| 认证 | Bearer Token（Header: `Authorization: Bearer <token>`） |

### 通用响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 404 | 资源不存在 |
| 500 | 服务端错误 |

---

## 2. 数据模型

### 2.1 API 对象

```json
{
  "name": "torch.abs", 
  "module": "torch", // torch.Tensor, torch.ao, torch.cuda
  "short": "abs",
  "level": "L0",
  "alignment": "aligned",
  "dims": {
    "func": "aligned",
    "prec": "aligned",
    "mem": "aligned",
    "det": "aligned"
  },
  "rawDims": {
    "func": "√",
    "prec": "√",
    "mem": "√",
    "det": "√"
  },
  "dts": ["DTS-123"],
  "tags": ["算子", "1690", "2357"],
  "freq": 238936,
  "caseTotal": 36,
  "casePass": 35,
  "updatedAt": "2026-04-08",
  "updatedBy": "chenyu"
}
```

### 2.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 完整 API 名称，如 `torch.abs`、`Tensor.add` |
| `module` | string | 所属模块，如 `torch`、`torch.nn`、`torch.Tensor` |
| `short` | string | 简短名称（最后一段） |
| `level` | string | 等级: `L0`(关键) / `L1`(重要) / `L2`(一般) |
| `alignment` | string | 整体对齐状态（见 §2.3） |
| `dims` | object | **四个维度的对齐状态**（核心数据） |
| `dims.func` | string | 功能维度状态 |
| `dims.prec` | string | **精度维度状态** |
| `dims.mem` | string | **内存维度状态** |
| `dims.det` | string | **确定性维度状态** |
| `rawDims` | object | Excel 原始值（√ / × / DTS-xxx / √-旧标准对齐） |
| `dts` | array | DTS 编号列表（如 `["DTS-123"]`） |
| `tags` | array | 标签: `1690`, `2357`, `算子`, `框架`, `工具`, `分布式`, `自定义API` |
| `freq` | number | 使用频次估计（次/周） |
| `caseTotal` | number | 测试用例总数 |
| `casePass` | number | 通过用例数 |
| `updatedAt` | string\|null | 最近更新日期（`YYYY-MM-DD`） |
| `updatedBy` | string\|null | 最近更新人 |

### 2.3 维度状态枚举

| 值 | 含义 | 颜色 |
|----|------|------|
| `aligned` | 完全对齐（√） | 绿 `#2da44e` |
| `reviewed` | 旧标准对齐（√-旧标准对齐） | 蓝 |
| `fixing` | 待修复（× / DTS-xxx） | 红 `#cf222e` |
| `unsupported` | 不支持 | 红 |
| `untested` | 未测试 | 灰 `#d8d8d0` |

### 2.4 四个维度

| key | 中文 | 字母 | 含义 |
|-----|------|------|------|
| `func` | 功能 | F | 计算结果与 CUDA 一致 |
| `prec` | 精度 | P | 数值误差在可接受范围内 |
| `mem` | 内存 | M | 内存模式与 CUDA 一致 |
| `det` | 确定性 | D | 相同输入多次运行结果一致 |

---

## 3. 接口列表

### 3.1 获取 API 列表

```
GET /api/v1/apis
```

**查询参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `search` | string | — | 名称/模块模糊搜索 |
| `level` | string | — | 等级筛选，多选用逗号分隔，如 `L0,L1` |
| `module` | string | — | 模块筛选，如 `torch.nn` |
| `alignment` | string | — | 对齐状态筛选，多选用逗号分隔 |
| `dim` | string | — | 按维度状态筛选: `func=fixing`, `prec=fixing`, `mem=fixing`, `det=fixing` |
| `page` | number | 1 | 页码 |
| `size` | number | 100 | 每页数量（max 1000） |

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 5522,
    "page": 1,
    "size": 100,
    "items": [ { ... } ]
  }
}
```

---

### 3.2 获取单个 API 详情

```
GET /api/v1/apis/{name}
```

`name` 需 URL 编码，如 `/api/v1/apis/torch.nn.functional.relu`

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": { "name": "torch.nn.functional.relu", ... }
}
```

---

### 3.3 获取 API 统计概览

```
GET /api/v1/apis/stats
```

**查询参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `level` | string | — | 等级筛选 |

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalApis": 5522,
    "testedApis": 2354,
    "untestedApis": 3168,
    "byAlignment": {
      "aligned": 1513,
      "reviewed": 816,
      "fixing": 25,
      "untested": 3168
    },
    "byLevel": {
      "L0": 422,
      "L1": 2007,
      "L2": 3093
    },
    "byModule": {
      "torch": 1250,
      "torch.Tensor": 890,
      "torch.nn": 680,
      "torch.nn.functional": 520,
      "...": 0
    },
    "dimStats": {
      "func": { "aligned": 2300, "reviewed": 50, "fixing": 4, "untested": 3168 },
      "prec": { "aligned": 2300, "reviewed": 50, "fixing": 4, "untested": 3168 },
      "mem": { "aligned": 2295, "reviewed": 50, "fixing": 9, "untested": 3168 },
      "det": { "aligned": 2300, "reviewed": 50, "fixing": 4, "untested": 3168 }
    },
    "readyApis": 1513,
    "blockingDims": 25
  }
}
```

---

### 3.4 获取下游仓库列表

```
GET /api/v1/repos
```

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "name": "pytorch/pytorch-lightning",
      "stars": 38000,
      "apiUsed": 146,
      "apiAligned": 123,
      "missing": 23,
      "rate": 0.84
    }
  ]
}
```

---

### 3.5 获取仓库的 API 明细

```
GET /api/v1/repos/{repoName}/apis
```

`repoName` 使用仓库短名，如 `transformers`、`vllm`

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "repo": "transformers",
    "apiUsed": 320,
    "apiAligned": 296,
    "missing": 24,
    "alignedApis": [
      { "name": "torch.matmul", "freq": 9820000,
        "dims": { "func": "aligned", "prec": "aligned", "mem": "aligned", "det": "aligned" } }
    ],
    "fixingApis": [
      { "name": "torch.linalg.svd", "freq": 180000,
        "dims": { "func": "aligned", "prec": "aligned", "mem": "fixing", "det": "aligned" },
        "brokenDims": ["mem"] }
    ]
  }
}
```

---

### 3.6 上传 Excel 导入数据

```
POST /api/v1/import
Content-Type: multipart/form-data
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `fullApiFile` | file | 全量 API Excel（参照 `2.7全量API.xlsx`） |
| `testApiFile` | file | 测试结果 Excel（参照 `Q1 2357 API 0416.xlsx`） |

**Excel 列约定**（参考现有 `data/import.mjs`）

全量 API (`2.7全量API.xlsx`):
| 列 | 内容 |
|----|------|
| A | 分类（算子/框架/工具/分布式/自定义API） |
| B | API 完整名称 |
| C | 等级（L0/L1/L2） |

测试结果 (`Q1 2357 API 0416.xlsx`):
| 列 | 内容 |
|----|------|
| A | API 名称 |
| B | 1690 版本（√ / 空） |
| C | 2357 版本（√ / 空） |
| D | 整体状态（√ / √-旧标准对齐 / × / 空） |
| E | 功能（√ / √-旧标准对齐 / × / DTS-xxx / 空） |
| F | 精度（√ / √-旧标准对齐 / × / DTS-xxx / 空） |
| G | 内存（√ / √-旧标准对齐 / × / DTS-xxx / 空） |
| H | 确定性（√ / √-旧标准对齐 / × / DTS-xxx / 空） |

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalImported": 5522,
    "testedUpdated": 2354,
    "aligned": 1513,
    "reviewed": 816,
    "fixing": 25,
    "untested": 3168
  }
}
```

---

### 3.7 获取模块列表

```
GET /api/v1/modules
```

**响应**

```json
{
  "code": 0,
  "data": [
    { "key": "torch", "name": "torch", "weight": 1250 },
    { "key": "torch.Tensor", "name": "torch.Tensor", "weight": 890 }
  ]
}
```

---

## 4. 维度筛选示例

### 查询精度异常的 API

```
GET /api/v1/apis?dim=prec=fixing
```

### 查询内存和确定性均有问题的 L0 API

```
GET /api/v1/apis?dim=mem=fixing&dim=det=fixing&level=L0
```

### 查询某 repo 中精度或内存阻塞的 API

```
GET /api/v1/repos/transformers/apis?dim=prec=fixing&dim=mem=fixing
```

---

## 5. Excel 导入处理规则

与现有 `data/import.mjs` 逻辑一致：

| Excel 值 | 解析为 |
|----------|--------|
| `√` | `aligned` |
| `√-旧标准对齐` | `reviewed` |
| `×` | `fixing` |
| `DTS-xxx` | `fixing`，同时记录在 `dts[]` 数组中 |
| 空 / 其他 | `untested` |

---

## 6. 注意事项

1. **`caseTotal`/`casePass`** 当前为前端根据维度对齐度估算的假数据，后端应存储实际测试数据或明确标记为估算值。
2. **`freq`** 使用频次目前为静态映射表 + 随机值，后续可接入真实日志统计。
3. **Excel 导入**建议采用增量更新：按 API name 匹配更新，不删除已有记录。
4. 接口设计参考了当前前端 `src/data/` 数据结构，确保切换成本最低。
