# BidScope PRD 拆解 03 · 数据模型与 Mock 数据规范

> 上游：总 PRD v1.0｜本文定义前端 TypeScript 类型契约、枚举字典、Mock 数据规模与生成规则、状态存储（store）接口。实现必须与本文一致，禁止页面内自定义结构。

| 项目 | 内容 |
| --- | --- |
| 版本 | v1.0 |
| 位置 | `mydemo/src/app/core/types.ts`、`core/mock/*.ts`、`core/store.ts` |
| 原则 | 确定性（刷新结果一致）、可复现、零真实企业数据、虚构声明常驻界面 |

---

## 1. 枚举字典

| 枚举 | 取值 | 中文标签 |
| --- | --- | --- |
| `Country` | `DE` `UK` `IT` `CZ` `AU` `PL` | 德国 / 英国 / 意大利 / 捷克 / 澳大利亚 / 波兰 |
| `DocType` | `tender` `competitorBid` `competitorManual` `awardNotice` `ourProduct` `other` | 招标文件 / 竞对标书 / 竞对手册 / 中标公示 / 我方资料 / 其他 |
| `SourceReliability` | `official` `public` `thirdParty` `unknown` | 官方发布 / 公开渠道 / 第三方转述 / 来源未知 |
| `ParseStatus` | `queued` `parsing` `done` `review` `failed` | 排队中 / 解析中 / 完成 / 需核对 / 失败 |
| `ParamStatus` | `draft` `pending` `confirmed` `corrected` `conflict` | 抽取中 / 待复核 / 已确认 / 已修正 / 冲突待决 |
| `JudgeStatus` | `compliant` `potentialDeviation` `deviation` `noResponse` `insufficientEvidence` `incomparable` `undisclosed` | 满足 / 潜在偏离 / 明确偏离 / 未应答 / 证据不足 / 无法直接比较 / 未披露 |
| `ParamLevel` | `cell` `module` `rack` `system` `plant` | 电芯 / 模组 / 机柜 / 系统 / 全站 |
| `Dimension` | `technical` `performance` `safety` `warranty` `delivery` `commercial` | 技术 / 性能 / 安全 / 质保 / 交付 / 商务 |
| `RiskLevel` | `high` `mid` `low` | 高 / 中 / 低 |
| `InsightType` | `fact` `inference` `suggestion` | 事实 / 推断 / 建议 |
| `Role` | `engineer` `bidManager` `commercial` `legal` `exec` `admin` | 技术工程师 / 投标经理 / 商务 / 法务 / 管理层 / 管理员 |
| `TaskState` | `pending` `approved` `rejected` `assigned` `overdue` | 待处理 / 已通过 / 已驳回 / 已指派 / 已超期 |
| `AuditAction` | `upload` `parse` `extract` `correct` `confirm` `conflict` `export` `approve` `login` `config` | — |

---

## 2. 类型契约

