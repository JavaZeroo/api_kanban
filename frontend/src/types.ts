export type AlignStatus =
  | 'aligned'
  | 'reviewed'
  | 'pending'
  | 'unsupported'
  | 'untested'

export const STATUS_LABEL: Record<AlignStatus, string> = {
  aligned: '完全对齐',
  reviewed: '已评审差异',
  pending: '待修复',
  unsupported: '不支持',
  untested: '未测试',
}

export const STATUS_SHORT: Record<AlignStatus, string> = {
  aligned: '对齐',
  reviewed: '已评审',
  pending: '待修复',
  unsupported: '不支持',
  untested: '未测试',
}

export const STATUS_COLOR: Record<AlignStatus, string> = {
  aligned: '#61B230',
  reviewed: '#FCC800',
  pending: '#D53C44',
  unsupported: '#C7000B',
  untested: '#A6A6A6',
}

export const STATUS_ORDER: AlignStatus[] = [
  'aligned',
  'reviewed',
  'pending',
  'unsupported',
  'untested',
]

export type Dimension = 'function' | 'accuracy' | 'memory' | 'determinism'

export const DIMENSION_LABEL: Record<Dimension, string> = {
  function: '功能',
  accuracy: '精度',
  memory: '内存',
  determinism: '确定性',
}

export const DIMENSIONS: Dimension[] = [
  'function',
  'accuracy',
  'memory',
  'determinism',
]

export type ApiLevel = 'L0' | 'L1' | 'L2' | 'TBD'

export type DataSource = 'ci' | 'manual' | 'import'

export interface TestCaseStat {
  pass: number
  fail: number
  error: number
  skip: number
}

export interface TopFailedCase {
  name: string
  message: string
}

export interface DimensionRecord {
  status: AlignStatus
  pass_rate: number | null
  case_total: number
  fail_count: number
  reviewed: boolean
  reviewer?: string
  reviewed_at?: string
  deviation_note?: string
  source_url?: string
  data_source: DataSource
  latest_run_at: string
  case_stat: TestCaseStat
  top_failed_cases?: TopFailedCase[]
}

export interface ApiRecord {
  api_name: string
  api_module: string
  api_level: ApiLevel
  alignment_score: number
  risk_tags: string[]
  data_source_summary: DataSource[]
  updated_at: string
  dimensions: Record<Dimension, DimensionRecord>
}

export type ActivityType =
  | 'status_changed'
  | 'ci_reported'
  | 'case_added'
  | 'reviewed'
  | 'regression'
  | 'fixed'

export interface ActivityEvent {
  event_id: string
  event_time: string
  api_name: string
  api_module: string
  dimension: Dimension
  event_type: ActivityType
  from_status?: AlignStatus
  to_status?: AlignStatus
  updated_by: string
  data_source: DataSource
  source_url?: string
  comment?: string
}

export interface DashboardSnapshot {
  snapshot_id: string
  snapshot_label: string
  data_updated_at: string
}
