import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_THRESHOLDS, WorkspaceStore } from '../../core/store';
import { downloadCsv } from '../../core/download';
import {
  DIMENSION_LABEL,
  DIMENSIONS,
  JUDGE_LABEL,
  JUDGE_META,
  JUDGE_PRIORITY,
  conditionText,
  sumWeights,
} from '../../core/format';
import { ComparisonRow, Dimension, JudgeStatus, Tone } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Heat } from '../../shared/ui/heat';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { ToastService } from '../../shared/ui/toast.service';

interface SourceOption {
  id: string;
  name: string;
}

interface CheckItem {
  key: string;
  label: string;
  pass: boolean;
}

@Component({
  selector: 'app-comparison',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Empty, Heat, Icon, Modal],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">对比分析</h1>
          <p class="page-sub">
            {{ store.activeProject()?.name }} · 共 {{ rows().length }} 条对比条目 · 强制条款
            {{ mandatoryCount() }} 项 · 六维度分项对比
          </p>
        </div>
        <div class="page-actions">
          <ui-btn variant="secondary" icon="scale" (click)="openWeights()">维度权重</ui-btn>
          <ui-btn variant="primary" icon="download" (click)="exportGaps()">导出差距清单</ui-btn>
        </div>
      </header>

      @if (isDefaultWeights()) {
        <div class="banner banner--warn section">
          <ui-icon name="alert" [size]="16" /><span>当前为默认权重，需按评标规则确认。默认值仅供演示，未经核定的权重不得用于对外报告。</span>
        </div>
      }

      <div class="banner banner--info section">
        <ui-icon name="info" [size]="16" /><span>本页不提供竞对总排名，仅提供分维度对比。横向结论须附证据与口径说明；缺失数据不判为不满足。</span>
      </div>

      <section class="section row row--wrap">
        <span class="small muted">维度权重（合计 {{ totalWeight() }}）</span>
        @for (d of dimensions; track d) {
          <span class="wchip"><span class="wchip__k">{{ dimLabel(d) }}</span><span class="mono">{{ store.weights()[d] }}</span></span>
        }
        <button type="button" class="link-btn small" (click)="openWeights()">调整权重</button>
      </section>

      <section class="section row row--wrap">
        @for (c of riskChips(); track c.key) {
          <button type="button" class="chip" [class.chip--active]="status() === c.key" (click)="toggleStatus(c.key)">
            {{ c.label }} <span class="chip__count">{{ c.count }}</span>
          </button>
        }
        @if (status() !== 'all' || mandatoryOnly() || incomparableOnly()) {
          <button type="button" class="link-btn small" (click)="clearFilters()">清除筛选</button>
        }
      </section>

      <section class="section">
        <div class="filter-bar">
          <div class="row" style="flex: 1">
            <ui-icon name="search" [size]="14" />
            <input class="input" type="search" placeholder="搜索参数、招标要求或判定说明" aria-label="搜索对比条目"
              [ngModel]="q()" (ngModelChange)="q.set($event); page.set(0)" />
          </div>
          <select class="select" aria-label="按维度筛选" [ngModel]="dim()" (ngModelChange)="dim.set($event); page.set(0)">
            <option value="all">全部维度</option>
            @for (d of dimensions; track d) { <option [value]="d">{{ dimLabel(d) }}</option> }
          </select>
          <select class="select" aria-label="按判定筛选" [ngModel]="status()" (ngModelChange)="status.set($event); page.set(0)">
            <option value="all">全部判定</option>
            @for (s of judgeStatuses; track s) { <option [value]="s">{{ judgeLabel(s) }}</option> }
          </select>
          <button type="button" class="chip" [class.chip--active]="mandatoryOnly()" (click)="toggleMandatory()">仅看强制条款</button>
          <button type="button" class="chip" [class.chip--active]="incomparableOnly()" (click)="toggleIncomparable()">仅看不可比</button>
          <span class="small muted">显示列</span>
          @for (c of competitors(); track c.id) {
            <label class="col-toggle"><input type="checkbox" class="checkbox" [checked]="!hidden().includes(c.id)" (change)="toggleColumn(c.id, $event)" />{{ c.name }}</label>
          }
        </div>

        @if (filtered().length === 0) {
          <ui-empty title="没有匹配的对比条目" hint="当前筛选条件下无可展示条目。可放宽判定或维度筛选，或清空搜索关键词后重试。"
            actionLabel="清空筛选" (action)="clearFilters()" />
        } @else {
          <div class="table-wrap">
            <table class="table matrix">
              <thead>
                <tr>
                  <th class="c-param" style="width: 190px">参数</th>
                  <th style="width: 220px">招标要求</th>
                  <th style="width: 150px">我方</th>
                  @for (c of visibleColumns(); track c.id) {
                    <th style="width: 150px">{{ c.name }}</th>
                  }
                  <th style="width: 250px">判定</th>
                  <th style="width: 72px">优先级</th>
                </tr>
              </thead>
              <tbody>
                @for (r of paged(); track r.id) {
                  <tr tabindex="0" [class.table-row--open]="expanded() === r.id" [class.row--incomparable]="isIncomparable(r)"
                    (click)="toggleRow(r.id)" (keydown.enter)="toggleRow(r.id)">
                    <td class="c-param"><div class="stack stack--tight">
                      <span class="strong">{{ r.defLabel }}</span>
                      <span class="mono small muted">{{ r.defKey }}</span>
                      <span class="tag">{{ dimLabel(r.dimension) }}</span>
                    </div></td>
                    <td><div class="stack stack--tight">
                      @if (r.mandatory) { <ui-badge label="强制条款" tone="danger" icon="alert" /> }
                      <span class="small">{{ r.requirement.text }}</span>
                      <span class="mono small muted">{{ r.requirement.targetValue }} {{ r.requirement.unit }}</span>
                      <span class="cond-chip">{{ reqCondition(r) }}</span>
                    </div></td>
                    <td><span class="small">{{ cellOf(r, 'our') }}</span></td>
                    @for (c of visibleColumns(); track c.id) {
                      <td><span class="small">{{ cellOf(r, c.id) }}</span></td>
                    }
                    <td><div class="stack stack--tight">
                      <ui-badge [label]="judgeLabel(r.judged)" [tone]="judgeTone(r.judged)" [icon]="judgeIcon(r.judged)" />
                      <span class="clamp small muted" [attr.title]="r.reason">{{ r.reason }}</span>
                      <button type="button" class="link-btn small" (click)="openEvidence(r, $event)">
                        <ui-icon name="link" [size]="12" /> 证据
                      </button>
                    </div></td>
                    <td><span class="mono small">{{ priority(r) }}</span></td>
                  </tr>
                  @if (expanded() === r.id) {
                    <tr>
                      <td [attr.colspan]="colspan()" class="table-detail">
                        <div class="detail">
                          <div class="stack stack--tight">
                            <span class="label">判定规则命中</span>
                            <ul class="check-list">
                              @for (h of r.ruleHits; track h.rule) {
                                <li><span class="mono small">{{ h.rule }}</span> · {{ h.detail }}</li>
                              }
                              @if (r.ruleHits.length === 0) { <li class="muted">无显式规则命中，按整体披露情况处理</li> }
                            </ul>
                            <span class="label">四要素可比性检查</span>
                            <div class="row row--wrap">
                              @for (c of checks(r); track c.key) {
                                <span class="cmp-item" [class.cmp-item--fail]="!c.pass">
                                  <ui-icon [name]="c.pass ? 'check' : 'x'" [size]="12" />{{ c.label }}{{ c.pass ? '一致' : '不一致' }}
                                </span>
                              }
                            </div>
                          </div>
                          <div class="stack stack--tight">
                            <span class="label">{{ isIncomparable(r) ? '为什么不可比' : '判定说明' }}</span>
                            <p class="small">{{ r.reason }}</p>
                            @if (r.clarify) {
                              <span class="label">建议澄清话术</span>
                              <p class="small">「{{ r.clarify }}」</p>
                            }
                            <span class="label">来源取值</span>
                            <ul class="check-list">
                              @for (c of r.cells; track c.sourceId) {
                                <li>{{ c.sourceName }}：<span class="mono">{{ c.display }}</span><span class="muted"> · {{ judgeLabel(c.status) }}</span></li>
                              }
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span>共 {{ filtered().length }} 条 · 第 {{ page() + 1 }} / {{ totalPages() }} 页 · 每页 20 条</span>
            <div class="row">
              <ui-btn size="sm" variant="secondary" [disabled]="page() === 0" (click)="prev()">上一页</ui-btn>
              <ui-btn size="sm" variant="secondary" [disabled]="page() >= totalPages() - 1" (click)="next()">下一页</ui-btn>
            </div>
          </div>
        }
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">维度得分热力图</h2>
          <span class="section-hint">仅统计可比条目 · 空白斜纹 = 该维度无可比数据</span>
        </div>
        <div class="card">
          <div class="card-bd">
            <ui-heat [cols]="heatCols" [rows]="store.dimensionScores()" />
            <p class="small muted" style="margin-top: 12px">
              计分口径：满足 100 分、潜在偏离 65 分、明确偏离 30 分；未披露、不可比、证据不足不计入均分，故单元格留空。本图只反映分维度可比程度，不构成竞对总排名。
            </p>
          </div>
        </div>
      </section>
    </div>

    <ui-modal [open]="weightOpen()" title="维度权重" size="md" [hasFooter]="true" (close)="weightOpen.set(false)">
      <div class="stack">
        <p class="small muted">权重用于本项目分维度对比与报告口径，六类维度合计必须为 100。系统不据此计算竞对总排名。</p>
        <div class="wgrid">
          @for (d of dimensions; track d) {
            <div class="field">
              <label [attr.for]="'w-' + d">{{ dimLabel(d) }}</label>
              <input [id]="'w-' + d" class="input" type="number" min="0" max="100" step="1" [class.input--error]="!weightValid()"
                [ngModel]="draft()[d]" (ngModelChange)="setDraft(d, $event)" />
            </div>
          }
        </div>
        <div class="row row--between small">
          <span class="muted">合计</span>
          <span class="mono" [class.text-danger]="!weightValid()">{{ weightTotal() }} / 100</span>
        </div>
        @if (!weightValid()) {
          <span class="error"><ui-icon name="alert" [size]="12" />权重合计必须为 100，当前为 {{ weightTotal() }}，无法应用</span>
        }
        <button type="button" class="link-btn small" (click)="resetDraft()">恢复默认权重</button>
      </div>
      <div modal-footer>
        <ui-btn variant="secondary" (click)="weightOpen.set(false)">取消</ui-btn>
        <ui-btn variant="primary" [disabled]="!weightValid()" (click)="applyWeights()">应用</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="!!evidence()" [title]="evidenceTitle()" size="lg" [hasFooter]="true" (close)="evidence.set(null)">
      @if (evidence(); as r) {
        <div class="stack">
          <div class="row row--wrap">
            <ui-badge [label]="judgeLabel(r.judged)" [tone]="judgeTone(r.judged)" [icon]="judgeIcon(r.judged)" />
            <span class="tag">{{ dimLabel(r.dimension) }}</span>
            @if (r.mandatory) { <span class="tag">强制条款</span> }
            <span class="mono small muted">{{ r.defKey }}</span>
          </div>
          <p class="small">{{ r.reason }}</p>
          <span class="label">来源取值与单源状态</span>
          <ul class="check-list">
            @for (c of r.cells; track c.sourceId) {
              <li>{{ c.sourceName }}：<span class="mono">{{ c.display }}</span><span class="muted"> · {{ judgeLabel(c.status) }}</span></li>
            }
          </ul>
          <span class="label">规则命中</span>
          <ul class="check-list">
            @for (h of r.ruleHits; track h.rule) {
              <li><span class="mono small">{{ h.rule }}</span>：{{ h.detail }}</li>
            }
            @if (r.ruleHits.length === 0) { <li class="muted">无显式规则命中</li> }
          </ul>
          <span class="label">四要素可比性（层级 / 单位 / 条件 / 边界）</span>
          <div class="row row--wrap">
            @for (c of checks(r); track c.key) {
              <span class="cmp-item" [class.cmp-item--fail]="!c.pass">
                <ui-icon [name]="c.pass ? 'check' : 'x'" [size]="12" />{{ c.label }}{{ c.pass ? '一致' : '不一致' }}
              </span>
            }
          </div>
          @if (r.clarify) {
            <div class="banner banner--info"><ui-icon name="info" [size]="16" /><span>{{ r.clarify }}</span></div>
          }
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="evidence.set(null)">关闭</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .matrix { min-width: 1020px; }
      .matrix th.c-param,
      .matrix td.c-param { position: sticky; left: 0; z-index: 1; background: var(--surface); border-right: 1px solid var(--line); }
      .matrix thead th.c-param { z-index: 11; background: var(--bg-subtle); }
      .matrix tbody tr { cursor: pointer; }
      .matrix tbody tr:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
      .matrix tbody tr:hover td.c-param,
      .matrix tbody tr.table-row--open td.c-param { background: var(--bg-subtle); }
      .row--incomparable > td.c-param { border-left: 2px dashed var(--line-strong); }
      .clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.45; }
      .detail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); }
      .check-list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8; color: var(--ink-2); }
      .cmp-item { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border: 1px solid #cfe6d7; background: #f2f8f4; color: var(--ok); font-size: 12px; }
      .cmp-item--fail { border-style: dashed; border-color: #e7b4ae; background: #fdf3f2; color: var(--danger); }
      .wchip { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; border: 1px solid var(--line); background: var(--surface); font-size: 13px; }
      .wchip__k { color: var(--ink-3); font-size: 12px; }
      .wgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-3); }
      .col-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-2); cursor: pointer; }
      @media (max-width: 768px) { .detail, .wgrid { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
})
export class Comparison implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly dimensions = DIMENSIONS;
  readonly heatCols = DIMENSIONS.map((d) => DIMENSION_LABEL[d]);
  readonly judgeStatuses: JudgeStatus[] = [
    'deviation', 'potentialDeviation', 'incomparable', 'noResponse',
    'insufficientEvidence', 'undisclosed', 'compliant',
  ];

  readonly rows = this.store.comparisonRows;
  readonly q = signal('');
  readonly dim = signal('all');
  readonly status = signal('all');
  readonly mandatoryOnly = signal(false);
  readonly incomparableOnly = signal(false);
  readonly page = signal(0);
  readonly pageSize = 20;
  readonly expanded = signal<string | null>(null);
  readonly hidden = signal<string[]>([]);
  readonly weightOpen = signal(false);
  readonly draft = signal<Record<Dimension, number>>({ ...DEFAULT_THRESHOLDS.weights });
  readonly evidence = signal<ComparisonRow | null>(null);

  readonly mandatoryCount = computed(() => this.rows().filter((r) => r.mandatory).length);
  readonly totalWeight = computed(() => sumWeights(this.store.weights()));
  readonly isDefaultWeights = computed(() =>
    DIMENSIONS.every((d) => this.store.weights()[d] === DEFAULT_THRESHOLDS.weights[d]),
  );

  readonly competitors = computed<SourceOption[]>(() => {
    const map = new Map<string, string>();
    for (const row of this.rows()) {
      for (const cell of row.cells) {
        if (cell.sourceId !== 'our') map.set(cell.sourceId, cell.sourceName);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  });

  readonly visibleColumns = computed(() => this.competitors().filter((c) => !this.hidden().includes(c.id)));
  readonly colspan = computed(() => 5 + this.visibleColumns().length);

  readonly riskChips = computed(() => {
    const stats = this.store.judgeStats();
    const count = (s: JudgeStatus): number => stats.find((x) => x.status === s)?.count ?? 0;
    return [
      { key: 'mandatoryRisk', label: '废标风险', count: this.store.mandatoryRiskCount() },
      { key: 'deviation', label: '明确偏离', count: count('deviation') },
      { key: 'incomparable', label: '不可比', count: count('incomparable') },
      { key: 'undisclosed', label: '未披露', count: count('undisclosed') },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const dim = this.dim();
    const status = this.status();
    const mandatoryOnly = this.mandatoryOnly();
    const incomparableOnly = this.incomparableOnly();
    return this.rows().filter((r) => {
      if (q) {
        const hay = `${r.defLabel} ${r.defKey} ${r.requirement.text} ${r.reason}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dim !== 'all' && r.dimension !== dim) return false;
      if (status === 'mandatoryRisk') {
        if (!(r.mandatory && r.judged !== 'compliant')) return false;
      } else if (status !== 'all' && r.judged !== status) {
        return false;
      }
      if (mandatoryOnly && !r.mandatory) return false;
      if (incomparableOnly && r.judged !== 'incomparable' && this.checks(r).every((c) => c.pass)) return false;
      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paged = computed(() => this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize));
  readonly weightTotal = computed(() => DIMENSIONS.reduce((acc, d) => acc + (this.draft()[d] ?? 0), 0));
  readonly weightValid = computed(() => this.weightTotal() === 100);
  readonly evidenceTitle = computed(() => '判定证据 · ' + (this.evidence()?.defLabel ?? ''));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.setActiveProject(id);
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'mandatoryRisk') this.status.set(status);
    else if (status && this.judgeStatuses.includes(status as JudgeStatus)) this.status.set(status);
  }

  dimLabel(d: string): string { return DIMENSION_LABEL[d as Dimension] ?? d; }
  judgeLabel(s: JudgeStatus): string { return JUDGE_LABEL[s]; }
  judgeTone(s: JudgeStatus): Tone { return JUDGE_META[s].tone; }
  judgeIcon(s: JudgeStatus): string { return JUDGE_META[s].icon; }
  priority(r: ComparisonRow): string { return 'P' + JUDGE_PRIORITY[r.judged]; }
  reqCondition(r: ComparisonRow): string { return conditionText(r.requirement.conditions); }
  isIncomparable(r: ComparisonRow): boolean { return r.judged === 'incomparable'; }
  cellOf(r: ComparisonRow, sourceId: string): string {
    return r.cells.find((c) => c.sourceId === sourceId)?.display ?? '—';
  }
  checks(r: ComparisonRow): CheckItem[] {
    return [
      { key: 'level', label: '层级', pass: r.comparable.level },
      { key: 'unit', label: '单位', pass: r.comparable.unit },
      { key: 'conditions', label: '条件', pass: r.comparable.conditions },
      { key: 'boundary', label: '边界', pass: r.comparable.boundary },
    ];
  }

  toggleRow(id: string): void { this.expanded.set(this.expanded() === id ? null : id); }
  toggleStatus(key: string): void {
    this.status.set(this.status() === key ? 'all' : key);
    this.page.set(0);
  }
  toggleMandatory(): void { this.mandatoryOnly.update((v) => !v); this.page.set(0); }
  toggleIncomparable(): void { this.incomparableOnly.update((v) => !v); this.page.set(0); }
  toggleColumn(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.hidden.update((list) => (checked ? list.filter((x) => x !== id) : [...list, id]));
  }
  clearFilters(): void {
    this.q.set('');
    this.dim.set('all');
    this.status.set('all');
    this.mandatoryOnly.set(false);
    this.incomparableOnly.set(false);
    this.page.set(0);
  }
  prev(): void { this.page.update((p) => Math.max(0, p - 1)); }
  next(): void { this.page.update((p) => Math.min(this.totalPages() - 1, p + 1)); }
  openEvidence(row: ComparisonRow, event: Event): void {
    event.stopPropagation();
    this.evidence.set(row);
  }
  openWeights(): void { this.resetDraft(); this.weightOpen.set(true); }
  resetDraft(): void { this.draft.set({ ...DEFAULT_THRESHOLDS.weights }); }
  setDraft(d: Dimension, raw: string | number): void {
    const parsed = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.-]/g, ''));
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
    const next: Record<Dimension, number> = { ...this.draft() };
    next[d] = value;
    this.draft.set(next);
  }
  applyWeights(): void {
    if (!this.weightValid()) return;
    const result = this.store.setWeights(this.draft());
    if (!result.ok) {
      this.toast.push('权重未应用', 'danger', result.message ?? '请检查权重合计');
      return;
    }
    this.weightOpen.set(false);
    this.toast.push('维度权重已应用', 'ok', `合计 ${this.weightTotal()} · 已写入审计日志`);
  }

  exportGaps(): void {
    const cols = this.visibleColumns();
    const header = ['参数', 'key', '维度', '强制条款', '招标要求', '条件', '我方',
      ...cols.map((c) => c.name), '判定', '优先级', '判定说明', '建议澄清'];
    const rows: (string | number)[][] = this.filtered().map((r) => [
      r.defLabel, r.defKey, DIMENSION_LABEL[r.dimension], r.mandatory ? '是' : '否', r.requirement.text,
      conditionText(r.requirement.conditions), this.cellOf(r, 'our'), ...cols.map((c) => this.cellOf(r, c.id)),
      JUDGE_LABEL[r.judged], this.priority(r), r.reason, r.clarify ?? '',
    ]);
    downloadCsv('BidScope-差距清单-' + this.store.activeProjectId() + '.csv', [header, ...rows]);
    this.store.pushAudit('export', '对比差距清单 CSV', `导出 ${rows.length} 行 · 权重合计 ${this.totalWeight()}`);
    this.toast.push('已导出差距清单', 'ok', `共 ${rows.length} 行，遵循当前筛选与列显示设置`);
  }
}
