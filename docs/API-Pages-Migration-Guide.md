# API 列表页 + API 详情页 迁移文档

## 1. 功能概述

| 页面 | 功能 |
|------|------|
| **API 列表页 (ApiList)** | 展示所有 API 的表格，支持搜索、多维度筛选（模块/状态/类别/维度）、排序、分页，状态与 URL 双向同步 |
| **API 详情页 (ApiDetail)** | 展示单个 API 的基本信息（名称、模块、类别、PyTorch 版本、数据来源等）和四个测试维度的详细卡片 |

---

## 2. 目录结构

```
src/
  app/
    types/
      api-alignment.ts       # 数据类型定义
    utils/
      statistics.ts          # getStatusDisplay, getDimensionName
      storage.ts             # getApiById, getAllApis（数据层，可替换为真实后端）
    components/
      ApiTable.tsx           # API 表格（含搜索/筛选/排序/分页）
      DimensionStatusCard.tsx # 维度状态卡片
    pages/
      ApiList.tsx            # API 列表页
      ApiDetail.tsx          # API 详情页
```

---

## 3. 数据类型接口

**文件：`src/app/types/api-alignment.ts`**

```typescript
// 对齐状态枚举
export type AlignmentStatus =
  | 'fully_aligned'      // 完全对齐
  | 'diff_reviewed'      // 有差异（已评审）
  | 'diff_unreviewed'    // 有差异（未评审）
  | 'not_tested';        // 未测试

// 测试维度
export type TestDimension = 'function' | 'precision' | 'memory' | 'determinism';

// API类别
export type ApiCategory =
  | 'distributed'   // 分布式类
  | 'framework'     // 框架类
  | 'operator'      // 算子类
  | 'utility';      // 工具类

// 测试用例结果
export type TestResult = 'pass' | 'fail' | 'skip';

// 测试用例
export interface TestCase {
  id: string;
  name: string;
  result: TestResult;
  errorMessage?: string;
  codeSnippet?: string;
  source?: string; // 数据来源：community / torch_npu
}

// 差异说明
export interface DifferenceDetail {
  description: string;
  reviewer?: string;
  reviewTime?: string;
  traceabilityLink?: string;
}

// 维度测试信息
export interface DimensionInfo {
  status: AlignmentStatus;
  passRate?: number;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  difference?: DifferenceDetail;
  testCases: TestCase[];
  communityPassRate?: number;
  torchNpuPassRate?: number;
  standard?: string;
  actualError?: string;
}

// API信息
export interface ApiInfo {
  id: string;
  name: string;
  module: string;
  pytorchDocUrl?: string;
  pytorchVersion?: string;
  category?: ApiCategory;
  dimensions: {
    function: DimensionInfo;
    precision: DimensionInfo;
    memory: DimensionInfo;
    determinism: DimensionInfo;
  };
  lastUpdated: string; // ISO date string
  dataSource?: string;
  traceabilityLink?: string;
}
```

---

## 4. 工具函数

### 4.1 statistics.ts（只取列表/详情页用到的函数）

**文件：`src/app/utils/statistics.ts`**

```typescript
import { AlignmentStatus } from '../types/api-alignment';

export function getStatusDisplay(status: AlignmentStatus): { label: string; color: string } {
  switch (status) {
    case 'fully_aligned':
      return { label: '完全对齐', color: 'text-green-600' };
    case 'diff_reviewed':
      return { label: '有差异（已评审）', color: 'text-yellow-600' };
    case 'diff_unreviewed':
      return { label: '有差异（未评审）', color: 'text-red-600' };
    case 'not_tested':
      return { label: '未测试', color: 'text-gray-400' };
  }
}

export function getDimensionName(dimension: string): string {
  const names: Record<string, string> = {
    function: '功能',
    precision: '精度',
    memory: '内存',
    determinism: '确定性',
  };
  return names[dimension] || dimension;
}
```

### 4.2 storage.ts（数据层接口，可替换为后端 API）

**文件：`src/app/utils/storage.ts`**

