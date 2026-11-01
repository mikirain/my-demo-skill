import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Bars, BarDatum } from '../../shared/ui/bars';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Ring } from '../../shared/ui/ring';
import {
  AUDIT_ACTION_LABEL,
  COUNTRY_LABEL,
  JUDGE_META,
  RISK_LABEL,
  RISK_TONE,
  ROLE_LABEL,
  deadlineText,
  deadlineTone,
  fmtDate,
  fmtDateTime,
} from '../../core/format';
import { AuditAction, Country, DocType, Gate, JudgeStatus, Project, RiskItem, RiskLevel, Tone } from '../../core/types';

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

const GATE_STATE_LABEL: Record<Gate['state'], string> = {
  done: '已完成',
  active: '进行中',
  todo: '未开始',
  blocked: '阻塞',
};

const GATE_STATE_ICON: Record<Gate['state'], string> = {
  done: 'check',
  active: 'clock',
  todo: 'minus',
  blocked: 'lock',
};

const RISK_STATE_LABEL: Record<RiskItem['state'], string> = {
  open: '待处理',
  mitigating: '处置中',
  closed: '已关闭',
};

const LEVEL_ORDER: Record<RiskLevel, number> = { high: 1, mid: 2, low: 3 };

interface RequiredDoc {
  type: DocType;
  label: string;
  badge: string;
  detail: string;
  tone: Tone;
}

const REQUIRED_DOCS: RequiredDoc[] = [
  {
    type: 'tender',
    label: '招标文件（技术规范书）',
    badge: '阻断',
    detail: '强制条款与参数基线均来自招标正文，缺失时无法开展抽取与对比。',
    tone: 'danger',
  },
  {
    type: 'competitorBid',
    label: '竞对标书（应答文件）',
    badge: '阻断',
    detail: '缺少竞对应答文件，横向对比无来源可依，判定只能标为未披露。',
    tone: 'danger',
  },
  {
    type: 'competitorManual',
    label: '竞对手册（公开技术资料）',
    badge: '影响',
    detail: '无手册时，标书中未披露的参数无法交叉验证，安全与噪声维度说服力弱。',
    tone: 'warn',
  },
  {
    type: 'ourProduct',
    label: '我方产品与测试资料',
    badge: '影响',
    detail: '缺少我方资料将无法生成「我方」列的标准化值与证据引用。',
    tone: 'warn',
  },
  {
    type: 'awardNotice',
    label: '中标公示 / 历史结果',
    badge: '建议',
    detail: '缺少历史结果，胜率与报价策略推断不可用，仅影响研判结论的丰富度。',
    tone: 'neutral',
  },
];

