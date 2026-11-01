import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { ToastService } from '../../shared/ui/toast.service';
import { COUNTRY_LABEL, deadlineText, deadlineTone, fmtDate as formatIsoDate } from '../../core/format';
import { Country, Project, Tone } from '../../core/types';

const STAGE_LABEL: Record<Project['stage'], string> = {
  intake: '摄取',
  extraction: '抽取',
  standardization: '校验',
  comparison: '对比',
  insight: '研判',
  published: '已发布',
};

const STAGE_TONE: Record<Project['stage'], Tone> = {
  intake: 'neutral',
  extraction: 'info',
  standardization: 'warn',
  comparison: 'info',
  insight: 'ok',
  published: 'ok',
};

const MIN_DEADLINE = '2026-10-24';

type SortKey = 'name' | 'country' | 'scale' | 'deadline' | 'completeness' | 'risks';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Badge, Btn, Empty, Icon, Modal, Progress],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">项目列表</h1>
          <p class="page-sub">
            共 {{ total() }} 个项目 · 在投 {{ activeCount() }} 个 · 覆盖 {{ countryCount() }} 个国别 · 未关闭高风险
            {{ highRiskTotal() }} 项
          </p>
        </div>
        <div class="page-actions">
          <div class="row" role="group" aria-label="视图切换">
            <button
              type="button"
              class="chip"
              [class.chip--active]="view() === 'card'"
              [attr.aria-pressed]="view() === 'card'"
              (click)="view.set('card')"
            >
              <ui-icon name="grid" [size]="14" />卡片
            </button>
            <button
              type="button"
              class="chip"
              [class.chip--active]="view() === 'table'"
              [attr.aria-pressed]="view() === 'table'"
              (click)="view.set('table')"
            >
              <ui-icon name="table" [size]="14" />表格
            </button>
          </div>
          <ui-btn variant="primary" icon="plus" (click)="openNew()">新建项目</ui-btn>
        </div>
      </header>

      <div class="filter-bar">
        <div class="row" style="flex: 1; min-width: 200px">
          <ui-icon name="search" [size]="14" />
          <input
            class="input"
            type="search"
            placeholder="搜索项目名称或客户"
            aria-label="搜索项目名称或客户"
            [ngModel]="q()"
            (ngModelChange)="q.set($event)"
          />
        </div>
        <select class="select" aria-label="按国别筛选" [ngModel]="country()" (ngModelChange)="country.set($event)">
          <option value="all">全部国别</option>
          @for (c of countryOptions; track c.code) {
            <option [value]="c.code">{{ c.label }}</option>
          }
        </select>
        <select class="select" aria-label="按阶段筛选" [ngModel]="stage()" (ngModelChange)="stage.set($event)">
          <option value="all">全部阶段</option>
          @for (s of stageOptions; track s.key) {
            <option [value]="s.key">{{ s.label }}</option>
          }
        </select>
        <button type="button" class="chip" [disabled]="!hasFilters()" (click)="clearFilters()">
          <ui-icon name="refresh" [size]="12" />清空筛选
        </button>
        <span class="small muted" style="margin-left: auto">
          筛选结果 <span class="mono">{{ filtered().length }}</span> / {{ total() }} 个项目
        </span>
      </div>

      @if (total() === 0) {
        <ui-empty title="尚无投标项目" hint="创建第一个项目后，系统会按大储模板加载参数字典与对比维度。" actionLabel="新建项目" (action)="openNew()" />
      } @else if (filtered().length === 0) {
        <ui-empty
          title="没有匹配的项目"
          [hint]="'当前国别、阶段或搜索词组合下没有项目。清空筛选后可查看全部 ' + total() + ' 个项目。'"
          actionLabel="清空筛选"
          (action)="clearFilters()"
        />
      } @else if (view() === 'card') {
        <div class="grid grid--3" style="margin-top: 16px">
          @for (p of filtered(); track p.id) {
            <article class="card project">
              <div class="card-hd">
                <div class="stack stack--tight">
                  <a class="card-title" [routerLink]="['/projects', p.id, 'overview']">{{ p.name }}</a>
                  <span class="card-sub truncate">{{ p.customer }}</span>
                </div>
                <ui-badge [label]="countryLabel(p.country)" tone="neutral" icon="folder" />
              </div>
              <div class="card-bd project__bd">
                <dl class="kv">
                  <dt>规模</dt>
                  <dd class="mono">{{ p.mw }} MW / {{ p.mwh }} MWh</dd>
                  <dt>技术路线</dt>
                  <dd>{{ p.route }}</dd>
                  <dt>阶段</dt>
                  <dd class="row row--wrap">
                    <ui-badge [label]="stageLabel(p.stage)" [tone]="stageTone(p.stage)" />
                    <span class="small muted mono">{{ gatesDone(p) }}/5 门禁</span>
                  </dd>
                  <dt>截止</dt>
                  <dd class="row row--wrap">
                    <ui-badge [label]="deadline(p.deadline)" [tone]="dtone(p.deadline)" icon="clock" />
                    <span class="small muted mono">{{ fmtDate(p.deadline) }}</span>
                  </dd>
                </dl>
                <div class="project__gates" role="list" [attr.aria-label]="p.name + ' 五阶段门禁'">
                  @for (g of p.gates; track g.key) {
                    <span
                      class="gate"
                      role="listitem"
                      [class]="'gate--' + g.state"
                      [attr.title]="g.label + ' · ' + gateStateText(g.state) + (g.note ? '：' + g.note : '')"
                    >
                      {{ g.label }}
                    </span>
                  }
                </div>
                <div class="project__progress">
                  <div class="row row--between small muted">
                    <span>资料完整性</span>
                    <span class="mono">{{ p.completeness }}%</span>
                  </div>
                  <ui-progress [value]="p.completeness" [tone]="completenessTone(p.completeness)" [showValue]="false" />
                </div>
              </div>
              <div class="card-ft">
                <span class="row" style="gap: 6px">
                  <ui-icon name="user" [size]="12" />{{ p.members.length }} 名成员 · 风险
                  <span class="mono" [class.text-danger]="highRisk(p.id) > 0">{{ riskCount(p.id) }}</span>
                </span>
                <a [routerLink]="['/projects', p.id, 'overview']" class="small">进入概览</a>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="table-wrap" style="margin-top: 16px">
          <table class="table">
            <thead>
              <tr>
                <th [attr.aria-sort]="ariaSort('name')">
                  <button type="button" class="table__sort" (click)="sortBy('name')">
                    名称 <ui-icon [name]="sortIcon('name')" [size]="12" />
                  </button>
                </th>
                <th [attr.aria-sort]="ariaSort('country')">
                  <button type="button" class="table__sort" (click)="sortBy('country')">
                    国别 <ui-icon [name]="sortIcon('country')" [size]="12" />
                  </button>
                </th>
                <th class="num" [attr.aria-sort]="ariaSort('scale')">
                  <button type="button" class="table__sort" (click)="sortBy('scale')">
                    规模 MW / MWh <ui-icon [name]="sortIcon('scale')" [size]="12" />
                  </button>
                </th>
                <th [attr.aria-sort]="ariaSort('deadline')">
                  <button type="button" class="table__sort" (click)="sortBy('deadline')">
                    截止 <ui-icon [name]="sortIcon('deadline')" [size]="12" />
                  </button>
                </th>
                <th style="width: 170px" [attr.aria-sort]="ariaSort('completeness')">
                  <button type="button" class="table__sort" (click)="sortBy('completeness')">
                    完整性 <ui-icon [name]="sortIcon('completeness')" [size]="12" />
                  </button>
                </th>
                <th class="num" [attr.aria-sort]="ariaSort('risks')">
                  <button type="button" class="table__sort" (click)="sortBy('risks')">
                    风险数 <ui-icon [name]="sortIcon('risks')" [size]="12" />
                  </button>
                </th>
                <th style="width: 128px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (p of rows(); track p.id) {
                <tr
                  class="row-link"
                  tabindex="0"
                  [attr.aria-label]="'打开项目概览：' + p.name"
                  (click)="open(p.id)"
                  (keydown.enter)="open(p.id)"
                >
                  <td>
                    <div class="stack stack--tight">
                      <a class="card-title" [routerLink]="['/projects', p.id, 'overview']">{{ p.name }}</a>
                      <span class="small muted truncate">{{ p.customer }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="tag">{{ countryLabel(p.country) }}</span>
                  </td>
                  <td class="num">{{ p.mw }} / {{ p.mwh }}</td>
                  <td>
                    <div class="row row--wrap">
                      <ui-badge [label]="deadline(p.deadline)" [tone]="dtone(p.deadline)" icon="clock" />
                      <span class="small muted mono">{{ fmtDate(p.deadline) }}</span>
                    </div>
                  </td>
                  <td>
                    <ui-progress [value]="p.completeness" [tone]="completenessTone(p.completeness)" />
                  </td>
                  <td class="num">
                    <span [class.text-danger]="highRisk(p.id) > 0" [attr.title]="'高风险 ' + highRisk(p.id) + ' 项'">
                      {{ riskCount(p.id) }}
                    </span>
                  </td>
                  <td>
                    <div class="row row--wrap">
                      <ui-badge [label]="stageLabel(p.stage)" [tone]="stageTone(p.stage)" />
                      <a [routerLink]="['/projects', p.id, 'overview']" class="small">概览</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="small muted" style="margin-top: 8px">
          点击任意行进入项目概览；表头可排序（截止日升序为最紧急在前）。共 {{ rows().length }} 行。
        </p>
      }
    </div>

    <ui-modal [open]="showNew()" title="新建投标项目" [hasFooter]="true" (close)="showNew.set(false)">
      <div class="stack">
        <div class="grid grid--2">
          <div class="field">
            <label for="np-name">项目名称 *</label>
            <input
              id="np-name"
              class="input"
              placeholder="例如 CZ-Brno 80MWh 独立储能"
              [(ngModel)]="form.name"
              [class.input--error]="errors()['name']"
            />
            @if (errors()['name']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['name'] }}</span>
            }
          </div>
          <div class="field">
            <label for="np-customer">客户名称 *</label>
            <input
              id="np-customer"
              class="input"
              placeholder="业主或 EPC 名称"
              [(ngModel)]="form.customer"
              [class.input--error]="errors()['customer']"
            />
            @if (errors()['customer']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['customer'] }}</span>
            }
          </div>
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="np-country">目标国别 *</label>
            <select id="np-country" class="select" [(ngModel)]="form.country">
              @for (c of countryOptions; track c.code) {
                <option [value]="c.code">{{ c.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="np-deadline">投标截止日 *</label>
            <input
              id="np-deadline"
              type="date"
              class="input"
              [attr.min]="minDeadline"
              [(ngModel)]="form.deadline"
              [class.input--error]="errors()['deadline']"
            />
            @if (errors()['deadline']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['deadline'] }}</span>
            }
          </div>
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="np-mw">功率（MW）*</label>
            <input id="np-mw" type="number" min="1" class="input" [(ngModel)]="form.mw" [class.input--error]="errors()['mw']" />
            @if (errors()['mw']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['mw'] }}</span>
            }
          </div>
          <div class="field">
            <label for="np-mwh">能量（MWh）*</label>
            <input id="np-mwh" type="number" min="1" class="input" [(ngModel)]="form.mwh" [class.input--error]="errors()['mwh']" />
            @if (errors()['mwh']) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['mwh'] }}</span>
            }
          </div>
        </div>
        <div class="banner banner--info">
          <ui-icon name="info" [size]="16" />
          <span>
            创建后按大储模板加载 48 项参数字典与 6 个对比维度；储能时长
            {{ durationHint() }}。演示环境不落库，刷新后恢复 3 个初始项目。
          </span>
        </div>
      </div>
      <div modal-footer>
        <ui-btn variant="secondary" (click)="showNew.set(false)">取消</ui-btn>
        <ui-btn variant="primary" icon="check" (click)="submitNew()">创建项目</ui-btn>
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
      .row-link {
        cursor: pointer;
      }
      .row-link:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
    `,
  ],
})
export class Projects {
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly minDeadline = MIN_DEADLINE;

  readonly view = signal<'card' | 'table'>('card');
  readonly q = signal('');
  readonly country = signal<string>('all');
  readonly stage = signal<string>('all');
  readonly sortKey = signal<SortKey>('deadline');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly showNew = signal(false);
  readonly errors = signal<Record<string, string>>({});
  form = {
    name: '',
    customer: '',
    country: 'CZ' as Country,
    mw: null as number | null,
    mwh: null as number | null,
    deadline: '',
  };

  readonly countryOptions = Object.entries(COUNTRY_LABEL).map(([code, label]) => ({ code, label }));
  readonly stageOptions = (['intake', 'extraction', 'standardization', 'comparison', 'insight', 'published'] as const).map(
    (key) => ({ key, label: STAGE_LABEL[key] }),
  );

  readonly total = computed(() => this.store.projects().length);
  readonly activeCount = computed(() => this.store.projects().filter((p) => p.stage !== 'published').length);
  readonly countryCount = computed(() => new Set(this.store.projects().map((p) => p.country)).size);

  readonly riskCounts = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const r of this.store.allRisks()) {
      if (r.state === 'closed') continue;
      map[r.projectId] = (map[r.projectId] ?? 0) + 1;
    }
    return map;
  });

  readonly highRiskCounts = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const r of this.store.allRisks()) {
      if (r.state === 'closed' || r.level !== 'high') continue;
      map[r.projectId] = (map[r.projectId] ?? 0) + 1;
    }
    return map;
  });

  readonly highRiskTotal = computed(() => this.store.allRisks().filter((r) => r.level === 'high' && r.state !== 'closed').length);

  readonly hasFilters = computed(() => this.q().trim() !== '' || this.country() !== 'all' || this.stage() !== 'all');

  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const country = this.country();
    const stage = this.stage();
    return this.store.projects().filter((p) => {
      if (country !== 'all' && p.country !== country) return false;
      if (stage !== 'all' && p.stage !== stage) return false;
      if (q && !(p.name.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q))) return false;
      return true;
    });
  });

  readonly rows = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const list = [...this.filtered()];
    list.sort((a, b) => {
      let diff = 0;
      switch (key) {
        case 'name':
          diff = a.name.localeCompare(b.name, 'zh-Hans-CN');
          break;
        case 'country':
          diff = COUNTRY_LABEL[a.country].localeCompare(COUNTRY_LABEL[b.country], 'zh-Hans-CN');
          break;
        case 'scale':
          diff = a.mwh - b.mwh;
          break;
        case 'deadline':
          diff = a.deadline.localeCompare(b.deadline);
          break;
        case 'completeness':
          diff = a.completeness - b.completeness;
          break;
        case 'risks':
          diff = this.riskCount(a.id) - this.riskCount(b.id);
          break;
        default:
          diff = 0;
          break;
      }
      return diff * dir;
    });
    return list;
  });

  readonly durationHint = (): string => {
    const mw = this.form.mw ?? 0;
    const mwh = this.form.mwh ?? 0;
    if (!mw || !mwh) return '未填写，暂不计算';
    const hours = mwh / mw;
    return `${hours.toFixed(1)} 小时（MWh ÷ MW）`;
  };

  countryLabel(code: Country): string {
    return COUNTRY_LABEL[code];
  }

  stageLabel(stage: Project['stage']): string {
    return STAGE_LABEL[stage];
  }

  stageTone(stage: Project['stage']): Tone {
    return STAGE_TONE[stage];
  }

  gateStateText(state: Project['gates'][number]['state']): string {
    if (state === 'done') return '已完成';
    if (state === 'active') return '进行中';
    if (state === 'blocked') return '阻塞';
    return '未开始';
  }

  gatesDone(p: Project): number {
    return p.gates.filter((g) => g.state === 'done').length;
  }

  completenessTone(v: number): Tone {
    if (v >= 85) return 'ok';
    if (v >= 60) return 'warn';
    return 'danger';
  }

  deadline(iso: string): string {
    return deadlineText(iso);
  }

  dtone(iso: string): Tone {
    return deadlineTone(iso);
  }

  fmtDate(iso: string): string {
    return formatIsoDate(iso);
  }

  riskCount(id: string): number {
    return this.riskCounts()[id] ?? 0;
  }

  highRisk(id: string): number {
    return this.highRiskCounts()[id] ?? 0;
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
      return;
    }
    this.sortKey.set(key);
    this.sortDir.set('asc');
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return 'minus';
    return this.sortDir() === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  clearFilters(): void {
    this.q.set('');
    this.country.set('all');
    this.stage.set('all');
  }

  open(id: string): void {
    this.router.navigate(['/projects', id, 'overview']);
  }

  openNew(): void {
    this.errors.set({});
    this.showNew.set(true);
  }

  submitNew(): void {
    const e: Record<string, string> = {};
    const name = this.form.name.trim();
    const customer = this.form.customer.trim();
    if (!name) e['name'] = '请输入项目名称';
    else if (name.length < 4) e['name'] = '项目名称至少 4 个字符，建议包含国别与规模';
    if (!customer) e['customer'] = '请输入客户名称';
    if (!this.form.deadline) e['deadline'] = '请选择投标截止日';
    else if (this.form.deadline < MIN_DEADLINE) e['deadline'] = `截止日不得早于 ${MIN_DEADLINE}`;
    if (this.form.mw === null || this.form.mw === undefined) e['mw'] = '请输入功率';
    else if (this.form.mw <= 0) e['mw'] = '功率需大于 0';
    if (this.form.mwh === null || this.form.mwh === undefined) e['mwh'] = '请输入能量';
    else if (this.form.mwh <= 0) e['mwh'] = '能量需大于 0';
    else if (this.form.mw && this.form.mwh / this.form.mw > 8) e['mwh'] = '能量/功率比不应超过 8 小时';
    this.errors.set(e);
    if (Object.keys(e).length > 0) {
      this.toast.push('表单校验未通过', 'danger', `共 ${Object.keys(e).length} 处需修正，请检查标红字段`);
      return;
    }
    this.store.pushAudit(
      'upload',
      `创建项目 ${name}`,
      `${COUNTRY_LABEL[this.form.country]} · ${this.form.mw}MW/${this.form.mwh}MWh · 截止 ${this.form.deadline}`,
    );
    this.showNew.set(false);
    this.toast.push('项目已创建', 'ok', `${name} 已写入审计日志，演示环境不落库`);
    this.resetForm();
  }

  private resetForm(): void {
    this.errors.set({});
    this.form = { name: '', customer: '', country: 'CZ', mw: null, mwh: null, deadline: '' };
  }
}
