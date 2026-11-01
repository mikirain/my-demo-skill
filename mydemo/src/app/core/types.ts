export type Country = 'DE' | 'UK' | 'IT' | 'CZ' | 'AU' | 'PL';

export type DocType =
  | 'tender'
  | 'competitorBid'
  | 'competitorManual'
  | 'awardNotice'
  | 'ourProduct'
  | 'other';

export type SourceReliability = 'official' | 'public' | 'thirdParty' | 'unknown';

export type ParseStatus = 'queued' | 'parsing' | 'done' | 'review' | 'failed';

export type ParamStatus = 'draft' | 'pending' | 'confirmed' | 'corrected' | 'conflict';

export type JudgeStatus =
  | 'compliant'
  | 'potentialDeviation'
  | 'deviation'
  | 'noResponse'
  | 'insufficientEvidence'
  | 'incomparable'
  | 'undisclosed';

export type ParamLevel = 'cell' | 'module' | 'rack' | 'system' | 'plant';

export type Dimension =
  | 'technical'
  | 'performance'
  | 'safety'
  | 'warranty'
  | 'delivery'
  | 'commercial';

export type RiskLevel = 'high' | 'mid' | 'low';

export type InsightType = 'fact' | 'inference' | 'suggestion';

export type Role = 'engineer' | 'bidManager' | 'commercial' | 'legal' | 'exec' | 'admin';

export type TaskState = 'pending' | 'approved' | 'rejected' | 'assigned' | 'overdue';

export type AuditAction =
  | 'upload'
  | 'parse'
  | 'extract'
  | 'correct'
  | 'confirm'
  | 'conflict'
  | 'export'
  | 'approve'
  | 'login'
  | 'config';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'dashed';

export interface Condition {
  dod?: number;
  temperature?: number;
  boundary?: 'dc-dc' | 'pcs' | 'ac-ac';
  sohEnd?: number;
  loadRate?: number;
  period?: 'year' | 'month';
  note?: string;
}

export interface Evidence {
  documentId: string;
  page: number;
  section: string;
  snippet: string;
  reliability: SourceReliability;
}

export interface Member {
  userId: string;
  role: Role;
  lastActive: string;
}

export interface Gate {
  key: string;
  label: string;
  state: 'done' | 'active' | 'todo' | 'blocked';
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  customer: string;
  country: Country;
  mw: number;
  mwh: number;
  route: string;
  deadline: string;
  stage: 'intake' | 'extraction' | 'standardization' | 'comparison' | 'insight' | 'published';
  customerType: string;
  contractMode: string;
  members: Member[];
  completeness: number;
  gates: Gate[];
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: DocType;
  reliability: SourceReliability;
  language: string;
  pages: number;
  qualityScore: number;
  parseStatus: ParseStatus;
  uploadedBy: string;
  uploadedAt: string;
  hash: string;
  competitorId?: string;
}

export interface ParseIssue {
  id: string;
  documentId: string;
  kind: 'missingPage' | 'crossPageTable' | 'lowOcr' | 'imageParam';
  severity: RiskLevel;
  page: number;
  text: string;
  handled: boolean;
}

export interface PageAnchor {
  id: string;
  documentId: string;
  page: number;
  section: string;
  paramKey: string;
  paramLabel: string;
  snippet: string;
  confidence: number;
}

export interface ParamDef {
  key: string;
  label: string;
  unit: string;
  domain: Dimension;
  level: ParamLevel;
  requiredConditions: (keyof Condition)[];
  aliases: string[];
  version: number;
}

export interface ConflictValue {
  value: string;
  source: string;
}

export interface ParamValue {
  id: string;
  projectId: string;
  defKey: string;
  defLabel: string;
  sourceId: string;
  sourceName: string;
  rawName: string;
  rawValue: string;
  value: string | number | null;
  unit: string;
  conditions: Condition;
  level: ParamLevel;
  evidence?: Evidence;
  confidence: number;
  status: ParamStatus;
  correctedBy?: string;
  correctedAt?: string;
  reason?: string;
  conflictValues?: ConflictValue[];
  dimension: Dimension;
}

export interface CompetitorModel {
  name: string;
  mwh: number;
  note: string;
}

export interface CompetitorHistoryItem {
  defKey: string;
  label: string;
  value: string;
  unit: string;
  source: string;
  date: string;
  stale: boolean;
}

export interface CompetitorProjectItem {
  name: string;
  result: 'win' | 'lose' | 'unknown';
  year: number;
}

export interface Competitor {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  regions: Country[];
  models: CompetitorModel[];
  paramHistory: CompetitorHistoryItem[];
  projects: CompetitorProjectItem[];
}

export interface Requirement {
  id: string;
  defKey: string;
  text: string;
  mandatory: boolean;
  targetValue: string;
  unit: string;
  conditions: Condition;
}