```typescript
import { ApiInfo } from '../types/api-alignment';

const STORAGE_KEY = 'torch_npu_api_data';

// 获取所有API数据
export function getAllApis(): ApiInfo[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 获取单个API
export function getApiById(id: string): ApiInfo | undefined {
  const apis = getAllApis();
  return apis.find(api => api.id === id);
}
```

**迁移提示**：当前使用 `localStorage` 存储。迁移时只需替换 `getAllApis()` 和 `getApiById()` 为真实后端调用即可。

---

## 5. 子组件

### 5.1 ApiTable.tsx（API 表格组件）

**文件：`src/app/components/ApiTable.tsx`**

```tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Table, Input, Select, Tag } from 'antd';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { ApiInfo, AlignmentStatus } from '../types/api-alignment';
import { getStatusDisplay } from '../utils/statistics';
import { Search, CheckCircle2, AlertCircle, XCircle, CircleDashed } from 'lucide-react';

interface ApiTableProps {
  apis: ApiInfo[];
}

const categoryLabels: Record<string, string> = {
  distributed: '分布式类',
  framework: '框架类',
  operator: '算子类',
  utility: '工具类',
};

const categoryColors: Record<string, string> = {
  distributed: 'purple',
  framework: 'cyan',
  operator: 'blue',
  utility: 'orange',
};

type SortField = 'name' | 'module' | 'alignment' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50];

export function ApiTable({ apis }: ApiTableProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL param helpers
  const getParam = (key: string, defaultValue: string) => searchParams.get(key) || defaultValue;
  const getIntParam = (key: string, defaultValue: number) => {
    const val = searchParams.get(key);
    const n = val ? parseInt(val, 10) : NaN;
    return isNaN(n) ? defaultValue : n;
  };

  // State from URL
  const [searchTerm, setSearchTerm] = useState(getParam('q', ''));
  const [moduleFilter, setModuleFilter] = useState(getParam('mod', 'all'));
  const [statusFilter, setStatusFilter] = useState(getParam('st', 'all'));
  const [categoryFilter, setCategoryFilter] = useState(getParam('cat', 'all'));
  const [dimensionFilter, setDimensionFilter] = useState(getParam('dim', 'all'));
  const [sortField, setSortField] = useState<SortField>(getParam('sort', 'lastUpdated') as SortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(getParam('order', 'desc') as SortOrder);
  const [page, setPage] = useState(getIntParam('page', 1));
  const [pageSize, setPageSize] = useState(() => {
    const size = getIntParam('size', DEFAULT_PAGE_SIZE);
    return PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_PAGE_SIZE;
  });

  // Update URL helper: writes non-default values, removes defaults
  const syncStateToUrl = useCallback((
    updates: Partial<{
      q: string;
      mod: string;
      st: string;
      cat: string;
      dim: string;
      sort: SortField;
      order: SortOrder;
      page: number;
      size: number;
    }>
  ) => {
    const next = new URLSearchParams(searchParams);

    const setOrDelete = (key: string, value: string | number, defaultValue: string | number) => {
      if (value === defaultValue || value === '' || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    };

    if ('q' in updates) setOrDelete('q', updates.q ?? searchTerm, '');
    if ('mod' in updates) setOrDelete('mod', updates.mod ?? moduleFilter, 'all');
    if ('st' in updates) setOrDelete('st', updates.st ?? statusFilter, 'all');
    if ('cat' in updates) setOrDelete('cat', updates.cat ?? categoryFilter, 'all');
    if ('dim' in updates) setOrDelete('dim', updates.dim ?? dimensionFilter, 'all');
    if ('sort' in updates) setOrDelete('sort', updates.sort ?? sortField, 'lastUpdated');
    if ('order' in updates) setOrDelete('order', updates.order ?? sortOrder, 'desc');
    if ('page' in updates) setOrDelete('page', updates.page ?? page, 1);
    if ('size' in updates) setOrDelete('size', updates.size ?? pageSize, DEFAULT_PAGE_SIZE);

    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, searchTerm, moduleFilter, statusFilter, categoryFilter, dimensionFilter, sortField, sortOrder, page, pageSize]);

  // Sync local state when URL changes (back/forward navigation)
  useEffect(() => {
    setSearchTerm(getParam('q', ''));
    setModuleFilter(getParam('mod', 'all'));
    setStatusFilter(getParam('st', 'all'));
    setCategoryFilter(getParam('cat', 'all'));
    setDimensionFilter(getParam('dim', 'all'));
    setSortField(getParam('sort', 'lastUpdated') as SortField);
    setSortOrder(getParam('order', 'desc') as SortOrder);
    setPage(getIntParam('page', 1));
    setPageSize(getIntParam('size', DEFAULT_PAGE_SIZE));
  }, [searchParams]);

  // 获取所有唯一的模块
  const modules = useMemo(() => {
    const uniqueModules = new Set(apis.map(api => api.module));
    return Array.from(uniqueModules).sort();
  }, [apis]);

  // 获取所有唯一的类别
  const categories = useMemo(() => {
    const uniqueCategories = new Set(apis.map(api => api.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [apis]);

  // 获取API的总体对齐状态
  const getApiOverallStatus = (api: ApiInfo): AlignmentStatus => {
    const statuses = [
      api.dimensions.function.status,
      api.dimensions.precision.status,
      api.dimensions.memory.status,
      api.dimensions.determinism.status,
    ];
    if (statuses.every(s => s === 'fully_aligned')) return 'fully_aligned';
    if (statuses.some(s => s === 'diff_unreviewed')) return 'diff_unreviewed';
    if (statuses.some(s => s === 'diff_reviewed')) return 'diff_reviewed';
    return 'not_tested';
  };

  // 筛选和排序
  const filteredAndSortedApis = useMemo(() => {
    let filtered = apis;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(api =>
        api.name.toLowerCase().includes(term) ||
        api.module.toLowerCase().includes(term)
      );
    }

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(api => api.module === moduleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(api => getApiOverallStatus(api) === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(api => api.category === categoryFilter);
    }

    if (dimensionFilter !== 'all') {
      const dimension = dimensionFilter as keyof ApiInfo['dimensions'];
      filtered = filtered.filter(api => api.dimensions[dimension].status !== 'not_tested');
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'module':
          comparison = a.module.localeCompare(b.module);
          break;
        case 'alignment': {
          const statusOrder: Record<AlignmentStatus, number> = {
            fully_aligned: 0,
            diff_reviewed: 1,
            diff_unreviewed: 2,
            not_tested: 3,
          };
          comparison = statusOrder[getApiOverallStatus(a)] - statusOrder[getApiOverallStatus(b)];
          break;
        }
        case 'lastUpdated':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [apis, searchTerm, moduleFilter, statusFilter, categoryFilter, dimensionFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedApis.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      const newPage = totalPages;
      setPage(newPage);
      syncStateToUrl({ page: newPage });
    }
  }, [totalPages, page, syncStateToUrl]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    syncStateToUrl({ q: value, page: 1 });
    setPage(1);
  };

  const handleModuleFilterChange = (value: string) => {
    setModuleFilter(value);
    syncStateToUrl({ mod: value, page: 1 });
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    syncStateToUrl({ st: value, page: 1 });
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    syncStateToUrl({ cat: value, page: 1 });
    setPage(1);
  };

  const handleDimensionFilterChange = (value: string) => {
    setDimensionFilter(value);
    syncStateToUrl({ dim: value, page: 1 });
    setPage(1);
  };

  const handleTableChange: TableProps<ApiInfo>['onChange'] = (pagination, _filters, sorter) => {
    if (pagination.current) {
      setPage(pagination.current);
      syncStateToUrl({ page: pagination.current });
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      syncStateToUrl({ size: pagination.pageSize });
    }
    if (sorter && !Array.isArray(sorter) && sorter.field) {
      const field = sorter.field as SortField;
      const order = sorter.order === 'ascend' ? 'asc' : 'desc';
      if (field !== sortField || order !== sortOrder) {
        setSortField(field);
        setSortOrder(order);
        syncStateToUrl({ sort: field, order, page: 1 });
        setPage(1);
      }
    }
  };

  const getStatusIcon = (status: AlignmentStatus) => {
    switch (status) {
      case 'fully_aligned':
        return <CheckCircle2 className="h-4 w-4 text-[#0066FF]" />;
      case 'diff_reviewed':
        return <AlertCircle className="h-4 w-4 text-[#FFAA00]" />;
      case 'diff_unreviewed':
        return <XCircle className="h-4 w-4 text-[#FF2244]" />;
      case 'not_tested':
        return <CircleDashed className="h-4 w-4 text-[#8899A8]" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: ColumnsType<ApiInfo> = [
    {
      title: 'API名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortField === 'name' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      sorter: true,
      sortOrder: sortField === 'module' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text) => <Tag bordered={false}>{text}</Tag>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category) =>
        category ? (
          <Tag color={categoryColors[category] || 'default'} bordered={false}>
            {categoryLabels[category] || category}
          </Tag>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: '功能',
      key: 'function',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center" title={getStatusDisplay(record.dimensions.function.status).label}>
          {getStatusIcon(record.dimensions.function.status)}
        </div>
      ),
    },
    {
      title: '精度',
      key: 'precision',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center" title={getStatusDisplay(record.dimensions.precision.status).label}>
          {getStatusIcon(record.dimensions.precision.status)}
        </div>
      ),
    },
    {
      title: '内存',
      key: 'memory',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center" title={getStatusDisplay(record.dimensions.memory.status).label}>
          {getStatusIcon(record.dimensions.memory.status)}
        </div>
      ),
    },
    {
      title: '确定性',
      key: 'determinism',
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center" title={getStatusDisplay(record.dimensions.determinism.status).label}>
          {getStatusIcon(record.dimensions.determinism.status)}
        </div>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: true,
      sortOrder: sortField === 'lastUpdated' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text) => <span className="text-sm text-gray-500">{formatDate(text)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7a8aa0] z-10" />
          <Input
            placeholder="搜索API名称或模块..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={moduleFilter} onChange={handleModuleFilterChange} style={{ minWidth: 160 }}>
          <Select.Option value="all">所有模块</Select.Option>
          {modules.map(module => (
            <Select.Option key={module} value={module}>{module}</Select.Option>
          ))}
        </Select>

        <Select value={statusFilter} onChange={handleStatusFilterChange} style={{ minWidth: 160 }}>
          <Select.Option value="all">所有状态</Select.Option>
          <Select.Option value="fully_aligned">完全对齐</Select.Option>
          <Select.Option value="diff_reviewed">有差异（已评审）</Select.Option>
          <Select.Option value="diff_unreviewed">有差异（未评审）</Select.Option>
          <Select.Option value="not_tested">未测试</Select.Option>
        </Select>

        <Select value={categoryFilter} onChange={handleCategoryFilterChange} style={{ minWidth: 140 }}>
          <Select.Option value="all">所有类别</Select.Option>
          <Select.Option value="distributed">分布式类</Select.Option>
          <Select.Option value="framework">框架类</Select.Option>
          <Select.Option value="operator">算子类</Select.Option>
          <Select.Option value="utility">工具类</Select.Option>
        </Select>

        <Select value={dimensionFilter} onChange={handleDimensionFilterChange} style={{ minWidth: 140 }}>
          <Select.Option value="all">所有维度</Select.Option>
          <Select.Option value="function">功能</Select.Option>
          <Select.Option value="precision">精度</Select.Option>
          <Select.Option value="memory">内存</Select.Option>
          <Select.Option value="determinism">确定性</Select.Option>
        </Select>
      </div>

      {/* 结果统计 */}
      <div className="text-sm text-gray-500">
        共找到 {filteredAndSortedApis.length} 个API，第 {page} / {totalPages} 页
      </div>

      {/* 表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table
          dataSource={filteredAndSortedApis}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total: filteredAndSortedApis.length,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => navigate(`/api/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </div>
  );
}
```

### 5.2 DimensionStatusCard.tsx（维度状态卡片）

**文件：`src/app/components/DimensionStatusCard.tsx`**

```tsx
import { useState } from 'react';
import { Card, Tag, Button, Collapse, Typography } from 'antd';
import { DimensionInfo, TestCase } from '../types/api-alignment';
import { getStatusDisplay, getDimensionName } from '../utils/statistics';
import { CheckCircle2, AlertCircle, XCircle, CircleDashed, ExternalLink } from 'lucide-react';

