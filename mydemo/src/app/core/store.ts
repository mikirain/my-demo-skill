import { Injectable, computed, signal } from '@angular/core';
import {
  AuditAction,
  AuditEvent,
  AwardedProject,
  Clarification,
  ComparisonRow,
  Dimension,
  Document,
  Experience,
  FulfilmentRecord,
  Insight,
  JudgeStatus,
  LevelChange,
  MatchResult,
  ParamValue,
  Project,
  ReviewTask,
  RiskItem,
  ThresholdConfig,
  User,
} from './types';
import {
  ACTIVE_PROJECT_ID,
  AUDIT_EVENTS,
  AWARDED_PROJECTS,
  CLARIFICATIONS,
  COMPARISON_ROWS,
  CURRENT_USER_ID,
  DOCUMENTS,
  EXPERIENCES,
  FULFILMENTS,
  INSIGHTS,
  LEVEL_CHANGES,
  PARAM_VALUES,
  PROJECTS,
  REVIEW_TASKS,
  RISK_ITEMS,
  USERS,
} from './mock';
import { COUNTRY_LABEL, DEMO_TODAY, DIMENSIONS, JUDGE_PRIORITY } from './format';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  autoPass: 0.85,
  manualForce: 0.6,
  sampleRate: 10,
  weights: { technical: 30, performance: 20, safety: 15, warranty: 15, delivery: 10, commercial: 10 },
  kbValidityMonths: 18,
  reviewTimeoutHours: 24,
};

const STATUS_SCORE: Partial<Record<JudgeStatus, number>> = {
  compliant: 100,
  potentialDeviation: 65,
  deviation: 30,
};

export interface ParamStats {
  total: number;
  pending: number;
  forced: number;
  conflicts: number;
  corrected: number;
  noEvidence: number;
}

export interface JudgeStat {
  status: JudgeStatus;
  count: number;
}

export interface ExperienceCitation {
  id: string;
  experienceId: string;
  projectId: string;
  title: string;
  level: Experience['evidenceLevel'];
  at: string;
  actor: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly _projects = signal<Project[]>(PROJECTS);
  private readonly _activeId = signal<string>(ACTIVE_PROJECT_ID);
  private readonly _documents = signal<Document[]>(DOCUMENTS);
  private readonly _paramValues = signal<ParamValue[]>(PARAM_VALUES);
  private readonly _rows = signal<ComparisonRow[]>(COMPARISON_ROWS);
  private readonly _insights = signal<Insight[]>(INSIGHTS);
  private readonly _risks = signal<RiskItem[]>(RISK_ITEMS);
  private readonly _clarifications = signal<Clarification[]>(CLARIFICATIONS);
  private readonly _tasks = signal<ReviewTask[]>(REVIEW_TASKS);
  private readonly _audit = signal<AuditEvent[]>(AUDIT_EVENTS);
  private readonly _thresholds = signal<ThresholdConfig>(DEFAULT_THRESHOLDS);
  private readonly _awarded = signal<AwardedProject[]>(AWARDED_PROJECTS);
  private readonly _experiences = signal<Experience[]>(EXPERIENCES);
  private readonly _fulfilments = signal<FulfilmentRecord[]>(FULFILMENTS);
  private readonly _citations = signal<ExperienceCitation[]>([]);
  private readonly _levelChanges = signal<LevelChange[]>(LEVEL_CHANGES);
  private _levelSeq = LEVEL_CHANGES.length;
  private auditSeq = 0;

  readonly projects = this._projects.asReadonly();
  readonly thresholds = this._thresholds.asReadonly();
  readonly weights = computed(() => this._thresholds().weights);

  readonly activeProject = computed(() => this._projects().find((p) => p.id === this._activeId()) ?? this._projects()[0]);
  readonly activeProjectId = this._activeId.asReadonly();

  readonly currentUser = computed<User>(() => USERS.find((u) => u.id === CURRENT_USER_ID) ?? USERS[0]);
  readonly users = signal<User[]>(USERS).asReadonly();

  readonly documents = computed(() => this._documents().filter((d) => d.projectId === this._activeId()));
  readonly auditEvents = this._audit.asReadonly();
  readonly allDocuments = this._documents.asReadonly();