export interface ComparisonCell {
  sourceId: string;
  sourceName: string;
  display: string;
  status: JudgeStatus;
}

export interface RuleHit {
  rule: string;
  detail: string;
}

export interface ComparableCheck {
  level: boolean;
  unit: boolean;
  conditions: boolean;
  boundary: boolean;
}

export interface ComparisonRow {
  id: string;
  projectId: string;
  defKey: string;
  defLabel: string;
  requirement: Requirement;
  dimension: Dimension;
  mandatory: boolean;
  cells: ComparisonCell[];
  judged: JudgeStatus;
  reason: string;
  ruleHits: RuleHit[];
  comparable: ComparableCheck;
  clarify?: string;
  weight: number;
}

export interface Insight {
  id: string;
  projectId: string;
  type: InsightType;
  text: string;
  evidenceIds: string[];
  state: 'draft' | 'adopted' | 'rejected' | 'edited';
  rejectReason?: string;
}

export interface RiskItem {
  id: string;
  projectId: string;
  level: RiskLevel;
  kind: string;
  text: string;
  relatedKeys: string[];
  suggestion: string;
  owner: string;
  state: 'open' | 'mitigating' | 'closed';
}

export interface Clarification {
  id: string;
  projectId: string;
  question: string;
  background: string;
  impact: string;
  evidenceIds: string[];
}

export interface DiffItem {
  field: string;
  current: string;
  suggested: string;
  changed: boolean;
}

export interface ReviewTask {
  id: string;
  projectId: string;
  kind: string;
  targetRef: string;
  title: string;
  priority: RiskLevel;
  assignee: string;
  editor: string;
  due: string;
  state: TaskState;
  diff: DiffItem[];
  note?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  audience: string;
  sections: string[];
  estPages: number;
  icon: string;
}

export interface ReportSnapshot {
  id: string;
  projectId: string;
  templateId: string;
  version: string;
  publishedAt: string;
  author: string;
  watermark: string;
  pages: number;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  target: string;
  result: 'ok' | 'denied';
  ip: string;
  detail?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  initials: string;
  lastLogin: string;
}

export interface ThresholdConfig {
  autoPass: number;
  manualForce: number;
  sampleRate: number;
  weights: Record<Dimension, number>;
  kbValidityMonths: number;
  reviewTimeoutHours: number;
}

export type Permission = 'allow' | 'read' | 'deny';
export type PermissionMatrix = Record<Role, Record<string, Permission>>;

/* ---------------- v1.1 中标经验复盘 ---------------- */

export type EvidenceLevel = 'A' | 'B' | 'C';

export type ExperienceCategory = 'competitor' | 'deviation' | 'commercial' | 'awarded';

export type WinFactorCategory =
  | 'price'
  | 'tco'
  | 'safety'
  | 'efficiency'
  | 'delivery'
  | 'local'
  | 'reference'
  | 'compliance';

export interface WinFactor {
  id: string;
  title: string;
  category: WinFactorCategory;
  level: EvidenceLevel;
  customerNeed: string;
  ourResponse: string;
  competitorGap: string;
  evidence: string[];
  confirmedBy?: string;
}

export interface AwardedProject {
  id: string;
  name: string;
  country: Country;
  mw: number;
  mwh: number;
  route: string;
  customerType: string;
  bidMode: string;
  contractMode: string;
  productModel: string;
  awardedYear: number;
  competitorIds: string[];
  hasScoreSheet: boolean;
  snapshotAt: string;
  factors: WinFactor[];
}

export interface Experience {
  id: string;
  category: ExperienceCategory;
  title: string;
  summary: string;
  projectId: string;
  country: Country;
  scaleBand: string;
  customerType: string;
  bidMode: string;
  productModel: string;
  requirement: string;
  strategy: string;
  result: string;
  evidenceLevel: EvidenceLevel;
  evidenceSources: string[];
  reviewer: string;
  reviewedAt: string;
  scope: string;
  state: 'draft' | 'verified' | 'deprecated';
}

export interface FulfilmentRecord {
  id: string;
  projectId: string;
  commitment: string;
  target: string;
  actual: string;
  variance: string;
  status: 'met' | 'partial' | 'missed' | 'pending';
  note: string;
  verifiedAt: string;
}

export interface MatchResult {
  project: AwardedProject;
  score: number;
  matched: string[];
  differences: string[];
  usableExperiences: Experience[];
  hypotheses: Experience[];
}

/** 证据等级变更申请（升级 / 降级均需留痕，升级需审批） */
export interface LevelChange {
  id: string;
  experienceId: string;
  from: EvidenceLevel;
  to: EvidenceLevel;
  reason: string;
  evidenceSources: string[];
  requestedBy: string;
  requestedAt: string;
  state: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}
