import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { downloadText } from '../../core/download';
import { INSIGHT_LABEL, RISK_LABEL, RISK_TONE } from '../../core/format';
import { Clarification, Insight, InsightType, RiskItem, RiskLevel, Tone } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Confirm } from '../../shared/ui/confirm';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { Stat } from '../../shared/ui/stat';
import { TabItem, Tabs } from '../../shared/ui/tabs';
import { ToastService } from '../../shared/ui/toast.service';

type TabId = 'conclusions' | 'risks' | 'clarify';
type RiskState = RiskItem['state'];
type InsightState = Insight['state'];

const EDIT_REASONS = [
  '措辞不准确：调整为可核验的表述',
  '口径不同：按统一测量边界重述',
  '原文有误：识别或引用定位错误',
  '证据不足：需追加引用后重写',
  '其他（在正文中补充说明）',
];

const INSIGHT_TONE: Record<InsightType, Tone> = { fact: 'info', inference: 'warn', suggestion: 'neutral' };
const INSIGHT_ICON: Record<InsightType, string> = { fact: 'check-square', inference: 'help', suggestion: 'bulb' };
const INSIGHT_STATE_LABEL: Record<InsightState, string> = {
  draft: '草稿',
  adopted: '已采纳',
  rejected: '已驳回',
  edited: '已修改',
};
const INSIGHT_STATE_TONE: Record<InsightState, Tone> = {
  draft: 'neutral',
  adopted: 'ok',
  rejected: 'danger',
  edited: 'info',
};
const RISK_STATE_LABEL: Record<RiskState, string> = { open: '未处置', mitigating: '处置中', closed: '已关闭' };
const RISK_STATE_TONE: Record<RiskState, Tone> = { open: 'warn', mitigating: 'info', closed: 'ok' };
const RISK_NEXT: Record<RiskState, RiskState> = { open: 'mitigating', mitigating: 'closed', closed: 'open' };
const RISK_ORDER: RiskLevel[] = ['high', 'mid', 'low'];