  readonly paramValues = computed(() => this._paramValues().filter((v) => v.projectId === this._activeId()));
  readonly comparisonRows = computed(() => {
    const rows = this._rows().filter((r) => r.projectId === this._activeId());
    return [...rows].sort((a, b) => {
      if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1;
      const pa = JUDGE_PRIORITY[a.judged];
      const pb = JUDGE_PRIORITY[b.judged];
      if (pa !== pb) return pa - pb;
      return b.weight - a.weight;
    });
  });

  /** 研判页只展示有证据的结论；无证据条目被拦截并计数 */
  readonly visibleInsights = computed(() =>
    this._insights().filter((i) => i.projectId === this._activeId() && i.evidenceIds.length > 0),
  );
  readonly blockedInsightCount = computed(
    () => this._insights().filter((i) => i.projectId === this._activeId() && i.evidenceIds.length === 0).length,
  );
  readonly insights = this._insights.asReadonly();
  readonly risks = computed(() => this._risks().filter((r) => r.projectId === this._activeId()));
  readonly clarifications = computed(() => this._clarifications().filter((c) => c.projectId === this._activeId()));
  readonly reviewTasks = computed(() => this._tasks().filter((t) => t.projectId === this._activeId()));
  readonly allReviewTasks = this._tasks.asReadonly();
  readonly allRisks = this._risks.asReadonly();

  readonly paramStats = computed<ParamStats>(() => {
    const list = this.paramValues();
    return {
      total: list.length,
      pending: list.filter((v) => v.status === 'pending').length,
      forced: list.filter((v) => v.confidence < this._thresholds().manualForce).length,
      conflicts: list.filter((v) => v.status === 'conflict').length,
      corrected: list.filter((v) => v.status === 'corrected').length,
      noEvidence: list.filter((v) => !v.evidence).length,
    };
  });

  readonly judgeStats = computed<JudgeStat[]>(() => {
    const rows = this.comparisonRows();
    const order: JudgeStatus[] = [
      'deviation',
      'potentialDeviation',
      'incomparable',
      'noResponse',
      'insufficientEvidence',
      'undisclosed',
      'compliant',
    ];
    return order.map((status) => ({ status, count: rows.filter((r) => r.judged === status).length }));
  });

  readonly mandatoryRiskCount = computed(
    () => this.comparisonRows().filter((r) => r.mandatory && r.judged !== 'compliant').length,
  );

  readonly unapprovedTaskCount = computed(
    () => this.reviewTasks().filter((t) => t.state === 'pending' || t.state === 'overdue' || t.state === 'assigned').length,
  );

  readonly highRiskCount = computed(() => this.risks().filter((r) => r.level === 'high').length);

  /** 报告发布阻断：存在未裁决冲突，或高风险任务未通过 */
  readonly publicationBlocked = computed(
    () => this.paramStats().conflicts > 0 || this.reviewTasks().some((t) => t.priority === 'high' && t.state !== 'approved' && t.state !== 'rejected'),
  );

  readonly publicationBlockReasons = computed<string[]>(() => {
    const reasons: string[] = [];
    if (this.paramStats().conflicts > 0) reasons.push(`存在 ${this.paramStats().conflicts} 项未裁决的参数冲突`);
    const pendingHigh = this.reviewTasks().filter(
      (t) => t.priority === 'high' && t.state !== 'approved' && t.state !== 'rejected',
    ).length;
    if (pendingHigh > 0) reasons.push(`存在 ${pendingHigh} 项高风险审核未通过`);
    return reasons;
  });

  readonly confirmedParamCount = computed(
    () => this.paramValues().filter((v) => v.status === 'confirmed' || v.status === 'corrected').length,
  );

  readonly insightReady = computed(() => this.confirmedParamCount() >= 15);

  /** 全局 KPI（跨项目） */
  readonly globalKpis = computed(() => {
    const pendingTasks = this._tasks().filter((t) => t.state === 'pending' || t.state === 'overdue').length;
    const highRisks = this._risks().filter((r) => r.level === 'high' && r.state !== 'closed').length;
    return {
      activeProjects: this._projects().filter((p) => p.stage !== 'published').length,
      pendingTasks,
      highRisks,
      kbEntries: 128,
    };
  });