interface DimensionStatusCardProps {
  dimensionName: string;
  dimensionInfo: DimensionInfo;
}

export function DimensionStatusCard({ dimensionName, dimensionInfo }: DimensionStatusCardProps) {
  const [activeKey, setActiveKey] = useState<string | string[]>('');
  const statusDisplay = getStatusDisplay(dimensionInfo.status);
  const displayName = getDimensionName(dimensionName);

  const getStatusIcon = () => {
    switch (dimensionInfo.status) {
      case 'fully_aligned':
        return <CheckCircle2 className="h-5 w-5" style={{ color: '#0066FF' }} />;
      case 'diff_reviewed':
        return <AlertCircle className="h-5 w-5" style={{ color: '#FFAA00' }} />;
      case 'diff_unreviewed':
        return <XCircle className="h-5 w-5" style={{ color: '#FF2244' }} />;
      case 'not_tested':
        return <CircleDashed className="h-5 w-5" style={{ color: '#8899A8' }} />;
    }
  };

  const getResultTag = (result: TestCase['result']) => {
    switch (result) {
      case 'pass':
        return <Tag color="success">通过</Tag>;
      case 'fail':
        return <Tag color="error">失败</Tag>;
      case 'skip':
        return <Tag>跳过</Tag>;
    }
  };

  const collapseItems = dimensionInfo.testCases.length > 0 ? [
    {
      key: 'testcases',
      label: `测试用例 (${dimensionInfo.testCases.length})`,
      children: (
        <div className="space-y-3">
          {dimensionInfo.testCases.map(testCase => (
            <div key={testCase.id} className="p-3 border rounded-md space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">{testCase.name}</div>
                  {testCase.source && (
                    <Tag className="mt-1 text-xs" bordered={false}>
                      {testCase.source === 'community' ? '社区用例' : 'torch_npu用例'}
                    </Tag>
                  )}
                </div>
                {getResultTag(testCase.result)}
              </div>

              {testCase.errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {testCase.errorMessage}
                </div>
              )}

              {testCase.codeSnippet && (
                <div className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  <pre className="font-mono">{testCase.codeSnippet}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ] : [];

  return (
    <Card bordered={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="text-lg font-semibold" style={{ color: '#0b0f1f' }}>{displayName}</div>
            <Typography.Text style={{ color: statusDisplay.color }}>
              {statusDisplay.label}
            </Typography.Text>
          </div>
        </div>
        {dimensionInfo.passRate !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: '#0b0f1f' }}>{dimensionInfo.passRate}%</div>
            <div className="text-xs" style={{ color: '#5a6478' }}>
              {dimensionInfo.passedCases}/{dimensionInfo.totalCases} 通过
            </div>
          </div>
        )}
      </div>

      {/* 精度和内存维度的对齐标准和实际误差 */}
      {(dimensionName === 'precision' || dimensionName === 'memory') && (dimensionInfo.standard || dimensionInfo.actualError) && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {dimensionInfo.standard && (
            <div className="space-y-1">
              <div className="text-sm" style={{ color: '#5a6478' }}>对齐标准</div>
              <div className="text-base font-semibold" style={{ color: '#0b0f1f' }}>{dimensionInfo.standard}</div>
            </div>
          )}
          {dimensionInfo.actualError && (
            <div className="space-y-1">
              <div className="text-sm" style={{ color: '#5a6478' }}>实际误差</div>
              <div className="text-base font-semibold" style={{ color: '#0b0f1f' }}>{dimensionInfo.actualError}</div>
            </div>
          )}
        </div>
      )}

      {/* 功能维度的社区和torch_npu用例通过率 */}
      {dimensionName === 'function' && (dimensionInfo.communityPassRate !== undefined || dimensionInfo.torchNpuPassRate !== undefined) && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {dimensionInfo.communityPassRate !== undefined && (
            <div className="space-y-1">
              <div className="text-sm" style={{ color: '#5a6478' }}>社区用例</div>
              <div className="text-xl font-semibold" style={{ color: '#0b0f1f' }}>{dimensionInfo.communityPassRate}%</div>
            </div>
          )}
          {dimensionInfo.torchNpuPassRate !== undefined && (
            <div className="space-y-1">
              <div className="text-sm" style={{ color: '#5a6478' }}>torch_npu用例</div>
              <div className="text-xl font-semibold" style={{ color: '#0b0f1f' }}>{dimensionInfo.torchNpuPassRate}%</div>
            </div>
          )}
        </div>
      )}

      {/* 差异说明 */}
      {dimensionInfo.difference && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)' }}>
          <div className="text-sm font-semibold mb-2" style={{ color: '#0b0f1f' }}>差异说明</div>
          <p className="text-sm" style={{ color: '#5a6478' }}>{dimensionInfo.difference.description}</p>
          {dimensionInfo.difference.reviewer && (
            <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: '#5a6478' }}>
              <span>评审人: {dimensionInfo.difference.reviewer}</span>
              {dimensionInfo.difference.reviewTime && (
                <span>评审时间: {dimensionInfo.difference.reviewTime}</span>
              )}
            </div>
          )}
          {dimensionInfo.difference.traceabilityLink && (
            <a
              href={dimensionInfo.difference.traceabilityLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs hover:underline"
              style={{ color: '#0066ff' }}
            >
              查看详情
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* 测试用例列表 */}
      {dimensionInfo.testCases.length > 0 && (
        <div className="mt-4">
          <Collapse
            activeKey={activeKey}
            onChange={setActiveKey}
            items={collapseItems}
            bordered={false}
            ghost
          />
        </div>
      )}

      {dimensionInfo.testCases.length === 0 && dimensionInfo.status === 'not_tested' && (
        <div className="mt-4">
          <p className="text-sm text-center py-4" style={{ color: '#5a6478' }}>
            暂无测试用例
          </p>
        </div>
      )}
    </Card>
  );
}
```

---

## 6. 页面组件

### 6.1 ApiList.tsx（API 列表页）

**文件：`src/app/pages/ApiList.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Typography } from 'antd';
import { ApiInfo } from '../types/api-alignment';
import { getAllApis, initializeSampleData, checkAndMigrateData } from '../utils/storage';
import { ApiTable } from '../components/ApiTable';
import { ArrowLeft } from 'lucide-react';

export function ApiList() {
  const navigate = useNavigate();
  const [apis, setApis] = useState<ApiInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    let data = getAllApis();

    if (data.length === 0) {
      initializeSampleData();
      data = getAllApis();
    } else {
      const migrated = checkAndMigrateData();
      if (migrated) {
        data = getAllApis();
      }
    }
    setApis(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0066ff', borderTopColor: 'transparent' }} />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                API 列表
              </Typography.Title>
              <Typography.Text className="text-sm mt-1 text-gray-500">
                查看所有 torch_npu API 的对齐状态与详细信息
              </Typography.Text>
            </div>
            <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiTable apis={apis} />
      </main>
    </div>
  );
}
```

### 6.2 ApiDetail.tsx（API 详情页）

**文件：`src/app/pages/ApiDetail.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Tag, Typography } from 'antd';
import { ApiInfo } from '../types/api-alignment';
import { getApiById } from '../utils/storage';
import { DimensionStatusCard } from '../components/DimensionStatusCard';
import { ArrowLeft, ExternalLink, Database, Calendar, Link as LinkIcon, Home, Hash } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  distributed: '分布式类',
  framework: '框架类',
  operator: '算子类',
  utility: '工具类',
};

