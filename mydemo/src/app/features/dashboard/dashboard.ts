import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Bars, BarDatum } from '../../shared/ui/bars';
import { Btn } from '../../shared/ui/btn';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { Stat } from '../../shared/ui/stat';
import { ToastService } from '../../shared/ui/toast.service';
import {
  AUDIT_ACTION_LABEL,
  COUNTRY_LABEL,
  RISK_LABEL,
  ROLE_LABEL,
  TASK_STATE_LABEL,
  deadlineText,
  deadlineTone,
  fmtDateTime,
  RISK_TONE,
} from '../../core/format';
import { Country } from '../../core/types';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Stat, Badge, Bars, Btn, Icon, Modal, Progress],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">投标工作台</h1>
          <p class="page-sub">在投项目 {{ kpis().activeProjects }} 个 · 待审 {{ kpis().pendingTasks }} 项 · 高风险 {{ kpis().highRisks }} 项 · 演示数据</p>
        </div>
        <div class="page-actions">
          <ui-btn variant="secondary" icon="refresh" (click)="refresh()">刷新数据</ui-btn>
          <ui-btn variant="primary" icon="plus" (click)="openNew()">新建项目</ui-btn>
        </div>
      </header>

      <section class="section">
        <div class="grid grid--4">
          <ui-stat label="在投项目" [value]="kpis().activeProjects" hint="含 1 个 T-6 天项目" (click)="noop()" />
          <ui-stat label="待我审核" [value]="kpis().pendingTasks" tone="warn" hint="其中 2 项已超期" />
          <ui-stat label="高风险项" [value]="kpis().highRisks" tone="danger" hint="废标与承诺风险为主" />
          <ui-stat label="情报库条目" [value]="kpis().kbEntries" tone="info" hint="覆盖 6 家竞对" />
        </div>
      </section>

      <div class="grid grid--sidebar section">
        <div class="stack stack--loose">
          <section class="section">
            <div class="section-head">
              <h2 class="section-title">在投项目</h2>
              <a routerLink="/projects" class="small">查看全部项目</a>
            </div>
            <div class="grid grid--3">
              @for (p of projects(); track p.id) {
                <article class="card project">
                  <div class="card-hd">
                    <div class="stack stack--tight">
                      <a class="card-title" [routerLink]="['/projects', p.id, 'overview']">{{ p.name }}</a>
                      <span class="card-sub">{{ p.customer }}</span>
                    </div>
                    <ui-badge [label]="country(p.country)" tone="neutral" />
                  </div>
                  <div class="card-bd project__bd">
                    <dl class="kv">
                      <dt>规模</dt>
                      <dd class="mono">{{ p.mw }} MW / {{ p.mwh }} MWh</dd>
                      <dt>技术路线</dt>
                      <dd>{{ p.route }}</dd>
                      <dt>截止</dt>
                      <dd class="row">
                        <ui-badge [label]="deadline(p.deadline)" [tone]="dtone(p.deadline)" icon="clock" />
                      </dd>
                    </dl>
                    <div class="project__progress">
                      <div class="row row--between small muted">
                        <span>资料完整性</span>
                        <span class="mono">{{ p.completeness }}%</span>
                      </div>
                      <ui-progress [value]="p.completeness" [tone]="p.completeness >= 85 ? 'ok' : 'warn'" [showValue]="false" />
                    </div>
                    <div class="project__gates">
                      @for (g of p.gates; track g.key) {
                        <span class="gate" [class]="'gate--' + g.state" [attr.title]="g.label + (g.note ? '：' + g.note : '')">
                          {{ g.label }}
                        </span>
                      }
                    </div>
                  </div>
                  <div class="card-ft">
                    <span>{{ members(p.id) }} 名成员</span>
                    <a [routerLink]="['/projects', p.id, 'comparison']" class="small">进入对比</a>
                  </div>
                </article>
              }
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <h2 class="section-title">最近活动</h2>
              <span class="section-hint">审计日志（最新 8 条）</span>
            </div>
            <div class="card">
              <div class="card-bd">
                <div class="timeline">
                  @for (e of activities(); track e.id) {
                    <div class="timeline__item">
                      <span class="timeline__dot" [class]="e.result === 'denied' ? 'timeline__dot dot--danger' : 'timeline__dot'"></span>
                      <div>
                        <p class="timeline__body">
                          <strong>{{ e.actor }}</strong> {{ action(e.action) }} · {{ e.target }}
                          @if (e.result === 'denied') {
                            <ui-badge label="已拒绝" tone="danger" icon="lock" />
                          }
                        </p>
                        <p class="timeline__meta mono">{{ fmt(e.at) }}{{ e.detail ? ' · ' + e.detail : '' }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="stack stack--loose">
          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">我的待办</h2>
              <ui-badge [label]="pending().length + ' 项'" tone="warn" />
            </div>
            <div class="card-bd card-bd--flush">
              @if (pending().length === 0) {
                <p class="muted small" style="padding: 16px">当前无待办</p>
              } @else {
                <ul class="todo">
                  @for (t of pending(); track t.id) {
                    <li class="todo__item">
                      <div class="todo__main">
                        <span class="todo__title">{{ t.title }}</span>
                        <span class="todo__meta">
                          <ui-badge [label]="t.kind" tone="neutral" [icon]="t.priority === 'high' ? 'alert' : 'info'" />
                          <span class="mono small">{{ projectName(t.projectId) }}</span>
                        </span>
                      </div>
                      <a
                        class="small"
                        [routerLink]="['/projects', t.projectId, 'reviews']"
                        [attr.aria-label]="'去处理：' + t.title"
                        >处理</a
                      >
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="card-ft">
              <span>含 {{ overdueCount() }} 项超期</span>
              <a routerLink="/projects/p-01/reviews" class="small">全部待办</a>
            </div>
          </section>

          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">风险分级</h2>
              <a routerLink="/projects/p-01/insights" class="small">风险清单</a>
            </div>
            <div class="card-bd">
              <ui-bars [data]="riskBars()" unit=" 项" />
              <div class="risk-top">
                @for (r of topRisks(); track r.id) {
                  <div class="risk-top__item">
                    <ui-badge [label]="level(r.level)" [tone]="tone(r.level)" [icon]="'alert'" />
                    <span class="small">{{ r.text }}</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-hd"><h2 class="card-title">研判门禁</h2></div>
            <div class="card-bd stack stack--tight">
              <div class="row row--between small">
                <span class="muted">已确认参数</span>
                <span class="mono">{{ confirmed() }} / {{ totalParams() }}</span>
              </div>
              <ui-progress [value]="confirmedPct()" [tone]="confirmedPct() >= 50 ? 'ok' : 'warn'" />
              <p class="small muted">已确认字段达到 15 项后，方可生成研判结论。</p>
              <a [routerLink]="['/projects', activeId(), 'parameters']" class="small">去参数矩阵确认</a>
            </div>
          </section>
        </div>
      </div>
    </div>

    <ui-modal [open]="showNew()" title="新建投标项目" (close)="showNew.set(false)">
      <div class="stack">
        <div class="grid grid--2">
          <div class="field">
            <label for="np-name">项目名称 *</label>
            <input id="np-name" class="input" [(ngModel)]="form.name" [class.input--error]="errors()['name']" />
            @if (errors()['name']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['name'] }}</span>
            }
          </div>
          <div class="field">
            <label for="np-customer">客户名称 *</label>
            <input id="np-customer" class="input" [(ngModel)]="form.customer" [class.input--error]="errors()['customer']" />
            @if (errors()['customer']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['customer'] }}</span>
            }
          </div>
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="np-country">目标国别 *</label>
            <select id="np-country" class="select" [(ngModel)]="form.country">
              @for (c of countries; track c.code) {
                <option [value]="c.code">{{ c.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="np-deadline">投标截止日 *</label>
            <input id="np-deadline" type="date" class="input" [(ngModel)]="form.deadline" [class.input--error]="errors()['deadline']" />
            @if (errors()['deadline']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['deadline'] }}</span>
            }
          </div>
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="np-mw">功率 (MW) *</label>
            <input id="np-mw" type="number" class="input" [(ngModel)]="form.mw" [class.input--error]="errors()['mw']" />
            @if (errors()['mw']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['mw'] }}</span>
            }
          </div>
          <div class="field">
            <label for="np-mwh">能量 (MWh) *</label>
            <input id="np-mwh" type="number" class="input" [(ngModel)]="form.mwh" [class.input--error]="errors()['mwh']" />
            @if (errors()['mwh']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['mwh'] }}</span>
            }
          </div>
        </div>
        <p class="hint">创建后将按大储模板加载 48 项参数字典与 6 个对比维度。</p>
      </div>
      <div modal-footer>
        <ui-btn variant="secondary" (click)="showNew.set(false)">取消</ui-btn>
        <ui-btn variant="primary" (click)="submitNew()">创建项目</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .project__bd {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .project__progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .project__gates {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .gate {
        font-size: 11px;
        padding: 2px 7px;
        border: 1px solid var(--line);
        color: var(--ink-3);
        background: var(--bg-subtle);
      }
      .gate--done {
        color: var(--ok);
        border-color: #cfe6d7;
        background: #f2f8f4;
      }
      .gate--active {
        color: var(--accent);
        border-color: #c3cef5;
        background: var(--accent-weak);
      }
      .gate--blocked {
        color: var(--danger);
        border-color: #efc7c0;
        background: #fdf3f2;
      }
      .todo {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .todo__item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .todo__item:last-child {
        border-bottom: none;
      }
      .todo__main {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .todo__title {
        font-size: 13px;
        color: var(--ink);
        line-height: 1.4;
      }
      .todo__meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .risk-top {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }
      .risk-top__item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        line-height: 1.5;
      }
    `,
  ],
})
export class Dashboard {
  private readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);

  readonly kpis = this.store.globalKpis;
  readonly projects = this.store.projects;
  readonly activeId = this.store.activeProjectId;
  readonly activities = computed(() => this.store.auditEvents().slice(0, 8));
  readonly pending = computed(() =>
    this.store
      .allReviewTasks()
      .filter((t) => t.state === 'pending' || t.state === 'overdue')
      .slice(0, 5),
  );
  readonly overdueCount = computed(() => this.store.allReviewTasks().filter((t) => t.state === 'overdue').length);
  readonly confirmed = computed(() => this.store.paramStats().total - this.store.paramStats().pending);
  readonly totalParams = computed(() => this.store.paramStats().total);
  readonly confirmedPct = computed(() => Math.round((this.confirmed() / Math.max(1, this.totalParams())) * 100));

  readonly riskBars = computed<BarDatum[]>(() => {
    const risks = this.store.allRisks();
    return (['high', 'mid', 'low'] as const).map((level) => ({
      label: RISK_LABEL[level] + '风险',
      value: risks.filter((r) => r.level === level && r.state !== 'closed').length,
      tone: level === 'high' ? ('danger' as const) : level === 'mid' ? ('warn' as const) : ('ok' as const),
    }));
  });

  readonly topRisks = computed(() =>
    this.store
      .allRisks()
      .filter((r) => r.state !== 'closed')
      .slice(0, 3),
  );

  readonly showNew = signal(false);
  readonly errors = signal<Record<string, string>>({});
  form = { name: '', customer: '', country: 'CZ' as Country, mw: null as number | null, mwh: null as number | null, deadline: '' };

  readonly countries = Object.entries(COUNTRY_LABEL).map(([code, label]) => ({ code, label }));

  country(code: Country): string {
    return COUNTRY_LABEL[code];
  }
  deadline(iso: string): string {
    return deadlineText(iso);
  }
  dtone(iso: string): 'danger' | 'warn' | 'neutral' {
    const t = deadlineTone(iso);
    return t === 'danger' ? 'danger' : t === 'warn' ? 'warn' : 'neutral';
  }
  action(a: keyof typeof AUDIT_ACTION_LABEL): string {
    return AUDIT_ACTION_LABEL[a];
  }
  fmt(at: string): string {
    return fmtDateTime(at);
  }
  level(l: 'high' | 'mid' | 'low'): string {
    return RISK_LABEL[l] + '风险';
  }
  tone(l: 'high' | 'mid' | 'low') {
    return RISK_TONE[l];
  }
  members(id: string): number {
    return this.projects().find((p) => p.id === id)?.members.length ?? 0;
  }
  projectName(id: string): string {
    return this.projects().find((p) => p.id === id)?.name ?? id;
  }
  roleLabel(role: keyof typeof ROLE_LABEL): string {
    return ROLE_LABEL[role];
  }
  stateLabel(state: keyof typeof TASK_STATE_LABEL): string {
    return TASK_STATE_LABEL[state];
  }
  noop(): void {
    /* 占位：KPI 点击在后续版本跳转到明细页 */
  }

  refresh(): void {
    this.toast.push('数据已刷新', 'ok', 'Mock 数据为确定性数据，刷新后保持一致');
  }

  openNew(): void {
    this.errors.set({});
    this.showNew.set(true);
  }

  submitNew(): void {
    const e: Record<string, string> = {};
    if (!this.form.name.trim()) e['name'] = '请输入项目名称';
    if (!this.form.customer.trim()) e['customer'] = '请输入客户名称';
    if (!this.form.deadline) e['deadline'] = '请选择投标截止日';
    else if (this.form.deadline < '2026-10-24') e['deadline'] = '截止日不得早于今天';
    if (!this.form.mw || this.form.mw <= 0) e['mw'] = '功率需大于 0';
    if (!this.form.mwh || this.form.mwh <= 0) e['mwh'] = '能量需大于 0';
    if (this.form.mw && this.form.mwh && this.form.mwh / this.form.mw > 8) e['mwh'] = '能量/功率比不应超过 8 小时';
    this.errors.set(e);
    if (Object.keys(e).length > 0) {
      this.toast.push('表单校验未通过', 'danger', '请检查标红字段后重试');
      return;
    }
    this.store.pushAudit('upload', `创建项目 ${this.form.name}`, `${this.form.mw}MW/${this.form.mwh}MWh`);
    this.showNew.set(false);
    this.toast.push('项目已创建', 'ok', '演示环境不落库，刷新后恢复初始数据');
    this.form = { name: '', customer: '', country: 'CZ', mw: null, mwh: null, deadline: '' };
  }
}