  /** 维度得分热力图：来源 × 维度 */
  readonly dimensionScores = computed<{ name: string; scores: (number | null)[] }[]>(() => {
    const rows = this.comparisonRows();
    const sources = ['our', 'c-a', 'c-b'];
    return sources.map((sourceId) => {
      const name = sourceId === 'our' ? '我方' : sourceId === 'c-a' ? '竞对 A' : '竞对 B';
      const scores = DIMENSIONS.map((dim) => {
        const inDim = rows.filter((r) => r.dimension === dim);
        if (!inDim.length) return null;
        const values = inDim
          .map((r) => {
            const c = r.cells.find((x) => x.sourceId === sourceId);
            return c ? STATUS_SCORE[c.status] : undefined;
          })
          .filter((v): v is number => v !== undefined);
        if (!values.length) return null;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      });
      return { name, scores };
    });
  });

  readonly contributors = computed(() => {
    const ids = new Set(this.activeProject()?.members.map((m) => m.userId) ?? []);
    return this._tasks()
      .filter((t) => t.state === 'approved' || t.state === 'rejected')
      .filter((t) => ids.has(t.assignee) || ids.has(t.editor))
      .slice(0, 6);
  });

  setActiveProject(id: string): void {
    this._activeId.set(id);
  }

  paramById(id: string): ParamValue | undefined {
    return this._paramValues().find((v) => v.id === id);
  }

  documentById(id: string): Document | undefined {
    return this._documents().find((d) => d.id === id);
  }

  correctParam(id: string, patch: Partial<ParamValue> & { reason: string }): void {
    this._paramValues.update((list) =>
      list.map((v) =>
        v.id === id
          ? {
              ...v,
              ...patch,
              status: 'corrected' as const,
              correctedBy: this.currentUser().id,
              correctedAt: '2026-10-24T09:20:00',
              confidence: 0.99,
            }
          : v,
      ),
    );
    this.pushAudit('correct', `${id} ${patch.defLabel ?? ''}`.trim(), patch.reason);
  }

  confirmParam(id: string): void {
    const target = this.paramById(id);
    this._paramValues.update((list) =>
      list.map((v) => (v.id === id ? { ...v, status: 'confirmed' as const, confidence: Math.max(v.confidence, 0.9) } : v)),
    );
    this.pushAudit('confirm', `${id} ${target?.defLabel ?? ''}`.trim());
  }

  bulkConfirm(ids: string[]): void {
    this._paramValues.update((list) =>
      list.map((v) => (ids.includes(v.id) ? { ...v, status: 'confirmed' as const, confidence: Math.max(v.confidence, 0.9) } : v)),
    );
    this.pushAudit('confirm', `批量确认 ${ids.length} 项参数`);
  }

  resolveConflict(id: string, chosen: string, note: string): void {
    this._paramValues.update((list) =>
      list.map((v) =>
        v.id === id
          ? { ...v, value: chosen, rawValue: chosen, status: 'confirmed' as const, conflictValues: undefined, confidence: 0.95, reason: note }
          : v,
      ),
    );
    this.pushAudit('conflict', `${id} 冲突裁决`, note);
  }

  adoptInsight(id: string): void {
    this._insights.update((list) => list.map((i) => (i.id === id ? { ...i, state: 'adopted' as const } : i)));
    this.pushAudit('approve', `${id} 结论采纳`);
  }

  rejectInsight(id: string, reason: string): void {
    this._insights.update((list) =>
      list.map((i) => (i.id === id ? { ...i, state: 'rejected' as const, rejectReason: reason } : i)),
    );
    this.pushAudit('correct', `${id} 结论驳回`, reason);
  }

  approveTask(id: string, note?: string): void {
    this._tasks.update((list) => list.map((t) => (t.id === id ? { ...t, state: 'approved' as const, note } : t)));
    this.pushAudit('approve', `${id} 审核通过`, note);
  }

  rejectTask(id: string, reason: string): void {
    this._tasks.update((list) => list.map((t) => (t.id === id ? { ...t, state: 'rejected' as const, note: reason } : t)));
    this.pushAudit('approve', `${id} 审核驳回`, reason);
  }

