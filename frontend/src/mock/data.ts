import type {
  ActivityEvent,
  ApiRecord,
  DashboardSnapshot,
  Dimension,
  DimensionRecord,
  AlignStatus,
  ApiLevel,
  DataSource,
} from '../types'

/* ---------------- Snapshot ---------------- */

export const SNAPSHOT: DashboardSnapshot = {
  snapshot_id: 'main-2026-04-15',
  snapshot_label: 'main @ 2026-04-15',
  data_updated_at: '2026-04-15T12:00:00',
}

/* ---------------- Helper factory ---------------- */

type DimInput = [
  AlignStatus,
  number | null, // pass_rate 0~1
  number, // case_total
  Partial<DimensionRecord>?,
]

const daysAgo = (d: number, h = 0) => {
  const base = new Date('2026-04-15T11:30:00')
  base.setDate(base.getDate() - d)
  base.setHours(base.getHours() - h)
  return base.toISOString().replace('.000Z', '')
}

function dim(
  status: AlignStatus,
  pass_rate: number | null,
  case_total: number,
  extra: Partial<DimensionRecord> = {},
): DimensionRecord {
  const fail_count =
    status === 'untested'
      ? 0
      : Math.max(0, Math.round((1 - (pass_rate ?? 1)) * case_total))
  return {
    status,
    pass_rate,
    case_total,
    fail_count,
    reviewed: status === 'reviewed',
    data_source: extra.data_source ?? 'ci',
    latest_run_at: extra.latest_run_at ?? daysAgo(1),
    case_stat: extra.case_stat ?? {
      pass: case_total - fail_count,
      fail: fail_count,
      error: 0,
      skip: 0,
    },
    ...extra,
  }
}

function scoreFor(dims: Record<Dimension, DimensionRecord>): number {
  const w: Record<AlignStatus, number> = {
    aligned: 100,
    reviewed: 70,
    pending: 30,
    unsupported: 0,
    untested: 0,
  }
  const arr = (['function', 'accuracy', 'memory', 'determinism'] as Dimension[]).map(
    (k) => w[dims[k].status],
  )
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
}

function riskTags(dims: Record<Dimension, DimensionRecord>, level: ApiLevel): string[] {
  const tags: string[] = []
  const statuses = Object.values(dims).map((d) => d.status)
  if (statuses.includes('pending')) tags.push('高风险')
  if (statuses.includes('unsupported')) tags.push('不支持')
  if ((level === 'L0' || level === 'L1') && statuses.includes('untested'))
    tags.push('L0/L1 未测')
  if (statuses.filter((s) => s === 'reviewed').length > 0) tags.push('已评审')
  return tags
}

function sourceSummary(dims: Record<Dimension, DimensionRecord>): DataSource[] {
  return Array.from(new Set(Object.values(dims).map((d) => d.data_source)))
}

function makeApi(
  api_name: string,
  api_module: string,
  api_level: ApiLevel,
  inputs: Record<Dimension, DimInput>,
  updated_at: string,
): ApiRecord {
  const dims: Record<Dimension, DimensionRecord> = {
    function: dim(...inputs.function),
    accuracy: dim(...inputs.accuracy),
    memory: dim(...inputs.memory),
    determinism: dim(...inputs.determinism),
  }
  return {
    api_name,
    api_module,
    api_level,
    alignment_score: scoreFor(dims),
    risk_tags: riskTags(dims, api_level),
    data_source_summary: sourceSummary(dims),
    updated_at,
    dimensions: dims,
  }
}

/* ---------------- Mock APIs ---------------- */

