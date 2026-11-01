import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import {
  RISK_LABEL,
  RISK_TONE,
  ROLE_LABEL,
  TASK_STATE_LABEL,
  deadlineText,
  deadlineTone,
  fmtDateTime,
} from '../../core/format';
import { AuditAction, ReviewTask, RiskLevel, TaskState, Tone, User } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Confirm } from '../../shared/ui/confirm';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { ToastService } from '../../shared/ui/toast.service';

type TaskFilter = 'all' | 'open' | 'overdue' | 'approved' | 'rejected';

const REASON_CHIPS = ['口径不同', '原文有误', '行业惯例', '证据不足', '其他'];

const STATE_TONE: Record<TaskState, Tone> = {
  pending: 'warn',
  overdue: 'danger',
  approved: 'ok',
  rejected: 'neutral',
  assigned: 'info',
};
const STATE_ICON: Record<TaskState, string> = {
  pending: 'clock',
  overdue: 'alert',
  approved: 'check',
  rejected: 'x',
  assigned: 'user',
};

@Component({
  selector: 'app-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Confirm, Empty, Icon, Modal],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">审核待办</h1>
          <p class="page-sub">
            {{ store.activeProject()?.name }} · 共 {{ tasks().length }} 项 · 待处理 {{ counts().open }} 项 · 超期 {{ counts().overdue }} 项 ·
            高风险 {{ highCount() }} 项
          </p>
        </div>
        <div class="page-actions">
          @if (highChecked().length > 0) {
            <span class="error"><ui-icon name="alert" [size]="12" />已选 {{ highChecked().length }} 项高风险，需逐项审核</span>
          }
          <ui-btn variant="secondary" icon="check-square" [disabled]="!canBatch()" (click)="batchConfirm.set(true)">
            批量采纳（{{ checked().length }}）
          </ui-btn>
        </div>
      </header>

      <div class="split">
        <section class="card">
          <div class="card-hd">
            <h2 class="card-title">待办任务</h2>
            <span class="card-sub mono">{{ filtered().length }} / {{ tasks().length }}</span>
          </div>
          <div class="card-bd card-bd--flush">
            <div class="task-filter">
              @for (f of filters(); track f.key) {
                <button type="button" class="chip" [class.chip--active]="filter() === f.key" (click)="setFilter(f.key)">
                  {{ f.label }} <span class="chip__count">{{ f.count }}</span>
                </button>
              }
            </div>
            @if (tasks().length === 0) {
              <ui-empty icon="check-square" title="当前无待办" hint="本项目的参数复核、结论审核与入库申请均已处理完毕。" />
            } @else if (filtered().length === 0) {
              <ui-empty icon="filter" title="该状态下无任务" hint="切换筛选条件查看其他任务，或选择「全部」。" />
            } @else {
              <ul class="task-list">
                @for (t of filtered(); track t.id) {
                  <li class="task" [class.task--active]="t.id === selectedId()">
                    <input
                      type="checkbox"
                      class="checkbox"
                      [attr.aria-label]="'选择任务 ' + t.title"
                      [checked]="checked().includes(t.id)"
                      (change)="toggleCheck(t.id, $event)"
                    />
                    <button
                      type="button"
                      class="task__main"
                      [attr.aria-current]="t.id === selectedId() ? 'true' : null"
                      (click)="select(t.id)"
                    >
                      <span class="row row--wrap">
                        <span class="task__dot" [class]="'task__dot task__dot--' + priorityTone(t.priority)"></span>
                        <span class="small">{{ priorityLabel(t.priority) }}优先级</span>
                        <span class="tag">{{ t.kind }}</span>
                      </span>
                      <span class="task__title truncate" [attr.title]="t.title">{{ t.title }}</span>
                      <span class="row row--wrap">
                        <span class="small muted">{{ userName(t.assignee) }}</span>
                        <ui-badge [label]="dueText(t.due)" [tone]="dueTone(t.due)" icon="clock" />
                        <ui-badge [label]="stateLabel(t.state)" [tone]="stateTone(t.state)" [icon]="stateIcon(t.state)" />
                      </span>
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
          <div class="card-ft">
            <span>共 {{ tasks().length }} 项 · 已勾选 {{ checked().length }} 项</span>
            <button type="button" class="link-btn small" [disabled]="checked().length === 0" (click)="checked.set([])">清空勾选</button>
          </div>
        </section>

        <div class="stack stack--loose">
          @if (selected(); as t) {
            <section class="card">
              <div class="card-hd">
                <div class="stack stack--tight">
                  <div class="row row--wrap">
                    <span class="tag">{{ t.kind }}</span>
                    <ui-badge [label]="priorityLabel(t.priority) + '优先级'" [tone]="priorityTone(t.priority)" icon="alert" />
                    <ui-badge [label]="stateLabel(t.state)" [tone]="stateTone(t.state)" [icon]="stateIcon(t.state)" />
                  </div>
                  <h2 class="card-title">{{ t.title }}</h2>
                </div>
                <span class="mono small muted">{{ t.id }}</span>
              </div>

              <div class="card-bd stack">
                @if (doubleReview(t)) {
                  <div class="banner banner--danger">
                    <ui-icon name="alert" [size]="16" />
                    <div class="stack stack--tight" style="flex: 1">
                      <span>该高风险项由同一人编辑与审核，需第二审核人。采纳与驳回已禁用（BR-08 双人规则）。</span>
                      <div>
                        <ui-btn size="sm" variant="secondary" icon="user" (click)="openAssign(t)">指派第二审核人</ui-btn>
                      </div>
                    </div>
                  </div>
                }

                <dl class="kv">
                  <dt>目标</dt>
                  <dd class="mono">{{ t.targetRef }}</dd>
                  <dt>发起人</dt>
                  <dd>{{ userName(t.editor) }}</dd>
                  <dt>审核人</dt>
                  <dd>
                    {{ userName(t.assignee) }}
                    @if (t.assignee === t.editor) {
                      <span class="tag" style="margin-left: 6px">与发起人相同</span>
                    }
                  </dd>
                  <dt>截止</dt>
                  <dd class="row">
                    <span class="mono">{{ t.due }}</span>
                    <ui-badge [label]="dueText(t.due)" [tone]="dueTone(t.due)" icon="clock" />
                  </dd>
                  <dt>备注</dt>
                  <dd>{{ t.note || '—' }}</dd>
                </dl>

                <div class="stack stack--tight">
                  <span class="label">差异对比（当前值 → 建议值）</span>
                  <div class="diff">
                    <div class="diff__row diff__head">
                      <div class="diff__cell diff__field">字段</div>
                      <div class="diff__cell diff__field">当前值</div>
                      <div class="diff__cell diff__field">建议值</div>
                    </div>
                    @for (d of t.diff; track d.field) {
                      <div class="diff__row" [class.diff__row--changed]="d.changed">
                        <div class="diff__cell diff__field">{{ d.field }}</div>
                        <div class="diff__cell mono">{{ d.current || '—' }}</div>
                        <div class="diff__cell mono" [class.diff__new]="d.changed">{{ d.suggested || '—' }}</div>
                      </div>
                    }
                    @if (t.diff.length === 0) {
                      <div class="diff__row">
                        <div class="diff__cell muted small">该项无字段级差异，仅需确认状态。</div>
                      </div>
                    }
                  </div>
                </div>

                <div class="stack stack--tight">
                  <span class="label">理由快捷选项</span>
                  <div class="row row--wrap">
                    @for (r of reasonChips; track r) {
                      <button type="button" class="chip" (click)="fillNote(r)">{{ r }}</button>
                    }
                  </div>
                  <div class="field">
                    <label for="rv-note">说明 / 驳回理由（驳回必填）</label>
                    <textarea
                      id="rv-note"
                      class="input"
                      rows="3"
                      placeholder="填写采信依据或驳回原因，例如：按统一口径重算后差异消失"
                      [ngModel]="note()"
                      (ngModelChange)="note.set($event); rejectError.set('')"
                    ></textarea>
                    @if (rejectError()) {
                      <span class="error"><ui-icon name="alert" [size]="12" />{{ rejectError() }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="card-ft">
                <span>操作写入审计日志，不可撤销 · 当前审核人 {{ userName(t.assignee) }}</span>
                <div class="row row--wrap">
                  <ui-btn size="sm" variant="secondary" icon="user" (click)="openAssign(t)">指派</ui-btn>
                  <ui-btn
                    size="sm"
                    variant="secondary"
                    icon="x"
                    [disabled]="doubleReview(t) || t.state === 'rejected'"
                    (click)="reject(t)"
                    >驳回</ui-btn
                  >
                  <ui-btn size="sm" variant="primary" icon="check" [disabled]="doubleReview(t) || t.state === 'approved'" (click)="approve(t)">
                    采纳
                  </ui-btn>
                </div>
              </div>
            </section>
          } @else {
            <ui-empty
              icon="check-square"
              title="选择左侧任务查看差异"
              hint="左侧列表按优先级与截止时间排列，选择一项后可查看逐字段差异并采纳或驳回。"
            />
          }

          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">审核记录</h2>
              <span class="card-sub">审核通过 / 修正 · 最近 6 条</span>
            </div>
            <div class="card-bd">
              @if (records().length === 0) {
                <p class="small muted">暂无审核记录。</p>
              } @else {
                <div class="timeline">
                  @for (e of records(); track e.id) {
                    <div class="timeline__item">
                      <span class="timeline__dot"></span>
                      <div>
                        <p class="timeline__body">
                          <strong>{{ e.actor }}</strong> {{ recordLabel(e.action) }} · {{ e.target }}
                          @if (e.result === 'denied') {
                            <ui-badge label="已拒绝" tone="danger" icon="lock" />
                          }
                        </p>
                        <p class="timeline__meta mono">{{ fmt(e.at) }}{{ e.detail ? ' · ' + e.detail : '' }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </section>
        </div>
      </div>
    </div>

    <ui-modal [open]="assignOpen()" title="指派审核人" size="md" (close)="assignOpen.set(false)">
      @if (selected(); as t) {
        <div class="stack">
          <div class="banner banner--info">
            <ui-icon name="info" [size]="16" />
            <span>高风险项禁止编辑人自审；候选人已排除发起人 {{ userName(t.editor) }}。指派后任务状态回到「已指派」。</span>
          </div>
          <div class="pick-list">
            @for (u of candidates(t); track u.id) {
              <label class="pick" [class.pick--on]="assignPick() === u.id">
                <input
                  type="radio"
                  class="checkbox"
                  name="assignee"
                  [attr.aria-label]="'指派给 ' + u.name"
                  [checked]="assignPick() === u.id"
                  (change)="assignPick.set(u.id)"
                />
                <span class="pick__name">{{ u.name }}</span>
                <span class="small muted">{{ roleLabel(u.role) }}</span>
              </label>
            }
            @if (candidates(t).length === 0) {
              <p class="small muted">无可指派成员。</p>
            }
          </div>
          @if (assignError()) {
            <span class="error"><ui-icon name="alert" [size]="12" />{{ assignError() }}</span>
          }
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="assignOpen.set(false)">取消</ui-btn>
        <ui-btn variant="primary" (click)="confirmAssign()">确认指派</ui-btn>
      </div>
    </ui-modal>

    <ui-confirm
      [open]="batchConfirm()"
      title="批量采纳"
      [message]="'将批量采纳 ' + batchable().length + ' 项低 / 中风险任务。'"
      detail="高风险任务需逐项审核（BR-08 双人规则），不在批量范围内；采纳后仍需在审核记录中留痕。"
      confirmText="批量采纳"
      (confirm)="doBatch()"
      (cancel)="batchConfirm.set(false)"
    />
  `,
  styles: [
    `
      .task-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
      }
      .task-list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 620px;
        overflow: auto;
      }
      .task {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        border-left: 2px solid transparent;
      }
      .task:last-child {
        border-bottom: none;
      }
      .task:hover {
        background: var(--bg-subtle);
      }
      .task--active {
        border-left-color: var(--accent);
        background: var(--accent-weak);
      }
      .task__main {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        padding: 0;
        border: none;
        background: none;
        font: inherit;
        text-align: left;
        cursor: pointer;
        color: var(--ink);
      }
      .task__main:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .task__title {
        font-size: 13px;
        line-height: 1.4;
      }
      .task__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ink-3);
        flex: none;
      }
      .task__dot--danger {
        background: var(--danger);
      }
      .task__dot--warn {
        background: var(--warn);
      }
      .task__dot--ok {
        background: var(--ok);
      }
      .diff__head {
        background: var(--bg-subtle);
      }
      .pick-list {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--line);
      }
      .pick {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        cursor: pointer;
        font-size: 13px;
      }
      .pick:last-child {
        border-bottom: none;
      }
      .pick--on {
        background: var(--accent-weak);
      }
      .pick__name {
        color: var(--ink);
      }
      .link-btn:disabled {
        color: var(--ink-3);
        cursor: not-allowed;
        text-decoration: none;
      }
      @media (max-width: 1024px) {
        .task-list {
          max-height: none;
        }
      }
    `,
  ],
})
export class Reviews implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly tasks = this.store.reviewTasks;
  readonly reasonChips = REASON_CHIPS;

  readonly filter = signal<TaskFilter>('all');
  readonly selectedId = signal<string | null>(null);
  readonly checked = signal<string[]>([]);
  readonly note = signal('');
  readonly rejectError = signal('');
  readonly batchConfirm = signal(false);

  readonly assignOpen = signal(false);
  readonly assignPick = signal<string | null>(null);
  readonly assignError = signal('');

  readonly selected = computed(() => this.tasks().find((t) => t.id === this.selectedId()) ?? null);
  readonly highCount = computed(() => this.tasks().filter((t) => t.priority === 'high').length);

  readonly counts = computed(() => {
    const list = this.tasks();
    return {
      all: list.length,
      open: list.filter((t) => t.state === 'pending' || t.state === 'assigned').length,
      overdue: list.filter((t) => t.state === 'overdue').length,
      approved: list.filter((t) => t.state === 'approved').length,
      rejected: list.filter((t) => t.state === 'rejected').length,
    };
  });

  readonly filters = computed(() => {
    const c = this.counts();
    return [
      { key: 'all' as TaskFilter, label: '全部', count: c.all },
      { key: 'open' as TaskFilter, label: '待处理', count: c.open },
      { key: 'overdue' as TaskFilter, label: '超期', count: c.overdue },
      { key: 'approved' as TaskFilter, label: '已通过', count: c.approved },
      { key: 'rejected' as TaskFilter, label: '已驳回', count: c.rejected },
    ];
  });

  readonly filtered = computed(() => {
    const list = this.tasks();
    const f = this.filter();
    if (f === 'all') return list;
    if (f === 'open') return list.filter((t) => t.state === 'pending' || t.state === 'assigned');
    if (f === 'overdue') return list.filter((t) => t.state === 'overdue');
    if (f === 'approved') return list.filter((t) => t.state === 'approved');
    return list.filter((t) => t.state === 'rejected');
  });

  readonly checkedTasks = computed(() => this.tasks().filter((t) => this.checked().includes(t.id)));
  readonly highChecked = computed(() => this.checkedTasks().filter((t) => t.priority === 'high'));
  readonly batchable = computed(() =>
    this.checkedTasks().filter((t) => t.priority !== 'high' && t.state !== 'approved' && t.state !== 'rejected'),
  );
  readonly canBatch = computed(
    () => this.checked().length > 0 && this.highChecked().length === 0 && this.batchable().length > 0,
  );

  readonly records = computed(() =>
    this.store
      .auditEvents()
      .filter((e) => e.action === 'approve' || e.action === 'correct')
      .slice(0, 6),
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.setActiveProject(id);
  }

  setFilter(key: TaskFilter): void {
    this.filter.set(key);
  }

  select(id: string): void {
    this.selectedId.set(id);
    const task = this.tasks().find((t) => t.id === id);
    this.note.set(task?.note ?? '');
    this.rejectError.set('');
  }

  toggleCheck(id: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checked.update((list) => (isChecked ? [...list, id] : list.filter((x) => x !== id)));
  }

  priorityLabel(level: RiskLevel): string {
    return RISK_LABEL[level];
  }
  priorityTone(level: RiskLevel): Tone {
    return RISK_TONE[level];
  }
  stateLabel(state: TaskState): string {
    return TASK_STATE_LABEL[state];
  }
  stateTone(state: TaskState): Tone {
    return STATE_TONE[state];
  }
  stateIcon(state: TaskState): string {
    return STATE_ICON[state];
  }
  dueText(iso: string): string {
    return deadlineText(iso);
  }
  dueTone(iso: string): Tone {
    return deadlineTone(iso);
  }
  fmt(at: string): string {
    return fmtDateTime(at);
  }
  recordLabel(action: AuditAction): string {
    return action === 'approve' ? '审核通过' : '审核修正';
  }
  userName(id: string): string {
    return this.store.users().find((u) => u.id === id)?.name ?? id;
  }
  roleLabel(role: keyof typeof ROLE_LABEL): string {
    return ROLE_LABEL[role];
  }
  doubleReview(t: ReviewTask): boolean {
    return t.assignee === t.editor && t.priority === 'high';
  }
  candidates(t: ReviewTask): User[] {
    return this.store.users().filter((u) => u.id !== t.editor);
  }

  fillNote(reason: string): void {
    const current = this.note().trim();
    if (!current) {
      this.note.set(reason);
    } else if (!current.includes(reason)) {
      this.note.set(current + '；' + reason);
    }
    this.rejectError.set('');
  }

  approve(t: ReviewTask): void {
    if (this.doubleReview(t)) {
      this.toast.push('无法采纳', 'danger', '高风险项需第二审核人（BR-08）');
      return;
    }
    const note = this.note().trim();
    this.store.approveTask(t.id, note || undefined);
    this.toast.push('审核已通过', 'ok', `${t.title}${note ? ' · 说明已记录' : ''}`);
  }

  reject(t: ReviewTask): void {
    if (this.doubleReview(t)) {
      this.toast.push('无法驳回', 'danger', '高风险项需第二审核人（BR-08）');
      return;
    }
    const reason = this.note().trim();
    if (reason.length < 4) {
      this.rejectError.set('请填写驳回理由（至少 4 个字），理由将写入审核记录');
      return;
    }
    this.rejectError.set('');
    this.store.rejectTask(t.id, reason);
    this.toast.push('已驳回', 'warn', `${t.title} · 理由已记录`);
  }

  openAssign(t: ReviewTask): void {
    this.assignPick.set(t.assignee !== t.editor ? t.assignee : null);
    this.assignError.set('');
    this.assignOpen.set(true);
  }

  confirmAssign(): void {
    const t = this.selected();
    if (!t) return;
    const pick = this.assignPick();
    if (!pick) {
      this.assignError.set('请选择一名审核人');
      return;
    }
    if (pick === t.editor) {
      this.assignError.set('不能指派给发起人本人（BR-08 双人规则）');
      return;
    }
    this.store.assignTask(t.id, pick);
    this.assignOpen.set(false);
    this.toast.push('已指派审核人', 'ok', `${t.id} → ${this.userName(pick)}`);
  }

  doBatch(): void {
    const list = this.batchable();
    if (list.length === 0) {
      this.batchConfirm.set(false);
      this.toast.push('无可采纳任务', 'warn', '所选任务均非低 / 中风险待处理项');
      return;
    }
    for (const t of list) this.store.approveTask(t.id, '批量采纳（低 / 中风险）');
    this.checked.set([]);
    this.batchConfirm.set(false);
    this.toast.push(`已批量采纳 ${list.length} 项`, 'ok', '高风险任务仍需逐项审核');
  }
}