```ts
export interface Condition {
  dod?: number;            // 放电深度 %
  temperature?: number;    // ℃
  boundary?: 'dc-dc' | 'pcs' | 'ac-ac';
  sohEnd?: number;         // 寿命终点 %
  loadRate?: number;       // 负载率 %
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

export interface Project {
  id: string; name: string; customer: string; country: Country;
  mw: number; mwh: number; route: 'LFP 液冷' | 'LFP 风冷' | 'NMC 液冷';
  deadline: string;               // ISO date
  stage: 'intake' | 'extraction' | 'standardization' | 'comparison' | 'insight' | 'published';
  members: Member[];
  completeness: number;           // 0-100
  gates: { key: string; label: string; state: 'done' | 'active' | 'todo' | 'blocked'; note?: string }[];
}

export interface Member { userId: string; role: Role; lastActive: string }

export interface Document {
  id: string; projectId: string; name: string;
  type: DocType; reliability: SourceReliability; language: string;
  pages: number; qualityScore: number; parseStatus: ParseStatus;
  uploadedBy: string; uploadedAt: string; hash: string;
  competitorId?: string;          // 竞对资料关联
}

export interface ParseIssue {
  id: string; documentId: string; kind: 'missingPage' | 'crossPageTable' | 'lowOcr' | 'imageParam';
  severity: RiskLevel; page: number; text: string; handled: boolean;
}

export interface PageAnchor {
  id: string; documentId: string; page: number; section: string;
  paramKey: string; paramLabel: string; snippet: string; confidence: number;
}

/** 参数字典项（全局） */
export interface ParamDef {
  key: string; label: string; unit: string; domain: Dimension;
  level: ParamLevel; requiredConditions: (keyof Condition)[];
  aliases: string[]; version: number;
}

/** 核心数据契约：五元组 */
export interface ParamValue {
  id: string; projectId: string; defKey: string; defLabel: string;
  sourceId: string;               // 'our' | competitorId
  sourceName: string; rawName: string; rawValue: string;
  value: string | number | null; unit: string;
  conditions: Condition; level: ParamLevel;
  evidence?: Evidence; confidence: number;
  status: ParamStatus; correctedBy?: string; correctedAt?: string;
  reason?: string; conflictValues?: { value: string; source: string }[];
  dimension: Dimension;
}

export interface Competitor {
  id: string; name: string; tier: 1 | 2 | 3; regions: Country[];
  models: { name: string; mwh: number; note: string }[];
  paramHistory: { defKey: string; label: string; value: string; unit: string;
                  source: string; date: string; stale: boolean }[];
  projects: { name: string; result: 'win' | 'lose' | 'unknown'; year: number }[];
}

export interface Requirement {
  id: string; defKey: string; text: string; mandatory: boolean;
  targetValue: string; unit: string; conditions: Condition;
}

export interface ComparisonRow {
  id: string; projectId: string; defKey: string; defLabel: string;
  requirement: Requirement; dimension: Dimension; mandatory: boolean;
  cells: { sourceId: string; sourceName: string; display: string; status: JudgeStatus }[];
  judged: JudgeStatus; reason: string; ruleHits: { rule: string; detail: string }[];
  comparable: { level: boolean; unit: boolean; conditions: boolean; boundary: boolean };
  clarify?: string; weight: number;
}

export interface Insight {
  id: string; projectId: string; type: InsightType; text: string;
  evidenceIds: string[]; state: 'draft' | 'adopted' | 'rejected' | 'edited';
  rejectReason?: string;
}

export interface RiskItem {
  id: string; projectId: string; level: RiskLevel;
  kind: '废标风险' | '技术偏离' | '承诺风险' | '证据缺口' | '商务风险';
  text: string; relatedKeys: string[]; suggestion: string; owner: string;
  state: 'open' | 'mitigating' | 'closed';
}

export interface Clarification {
  id: string; projectId: string; question: string; background: string;
  impact: string; evidenceIds: string[];
}

export interface DiffItem { field: string; current: string; suggested: string; changed: boolean }

export interface ReviewTask {
  id: string; projectId: string; kind: '参数复核' | '结论审核' | '强制条款' | '承诺风险' | '入库申请';
  targetRef: string; title: string; priority: RiskLevel;
  assignee: string; editor: string; due: string; state: TaskState;
  diff: DiffItem[]; note?: string;
}

export interface ReportTemplate {
  id: string; name: string; audience: string; sections: string[];
  estPages: number; icon: string;
}

export interface ReportSnapshot {
  id: string; projectId: string; templateId: string; version: string;
  publishedAt: string; author: string; watermark: string; pages: number;
}

export interface AuditEvent {
  id: string; at: string; actor: string; action: AuditAction;
  target: string; result: 'ok' | 'denied'; ip: string; detail?: string;
}

export interface User { id: string; name: string; role: Role; initials: string; lastLogin: string }

export interface ThresholdConfig {
  autoPass: number; manualForce: number; sampleRate: number;
  weights: Record<Dimension, number>;
  kbValidityMonths: number; reviewTimeoutHours: number;
}

export type Permission = 'allow' | 'read' | 'deny';
export type PermissionMatrix = Record<Role, Record<string, Permission>>;
```

---

## 3. Mock 数据规模

| 数据集 | 条数 | 关键约束 |
| --- | --- | --- |
| projects | 3 | 捷克 100MWh（主）、德国 230MWh、英国 60MWh；覆盖不同阶段 |
| members | 6 | 覆盖 6 类角色 |
| documents | 14 | 每项目 4–5 份；含 2 失败、3 低分、2 缺失页 |
| parseIssues | 6 | 覆盖四种异常类型 |
| pageAnchors | 18 | 集中在主项目 2 份文档 |
| paramDefs | 48 | 覆盖 6 维度、5 层级、必填条件 |
| paramValues | 60 | 分布：高置信 34 / 中 16 / 低 6 / 冲突 4 |
| competitors | 6 | 梯队 1：2 家；梯队 2：3 家；中国同侪 1 家 |
| comparisonRows | 42 | 含 8 Mandatory；六态全覆盖；不可比 5 行 |
| insights | 12 | 事实 5 / 推断 4 / 建议 3；2 条无证据（应被拦截不展示） |
| riskItems | 8 | 高 3 / 中 3 / 低 2 |
| clarifications | 6 | — |
| reviewTasks | 9 | 含 2 超期、1 自审冲突（演示双人规则） |
| reportTemplates | 5 | 技术报告/差距清单/证据索引/澄清清单/一页简报 |
| reportSnapshots | 3 | v1.0 / v1.1 / v2.0 |
| auditEvents | 30 | 覆盖 10 类动作、含 1 条 denied |
| users | 8 | 6 角色 + 1 只读 + 1 停用 |