  assignTask(id: string, userId: string): void {
    this._tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, assignee: userId, state: 'assigned' as const } : t)),
    );
    this.pushAudit('approve', `${id} 指派审核人`, userId);
  }

  setWeights(weights: Record<Dimension, number>): { ok: boolean; message?: string } {
    const total = DIMENSIONS.reduce((acc, d) => acc + (weights[d] ?? 0), 0);
    if (total !== 100) {
      return { ok: false, message: `权重合计必须为 100，当前为 ${total}` };
    }
    this._thresholds.update((t) => ({ ...t, weights: { ...weights } }));
    this.pushAudit('config', '维度权重调整', JSON.stringify(weights));
    return { ok: true };
  }

  updateThresholds(patch: Partial<ThresholdConfig>, note: string): { ok: boolean; message?: string } {
    const next = { ...this._thresholds(), ...patch };
    if (next.manualForce >= next.autoPass) {
      return { ok: false, message: '强制人工阈值必须低于免检阈值' };
    }
    this._thresholds.set(next);
    this.pushAudit('config', '阈值配置变更', note);
    return { ok: true };
  }

  markIssueHandled(): void {
    this.pushAudit('parse', '处理解析异常');
  }

  setDocStatus(id: string, status: Document['parseStatus'], quality?: number): void {
    this._documents.update((list) =>
      list.map((d) => (d.id === id ? { ...d, parseStatus: status, qualityScore: quality ?? d.qualityScore } : d)),
    );
    this.pushAudit('parse', `${id} 状态更新为 ${status}`);
  }

  addDocument(doc: Document): void {
    this._documents.update((list) => [doc, ...list]);
    this.pushAudit('upload', doc.name);
  }

  pushAudit(action: AuditAction, target: string, detail?: string): void {
    this.auditSeq += 1;
    const id = 'aud-' + String(AUDIT_EVENTS.length + this.auditSeq).padStart(3, '0');
    const at = new Date(DEMO_TODAY.getTime() + this.auditSeq * 60000).toISOString().slice(0, 16);
    this._audit.update((list) => [
      {
        id,
        at,
        actor: this.currentUser().name,
        action,
        target,
        result: 'ok',
        ip: '10.20.31.17',
        detail,
      },
      ...list,
    ]);
  }

  /* ================= v1.1 中标经验复盘与知识复用 ================= */

  readonly awardedProjects = computed<AwardedProject[]>(() => this._awarded());
  readonly experiences = this._experiences.asReadonly();
  readonly fulfilments = this._fulfilments.asReadonly();

  readonly experienceStats = computed(() => {
    const list = this._experiences();
    return {
      total: list.length,
      verified: list.filter((e) => e.state === 'verified').length,
      draft: list.filter((e) => e.state === 'draft').length,
      deprecated: list.filter((e) => e.state === 'deprecated').length,
      levelA: list.filter((e) => e.evidenceLevel === 'A').length,
      levelB: list.filter((e) => e.evidenceLevel === 'B').length,
      levelC: list.filter((e) => e.evidenceLevel === 'C').length,
    };
  });

  readonly citedExperienceCount = computed(
    () => this._citations().filter((c) => c.projectId === this._activeId()).length,
  );

  readonly citations = this._citations.asReadonly();

  awardedById(id: string): AwardedProject | undefined {
    return this._awarded().find((p) => p.id === id);
  }

  fulfilmentsFor(projectId: string): FulfilmentRecord[] {
    return this._fulfilments().filter((f) => f.projectId === projectId);
  }

  experiencesFor(projectId: string, category?: Experience['category']): Experience[] {
    return this._experiences().filter(
      (e) => e.projectId === projectId && (!category || e.category === category),
    );
  }

  /** 相似项目匹配：国家 30 + 规模 25 + 路线 15 + 客户类型 15 + 合同模式 15 */
  readonly matchResults = computed<MatchResult[]>(() => {
    const p = this.activeProject();
    if (!p) return [];
    const results = this._awarded().map((a) => {
      const matched: string[] = [];
      const differences: string[] = [];
      let score = 0;

      if (a.country === p.country) {
        score += 30;
        matched.push(`国别一致：${COUNTRY_LABEL[a.country]}`);
      } else {
        differences.push(`国别不同：${COUNTRY_LABEL[a.country]} vs ${COUNTRY_LABEL[p.country]}（并网规范与认证要求不同）`);
      }

      const ratio = a.mwh / Math.max(1, p.mwh);
      if (ratio >= 0.8 && ratio <= 1.25) {
        score += 25;
        matched.push(`规模相近：${a.mwh} MWh vs ${p.mwh} MWh`);
      } else if (ratio >= 0.5 && ratio <= 2) {
        score += 15;
        matched.push(`规模同量级：${a.mwh} MWh vs ${p.mwh} MWh`);
      } else {
        differences.push(`规模差异大：${a.mwh} MWh vs ${p.mwh} MWh（${ratio > 2 ? '历史项目更大' : '历史项目更小'}，配置与报价结构需重算）`);
      }

      if (a.route === p.route) {
        score += 15;
        matched.push(`技术路线一致：${a.route}`);
      } else {
        differences.push(`技术路线不同：${a.route} vs ${p.route}`);
      }

      if (a.customerType === p.customerType) {
        score += 15;
        matched.push(`客户类型一致：${a.customerType}`);
      } else {
        differences.push(`客户类型不同：${a.customerType} vs ${p.customerType}（关注点与决策链不同）`);
      }

      if (a.contractMode === p.contractMode) {
        score += 15;
        matched.push(`合同模式一致：${a.contractMode}`);
      } else {
        differences.push(`合同模式不同：${a.contractMode} vs ${p.contractMode}（责任边界与风险分配不同）`);
      }

      const exps = this._experiences().filter((e) => e.projectId === a.id && e.state !== 'deprecated');
      return {
        project: a,
        score,
        matched,
        differences,
        usableExperiences: exps.filter((e) => e.evidenceLevel !== 'C'),
        hypotheses: exps.filter((e) => e.evidenceLevel === 'C'),
      };
    });
    return results.sort((x, y) => y.score - x.score);
  });

  verifyExperience(id: string): void {
    const target = this._experiences().find((e) => e.id === id);
    this._experiences.update((list) => list.map((e) => (e.id === id ? { ...e, state: 'verified' } : e)));
    this.pushAudit('approve', `${id} 经验入库`, target?.title);
  }

  deprecateExperience(id: string, reason: string): void {
    this._experiences.update((list) =>
      list.map((e) => (e.id === id ? { ...e, state: 'deprecated' } : e)),
    );
    this.pushAudit('config', `${id} 经验停用`, reason);
  }

  citeExperience(experienceId: string): void {
    const exp = this._experiences().find((e) => e.id === experienceId);
    if (!exp) return;
    this._citations.update((list) => [
      {
        id: 'cite-' + (list.length + 1),
        experienceId,
        projectId: this._activeId(),
        title: exp.title,
        level: exp.evidenceLevel,
        at: new Date(DEMO_TODAY.getTime() + (list.length + 1) * 60000).toISOString().slice(0, 16),
        actor: this.currentUser().name,
      },
      ...list,
    ]);
    this.pushAudit('approve', `${experienceId} 引用到当前项目`, exp.title);
  }

  /** 履约验证：missed 时按 BR-14 将同项目 A/B 级经验降级并退回待复核 */
  verifyFulfilment(id: string, note: string): void {
    const record = this._fulfilments().find((f) => f.id === id);
    this._fulfilments.update((list) =>
      list.map((f) =>
        f.id === id ? { ...f, status: f.status === 'pending' ? 'met' : f.status, note, verifiedAt: '2026-10-24' } : f,
      ),
    );
    this.pushAudit('approve', `${id} 履约确认`, note);
    if (record && record.status === 'missed') {
      const downgrade = (level: Experience['evidenceLevel']): Experience['evidenceLevel'] => (level === 'A' ? 'B' : 'C');
      this._experiences.update((list) =>
        list.map((e) =>
          e.projectId === record.projectId && e.evidenceLevel !== 'C'
            ? { ...e, evidenceLevel: downgrade(e.evidenceLevel), state: 'draft' as const }
            : e,
        ),
      );
      this.pushAudit('config', `${record.projectId} 经验降级`, `履约未达标：${record.commitment}`);
    }
  }

  /* ---------------- 证据等级变更（申请 → 审批 → 留痕） ---------------- */

  readonly levelChanges = this._levelChanges.asReadonly();

  readonly pendingLevelChangeCount = computed(
    () => this._levelChanges().filter((c) => c.state === 'pending').length,
  );

  levelChangesFor(experienceId: string): LevelChange[] {
    return this._levelChanges()
      .filter((c) => c.experienceId === experienceId)
      .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }

  pendingLevelChangeFor(experienceId: string): LevelChange | undefined {
    return this._levelChanges().find((c) => c.experienceId === experienceId && c.state === 'pending');
  }

  requestLevelChange(
    experienceId: string,
    to: Experience['evidenceLevel'],
    reason: string,
    evidenceSources: string[],
  ): { ok: boolean; message?: string } {
    const exp = this._experiences().find((e) => e.id === experienceId);
    if (!exp) return { ok: false, message: '经验条目不存在' };
    if (to === exp.evidenceLevel) return { ok: false, message: '目标等级与当前等级相同' };
    if (this.pendingLevelChangeFor(experienceId)) return { ok: false, message: '该条目已有待审批的等级变更' };

    const rank: Record<Experience['evidenceLevel'], number> = { A: 3, B: 2, C: 1 };
    const isUpgrade = rank[to] > rank[exp.evidenceLevel];
    const sources = evidenceSources.map((s) => s.trim()).filter(Boolean);

    if (isUpgrade && sources.length === 0) return { ok: false, message: '升级必须提供至少一条新证据来源' };
    if (reason.trim().length < 6) return { ok: false, message: '请填写变更理由（至少 6 个字）' };
    if (to === 'A') {
      const awarded = this.awardedById(exp.projectId);
      if (awarded && !awarded.hasScoreSheet) {
        return { ok: false, message: '该项目无正式评分表，按 BR-13 最高只能评 B 级' };
      }
      if (sources.length === 0) return { ok: false, message: '升级到 A 级必须提供直接证据来源' };
    }

    this._levelSeq += 1;
    const change: LevelChange = {
      id: 'lc-' + String(this._levelSeq).padStart(2, '0'),
      experienceId,
      from: exp.evidenceLevel,
      to,
      reason: reason.trim(),
      evidenceSources: sources,
      requestedBy: this.currentUser().name,
      requestedAt: '2026-10-24T10:50:00',
      state: 'pending',
    };
    this._levelChanges.update((list) => [change, ...list]);
    this.pushAudit('config', `${experienceId} 申请等级变更`, `${exp.evidenceLevel} → ${to}：${reason.trim()}`);
    return { ok: true };
  }

  approveLevelChange(id: string, note = '证据链完整，同意变更'): { ok: boolean; message?: string } {
    const change = this._levelChanges().find((c) => c.id === id);
    if (!change || change.state !== 'pending') return { ok: false, message: '该变更已处理' };
    if (change.requestedBy === this.currentUser().name) {
      return { ok: false, message: '按 BR-08 双人规则，不可审批本人发起的等级变更' };
    }
    this._levelChanges.update((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, state: 'approved' as const, reviewedBy: this.currentUser().name, reviewedAt: '2026-10-24T10:52:00', reviewNote: note }
          : c,
      ),
    );
    this._experiences.update((list) =>
      list.map((e) =>
        e.id === change.experienceId
          ? {
              ...e,
              evidenceLevel: change.to,
              evidenceSources: Array.from(new Set([...e.evidenceSources, ...change.evidenceSources])),
              state: e.state === 'deprecated' ? e.state : ('verified' as const),
            }
          : e,
      ),
    );
    this.pushAudit('approve', `${change.experienceId} 等级变更通过`, `${change.from} → ${change.to}`);
    return { ok: true };
  }

  rejectLevelChange(id: string, note: string): { ok: boolean; message?: string } {
    const change = this._levelChanges().find((c) => c.id === id);
    if (!change || change.state !== 'pending') return { ok: false, message: '该变更已处理' };
    if (note.trim().length < 4) return { ok: false, message: '请填写驳回理由（至少 4 个字）' };
    this._levelChanges.update((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, state: 'rejected' as const, reviewedBy: this.currentUser().name, reviewedAt: '2026-10-24T10:52:00', reviewNote: note.trim() }
          : c,
      ),
    );
    this.pushAudit('correct', `${change.experienceId} 等级变更驳回`, note.trim());
    return { ok: true };
  }
}