@Component({
  selector: 'app-insights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Badge, Btn, Confirm, Empty, Icon, Modal, Progress, Stat, Tabs],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">研判与风险</h1>
          <p class="page-sub">
            {{ store.activeProject()?.name }} · 已确认字段 {{ confirmed() }} / {{ total() }} · 结论 {{ conclusions().length }} 条 ·
            风险 {{ store.risks().length }} 项 · 待澄清 {{ store.clarifications().length }} 条
          </p>
        </div>
        <div class="page-actions">
          @if (!store.insightReady()) {
            <span class="small gate-note">
              <ui-icon name="alert" [size]="12" />
              已确认字段不足 15 项
              <a [routerLink]="['/projects', activeId(), 'parameters']">去参数矩阵</a>
            </span>
          }
          <ui-btn variant="secondary" icon="download" [disabled]="store.clarifications().length === 0" (click)="exportClarifications()">
            导出澄清清单
          </ui-btn>
          <ui-btn variant="primary" icon="bulb" [disabled]="!store.insightReady()" (click)="generate()">生成研判</ui-btn>
        </div>
      </header>

      <section class="section">
        <div class="card">
          <div class="card-bd strip">
            <div class="strip__gate">
              <div class="row row--between small">
                <span class="muted">已确认字段（研判门禁）</span>
                <span class="mono">{{ confirmed() }} / {{ total() }}</span>
              </div>
              <ui-progress [value]="confirmedPct()" [tone]="store.insightReady() ? 'ok' : 'warn'" label="已确认字段占比" />
              <p class="small muted">
                达到 15 项后方可生成研判结论。结论只引用已确认字段与原文锚点，引用缺失的条目不会进入结论区。
              </p>
            </div>
            <div class="grid grid--3">
              <ui-stat label="结论" [value]="conclusions().length" hint="均有原文证据引用" />
              <ui-stat label="已采纳" [value]="adoptedCount()" tone="ok" hint="进入差距清单与报告" />
              <ui-stat label="被拦截（无证据）" [value]="blocked()" tone="warn" hint="按 BR-01 不进入结论区" />
            </div>
          </div>
          @if (blocked() > 0) {
            <div class="card-ft">
              <span>
                另有 {{ blocked() }} 条候选结论因无证据引用被拦截，仅保留计数、不展示正文：BR-01 要求任何结论可回溯原文，BR-06
                要求系统只输出依据、不替人下判断。
              </span>
              <a [routerLink]="['/projects', activeId(), 'parameters']" class="small">补充证据</a>
            </div>
          }
        </div>
      </section>

      <section class="section">
        <ui-tabs [tabs]="tabs()" [active]="tab()" label="研判视图" (change)="switchTab($event)" />

        @switch (tab()) {
          @case ('conclusions') {
            @if (!store.insightReady()) {
              <ui-empty
                icon="bulb"
                title="研判尚未生成"
                [hint]="'已确认字段 ' + confirmed() + ' 项，需达到 15 项方可生成研判。请先在参数矩阵完成确认或冲突裁决。'"
                actionLabel="去参数矩阵"
                (action)="gotoParameters()"
              />
            } @else if (conclusions().length === 0) {
              <ui-empty icon="bulb" title="暂无研判结论" hint="点击「生成研判」后，系统将基于已确认字段与原文锚点生成事实、推断与建议三类结论。" />
            } @else {
              <div class="stack">
                @for (i of conclusions(); track i.id) {
                  <article class="card">
                    <div class="card-hd">
                      <div class="row row--wrap">
                        <ui-badge [label]="insightLabel(i.type)" [tone]="insightTone(i.type)" [icon]="insightIcon(i.type)" />
                        @if (i.type === 'inference') {
                          <span class="small muted">推断类结论需人工核实后采纳</span>
                        }
                      </div>
                      <ui-badge [label]="stateLabel(i.state)" [tone]="stateTone(i.state)" [ariaLabel]="'状态：' + stateLabel(i.state)" />
                    </div>
                    <div class="card-bd insight__bd">
                      <p class="insight__text">{{ displayText(i) }}</p>
                      <div class="insight__ev">
                        <span class="label">依据</span>
                        @for (e of i.evidenceIds; track e) {
                          <span class="tag mono"><ui-icon name="link" [size]="11" />{{ e }}</span>
                        }
                        @if (i.evidenceIds.length === 0) {
                          <span class="small text-danger">无引用（应被拦截）</span>
                        }
                      </div>
                    </div>
                    <div class="card-ft">
                      <span class="small muted mono">{{ i.id }}</span>
                      <div class="row row--wrap">
                        <ui-btn size="sm" variant="ghost" icon="check" [disabled]="i.state === 'adopted'" (click)="adopt(i)">采纳</ui-btn>
                        <ui-btn size="sm" variant="ghost" icon="edit" (click)="openEdit(i)">修改</ui-btn>
                        <ui-btn size="sm" variant="ghost" icon="x" (click)="deleting.set(i)">删除</ui-btn>
                      </div>
                    </div>
                  </article>
                }
              </div>
            }
          }
          @case ('risks') {
            <div class="row row--wrap" style="margin-bottom: 12px">
              @for (c of levelChips(); track c.key) {
                <button type="button" class="chip" [class.chip--active]="levelFilter() === c.key" (click)="setLevel(c.key)">
                  {{ c.label }} <span class="chip__count">{{ c.count }}</span>
                </button>
              }
              <span class="small muted">高风险默认展开；同一风险可循环标记为处置中 / 已关闭。</span>
            </div>
            @if (store.risks().length === 0) {
              <ui-empty icon="alert" title="暂无风险条目" hint="风险清单由对比判定与强制条款自动汇总；当前项目尚未产生可分级风险。" />
            } @else if (riskGroups().length === 0) {
              <ui-empty icon="filter" title="该级别暂无风险" hint="切换级别筛选查看其他等级的风险条目。" />
            } @else {
              <div class="stack">
                @for (g of riskGroups(); track g.level) {
                  <div class="group">
                    <button type="button" class="group__hd" [attr.aria-expanded]="isOpen(g.level)" (click)="toggleLevel(g.level)">
                      <span class="row">
                        <ui-icon [name]="isOpen(g.level) ? 'chevron-down' : 'chevron-right'" [size]="14" />
                        <ui-badge [label]="g.label" [tone]="g.tone" icon="alert" />
                        <span class="small muted">{{ g.items.length }} 项</span>
                      </span>
                      @if (levelFilter() === 'all') {
                        <span class="small muted">{{ isOpen(g.level) ? '收起' : '展开' }}</span>
                      } @else {
                        <span class="small muted">按级别筛选</span>
                      }
                    </button>
                    @if (isOpen(g.level)) {
                      @for (r of g.items; track r.id) {
                        <div class="risk">
                          <div class="risk__main">
                            <div class="row row--wrap">
                              <span class="tag">{{ r.kind }}</span>
                              <span class="mono small muted">{{ r.id }}</span>
                              <ui-badge [label]="riskStateLabel(r)" [tone]="riskStateTone(r)" [ariaLabel]="'状态：' + riskStateLabel(r)" />
                            </div>
                            <p class="risk__text">{{ r.text }}</p>
                            <div class="row row--wrap">
                              <span class="label">关联参数</span>
                              @for (k of r.relatedKeys; track k) {
                                <span class="cond-chip">{{ k }}</span>
                              }
                            </div>
                            <p class="small risk__sug"><span class="label">建议处置</span>{{ r.suggestion }}</p>
                          </div>
                          <div class="risk__side">
                            <span class="small muted">责任人</span>
                            <span class="small">{{ r.owner }}</span>
                            <ui-btn size="sm" variant="secondary" icon="check-square" (click)="advanceRisk(r)">标记处置</ui-btn>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          }
          @case ('clarify') {
            @if (store.clarifications().length === 0) {
              <ui-empty icon="help" title="暂无待澄清问题" hint="对比中若出现口径不一致或证据缺口，系统会在此生成待澄清问题。" />
            } @else {
              <div class="row row--between" style="margin-bottom: 12px">
                <div class="row row--wrap">
                  <button type="button" class="chip" [class.chip--active]="allSelected()" (click)="toggleAllClarify()">
                    全选 <span class="chip__count">{{ clarifySelected().length }} / {{ store.clarifications().length }}</span>
                  </button>
                  <span class="small muted">勾选后可复制为纯文本，用于答疑文件与邮件。</span>
                </div>
                <ui-btn variant="secondary" icon="doc" [disabled]="clarifySelected().length === 0" (click)="copyClarifications()">
                  复制为文本
                </ui-btn>
              </div>
              <div class="stack stack--tight">
                @for (c of store.clarifications(); track c.id) {
                  <div class="clr" [class.clr--on]="clarifySelected().includes(c.id)">
                    <input
                      type="checkbox"
                      class="checkbox"
                      [attr.aria-label]="'选择澄清问题 ' + c.question"
                      [checked]="clarifySelected().includes(c.id)"
                      (change)="toggleClarify(c.id, $event)"
                    />
                    <div class="clr__body">
                      <p class="clr__q">{{ c.question }}</p>
                      <dl class="kv kv--tight">
                        <dt>背景</dt>
                        <dd>{{ c.background }}</dd>
                        <dt>影响</dt>
                        <dd>{{ c.impact }}</dd>
                        <dt>证据</dt>
                        <dd>
                          @for (e of c.evidenceIds; track e) {
                            <span class="tag mono"><ui-icon name="link" [size]="11" />{{ e }}</span>
                          }
                          @if (c.evidenceIds.length === 0) {
                            <span class="small muted">无引用</span>
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                }
              </div>
            }
          }
        }
      </section>

      <section class="section">
        <div class="card">
          <div class="card-hd">
            <h2 class="card-title">决策留白</h2>
            <ui-badge label="BR-06 · 由人填写" tone="neutral" icon="user" />
          </div>
          <div class="card-bd stack">
            <div class="banner banner--warn">
              <ui-icon name="alert" [size]="16" />
              <span>
                系统不会输出报价让利空间、承诺可用率等决策值，也不会给出推荐值或区间；此处仅为人工填写占位，填写后随决策记录一并留痕。
              </span>
            </div>
            <div class="grid grid--2">
              <div class="field">
                <label for="ins-discount">报价让利空间</label>
                <input
                  id="ins-discount"
                  class="input"
                  placeholder="由商务负责人填写，例如：3%"
                  [ngModel]="discount()"
                  (ngModelChange)="discount.set($event)"
                />
              </div>
              <div class="field">
                <label for="ins-availability">承诺可用率</label>
                <input
                  id="ins-availability"
                  class="input"
                  placeholder="由投标经理填写，例如：98.5%（年、时间加权）"
                  [ngModel]="availability()"
                  (ngModelChange)="availability.set($event)"
                />
              </div>
            </div>
            <div class="row row--between">
              <span class="hint">由人填写，系统不生成 · 两项均不参与系统打分</span>
              <ui-btn variant="secondary" icon="check" (click)="saveDecision()">保存</ui-btn>
            </div>
          </div>
        </div>
      </section>
    </div>

    <ui-modal [open]="!!editing()" title="修改结论" size="md" (close)="closeEdit()">
      @if (editing(); as i) {
        <div class="stack">
          <div class="banner banner--info">
            <ui-icon name="info" [size]="16" />
            <span>修改只影响本页展示并写入审计日志；结论原文由系统生成，演示环境不落库。</span>
          </div>
          <dl class="kv">
            <dt>结论</dt>
            <dd class="mono">{{ i.id }}</dd>
            <dt>类型</dt>
            <dd>{{ insightLabel(i.type) }}</dd>
            <dt>依据</dt>
            <dd class="mono small">{{ i.evidenceIds.join(' · ') || '无引用' }}</dd>
          </dl>
          <div class="field">
            <label for="ins-text">结论正文 *</label>
            <textarea id="ins-text" class="input" rows="4" [ngModel]="editText()" (ngModelChange)="editText.set($event)"></textarea>
          </div>
          <div class="field">
            <label for="ins-reason">修改理由 *</label>
            <select id="ins-reason" class="select" [ngModel]="editReason()" (ngModelChange)="editReason.set($event)">
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
        <ui-btn variant="primary" (click)="saveEdit()">保存修改</ui-btn>
      </div>
    </ui-modal>

    <ui-confirm
      [open]="!!deleting()"
      title="删除结论"
      [message]="'将删除结论 ' + (deleting()?.id ?? '') + '，并在审计日志中记录理由。'"
      detail="删除后该结论不再出现在结论区与报告中（演示：状态置为已驳回，原文保留在审计记录内）。"
      confirmText="删除"
      [danger]="true"
      (confirm)="confirmDelete()"
      (cancel)="deleting.set(null)"
    />
  `,
  styles: [
    `
      .gate-note {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--warn);
      }
      .strip {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
        gap: var(--sp-5);
        align-items: center;
      }
      .strip__gate {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .insight__bd {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .insight__text {
        margin: 0;
        font-size: 14px;
        line-height: 1.7;
        color: var(--ink);
      }
      .insight__ev {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .group {
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .group__hd {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
        width: 100%;
        padding: 10px 14px;
        font: inherit;
        background: var(--bg-subtle);
        border: none;
        border-bottom: 1px solid var(--line);
        cursor: pointer;
        text-align: left;
      }
      .group__hd:hover {
        background: #eeeef0;
      }
      .risk {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 150px;
        gap: var(--sp-4);
        padding: 14px;
        border-bottom: 1px solid var(--line);
      }
      .risk:last-child {
        border-bottom: none;
      }
      .risk__main {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .risk__text {
        margin: 0;
        font-size: 13px;
        line-height: 1.7;
        color: var(--ink);
      }
      .risk__sug {
        margin: 0;
        color: var(--ink-2);
        line-height: 1.6;
      }
      .risk__side {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        border-left: 1px solid var(--line);
        padding-left: var(--sp-4);
      }
      .clr {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: var(--sp-3);
        padding: 12px 14px;
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .clr--on {
        border-color: var(--accent);
        background: var(--accent-weak);
      }
      .clr__body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .clr__q {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--ink);
      }
      .kv--tight {
        gap: 4px 12px;
      }
      @media (max-width: 1024px) {
        .strip {
          grid-template-columns: minmax(0, 1fr);
        }
        .risk {
          grid-template-columns: minmax(0, 1fr);
        }
        .risk__side {
          flex-direction: row;
          align-items: center;
          border-left: none;
          padding-left: 0;
          border-top: 1px solid var(--line);
          padding-top: 8px;
        }
      }
    `,
  ],
})
export class Insights implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeId = this.store.activeProjectId;
  readonly reasons = EDIT_REASONS;

  readonly tab = signal<TabId>('conclusions');
  readonly levelFilter = signal<RiskLevel | 'all'>('all');
  readonly expanded = signal<Record<RiskLevel, boolean>>({ high: true, mid: false, low: false });
  readonly riskStates = signal<Record<string, RiskState>>({});
  readonly texts = signal<Record<string, string>>({});
  readonly clarifySelected = signal<string[]>([]);
  readonly discount = signal('');
  readonly availability = signal('');

  readonly editing = signal<Insight | null>(null);
  readonly editText = signal('');
  readonly editReason = signal('');
  readonly editError = signal('');
  readonly deleting = signal<Insight | null>(null);

  readonly conclusions = this.store.visibleInsights;
  readonly blocked = this.store.blockedInsightCount;
  readonly confirmed = this.store.confirmedParamCount;
  readonly total = computed(() => this.store.paramStats().total);
  readonly confirmedPct = computed(() => Math.round((this.confirmed() / Math.max(1, this.total())) * 100));
  readonly adoptedCount = computed(() => this.conclusions().filter((i) => i.state === 'adopted').length);

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'conclusions', label: '结论卡片', count: this.conclusions().length },
    { id: 'risks', label: '风险清单', count: this.store.risks().length },
    { id: 'clarify', label: '待澄清问题', count: this.store.clarifications().length },
  ]);

  readonly levelChips = computed(() => {
    const all = this.store.risks();
    return [
      { key: 'all' as const, label: '全部级别', count: all.length },
      ...RISK_ORDER.map((level) => ({
        key: level,
        label: `${RISK_LABEL[level]}风险`,
        count: all.filter((r) => r.level === level).length,
      })),
    ];
  });

  readonly riskGroups = computed(() => {
    const filter = this.levelFilter();
    const list = this.store.risks().filter((r) => filter === 'all' || r.level === filter);
    return RISK_ORDER.filter((level) => list.some((r) => r.level === level)).map((level) => ({
      level,
      label: `${RISK_LABEL[level]}风险`,
      tone: RISK_TONE[level],
      items: list.filter((r) => r.level === level),
    }));
  });

  readonly allSelected = computed(
    () => this.store.clarifications().length > 0 && this.clarifySelected().length === this.store.clarifications().length,
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.setActiveProject(id);
  }

  switchTab(id: string): void {
    this.tab.set(id as TabId);
  }

  gotoParameters(): void {
    this.router.navigate(['/projects', this.activeId(), 'parameters']);
  }

  insightLabel(type: InsightType): string {
    return INSIGHT_LABEL[type];
  }
  insightTone(type: InsightType): Tone {
    return INSIGHT_TONE[type];
  }
  insightIcon(type: InsightType): string {
    return INSIGHT_ICON[type];
  }
  stateLabel(state: InsightState): string {
    return INSIGHT_STATE_LABEL[state];
  }
  stateTone(state: InsightState): Tone {
    return INSIGHT_STATE_TONE[state];
  }
  riskStateLabel(r: RiskItem): string {
    return RISK_STATE_LABEL[this.riskState(r)];
  }
  riskStateTone(r: RiskItem): Tone {
    return RISK_STATE_TONE[this.riskState(r)];
  }
  riskState(r: RiskItem): RiskState {
    return this.riskStates()[r.id] ?? r.state;
  }
  displayText(i: Insight): string {
    const base = this.texts()[i.id] ?? i.text;
    if (i.type === 'inference' && !base.startsWith('待核实：')) return '待核实：' + base;
    return base;
  }

  generate(): void {
    if (!this.store.insightReady()) {
      this.toast.push('无法生成研判', 'warn', '已确认字段不足 15 项');
      return;
    }
    this.store.pushAudit('extract', '生成研判结论', `已确认字段 ${this.confirmed()} 项`);
    this.toast.push('研判已生成', 'ok', `共 ${this.conclusions().length} 条结论，均引用原文锚点`);
  }

  adopt(i: Insight): void {
    this.store.adoptInsight(i.id);
    this.toast.push('结论已采纳', 'ok', `${i.id} · 将进入差距清单与报告`);
  }

  openEdit(i: Insight): void {
    this.editing.set(i);
    this.editText.set(this.texts()[i.id] ?? i.text);
    this.editReason.set('');
    this.editError.set('');
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const i = this.editing();
    if (!i) return;
    const text = this.editText().trim();
    if (text.length < 8) {
      this.editError.set('结论正文至少 8 个字');
      return;
    }
    if (!this.editReason()) {
      this.editError.set('请选择修改理由');
      return;
    }
    this.texts.update((map) => ({ ...map, [i.id]: text }));
    this.store.pushAudit('correct', `结论修改 ${i.id}`, this.editReason());
    this.editing.set(null);
    this.toast.push('已保存修改（演示：不落库）', 'ok', `${i.id} · 理由：${this.editReason()}`);
  }

  confirmDelete(): void {
    const i = this.deleting();
    if (!i) return;
    const reason = '删除结论：依据不足或与研判目标无关';
    this.store.rejectInsight(i.id, reason);
    this.deleting.set(null);
    this.toast.push('结论已删除', 'ok', `${i.id} · 已写入审计日志`);
  }

  setLevel(key: RiskLevel | 'all'): void {
    this.levelFilter.set(this.levelFilter() === key ? 'all' : key);
  }

  isOpen(level: RiskLevel): boolean {
    const filter = this.levelFilter();
    if (filter !== 'all') return filter === level;
    return this.expanded()[level];
  }

  toggleLevel(level: RiskLevel): void {
    if (this.levelFilter() !== 'all') return;
    this.expanded.update((map) => ({ ...map, [level]: !map[level] }));
  }

  advanceRisk(r: RiskItem): void {
    const current = this.riskState(r);
    const next = RISK_NEXT[current];
    this.riskStates.update((map) => ({ ...map, [r.id]: next }));
    this.store.pushAudit('correct', `风险处置 ${r.id}`, `${RISK_STATE_LABEL[current]} → ${RISK_STATE_LABEL[next]}`);
    this.toast.push(
      '风险已标记',
      next === 'closed' ? 'info' : 'ok',
      next === 'closed'
        ? `${r.kind}：已关闭，高风险项仍需在审核页完成双人确认`
        : `${r.kind}：${RISK_STATE_LABEL[next]}`,
    );
  }

  toggleClarify(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.clarifySelected.update((list) => (checked ? [...list, id] : list.filter((x) => x !== id)));
  }

  toggleAllClarify(): void {
    if (this.allSelected()) {
      this.clarifySelected.set([]);
      return;
    }
    this.clarifySelected.set(this.store.clarifications().map((c) => c.id));
  }

  async copyClarifications(): Promise<void> {
    const items = this.store.clarifications().filter((c) => this.clarifySelected().includes(c.id));
    if (items.length === 0) {
      this.toast.push('未选择待澄清问题', 'warn', '勾选后可复制为纯文本');
      return;
    }
    await this.emitClarify(items, false);
  }

  async exportClarifications(): Promise<void> {
    const items = this.store.clarifications();
    if (items.length === 0) {
      this.toast.push('暂无待澄清问题', 'warn', '对比中未发现口径不一致或证据缺口');
      return;
    }
    await this.emitClarify(items, true);
  }

  private async emitClarify(items: Clarification[], forceDownload: boolean): Promise<void> {
    const text = this.buildClarifyText(items);
    let copied = false;
    if (!forceDownload) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) downloadText('BidScope-待澄清清单.txt', text);
    this.store.pushAudit('export', '待澄清问题清单', `${items.length} 条 · ${copied ? '复制到剪贴板' : '导出文本文件'}`);
    this.toast.push(
      copied ? `已复制 ${items.length} 条待澄清问题` : `已导出 ${items.length} 条待澄清问题`,
      copied ? 'ok' : 'info',
      '文本包含问题、背景、影响与证据锚点',
    );
  }

  private buildClarifyText(items: Clarification[]): string {
    const project = this.store.activeProject();
    const head = [`待澄清问题清单`, `项目：${project?.name ?? ''} / ${project?.customer ?? ''}`, `条数：${items.length}`];
    const body = items.map((c, index) => {
      const ev = c.evidenceIds.length > 0 ? c.evidenceIds.join('、') : '无引用';
      return [
        `${index + 1}. ${c.question}`,
        `   背景：${c.background}`,
        `   影响：${c.impact}`,
        `   证据：${ev}`,
      ].join('\n');
    });
    return [...head, '', ...body, '', '说明：以上问题由系统汇总，答复口径由人工确认。'].join('\n');
  }

  saveDecision(): void {
    const discount = this.discount().trim();
    const availability = this.availability().trim();
    if (!discount && !availability) {
      this.toast.push('未填写决策留白', 'warn', '两项均为空，未写入审计记录');
      return;
    }
    this.store.pushAudit(
      'confirm',
      '决策留白填写',
      `报价让利空间=${discount || '未填'}；承诺可用率=${availability || '未填'}`,
    );
    this.toast.push('决策留白已记录（演示：不落库）', 'ok', '由人填写的值不参与系统打分，仅随决策留痕');
  }
}