export function ApiDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const apiData = getApiById(id);
      setApi(apiData || null);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0066ff', borderTopColor: 'transparent' }} />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Typography.Title level={3}>API 未找到</Typography.Title>
          <p className="text-gray-500 mb-6">找不到ID为 "{id}" 的API</p>
          <Button type="primary" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/apis')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {api.name}
              </Typography.Title>
              <Typography.Text className="text-sm mt-1 text-gray-500 block">
                API 详情与测试维度分析
              </Typography.Text>
            </div>
            <div className="flex items-center gap-2">
              <Button icon={<Home className="h-4 w-4" />} onClick={() => navigate('/')}>
                返回首页
              </Button>
              <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/apis')}>
                返回列表
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* API基本信息 */}
          <section>
            <h2>API 详情</h2>
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-bold">{api.name}</span>
                  <Tag bordered={false}>{api.module}</Tag>
                  {api.category && (
                    <Tag color="blue" bordered={false}>
                      {categoryLabels[api.category] || api.category}
                    </Tag>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p>所属模块: <span className="font-medium">{api.module}</span></p>

                {api.pytorchDocUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href={api.pytorchDocUrl} target="_blank" rel="noopener noreferrer">
                      PyTorch 官方文档
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">最后更新</div>
                      <div className="text-sm font-medium">{formatDate(api.lastUpdated)}</div>
                    </div>
                  </div>

                  {api.pytorchVersion && (
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">PyTorch 版本</div>
                        <div className="text-sm font-medium">{api.pytorchVersion}</div>
                      </div>
                    </div>
                  )}

                  {api.dataSource && (
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">数据来源</div>
                        <div className="text-sm font-medium">{api.dataSource}</div>
                      </div>
                    </div>
                  )}

                  {api.traceabilityLink && (
                    <div className="flex items-start gap-2">
                      <LinkIcon className="h-4 w-4 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">可溯源链接</div>
                        <a href={api.traceabilityLink} target="_blank" rel="noopener noreferrer">
                          查看详情
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 四个维度的状态卡片 */}
          <section>
            <h2>测试维度详情</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DimensionStatusCard dimensionName="function" dimensionInfo={api.dimensions.function} />
              <DimensionStatusCard dimensionName="precision" dimensionInfo={api.dimensions.precision} />
              <DimensionStatusCard dimensionName="memory" dimensionInfo={api.dimensions.memory} />
              <DimensionStatusCard dimensionName="determinism" dimensionInfo={api.dimensions.determinism} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
```

---

## 7. 路由配置

```tsx
// src/app/routes.tsx
import { createBrowserRouter } from 'react-router';
import { ApiList } from './pages/ApiList';
import { ApiDetail } from './pages/ApiDetail';

export const router = createBrowserRouter([
  {
    path: '/apis',
    Component: ApiList,
  },
  {
    path: '/api/:id',
    Component: ApiDetail,
  },
]);
```

---

## 8. 依赖清单

| 库 | 用途 | 版本参考 |
|---|---|---|
| `react` / `react-dom` | 框架 | ^18.3 |
| `react-router` | 路由 | ^7.13 |
| `antd` | UI 组件（Table、Input、Select、Tag、Button、Collapse、Card、Typography） | ^6.3 |
| `lucide-react` | 图标 | ^0.487 |

---

## 9. 关键实现逻辑说明

### 9.1 URL 状态同步（ApiTable）

表格的搜索、筛选、排序、分页状态全部与 URL query params 双向同步：
- 用户操作（搜索/筛选/翻页）时，通过 `syncStateToUrl` 写入 URL
- 默认值不写（`'all'`、`''`、`1`、`'lastUpdated'` 等），保证 URL 干净
- URL 变化时（浏览器前进/后退），通过 `useEffect` 反向同步到本地 state
- 切换筛选项时自动重置到第 1 页

### 9.2 总体对齐状态计算

`getApiOverallStatus` 优先级规则：
1. 四个维度**全部** `fully_aligned` → `fully_aligned`
2. 任意维度为 `diff_unreviewed` → `diff_unreviewed`
3. 任意维度为 `diff_reviewed` → `diff_reviewed`
4. 其余 → `not_tested`

### 9.3 维度卡片特殊展示

- **功能维度**：额外展示 `communityPassRate`（社区用例通过率）和 `torchNpuPassRate`
- **精度/内存维度**：额外展示 `standard`（对齐标准）和 `actualError`（实际误差）
- **差异说明**：`difference` 对象存在时渲染差异说明面板，含评审人、评审时间、可追溯链接
- **测试用例**：通过 `Collapse` 折叠展示，含用例名称、来源标签、结果、错误信息、代码片段

### 9.4 点击行跳转详情

`Table` 的 `onRow` 为每行绑定 `onClick`，点击后导航到 `/api/{record.id}`。`rowKey="id"` 确保唯一性。