**虚构声明**：所有项目名、客户名、竞对名（A/B/C 等代号）、参数值均为虚构，界面页脚常驻「演示数据，非真实企业信息」。

---

## 4. 生成规则（确定性）

1. 所有时间基于固定基准日 `2026-10-24`，用 `offset(days)` 计算，禁止 `Date.now()` 参与渲染关键内容；
2. ID 形如 `p-01`、`doc-014`、`pv-023`、`cmp-017`、`ins-009`、`task-05`、`aud-030`；
3. 置信度两位小数；质量分整数；
4. 冲突值固定在 `pv-008`、`pv-019`、`pv-031`、`pv-044`；
5. 判定与证据必须自洽：状态为 `insufficientEvidence` 的行其 `evidence` 为 `undefined`；
6. 竞对名用 `竞对 A`…`竞对 E` + 一家「中国同侪 F」，不映射真实厂商。

---

## 5. 状态存储接口（`WorkspaceStore`）

```ts
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  // 只读信号
  readonly projects: Signal<Project[]>;
  readonly activeProject: Signal<Project | undefined>;
  readonly documents: Signal<Document[]>;          // 按 activeProject 过滤
  readonly paramValues: Signal<ParamValue[]>;
  readonly comparisonRows: Signal<ComparisonRow[]>;
  readonly insights: Signal<Insight[]>;
  readonly risks: Signal<RiskItem[]>;
  readonly clarifications: Signal<Clarification[]>;
  readonly reviewTasks: Signal<ReviewTask[]>;
  readonly auditEvents: Signal<AuditEvent[]>;
  readonly thresholds: Signal<ThresholdConfig>;
  readonly weights: Signal<Record<Dimension, number>>;
  readonly currentUser: Signal<User>;

  // 派生
  readonly counts: Signal<{ pending: number; forced: number; conflicts: number;
                            corrected: number; unconfirmedInsights: number;
                            unapprovedTasks: number; fatalRisks: number }>;
  readonly publicationBlocked: Signal<boolean>;   // 存在未裁决冲突/未审高风险

  // 命令
  setActiveProject(id: string): void;
  correctParam(id: string, patch: Partial<ParamValue> & { reason: string }): void;
  confirmParam(id: string): void;
  bulkConfirm(ids: string[]): void;
  resolveConflict(id: string, chosen: string, note: string): void;
  adoptInsight(id: string): void;
  rejectInsight(id: string, reason: string): void;
  approveTask(id: string, note?: string): void;
  rejectTask(id: string, reason: string): void;
  setWeights(w: Record<Dimension, number>): void;
  updateThresholds(patch: Partial<ThresholdConfig>, note: string): void;
  pushAudit(action: AuditAction, target: string, detail?: string): void;
  resetDemo(): void;
}
```

### 5.1 状态变更的连带规则

| 命令 | 连带效果 |
| --- | --- |
| `correctParam` | 状态 → `corrected`；写审计；若影响对比行，该行 `judged` 重算提示（Demo 中用标注「结论需复核」） |
| `confirmParam` | 状态 → `confirmed`；从待办计数移除 |
| `resolveConflict` | 状态 → `confirmed`；清除冲突标记；解除报告发布阻断 |
| `adoptInsight` | 状态 → `adopted`；计入采纳率 |
| `approveTask` | 状态 → `approved`；写审计；若为「承诺风险」类，解除导出阻断 |
| `setWeights` | 合计必须 100，否则拒绝并返回错误；写审计 |
| `updateThresholds` | 需 note；写审计；更新路由阈值（影响 `counts.pending`） |

---

## 6. 格式化与展示约定

| 内容 | 规则 |
| --- | --- |
| 容量 | `100 MWh`（整数 + 空格 + 单位） |
| 数值 | 等宽字体，最多两位小数，单位后置空格 |
| 日期 | `2026-11-08`；时间线用 `11-06 14:32` |
| 倒计时 | `T-7 天`，≤3 天标 danger，≤7 天标 warn |
| 置信度 | `0.92` + 进度条；<0.60 显示「强制人工」 |
| 页码 | `P.37`；区间 `P.37–38` |
| 空值 | 显示 `—` 并附 tooltip「原文未披露」，禁止显示 0 |
| 缺失证据 | 灰显数值 + `无引用` 标签 |

---

## 7. 验收自检（数据层）

- [ ] 任一页面刷新后数据一致（无 `Math.random`、无 `Date.now` 影响渲染）
- [ ] `paramValues` 中 4 条冲突项可在界面裁决
- [ ] `comparisonRows` 的六态全部至少出现一次
- [ ] 无证据条目不出现在研判列表，但计入拦截计数
- [ ] 8 条风险中 3 条高危在概览与研判页计数一致
- [ ] 9 条审核任务中 1 条触发双人规则禁用
- [ ] 审计日志随操作增长（每次交互 +1 条）