const DOC_LINES: { type: DocType; label: string }[] = [
  { type: 'tender', label: '招标文件' },
  { type: 'competitorBid', label: '竞对标书' },
  { type: 'competitorManual', label: '竞对手册' },
  { type: 'awardNotice', label: '中标公示' },
  { type: 'ourProduct', label: '我方资料' },
  { type: 'other', label: '其他' },
];

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Bars, Btn, Empty, Icon, Ring],
  template: `
    <div class="page">
      @if (missingId()) {
        <ui-empty
          title="项目不存在"
          [hint]="'未找到编号为 ' + missingId() + ' 的项目，可能已被删除或链接有误。'"
          actionLabel="返回项目列表"
          (action)="backToList()"
        />
      } @else {
        @if (project(); as p) {
          <header class="page-head">
            <div class="page-head__main">
              <div class="row row--wrap">
                <h1 class="page-title">{{ p.name }}</h1>
                <ui-badge [label]="stageLabel(p.stage)" [tone]="stageTone(p.stage)" icon="folder" />
              </div>
              <p class="page-sub">
                {{ p.customer }} · {{ country(p.country) }} · {{ p.mw }} MW / {{ p.mwh }} MWh · {{ p.route }}
              </p>
              <div class="row row--wrap" style="margin-top: 6px">
                <ui-badge [label]="deadline(p.deadline)" [tone]="deadlineToneOf(p.deadline)" icon="clock" />
                <span class="small muted mono">截止 {{ formatDate(p.deadline) }}</span>
                <span class="small muted">项目编号 <span class="mono">{{ p.id }}</span></span>
              </div>
            </div>
            <div class="page-actions">
              <ui-btn variant="secondary" icon="file" (click)="go('documents')">资料管理</ui-btn>
              <ui-btn variant="secondary" icon="check-square" [disabled]="blocked()" (click)="submitReview()">提交审核</ui-btn>
              <ui-btn variant="primary" icon="table" (click)="go('parameters')">进入参数矩阵</ui-btn>
            </div>
          </header>

          @if (tenderMissing()) {
            <div class="banner banner--danger section" role="alert">
              <ui-icon name="alert" [size]="16" />
              <div class="stack stack--tight">
                <span class="strong">缺少招标文件，分析链路无法启动</span>
                <span>
                  本项目尚未上传招标正文（技术规范书）。强制条款、参数基线与判定结论都缺少来源依据，报告发布被阻断。请先在资料管理上传招标文件，再回到本页推进门禁。
                </span>
              </div>
            </div>
          }

          @if (blocked()) {
            <div class="banner banner--warn section" role="alert">
              <ui-icon name="lock" [size]="16" />
              <div class="stack stack--tight">
                <span class="strong">发布门禁未通过：结论可查看，但不可提交审核与导出报告</span>
                <span>系统拦截原因为「存在未裁决冲突」或「高风险审核未通过」，逐条处置后自动解除：</span>
                <ul class="blockers">
                  @for (reason of blockReasons(); track reason) {
                    <li>{{ reason }}</li>
                  }
                  @if (blockReasons().length === 0) {
                    <li>未返回具体阻断项，请到参数矩阵与审核待办核对。</li>
                  }
                </ul>
              </div>
            </div>
          }

          <section class="section">
            <div class="section-head">
              <h2 class="section-title">分析门禁</h2>
              <span class="section-hint">摄取 → 抽取 → 校验 → 对比 → 研判，五阶段顺序推进，状态以图标与文字双重编码</span>
            </div>
            <div class="gates">
              @for (g of p.gates; track g.key) {
                <div class="gate-step" [class]="'gate-step--' + g.state" [attr.title]="g.note ?? g.label + '：' + gateStateLabel(g.state)">
                  <div class="row" style="gap: 6px">
                    <ui-icon [name]="gateIcon(g.state)" [size]="14" />
                    <span class="gate-step__label">{{ g.label }}</span>
                  </div>
                  <span class="gate-step__state">{{ gateStateLabel(g.state) }}</span>
                  @if (g.note) {
                    <span class="gate-step__note">{{ g.note }}</span>
                  } @else {
                    <span class="gate-step__note muted">无阻塞记录</span>
                  }
                </div>
              }
            </div>
          </section>

          <div class="grid grid--sidebar section">
            <div class="stack stack--loose">
              <div class="grid grid--2">
                <section class="card">
                  <div class="card-hd">
                    <h2 class="card-title">资料完整性</h2>
                    <a [routerLink]="['/projects', p.id, 'documents']" class="small">管理资料</a>
                  </div>
                  <div class="card-bd stack">
                    <div class="row" style="gap: 16px; align-items: center">
                      <ui-ring [value]="p.completeness" [size]="96" label="完整性" />
                      <div class="stack stack--tight" style="flex: 1; min-width: 0">
                        <span class="small">已上传 <span class="mono">{{ docs().length }}</span> 份资料 · 解析异常 <span class="mono">{{ issueDocs().length }}</span> 份</span>
                        <span class="small muted">缺项按文档类型判定，五类关键资料缺一即计入清单。</span>
                        <div class="row row--wrap">
                          @for (d of docLines(); track d.label) {
                            <span class="tag" [class.text-danger]="d.count === 0">
                              {{ d.label }} <span class="mono">{{ d.count }}</span>
                            </span>
                          }
                        </div>
                      </div>
                    </div>

                    @if (missingItems().length === 0) {
                      <p class="small row text-ok"><ui-icon name="check" [size]="14" />五类关键资料齐备，可推进到对比阶段。</p>
                    } @else {
                      <div class="stack stack--tight">
                        <span class="label">缺项清单（{{ missingItems().length }}）</span>
                        <ul class="miss">
                          @for (m of missingItems(); track m.label) {
                            <li class="miss__item">
                              <ui-badge [label]="m.badge" [tone]="m.tone" [icon]="m.tone === 'danger' ? 'alert' : 'info'" />
                              <div class="stack" style="gap: 2px">
                                <span class="small strong">{{ m.label }}</span>
                                <span class="small muted">{{ m.detail }}</span>
                              </div>
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    @if (issueDocs().length > 0) {
                      <div class="banner banner--warn">
                        <ui-icon name="alert" [size]="16" />
                        <span>{{ issueDocs().length }} 份资料处于解析中/需核对/失败：{{ issueNames() }}。未完成的解析不会进入参数矩阵。</span>
                      </div>
                    }
                  </div>
                </section>

                <section class="card">
                  <div class="card-hd">
                    <h2 class="card-title">判定分布</h2>
                    <span class="card-sub">共 <span class="mono">{{ judgeTotal() }}</span> 条判定</span>
                  </div>
                  <div class="card-bd stack">
                    <ui-bars [data]="judgeBars()" unit=" 项" />
                    <div class="drill">
                      @for (j of judgeRows(); track j.status) {
                        <button
                          type="button"
                          class="chip"
                          [attr.aria-label]="'查看' + j.label + '判定的对比明细'"
                          (click)="openJudge(j.status)"
                        >
                          <ui-icon [name]="j.icon" [size]="12" />{{ j.label }}<span class="chip__count">{{ j.count }}</span>
                        </button>
                      }
                    </div>
                    <p class="small muted">
                      点击任一状态跳转对比分析并按该判定筛选；「无法直接比较」与「未披露」不参与维度得分，斜纹表示不可比。
                    </p>
                  </div>
                </section>
              </div>

              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">风险摘要</h2>
                  <a [routerLink]="['/projects', p.id, 'insights']" class="small">研判与风险清单</a>
                </div>
                <div class="card-bd">
                  <ui-bars [data]="riskBars()" unit=" 项" />
                  <p class="small muted" style="margin-top: 8px">
                    未关闭 <span class="mono">{{ openRiskCount() }}</span> 项 · 已关闭 <span class="mono">{{ closedRiskCount() }}</span> 项 ·
                    高等级风险须在提交审核前完成处置并留痕。
                  </p>
                  <div class="risk-list">
                    @for (r of topRisks(); track r.id) {
                      <div class="risk-list__item">
                        <div class="row row--between row--wrap">
                          <ui-badge [label]="levelLabel(r.level)" [tone]="riskTone(r.level)" icon="alert" />
                          <span class="small muted">{{ r.kind }} · 责任人 <span class="strong">{{ r.owner }}</span></span>
                        </div>
                        <p class="small">{{ r.text }}</p>
                        <p class="small muted">处置建议：{{ r.suggestion }}</p>
                        <div class="row row--wrap">
                          <span class="tag">{{ riskState(r.state) }}</span>
                          <span class="small muted mono">{{ r.relatedKeys.join(' · ') }}</span>
                        </div>
                      </div>
                    } @empty {
                      <p class="small muted">本项目暂未记录风险项，可在研判页发起新一轮分析。</p>
                    }
                  </div>
                </div>
              </section>
            </div>

            <div class="stack stack--loose">
              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">项目档案</h2>
                  <ui-badge [label]="stageLabel(p.stage)" [tone]="stageTone(p.stage)" />
                </div>
                <div class="card-bd">
                  <dl class="kv">
                    <dt>客户</dt>
                    <dd>{{ p.customer }}</dd>
                    <dt>国别</dt>
                    <dd>{{ country(p.country) }}</dd>
                    <dt>规模</dt>
                    <dd class="mono">{{ p.mw }} MW / {{ p.mwh }} MWh</dd>
                    <dt>储能时长</dt>
                    <dd class="mono">{{ duration(p) }}</dd>
                    <dt>技术路线</dt>
                    <dd>{{ p.route }}</dd>
                    <dt>截止日</dt>
                    <dd class="mono">{{ formatDate(p.deadline) }}</dd>
                    <dt>参数</dt>
                    <dd class="mono">{{ paramTotal() }} 项 · 待复核 {{ paramPending() }}</dd>
                    <dt>成员</dt>
                    <dd>{{ p.members.length }} 人</dd>
                  </dl>
                </div>
                <div class="card-ft">
                  <span>演示数据 · 2026-10-24</span>
                  <a [routerLink]="['/projects', p.id, 'reports']" class="small">报告中心</a>
                </div>
              </section>

              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">项目成员</h2>
                  <span class="card-sub"><span class="mono">{{ members().length }}</span> 人</span>
                </div>
                <div class="card-bd card-bd--flush">
                  <ul class="members">
                    @for (m of members(); track m.id) {
                      <li class="members__item">
                        <span class="initials" aria-hidden="true">{{ m.initials }}</span>
                        <div class="stack" style="gap: 2px; flex: 1; min-width: 0">
                          <span class="small strong">{{ m.name }}</span>
                          <span class="small muted">{{ m.role }}</span>
                        </div>
                        <span class="small muted mono" [attr.title]="'最近活动 ' + m.lastActive">{{ m.lastActive }}</span>
                      </li>
                    } @empty {
                      <li class="members__item small muted">尚未添加项目成员。</li>
                    }
                  </ul>
                </div>
              </section>

              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">最近变更</h2>
                  <span class="card-sub">全项目最近活动</span>
                </div>
                <div class="card-bd">
                  <div class="timeline">
                    @for (e of activities(); track e.id) {
                      <div class="timeline__item">
                        <span class="timeline__dot" [class.dot--danger]="e.result === 'denied'"></span>
                        <div>
                          <p class="timeline__body">
                            <strong>{{ e.actor }}</strong> {{ actionLabel(e.action) }} · {{ e.target }}
                            @if (e.result === 'denied') {
                              <ui-badge label="已拒绝" tone="danger" icon="lock" />
                            }
                          </p>
                          <p class="timeline__meta mono">{{ formatTime(e.at) }}{{ e.detail ? ' · ' + e.detail : '' }}</p>
                        </div>
                      </div>
                    } @empty {
                      <p class="small muted">暂无审计事件。</p>
                    }
                  </div>
                  <p class="small muted" style="margin-top: 8px">
                    审计事件未按项目归档，此处展示全部项目的最新 5 条记录；完整日志见系统管理。
                  </p>
                </div>
              </section>
            </div>
          </div>
        } @else {
          <ui-empty
            title="项目数据未能加载"
            hint="演示数据为本地 Mock，可刷新页面重试；若仍失败请返回项目列表重新进入。"
            actionLabel="返回项目列表"
            (action)="backToList()"
          />
        }
      }
    </div>
  `,
  styles: [
    `
      .blockers {
        margin: 0;
        padding-left: 18px;
        font-size: 12px;
        color: var(--ink-2);
        line-height: 1.8;
      }
      .gates {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
      }
      .gate-step {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 14px;
        background: var(--surface);
        min-height: 84px;
      }
      .gate-step__label {
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
      }
      .gate-step__state {
        font-size: 12px;
        color: var(--ink-3);
      }
      .gate-step__note {
        font-size: 11px;
        color: var(--ink-3);
        line-height: 1.5;
      }
      .gate-step--done {
        border-top: 2px solid var(--ok);
      }
      .gate-step--done .gate-step__state {
        color: var(--ok);
      }
      .gate-step--active {
        border-top: 2px solid var(--accent);
        background: var(--accent-weak);
      }
      .gate-step--active .gate-step__state {
        color: var(--accent);
      }
      .gate-step--todo {
        border-top: 2px dashed var(--line-strong);
        background: var(--bg-subtle);
      }
      .gate-step--blocked {
        border-top: 2px solid var(--danger);
        background: #fdf4f3;
      }
      .gate-step--blocked .gate-step__state,
      .gate-step--blocked .gate-step__note {
        color: var(--danger);
      }
      .miss {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .miss__item {
        display: grid;
        grid-template-columns: 62px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        padding-bottom: 8px;
        border-bottom: 1px dashed var(--line);
      }
      .miss__item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .drill {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }
      .risk-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-top: 12px;
        border-top: 1px solid var(--line);
      }
      .risk-list__item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
      }
      .risk-list__item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .members {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .members__item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .members__item:last-child {
        border-bottom: none;
      }
      .initials {
        width: 30px;
        height: 30px;
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--ink);
        color: #fff;
        font-size: 12px;
      }
      @media (max-width: 1024px) {
        .gates {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class Overview implements OnInit {
  private readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly project = this.store.activeProject;
  readonly missingId = signal<string | null>(null);

  readonly docs = computed(() => this.store.documents());
  readonly issueDocs = computed(() =>
    this.store.documents().filter((d) => d.parseStatus === 'review' || d.parseStatus === 'failed' || d.parseStatus === 'parsing'),
  );
  readonly issueNames = computed(() =>
    this.issueDocs()
      .slice(0, 2)
      .map((d) => d.name)
      .join('、'),
  );

  readonly tenderMissing = computed(() => !this.store.documents().some((d) => d.type === 'tender'));
  readonly blocked = this.store.publicationBlocked;
  readonly blockReasons = this.store.publicationBlockReasons;

  readonly docLines = computed(() =>
    DOC_LINES.map((line) => ({
      label: line.label,
      count: this.store.documents().filter((d) => d.type === line.type).length,
    })),
  );

  readonly missingItems = computed(() =>
    REQUIRED_DOCS.filter((req) => !this.store.documents().some((d) => d.type === req.type)).map((req) => ({
      label: req.label,
      badge: req.badge,
      detail: req.detail,
      tone: req.tone,
    })),
  );

  readonly judgeRows = computed(() =>
    this.store.judgeStats().map((stat) => ({
      status: stat.status,
      count: stat.count,
      label: JUDGE_META[stat.status].label,
      tone: JUDGE_META[stat.status].tone,
      icon: JUDGE_META[stat.status].icon,
    })),
  );

  readonly judgeBars = computed<BarDatum[]>(() =>
    this.judgeRows().map((row) => ({ label: row.label, value: row.count, tone: row.tone })),
  );

  readonly judgeTotal = computed(() => this.store.judgeStats().reduce((sum, stat) => sum + stat.count, 0));

  readonly riskBars = computed<BarDatum[]>(() =>
    (['high', 'mid', 'low'] as const).map((level) => ({
      label: RISK_LABEL[level] + '风险',
      value: this.store.risks().filter((r) => r.level === level && r.state !== 'closed').length,
      tone: RISK_TONE[level],
    })),
  );

  readonly topRisks = computed(() =>
    [...this.store.risks()]
      .filter((r) => r.state !== 'closed')
      .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
      .slice(0, 4),
  );

  readonly openRiskCount = computed(() => this.store.risks().filter((r) => r.state !== 'closed').length);
  readonly closedRiskCount = computed(() => this.store.risks().filter((r) => r.state === 'closed').length);

  readonly paramTotal = computed(() => this.store.paramStats().total);
  readonly paramPending = computed(() => this.store.paramStats().pending);

  readonly members = computed(() => {
    const users = this.store.users();
    return (this.project()?.members ?? []).map((member) => {
      const user = users.find((u) => u.id === member.userId);
      return {
        id: member.userId,
        name: user?.name ?? member.userId,
        initials: user?.initials ?? member.userId.slice(-2),
        role: ROLE_LABEL[member.role],
        lastActive: fmtDateTime(member.lastActive),
      };
    });
  });

  readonly activities = computed(() => this.store.auditEvents().slice(0, 5));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.store.setActiveProject(id);
    const exists = this.store.projects().some((p) => p.id === id);
    this.missingId.set(exists ? null : id);
  }

  country(code: Country): string {
    return COUNTRY_LABEL[code];
  }

  stageLabel(stage: Project['stage']): string {
    return STAGE_LABEL[stage];
  }

  stageTone(stage: Project['stage']): Tone {
    return STAGE_TONE[stage];
  }

  gateStateLabel(state: Gate['state']): string {
    return GATE_STATE_LABEL[state];
  }

  gateIcon(state: Gate['state']): string {
    return GATE_STATE_ICON[state];
  }

  deadline(iso: string): string {
    return deadlineText(iso);
  }

  deadlineToneOf(iso: string): Tone {
    return deadlineTone(iso);
  }

  formatDate(iso: string): string {
    return fmtDate(iso);
  }

  formatTime(iso: string): string {
    return fmtDateTime(iso);
  }

  actionLabel(action: AuditAction): string {
    return AUDIT_ACTION_LABEL[action];
  }

  levelLabel(level: RiskLevel): string {
    return RISK_LABEL[level] + '风险';
  }

  riskTone(level: RiskLevel): Tone {
    return RISK_TONE[level];
  }

  riskState(state: RiskItem['state']): string {
    return RISK_STATE_LABEL[state];
  }

  duration(p: Project): string {
    if (!p.mw) return '—';
    return `${(p.mwh / p.mw).toFixed(1)} 小时`;
  }

  openJudge(status: JudgeStatus): void {
    this.router.navigate(['/projects', this.store.activeProjectId(), 'comparison'], { queryParams: { status } });
  }

  go(page: 'parameters' | 'documents' | 'comparison' | 'insights'): void {
    this.router.navigate(['/projects', this.store.activeProjectId(), page]);
  }

  submitReview(): void {
    if (this.blocked()) return;
    this.router.navigate(['/projects', this.store.activeProjectId(), 'reviews']);
  }

  backToList(): void {
    this.router.navigate(['/projects']);
  }
}
