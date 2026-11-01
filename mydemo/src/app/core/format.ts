import {
  AuditAction,
  Country,
  Dimension,
  DocType,
  InsightType,
  JudgeStatus,
  ParamStatus,
  ParseStatus,
  RiskLevel,
  Role,
  SourceReliability,
  TaskState,
  Tone,
} from './types';

export const DEMO_TODAY = new Date('2026-10-24T09:00:00');

export const COUNTRY_LABEL: Record<Country, string> = {
  DE: '德国',
  UK: '英国',
  IT: '意大利',
  CZ: '捷克',
  AU: '澳大利亚',
  PL: '波兰',
};

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  tender: '招标文件',
  competitorBid: '竞对标书',
  competitorManual: '竞对手册',
  awardNotice: '中标公示',
  ourProduct: '我方资料',
  other: '其他',
};

export const RELIABILITY_LABEL: Record<SourceReliability, string> = {
  official: '官方发布',
  public: '公开渠道',
  thirdParty: '第三方转述',
  unknown: '来源未知',
};

export const PARSE_STATUS_LABEL: Record<ParseStatus, string> = {
  queued: '排队中',
  parsing: '解析中',
  done: '完成',
  review: '需核对',
  failed: '失败',
};

export const PARAM_STATUS_LABEL: Record<ParamStatus, string> = {
  draft: '抽取中',
  pending: '待复核',
  confirmed: '已确认',
  corrected: '已修正',
  conflict: '冲突待决',
};

export const JUDGE_LABEL: Record<JudgeStatus, string> = {
  compliant: '满足',
  potentialDeviation: '潜在偏离',
  deviation: '明确偏离',
  noResponse: '未应答',
  insufficientEvidence: '证据不足',
  incomparable: '无法直接比较',
  undisclosed: '未披露',
};

export const LEVEL_LABEL: Record<string, string> = {
  cell: '电芯',
  module: '模组',
  rack: '机柜',
  system: '系统',
  plant: '全站',
};

export const DIMENSION_LABEL: Record<Dimension, string> = {
  technical: '技术',
  performance: '性能',
  safety: '安全',
  warranty: '质保',
  delivery: '交付',
  commercial: '商务',
};

export const DIMENSIONS: Dimension[] = [
  'technical',
  'performance',
  'safety',
  'warranty',
  'delivery',
  'commercial',
];

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: '高',
  mid: '中',
  low: '低',
};

export const INSIGHT_LABEL: Record<InsightType, string> = {
  fact: '事实',
  inference: '推断',
  suggestion: '建议',
};

export const ROLE_LABEL: Record<Role, string> = {
  engineer: '技术工程师',
  bidManager: '投标经理',
  commercial: '商务',
  legal: '法务',
  exec: '管理层',
  admin: '管理员',
};

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
  assigned: '已指派',
  overdue: '已超期',
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  upload: '上传资料',
  parse: '文档解析',
  extract: '参数抽取',
  correct: '修正参数',
  confirm: '确认参数',
  conflict: '冲突裁决',
  export: '导出报告',
  approve: '审核通过',
  login: '登录',
  config: '配置变更',
};

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: string;
}

export const JUDGE_META: Record<JudgeStatus, StatusMeta> = {
  compliant: { label: '满足', tone: 'ok', icon: 'check' },
  potentialDeviation: { label: '潜在偏离', tone: 'warn', icon: 'alert' },
  deviation: { label: '明确偏离', tone: 'danger', icon: 'alert' },
  noResponse: { label: '未应答', tone: 'neutral', icon: 'minus' },
  insufficientEvidence: { label: '证据不足', tone: 'neutral', icon: 'help' },
  incomparable: { label: '无法直接比较', tone: 'dashed', icon: 'scale' },
  undisclosed: { label: '未披露', tone: 'neutral', icon: 'minus' },
};

export const JUDGE_PRIORITY: Record<JudgeStatus, number> = {
  deviation: 1,
  incomparable: 2,
  potentialDeviation: 3,
  noResponse: 3,
  insufficientEvidence: 4,
  undisclosed: 5,
  compliant: 6,
};

export const PARAM_STATUS_TONE: Record<ParamStatus, Tone> = {
  draft: 'neutral',
  pending: 'warn',
  confirmed: 'ok',
  corrected: 'info',
  conflict: 'danger',
};

export const PARSE_STATUS_TONE: Record<ParseStatus, Tone> = {
  queued: 'neutral',
  parsing: 'info',
  done: 'ok',
  review: 'warn',
  failed: 'danger',
};

export const RELIABILITY_TONE: Record<SourceReliability, Tone> = {
  official: 'ok',
  public: 'info',
  thirdParty: 'warn',
  unknown: 'neutral',
};

export const RISK_TONE: Record<RiskLevel, Tone> = {
  high: 'danger',
  mid: 'warn',
  low: 'ok',
};

export function daysLeft(iso: string): number {
  const target = new Date(iso + 'T09:00:00').getTime();
  return Math.round((target - DEMO_TODAY.getTime()) / 86400000);
}

export function deadlineTone(iso: string): Tone {
  const d = daysLeft(iso);
  if (d <= 3) return 'danger';
  if (d <= 7) return 'warn';
  return 'neutral';
}

export function deadlineText(iso: string): string {
  const d = daysLeft(iso);
  if (d < 0) return `已过期 ${Math.abs(d)} 天`;
  if (d === 0) return '今天截止';
  return `T-${d} 天`;
}

export function confidenceTone(v: number): Tone {
  if (v >= 0.85) return 'ok';
  if (v >= 0.6) return 'warn';
  return 'danger';
}

export function fmtNum(v: number | string | null): string {
  if (v === null || v === '') return '—';
  if (typeof v === 'string') return v;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function fmtPct(v: number): string {
  return `${v.toFixed(0)}%`;
}

export function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export function fmtDateTime(iso: string): string {
  return iso.slice(5, 16).replace('T', ' ');
}

export function initials(name: string): string {
  return name.slice(0, 1);
}

export function conditionText(c: {
  dod?: number;
  temperature?: number;
  boundary?: string;
  sohEnd?: number;
  loadRate?: number;
  period?: string;
  note?: string;
}): string {
  const parts: string[] = [];
  if (c.dod !== undefined) parts.push(`DoD ${c.dod}%`);
  if (c.temperature !== undefined) parts.push(`${c.temperature}℃`);
  if (c.boundary) parts.push(c.boundary.toUpperCase());
  if (c.sohEnd !== undefined) parts.push(`SoH ${c.sohEnd}%`);
  if (c.loadRate !== undefined) parts.push(`负载 ${c.loadRate}%`);
  if (c.period) parts.push(c.period === 'year' ? '年度口径' : '月度口径');
  if (c.note) parts.push(c.note);
  return parts.length ? parts.join(' · ') : '条件未标注';
}

export function sumWeights(w: Record<Dimension, number>): number {
  return DIMENSIONS.reduce((acc, d) => acc + (w[d] ?? 0), 0);
}
