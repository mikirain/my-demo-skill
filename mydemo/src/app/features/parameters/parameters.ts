import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Confirm } from '../../shared/ui/confirm';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { ToastService } from '../../shared/ui/toast.service';
import {
  DIMENSION_LABEL,
  DIMENSIONS,
  LEVEL_LABEL,
  PARAM_STATUS_LABEL,
  PARAM_STATUS_TONE,
  conditionText,
  confidenceTone,
} from '../../core/format';
import { ParamStatus, ParamValue } from '../../core/types';
import { downloadCsv } from '../../core/download';

const REASONS = ['口径不同：按统一测量边界重算', '原文有误：识别或 OCR 错误', '计算错误：换算或取值有误', '资料过时：使用更新版本', '行业惯例：按行业约定口径', '其他（在说明中补充）'];

@Component({
  selector: 'app-parameters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Confirm, Empty, Icon, Modal, Progress],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">参数矩阵</h1>
          <p class="page-sub">
            {{ store.activeProject()?.name }} · 共 {{ list().length }} 条参数实例 · 六类维度 · 每条均需可溯源
          </p>
        </div>
        <div class="page-actions">
          <ui-btn variant="secondary" icon="download" (click)="exportCsv()">导出 CSV</ui-btn>
          <ui-btn variant="primary" icon="check" [disabled]="selectableSelected().length === 0" (click)="bulkConfirm.set(true)">
            批量确认（{{ selectableSelected().length }}）
          </ui-btn>
        </div>
      </header>

      <div class="banner banner--info section">
        <ui-icon name="info" [size]="16" />
        <span>
          置信度 ≥ {{ pct(store.thresholds().autoPass) }} 免检进入矩阵；{{ pct(store.thresholds().manualForce) }}–{{ pct(store.thresholds().autoPass) }} 提示复核可批量通过；低于
          {{ pct(store.thresholds().manualForce) }} 强制人工，不可跳过。
        </span>
      </div>

      <div class="section">
        <div class="row row--wrap" style="margin-bottom: 12px">
          @for (c of chips(); track c.key) {
            <button type="button" class="chip" [class.chip--active]="quick() === c.key" (click)="toggleQuick(c.key)">
              {{ c.label }} <span class="chip__count">{{ c.count }}</span>
            </button>
          }
        </div>

        <div class="filter-bar">
          <div class="row" style="flex: 1">
            <ui-icon name="search" [size]="14" />
            <input
              class="input"
              type="search"
              placeholder="搜索参数名或 key"
              aria-label="搜索参数"
              [ngModel]="q()"
              (ngModelChange)="q.set($event); page.set(0)"
            />
          </div>
          <select class="select" aria-label="按维度筛选" [ngModel]="dim()" (ngModelChange)="dim.set($event); page.set(0)">
            <option value="all">全部维度</option>
            @for (d of dimensions; track d) {
              <option [value]="d">{{ dimLabel(d) }}</option>
            }
          </select>
          <select class="select" aria-label="按来源筛选" [ngModel]="source()" (ngModelChange)="source.set($event); page.set(0)">
            <option value="all">全部来源</option>
            @for (s of sources(); track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
          <select class="select" aria-label="按状态筛选" [ngModel]="status()" (ngModelChange)="status.set($event); page.set(0)">
            <option value="all">全部状态</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ statusLabel(s) }}</option>
            }
          </select>
          <button type="button" class="chip" [class.chip--active]="density() === 'compact'" (click)="density.set(density() === 'compact' ? 'comfort' : 'compact')">
            {{ density() === 'compact' ? '紧凑' : '舒适' }}
          </button>
        </div>

        @if (filtered().length === 0) {
          <ui-empty
            title="没有匹配的参数"
            hint="尝试放宽筛选条件，或清空搜索关键词。当前项目可能尚未完成抽取。"
            actionLabel="清空筛选"
            (action)="clearFilters()"
          />
        } @else {
          <div class="table-wrap">
            <table class="table" [class.table--compact]="density() === 'compact'">
              <thead>
                <tr>
                  <th style="width: 36px">
                    <input
                      type="checkbox"
                      class="checkbox"
                      aria-label="全选可批量确认项"
                      [checked]="allSelected()"
                      (change)="toggleAll($event)"
                    />
                  </th>
                  <th>参数</th>
                  <th>来源</th>
                  <th>原始值 / 标准化值</th>
                  <th>条件与层级</th>
                  <th style="width: 120px">置信度</th>
                  <th>状态</th>
                  <th>证据</th>
                  <th style="width: 120px">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (v of paged(); track v.id) {
                  <tr [class.table-row--open]="expanded() === v.id">
                    <td>
                      <input
                        type="checkbox"
                        class="checkbox"
                        [attr.aria-label]="'选择 ' + v.defLabel"
                        [checked]="selected().includes(v.id)"
                        [disabled]="!canBulk(v)"
                        [attr.title]="canBulk(v) ? '可批量确认' : '低于强制人工阈值，需逐条处理'"
                        (change)="toggleOne(v, $event)"
                      />
                    </td>
                    <td>
                      <div class="stack stack--tight">
                        <button type="button" class="link-btn" (click)="toggleExpand(v.id)">{{ v.defLabel }}</button>
                        <span class="mono small muted">{{ v.defKey }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="small">{{ v.sourceName }}</span>
                      @if (v.sourceId === 'our') {
                        <span class="tag">我方</span>
                      }
                    </td>
                    <td>
                      <div class="stack stack--tight">
                        <span class="small muted">{{ v.rawValue }}</span>
                        <span class="mono">
                          @if (v.value === null) {
                            <span class="muted">—</span>
                          } @else {
                            {{ v.value }} <span class="muted small">{{ v.unit }}</span>
                          }
                        </span>
                      </div>
                    </td>
                    <td>
                      <div class="small">
                        @for (c of conditionsOf(v); track c) {
                          <span class="cond-chip">{{ c }}</span>
                        }
                        @if (conditionsOf(v).length === 0) {
                          <span class="muted small">条件未标注</span>
                        }
                      </div>
                      <span class="tag">{{ levelLabel(v.level) }}</span>
                    </td>
                    <td>
                      <ui-progress [value]="v.confidence * 100" [tone]="confTone(v.confidence)" />
                    </td>
                    <td>
                      <ui-badge
                        [label]="statusLabel(v.status)"
                        [tone]="statusTone(v.status)"
                        [icon]="v.status === 'conflict' ? 'alert' : v.status === 'confirmed' ? 'check' : v.status === 'corrected' ? 'edit' : 'clock'"
                      />
                      @if (v.conflictValues) {
                        <button type="button" class="link-btn small" style="display: block; margin-top: 4px" (click)="openConflict(v)">
                          冲突 {{ v.conflictValues.length }} 值
                        </button>
                      }
                    </td>
                    <td>
                      @if (v.evidence) {
                        <button type="button" class="link-btn small" (click)="gotoEvidence(v)">
                          <ui-icon name="link" [size]="12" /> P.{{ v.evidence.page }}
                        </button>
                      } @else {
                        <span class="small muted">无引用</span>
                      }
                    </td>
                    <td>
                      <div class="row row--wrap">
                        <ui-btn size="sm" variant="ghost" icon="edit" (click)="openEdit(v)">修正</ui-btn>
                        @if (v.status !== 'confirmed') {
                          <ui-btn size="sm" variant="ghost" icon="check" (click)="confirmOne(v)">确认</ui-btn>
                        }
                      </div>
                    </td>
                  </tr>
                  @if (expanded() === v.id) {
                    <tr>
                      <td colspan="9" class="table-detail">
                        <div class="grid grid--2">
                          <div class="stack stack--tight">
                            <span class="label">标准化链路</span>
                            <ol class="chain">
                              <li>原始值：<span class="mono">{{ v.rawValue }}</span></li>
                              <li>别名映射：<span class="mono">{{ v.rawName }} → {{ v.defKey }}</span></li>
                              <li>单位换算：<span class="mono">{{ v.unit }}</span></li>
                              <li>条件归一：<span class="mono">{{ conditionsOf(v).join(' · ') || '未标注' }}</span></li>
                              <li>标准化值：<span class="mono">{{ v.value ?? '—' }} {{ v.unit }}</span></li>
                            </ol>
                          </div>
                          <div class="stack stack--tight">
                            <span class="label">校验与历史</span>
                            <ul class="check-list">
                              <li [class.text-danger]="!v.evidence">证据引用：{{ v.evidence ? '已定位 P.' + v.evidence.page : '缺失' }}</li>
                              <li>条件完整性：{{ conditionsOf(v).length > 0 ? '已标注' : '未标注（不可直接比较）' }}</li>
                              <li>来源可靠性：{{ v.evidence?.reliability ?? '未知' }}</li>
                              @if (v.correctedBy) {
                                <li>修正记录：{{ v.correctedBy }} · {{ v.correctedAt }} · {{ v.reason }}</li>
                              } @else {
                                <li class="muted">修正记录：无</li>
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
            <span>共 {{ filtered().length }} 条 · 第 {{ page() + 1 }} / {{ totalPages() }} 页</span>
            <div class="row">
              <ui-btn size="sm" variant="secondary" [disabled]="page() === 0" (click)="prev()">上一页</ui-btn>
              <ui-btn size="sm" variant="secondary" [disabled]="page() >= totalPages() - 1" (click)="next()">下一页</ui-btn>
            </div>
          </div>
        }
      </div>
    </div>

    <ui-modal [open]="!!editing()" title="修正参数值" size="md" (close)="closeEdit()">
      @if (editing(); as v) {
        <div class="stack">
          <div class="banner banner--warn">
            <ui-icon name="alert" [size]="16" />
            <span>修正将记录原值、新值、理由与操作人，并写入审计日志。修正不会直接改变其他来源的值。</span>
          </div>
          <dl class="kv">
            <dt>参数</dt>
            <dd>{{ v.defLabel }} <span class="mono small muted">{{ v.defKey }}</span></dd>
            <dt>原值</dt>
            <dd class="mono">{{ v.rawValue }} → {{ v.value ?? '—' }} {{ v.unit }}</dd>
            <dt>来源</dt>
            <dd>{{ v.sourceName }}</dd>
          </dl>
          <div class="grid grid--2">
            <div class="field">
              <label for="ed-value">修正后数值 *</label>
              <input id="ed-value" class="input" type="text" inputmode="decimal" [ngModel]="editValue()" (ngModelChange)="editValue.set($event)" />
            </div>
            <div class="field">
              <label for="ed-unit">单位</label>
              <input id="ed-unit" class="input" [ngModel]="v.unit" disabled />
            </div>
          </div>
          <div class="field">
            <label for="ed-reason">修正理由 *</label>
            <select id="ed-reason" class="select" [ngModel]="editReason()" (ngModelChange)="editReason.set($event)">
              <option value="">请选择理由</option>
              @for (r of reasons; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
            @if (editError()) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ editError() }}</span>
            }
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="closeEdit()">取消</ui-btn>
        <ui-btn variant="primary" (click)="saveEdit()">保存修正</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="!!conflict()" title="参数冲突裁决" size="lg" (close)="conflict.set(null)">
      @if (conflict(); as v) {
        <div class="stack">
          <p class="small muted">
            {{ v.defLabel }} 在同一来源出现多个取值。系统不会自动选择一个，需人工裁决并说明理由。
          </p>
          <div class="conflict">
            @for (cv of v.conflictValues; track cv.value) {
              <label class="conflict__opt" [class.conflict__opt--picked]="chosen() === cv.value">
                <input type="radio" name="cv" class="checkbox" [value]="cv.value" [checked]="chosen() === cv.value" (change)="chosen.set(cv.value)" />
                <span class="mono">{{ cv.value }}</span>
                <span class="small muted">{{ cv.source }}</span>
              </label>
            }
          </div>
          <div class="field">
            <label for="cf-note">裁决说明 *</label>
            <textarea id="cf-note" class="input" rows="3" [ngModel]="note()" (ngModelChange)="note.set($event)" placeholder="说明采用该值的依据，例如以最新版本或正式投标文件为准"></textarea>
            @if (conflictError()) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ conflictError() }}</span>
            }
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="conflict.set(null)">取消</ui-btn>
        <ui-btn variant="primary" (click)="saveConflict()">确认裁决</ui-btn>
      </div>
    </ui-modal>

    <ui-confirm
      [open]="bulkConfirm()"
      title="批量确认参数"
      [message]="'将确认 ' + selectableSelected().length + ' 项中置信度项目，全部标记为已确认。'"
      detail="低于强制人工阈值的项不在本次范围内，仍需逐条处理。"
      confirmText="批量确认"
      (confirm)="doBulkConfirm()"
      (cancel)="bulkConfirm.set(false)"
    />
  `,
  styles: [
    `
      .chain {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.9;
        color: var(--ink-2);
      }
      .check-list {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.9;
        color: var(--ink-2);
      }
      .conflict {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--line);
      }
      .conflict__opt {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        cursor: pointer;
        font-size: 13px;
      }
      .conflict__opt:last-child {
        border-bottom: none;
      }
      .conflict__opt--picked {
        background: var(--accent-weak);
      }
    `,
  ],
})
export class Parameters implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly dimensions = DIMENSIONS;
  readonly statuses: ParamStatus[] = ['pending', 'confirmed', 'corrected', 'conflict', 'draft'];
  readonly reasons = REASONS;

  readonly q = signal('');
  readonly dim = signal('all');
  readonly source = signal('all');
  readonly status = signal('all');
  readonly quick = signal('none');
  readonly density = signal<'comfort' | 'compact'>('comfort');
  readonly page = signal(0);
  readonly pageSize = 20;
  readonly expanded = signal<string | null>(null);
  readonly selected = signal<string[]>([]);
  readonly bulkConfirm = signal(false);

  readonly editing = signal<ParamValue | null>(null);
  readonly editValue = signal('');
  readonly editReason = signal('');
  readonly editError = signal('');

  readonly conflict = signal<ParamValue | null>(null);
  readonly chosen = signal('');
  readonly note = signal('');
  readonly conflictError = signal('');

  readonly list = this.store.paramValues;

  readonly sources = computed(() => Array.from(new Set(this.list().map((v) => v.sourceName))));

  readonly filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    const quick = this.quick();
    return this.list().filter((v) => {
      if (q && !(v.defLabel.toLowerCase().includes(q) || v.defKey.toLowerCase().includes(q))) return false;
      if (this.dim() !== 'all' && v.dimension !== this.dim()) return false;
      if (this.source() !== 'all' && v.sourceName !== this.source()) return false;
      if (this.status() !== 'all' && v.status !== this.status()) return false;
      if (quick === 'pending' && !(v.status === 'pending' || v.status === 'conflict')) return false;
      if (quick === 'forced' && v.confidence >= this.store.thresholds().manualForce) return false;
      if (quick === 'conflict' && v.status !== 'conflict') return false;
      if (quick === 'corrected' && v.status !== 'corrected') return false;
      if (quick === 'noevidence' && v.evidence) return false;
      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paged = computed(() => this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize));

  readonly selectableSelected = computed(() =>
    this.filtered()
      .filter((v) => v.confidence >= this.store.thresholds().manualForce && v.confidence < this.store.thresholds().autoPass)
      .filter((v) => this.selected().includes(v.id)),
  );

  readonly allSelected = computed(() => {
    const selectable = this.paged().filter((v) => this.canBulk(v));
    return selectable.length > 0 && selectable.every((v) => this.selected().includes(v.id));
  });

  readonly chips = computed(() => {
    const stats = this.store.paramStats();
    return [
      { key: 'pending', label: '待我确认', count: stats.pending },
      { key: 'forced', label: '强制人工', count: stats.forced },
      { key: 'conflict', label: '冲突', count: stats.conflicts },
      { key: 'corrected', label: '已修正', count: stats.corrected },
      { key: 'noevidence', label: '无引用', count: stats.noEvidence },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.setActiveProject(id);
  }

  dimLabel(d: string): string {
    return DIMENSION_LABEL[d as keyof typeof DIMENSION_LABEL];
  }
  levelLabel(l: string): string {
    return LEVEL_LABEL[l] ?? l;
  }
  statusLabel(s: string): string {
    return PARAM_STATUS_LABEL[s as ParamStatus] ?? s;
  }
  statusTone(s: ParamStatus) {
    return PARAM_STATUS_TONE[s];
  }
  confTone(c: number) {
    return confidenceTone(c);
  }
  pct(v: number): string {
    return Math.round(v * 100) + '%';
  }
  conditionsOf(v: ParamValue): string[] {
    const text = conditionText(v.conditions);
    return text === '条件未标注' ? [] : text.split(' · ');
  }
  canBulk(v: ParamValue): boolean {
    return v.confidence >= this.store.thresholds().manualForce && v.confidence < this.store.thresholds().autoPass;
  }

  toggleQuick(key: string): void {
    this.quick.set(this.quick() === key ? 'none' : key);
    this.page.set(0);
  }

  clearFilters(): void {
    this.q.set('');
    this.dim.set('all');
    this.source.set('all');
    this.status.set('all');
    this.quick.set('none');
    this.page.set(0);
  }

  toggleExpand(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  toggleOne(v: ParamValue, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update((list) => (checked ? [...list, v.id] : list.filter((x) => x !== v.id)));
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.paged().filter((v) => this.canBulk(v)).map((v) => v.id);
    this.selected.update((list) => (checked ? Array.from(new Set([...list, ...ids])) : list.filter((x) => !ids.includes(x))));
  }

  prev(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  next(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  confirmOne(v: ParamValue): void {
    this.store.confirmParam(v.id);
    this.toast.push('参数已确认', 'ok', `${v.defLabel} · ${v.sourceName}`);
  }

  doBulkConfirm(): void {
    const ids = this.selectableSelected().map((v) => v.id);
    this.store.bulkConfirm(ids);
    this.selected.set([]);
    this.bulkConfirm.set(false);
    this.toast.push(`已批量确认 ${ids.length} 项`, 'ok', '低于强制人工阈值的项仍待逐条处理');
  }

  openEdit(v: ParamValue): void {
    this.editing.set(v);
    this.editValue.set(typeof v.value === 'number' ? String(v.value) : '');
    this.editReason.set('');
    this.editError.set('');
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const v = this.editing();
    if (!v) return;
    const parsed = Number(this.editValue().replace(',', '.'));
    if (!this.editValue().trim() || Number.isNaN(parsed)) {
      this.editError.set('请输入有效的修正数值');
      return;
    }
    if (!this.editReason()) {
      this.editError.set('请选择修正理由');
      return;
    }
    this.store.correctParam(v.id, {
      value: parsed,
      rawValue: String(parsed),
      reason: this.editReason(),
      defLabel: v.defLabel,
    });
    this.editing.set(null);
    this.toast.push('修正已保存', 'ok', `${v.defLabel} → ${parsed} ${v.unit}，已写入审计日志`);
  }

  openConflict(v: ParamValue): void {
    this.conflict.set(v);
    this.chosen.set(v.conflictValues?.[0]?.value ?? '');
    this.note.set('');
    this.conflictError.set('');
  }

  saveConflict(): void {
    const v = this.conflict();
    if (!v) return;
    if (!this.chosen()) {
      this.conflictError.set('请选择一个取值');
      return;
    }
    if (this.note().trim().length < 4) {
      this.conflictError.set('请填写裁决说明（至少 4 个字）');
      return;
    }
    this.store.resolveConflict(v.id, this.chosen(), this.note());
    this.conflict.set(null);
    this.toast.push('冲突已裁决', 'ok', `${v.defLabel}：采用「${this.chosen()}」`);
  }

  gotoEvidence(v: ParamValue): void {
    if (!v.evidence) return;
    this.router.navigate(['/projects', this.store.activeProjectId(), 'documents', v.evidence.documentId], {
      queryParams: { page: v.evidence.page, key: v.defKey },
    });
  }

  exportCsv(): void {
    const rows: (string | number)[][] = [
      ['参数', 'key', '来源', '原始值', '标准化值', '单位', '条件', '层级', '置信度', '状态', '证据页码', '来源可靠性'],
      ...this.filtered().map((v) => [
        v.defLabel,
        v.defKey,
        v.sourceName,
        v.rawValue,
        v.value ?? '',
        v.unit,
        conditionText(v.conditions),
        LEVEL_LABEL[v.level] ?? v.level,
        v.confidence.toFixed(2),
        PARAM_STATUS_LABEL[v.status],
        v.evidence ? 'P.' + v.evidence.page : '无引用',
        v.evidence?.reliability ?? '未知',
      ]),
    ];
    downloadCsv('BidScope-参数矩阵.csv', rows);
    this.store.pushAudit('export', '参数矩阵 CSV', `导出 ${this.filtered().length} 行`);
    this.toast.push('已导出 CSV', 'ok', `共 ${this.filtered().length} 行，遵循当前筛选条件`);
  }
}