export const API_RECORDS: ApiRecord[] = [
  makeApi(
    'Tensor.to',
    'torch.Tensor',
    'L0',
    {
      function: ['aligned', 0.99, 142, { data_source: 'ci' }],
      accuracy: [
        'reviewed',
        0.91,
        60,
        {
          data_source: 'manual',
          reviewer: 'liwei',
          reviewed_at: daysAgo(12),
          deviation_note: 'fp16 下 atol=1e-3，硬件架构限制不再优化',
          source_url: 'https://ci.npu.internal/job/tensor-to/2341',
          top_failed_cases: [
            {
              name: 'test_to_float16_large_tensor',
              message: 'atol=1.2e-3 exceeds threshold',
            },
          ],
        },
      ],
      memory: ['untested', null, 0, { data_source: 'manual' }],
      determinism: ['aligned', 1.0, 15],
    },
    daysAgo(0, 2),
  ),

  makeApi(
    'Tensor.contiguous',
    'torch.Tensor',
    'L0',
    {
      function: ['aligned', 1.0, 88],
      accuracy: ['aligned', 1.0, 22],
      memory: ['aligned', 1.0, 18],
      determinism: ['aligned', 1.0, 12],
    },
    daysAgo(1),
  ),

  makeApi(
    'Tensor.view',
    'torch.Tensor',
    'L0',
    {
      function: ['aligned', 1.0, 65],
      accuracy: ['aligned', 1.0, 18],
      memory: ['reviewed', 0.98, 20, {
        reviewer: 'wanghua',
        reviewed_at: daysAgo(30),
        deviation_note: 'stride 布局差异，不影响功能',
      }],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(2),
  ),

  makeApi(
    'Tensor.reshape',
    'torch.Tensor',
    'L0',
    {
      function: ['aligned', 0.97, 110],
      accuracy: ['aligned', 1.0, 24],
      memory: ['pending', 0.62, 18, { fail_count: 7 }],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(0, 6),
  ),

  makeApi(
    'Tensor.scatter_',
    'torch.Tensor',
    'L1',
    {
      function: ['pending', 0.72, 95, {
        fail_count: 26,
        top_failed_cases: [
          { name: 'test_scatter_reduce_fp16', message: 'output mismatch at idx=128' },
          { name: 'test_scatter_empty_dim', message: 'RuntimeError: NPU-OP-NOT-SUPPORTED' },
        ],
      }],
      accuracy: ['pending', 0.55, 40],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(0, 1),
  ),

  makeApi(
    'Tensor.index_put_',
    'torch.Tensor',
    'L1',
    {
      function: ['pending', 0.68, 72, { fail_count: 23 }],
      accuracy: ['reviewed', 0.95, 30, {
        reviewer: 'zhangsan',
        reviewed_at: daysAgo(4),
        deviation_note: 'accumulate 模式存在 fp16 精度差异',
      }],
      memory: ['untested', null, 0],
      determinism: ['pending', 0.4, 10],
    },
    daysAgo(0, 4),
  ),

  makeApi(
    'Tensor.nonzero',
    'torch.Tensor',
    'L2',
    {
      function: ['aligned', 0.96, 28],
      accuracy: ['aligned', 1.0, 12],
      memory: ['untested', null, 0],
      determinism: ['reviewed', 1.0, 6, {
        reviewer: 'zhouqi',
        reviewed_at: daysAgo(22),
        deviation_note: '输出顺序受 kernel 调度影响，经确认可接受',
      }],
    },
    daysAgo(6),
  ),

  makeApi(
    'Tensor.sort',
    'torch.Tensor',
    'L1',
    {
      function: ['aligned', 0.99, 52],
      accuracy: ['aligned', 1.0, 18],
      memory: ['aligned', 1.0, 10],
      determinism: ['pending', 0.5, 8, { fail_count: 4, data_source: 'manual' }],
    },
    daysAgo(3),
  ),

  // torch.nn.functional
  makeApi(
    'F.conv2d',
    'torch.nn.functional',
    'L0',
    {
      function: ['aligned', 0.98, 210, { data_source: 'ci' }],
      accuracy: ['reviewed', 0.93, 88, {
        reviewer: 'chengming',
        reviewed_at: daysAgo(8),
        deviation_note: 'fp16 在大 kernel 下 atol=2e-3',
        source_url: 'https://ci.npu.internal/job/conv2d/5521',
      }],
      memory: ['aligned', 0.99, 40],
      determinism: ['reviewed', 1.0, 20, {
        reviewer: 'chengming',
        reviewed_at: daysAgo(8),
        deviation_note: '与 CUDA cudnn.benchmark 行为一致',
      }],
    },
    daysAgo(0, 3),
  ),

  makeApi(
    'F.linear',
    'torch.nn.functional',
    'L0',
    {
      function: ['aligned', 1.0, 120],
      accuracy: ['aligned', 0.99, 65],
      memory: ['aligned', 1.0, 22],
      determinism: ['aligned', 1.0, 18],
    },
    daysAgo(2),
  ),

  makeApi(
    'F.softmax',
    'torch.nn.functional',
    'L0',
    {
      function: ['aligned', 1.0, 72],
      accuracy: ['reviewed', 0.96, 48, {
        reviewer: 'yiran',
        reviewed_at: daysAgo(6),
        deviation_note: 'bf16 末位精度差异',
      }],
      memory: ['aligned', 1.0, 12],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(1),
  ),

  makeApi(
    'F.gelu',
    'torch.nn.functional',
    'L1',
    {
      function: ['aligned', 1.0, 44],
      accuracy: ['pending', 0.84, 30, { fail_count: 5 }],
      memory: ['aligned', 1.0, 10],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(0, 5),
  ),

  makeApi(
    'F.layer_norm',
    'torch.nn.functional',
    'L0',
    {
      function: ['aligned', 0.99, 84],
      accuracy: ['aligned', 0.98, 50],
      memory: ['untested', null, 0, { data_source: 'manual' }],
      determinism: ['aligned', 1.0, 16],
    },
    daysAgo(4),
  ),

  makeApi(
    'F.scaled_dot_product_attention',
    'torch.nn.functional',
    'L0',
    {
      function: ['pending', 0.79, 140, {
        fail_count: 29,
        top_failed_cases: [
          { name: 'test_sdpa_flash_bf16', message: 'attn output NaN' },
          { name: 'test_sdpa_causal_mask_long', message: 'shape mismatch' },
        ],
      }],
      accuracy: ['pending', 0.71, 60],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(0, 1),
  ),

  makeApi(
    'F.dropout',
    'torch.nn.functional',
    'L1',
    {
      function: ['aligned', 1.0, 24],
      accuracy: ['aligned', 1.0, 10],
      memory: ['aligned', 1.0, 8],
      determinism: ['reviewed', 1.0, 12, {
        reviewer: 'sunwei',
        reviewed_at: daysAgo(45),
        deviation_note: 'RNG 状态独立，与 CUDA 非确定性行为一致',
      }],
    },
    daysAgo(10),
  ),

  makeApi(
    'F.cross_entropy',
    'torch.nn.functional',
    'L0',
    {
      function: ['aligned', 0.98, 80],
      accuracy: ['aligned', 0.99, 48],
      memory: ['aligned', 0.99, 18],
      determinism: ['aligned', 1.0, 12],
    },
    daysAgo(3),
  ),

  // torch.nn
  makeApi(
    'nn.Linear',
    'torch.nn',
    'L0',
    {
      function: ['aligned', 1.0, 50],
      accuracy: ['aligned', 1.0, 24],
      memory: ['aligned', 1.0, 12],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(5),
  ),

  makeApi(
    'nn.LayerNorm',
    'torch.nn',
    'L0',
    {
      function: ['aligned', 1.0, 42],
      accuracy: ['aligned', 0.98, 26],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(8),
  ),

  makeApi(
    'nn.BatchNorm2d',
    'torch.nn',
    'L0',
    {
      function: ['aligned', 0.97, 68],
      accuracy: ['reviewed', 0.94, 34, {
        reviewer: 'liwei',
        reviewed_at: daysAgo(14),
        deviation_note: 'running_stats 更新顺序差异',
      }],
      memory: ['aligned', 1.0, 14],
      determinism: ['aligned', 1.0, 12],
    },
    daysAgo(5),
  ),

  makeApi(
    'nn.MultiheadAttention',
    'torch.nn',
    'L0',
    {
      function: ['pending', 0.74, 110, { fail_count: 29 }],
      accuracy: ['pending', 0.7, 50, { fail_count: 15 }],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(0, 2),
  ),

  makeApi(
    'nn.Embedding',
    'torch.nn',
    'L1',
    {
      function: ['aligned', 1.0, 38],
      accuracy: ['aligned', 1.0, 16],
      memory: ['aligned', 1.0, 10],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(9),
  ),

  // torch.optim
  makeApi(
    'optim.AdamW',
    'torch.optim',
    'L0',
    {
      function: ['aligned', 0.99, 52],
      accuracy: ['reviewed', 0.95, 30, {
        reviewer: 'yiran',
        reviewed_at: daysAgo(11),
        deviation_note: 'weight decay 浮点累积差异',
      }],
      memory: ['aligned', 1.0, 12],
      determinism: ['aligned', 1.0, 10],
    },
    daysAgo(4),
  ),

  makeApi(
    'optim.SGD',
    'torch.optim',
    'L0',
    {
      function: ['aligned', 1.0, 36],
      accuracy: ['aligned', 1.0, 20],
      memory: ['aligned', 1.0, 10],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(12),
  ),

  makeApi(
    'optim.Adam',
    'torch.optim',
    'L0',
    {
      function: ['aligned', 1.0, 36],
      accuracy: ['aligned', 0.98, 20],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(15),
  ),

  makeApi(
    'optim.RMSprop',
    'torch.optim',
    'L1',
    {
      function: ['aligned', 1.0, 24],
      accuracy: ['aligned', 1.0, 12],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(25),
  ),

  // torch.linalg
  makeApi(
    'linalg.norm',
    'torch.linalg',
    'L1',
    {
      function: ['aligned', 0.99, 42],
      accuracy: ['aligned', 0.98, 20],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(7),
  ),

  makeApi(
    'linalg.inv',
    'torch.linalg',
    'L1',
    {
      function: ['pending', 0.82, 38, { fail_count: 7 }],
      accuracy: ['pending', 0.66, 24, { fail_count: 8 }],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(0, 8),
  ),

  makeApi(
    'linalg.svd',
    'torch.linalg',
    'L1',
    {
      function: ['reviewed', 0.93, 30, {
        reviewer: 'wanghua',
        reviewed_at: daysAgo(9),
        deviation_note: 'U/V 符号自由度差异',
      }],
      accuracy: ['reviewed', 0.9, 18, {
        reviewer: 'wanghua',
        reviewed_at: daysAgo(9),
        deviation_note: 'fp32 下 rtol=1e-5',
      }],
      memory: ['untested', null, 0],
      determinism: ['pending', 0.4, 6],
    },
    daysAgo(9),
  ),

  makeApi(
    'linalg.solve',
    'torch.linalg',
    'L2',
    {
      function: ['unsupported', null, 0, { data_source: 'manual' }],
      accuracy: ['unsupported', null, 0],
      memory: ['unsupported', null, 0],
      determinism: ['unsupported', null, 0],
    },
    daysAgo(32),
  ),

  // torch.fft
  makeApi(
    'fft.fft',
    'torch.fft',
    'L2',
    {
      function: ['pending', 0.78, 28, { fail_count: 6 }],
      accuracy: ['pending', 0.65, 16, { fail_count: 5 }],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 6],
    },
    daysAgo(0, 10),
  ),

  makeApi(
    'fft.rfft',
    'torch.fft',
    'L2',
    {
      function: ['untested', null, 0],
      accuracy: ['untested', null, 0],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(50),
  ),

  makeApi(
    'fft.irfft',
    'torch.fft',
    'L2',
    {
      function: ['untested', null, 0],
      accuracy: ['untested', null, 0],
      memory: ['untested', null, 0],
      determinism: ['untested', null, 0],
    },
    daysAgo(50),
  ),

  // torch.cuda (NPU 等价层)
  makeApi(
    'cuda.stream',
    'torch.cuda',
    'L1',
    {
      function: ['reviewed', 0.92, 20, {
        reviewer: 'liuyang',
        reviewed_at: daysAgo(20),
        deviation_note: 'NPU stream 语义差异，经设计评审',
      }],
      accuracy: ['aligned', 1.0, 6],
      memory: ['aligned', 1.0, 6],
      determinism: ['aligned', 1.0, 6],
    },
    daysAgo(20),
  ),

  makeApi(
    'cuda.synchronize',
    'torch.cuda',
    'L1',
    {
      function: ['aligned', 1.0, 12],
      accuracy: ['aligned', 1.0, 4],
      memory: ['aligned', 1.0, 4],
      determinism: ['aligned', 1.0, 4],
    },
    daysAgo(18),
  ),

  // torch.distributed
  makeApi(
    'dist.all_reduce',
    'torch.distributed',
    'L0',
    {
      function: ['aligned', 0.98, 38],
      accuracy: ['aligned', 0.99, 18],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 8],
    },
    daysAgo(6),
  ),

  makeApi(
    'dist.broadcast',
    'torch.distributed',
    'L0',
    {
      function: ['aligned', 1.0, 24],
      accuracy: ['aligned', 1.0, 10],
      memory: ['untested', null, 0],
      determinism: ['aligned', 1.0, 6],
    },
    daysAgo(11),
  ),
]

/* ---------------- Activity feed ---------------- */

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    event_id: 'evt_001',
    event_time: daysAgo(0, 1),
    api_name: 'F.scaled_dot_product_attention',
    api_module: 'torch.nn.functional',
    dimension: 'function',
    event_type: 'regression',
    from_status: 'aligned',
    to_status: 'pending',
    updated_by: 'ci-bot',
    data_source: 'ci',
    source_url: 'https://ci.npu.internal/job/sdpa/8812',
    comment: 'flash-attn kernel 引入的输出 NaN',
  },
  {
    event_id: 'evt_002',
    event_time: daysAgo(0, 2),
    api_name: 'Tensor.to',
    api_module: 'torch.Tensor',
    dimension: 'accuracy',
    event_type: 'reviewed',
    from_status: 'pending',
    to_status: 'reviewed',
    updated_by: 'liwei',
    data_source: 'manual',
    comment: '硬件限制，不再优化',
  },
  {
    event_id: 'evt_003',
    event_time: daysAgo(0, 3),
    api_name: 'F.conv2d',
    api_module: 'torch.nn.functional',
    dimension: 'function',
    event_type: 'ci_reported',
    to_status: 'aligned',
    updated_by: 'ci-bot',
    data_source: 'ci',
    source_url: 'https://ci.npu.internal/job/conv2d/5521',
    comment: '210 case 全通过',
  },
  {
    event_id: 'evt_004',
    event_time: daysAgo(0, 5),
    api_name: 'F.gelu',
    api_module: 'torch.nn.functional',
    dimension: 'accuracy',
    event_type: 'status_changed',
    from_status: 'aligned',
    to_status: 'pending',
    updated_by: 'ci-bot',
    data_source: 'ci',
    source_url: 'https://ci.npu.internal/job/gelu/1921',
  },
  {
    event_id: 'evt_005',
    event_time: daysAgo(1),
    api_name: 'nn.BatchNorm2d',
    api_module: 'torch.nn',
    dimension: 'accuracy',
    event_type: 'reviewed',
    from_status: 'pending',
    to_status: 'reviewed',
    updated_by: 'liwei',
    data_source: 'manual',
    comment: 'running_stats 更新顺序差异',
  },
  {
    event_id: 'evt_006',
    event_time: daysAgo(0, 8),
    api_name: 'linalg.inv',
    api_module: 'torch.linalg',
    dimension: 'function',
    event_type: 'case_added',
    updated_by: 'chengming',
    data_source: 'manual',
    comment: '新增 12 条边界 case',
  },
  {
    event_id: 'evt_007',
    event_time: daysAgo(2),
    api_name: 'Tensor.sort',
    api_module: 'torch.Tensor',
    dimension: 'determinism',
    event_type: 'status_changed',
    from_status: 'aligned',
    to_status: 'pending',
    updated_by: 'ci-bot',
    data_source: 'ci',
    source_url: 'https://ci.npu.internal/job/sort/231',
  },
  {
    event_id: 'evt_008',
    event_time: daysAgo(3),
    api_name: 'F.softmax',
    api_module: 'torch.nn.functional',
    dimension: 'accuracy',
    event_type: 'fixed',
    from_status: 'pending',
    to_status: 'aligned',
    updated_by: 'yiran',
    data_source: 'ci',
    source_url: 'https://ci.npu.internal/job/softmax/998',
    comment: '修复 bf16 末位精度问题',
  },
  {
    event_id: 'evt_009',
    event_time: daysAgo(4),
    api_name: 'Tensor.reshape',
    api_module: 'torch.Tensor',
    dimension: 'memory',
    event_type: 'status_changed',
    from_status: 'untested',
    to_status: 'pending',
    updated_by: 'ci-bot',
    data_source: 'ci',
  },
  {
    event_id: 'evt_010',
    event_time: daysAgo(5),
    api_name: 'optim.AdamW',
    api_module: 'torch.optim',
    dimension: 'accuracy',
    event_type: 'reviewed',
    from_status: 'pending',
    to_status: 'reviewed',
    updated_by: 'yiran',
    data_source: 'manual',
  },
]
