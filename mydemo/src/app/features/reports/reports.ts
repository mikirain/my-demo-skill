import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { downloadCsv, downloadText } from '../../core/download';
import { DEMO_TODAY, DIMENSION_LABEL, JUDGE_LABEL, JUDGE_META, fmtDateTime } from '../../core/format';
import { ComparisonRow, JudgeStatus, ReportSnapshot, Tone } from '../../core/types';
import { REPORT_SNAPSHOTS, REPORT_TEMPLATES } from '../../core/mock/reviews';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Btn, Empty, Icon, Modal],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">报告中心</h1>
          <p class="page-sub">
            {{ projectName() }} · {{ templates.length }} 个模板 · 已发布快照 {{ snapshots().length }} 个 ·
            {{ blocked() ? '发布门禁未通过' : '发布门禁已通过' }}
          </p>
        </div>
        <div class="page-actions">
          <ui-btn variant="secondary" icon="doc" [disabled]="blocked()" (click)="exportBrief()">导出文本简报</ui-btn>
          <ui-btn variant="primary" icon="download" [disabled]="blocked()" (click)="exportCsv()">导出 CSV</ui-btn>
        </div>
      </header>

      @if (blocked()) {
        <div class="banner banner--danger section">
          <ui-icon name="alert" [size]="16" />
          <div class="stack stack--tight">
            <span>发布门禁未通过：报告导出与发布已禁用，需先关闭以下阻断项。</span>
            <ul class="gate-list">
              @for (reason of blockReasons(); track reason) {
                <li>
                  {{ reason }} ·
                  <a [routerLink]="['/projects', activeId(), 'parameters']">去参数矩阵</a>
                  <span class="muted"> / </span>
                  <a [routerLink]="['/projects', activeId(), 'reviews']">去审核待办</a>
                </li>
              }
            </ul>
          </div>
        </div>
      } @else {
        <div class="banner banner--info section">
          <ui-icon name="info" [size]="16" /><span>发布门禁已通过：参数冲突已裁决、高风险审核已完成。导出将写入审计日志，报告带水印与证据角标。</span>
        </div>
      }

      <div class="split">
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">报告模板</h2>
            <span class="section-hint">按受众选择</span>
          </div>
          <div class="stack stack--tight">
            @for (t of templates; track t.id) {
              <button type="button" class="tpl" [class.tpl--active]="t.id === selectedId()" [attr.aria-pressed]="t.id === selectedId()"
                (click)="selectedId.set(t.id)">
                <span class="tpl__top"><ui-icon [name]="t.icon" [size]="16" /><span class="tpl__name">{{ t.name }}</span></span>
                <span class="tpl__aud">{{ t.audience }}</span>
                <span class="tpl__secs">@for (s of t.sections; track s) { <span class="tag">{{ s }}</span> }</span>
                <span class="tpl__foot mono">预计 {{ t.estPages }} 页 · {{ t.sections.length }} 章</span>
              </button>
            }
          </div>
        </section>

        <section class="section">
          <div class="card">
            <div class="card-hd">
              <div class="stack stack--tight">
                <h2 class="card-title">{{ selected().name }}</h2>
                <span class="card-sub">模拟预览 · 导出内容与预览结构一致</span>
              </div>
              <ui-badge [label]="'约 ' + selected().estPages + ' 页'" tone="neutral" icon="doc" />
            </div>
            <div class="card-bd">
              <article class="doc">
                <h3 class="doc__title">{{ selected().name }}</h3>
                <p class="doc__meta mono">{{ projectName() }} · {{ customer() }} · {{ today }} · 作者 {{ userName() }}</p>
                @for (s of sections(); track s.heading) {
                  <section class="doc__sec">
                    <h4 class="doc__h">{{ s.heading }}</h4>
                    <p class="doc__p">{{ s.body }}</p>
                  </section>
                }
                <span class="label">关键参数对比（前 5 条）</span>
                <table class="table">
                  <thead><tr><th>参数</th><th>要求</th><th>我方</th><th>判定</th></tr></thead>
                  <tbody>
                    @for (r of topRows(); track r.id) {
                      <tr>
                        <td>{{ r.defLabel }}</td>
                        <td class="mono small">{{ r.requirement.targetValue }} {{ r.requirement.unit }}</td>
                        <td class="small">{{ ourValue(r) }}</td>
                        <td><ui-badge [label]="judgeLabel(r.judged)" [tone]="judgeTone(r.judged)" /></td>
                      </tr>
                    }
                  </tbody>
                </table>
                <p class="doc__foot mono">{{ watermark() }}</p>
              </article>
            </div>
          </div>
        </section>
      </div>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">已发布快照</h2>
          <span class="section-hint">快照发布后不可修改 · 水印随快照固定</span>
        </div>
        @if (snapshots().length === 0) {
          <ui-empty title="当前项目尚无已发布快照"
            hint="报告通过门禁并发布后会在此留存版本、作者与水印信息。演示环境不写入新快照。" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>版本</th><th>模板</th><th>发布时间</th><th>作者</th><th>页数</th><th>水印</th><th>操作</th></tr></thead>
              <tbody>
                @for (s of snapshots(); track s.id) {
                  <tr>
                    <td class="mono">{{ s.version }}</td>
                    <td>{{ templateName(s.templateId) }}</td>
                    <td class="mono small">{{ published(s.publishedAt) }}</td>
                    <td>{{ s.author }}</td>
                    <td class="mono">{{ s.pages }}</td>
                    <td class="mono small muted">{{ s.watermark }}</td>
                    <td><div class="row row--wrap">
                      <ui-btn size="sm" variant="ghost" icon="eye" (click)="openSnapshot(s)">查看</ui-btn>
                      <ui-btn size="sm" variant="ghost" icon="download" (click)="reExport(s)">重新导出</ui-btn>
                    </div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    <ui-modal [open]="!!snapshot()" title="已发布快照" size="md" [hasFooter]="true" (close)="snapshot.set(null)">
      @if (snapshot(); as s) {
        <div class="stack">
          <p class="watermark mono">{{ s.watermark }}</p>
          <dl class="kv">
            <dt>版本</dt>
            <dd class="mono">{{ s.version }}</dd>
            <dt>模板</dt>
            <dd>{{ templateName(s.templateId) }}</dd>
            <dt>发布时间</dt>
            <dd class="mono">{{ published(s.publishedAt) }}</dd>
            <dt>作者</dt>
            <dd>{{ s.author }}</dd>
            <dt>页数</dt>
            <dd class="mono">{{ s.pages }} 页</dd>
          </dl>
          <div class="banner banner--info">
            <ui-icon name="info" [size]="16" />
            <span>快照内容与发布时刻一致，后续参数修正不会改变此版本；如需更新，请重新导出并发布新版本。</span>
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="snapshot.set(null)">关闭</ui-btn>
        <ui-btn variant="primary" icon="download" [disabled]="blocked()" (click)="reExportCurrent()">重新导出</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .tpl { display: flex; flex-direction: column; gap: 6px; width: 100%; text-align: left; padding: 12px 14px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; font: inherit; }
      .tpl:hover { border-color: var(--line-strong); background: var(--bg-subtle); }
      .tpl--active { border-color: var(--accent); background: var(--accent-weak); }
      .tpl__top { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
      .tpl__aud { font-size: 12px; color: var(--ink-3); }
      .tpl__secs { display: flex; flex-wrap: wrap; gap: 4px; }
      .tpl__foot { font-size: 11px; color: var(--ink-3); }
      .gate-list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; }
      .doc { display: flex; flex-direction: column; gap: 14px; }
      .doc__title { font-size: 20px; }
      .doc__meta { font-size: 12px; color: var(--ink-3); padding-bottom: 10px; border-bottom: 1px solid var(--line); }
      .doc__sec { display: flex; flex-direction: column; gap: 6px; }
      .doc__h { font-size: 14px; color: var(--ink); }
      .doc__p { font-size: 13px; line-height: 1.75; color: var(--ink-2); }
      .doc__foot { margin-top: 8px; padding-top: 10px; border-top: 1px dashed var(--line-strong); font-size: 11px; color: var(--ink-3); }
      .watermark { font-size: 12px; color: var(--ink-3); letter-spacing: 0.04em; padding: 8px 10px; border: 1px dashed var(--line-strong); background: var(--bg-subtle); }
    `,
  ],
})
export class Reports implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly templates = REPORT_TEMPLATES;
  readonly selectedId = signal(REPORT_TEMPLATES[0].id);
  readonly snapshot = signal<ReportSnapshot | null>(null);
  readonly blocked = this.store.publicationBlocked;
  readonly blockReasons = this.store.publicationBlockReasons;
  readonly activeId = this.store.activeProjectId;

  readonly today = this.localDate();
  readonly selected = computed(() => this.templates.find((t) => t.id === this.selectedId()) ?? this.templates[0]);
  readonly projectName = computed(() => this.store.activeProject()?.name ?? '未选择项目');
  readonly customer = computed(() => this.store.activeProject()?.customer ?? '—');
  readonly userName = computed(() => this.store.currentUser().name);
  readonly watermark = computed(() => `${this.projectName()} · ${this.userName()} · ${this.today} · 内部资料 · 预览草稿`);
  readonly snapshots = computed(() => REPORT_SNAPSHOTS.filter((s) => s.projectId === this.store.activeProjectId()));
  readonly topRows = computed(() => this.store.comparisonRows().slice(0, 5));
  readonly insights = computed(() => this.store.visibleInsights().slice(0, 3));
  readonly topRisk = computed(() => {
    const risks = this.store.risks();
    return risks.find((r) => r.level === 'high' && r.state !== 'closed') ?? risks[0];
  });
  readonly evidenceCount = computed(() => this.store.paramValues().filter((v) => !!v.evidence).length);

  readonly stats = computed(() => {
    const judgeStats = this.store.judgeStats();
    const count = (s: JudgeStatus): number => judgeStats.find((x) => x.status === s)?.count ?? 0;
    const rows = this.store.comparisonRows();
    return {
      total: rows.length,
      mandatory: rows.filter((r) => r.mandatory).length,
      compliant: count('compliant'),
      potential: count('potentialDeviation'),
      deviation: count('deviation'),
      incomparable: count('incomparable'),
      undisclosed: count('undisclosed'),
      insufficient: count('insufficientEvidence'),
      mandatoryRisk: this.store.mandatoryRiskCount(),
      confirmed: this.store.confirmedParamCount(),
      pending: this.store.paramStats().pending,
    };
  });

  readonly comparability = computed(() => {
    const rows = this.store.comparisonRows();
    return {
      level: rows.filter((r) => !r.comparable.level).length,
      unit: rows.filter((r) => !r.comparable.unit).length,
      conditions: rows.filter((r) => !r.comparable.conditions).length,
      boundary: rows.filter((r) => !r.comparable.boundary).length,
    };
  });

  readonly sections = computed(() => this.selected().sections.slice(0, 5).map((heading) => ({ heading, body: this.sectionBody(heading) })));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.setActiveProject(id);
  }

  templateName(id: string): string {
    return this.templates.find((t) => t.id === id)?.name ?? id;
  }
  published(iso: string): string {
    return fmtDateTime(iso);
  }
  judgeLabel(s: JudgeStatus): string {
    return JUDGE_LABEL[s];
  }
  judgeTone(s: JudgeStatus): Tone {
    return JUDGE_META[s].tone;
  }
  ourValue(r: ComparisonRow): string {
    return r.cells.find((c) => c.sourceId === 'our')?.display ?? '—';
  }

  openSnapshot(s: ReportSnapshot): void {
    this.snapshot.set(s);
  }
  reExportCurrent(): void {
    const s = this.snapshot();
    if (s) this.reExport(s);
  }
  private denied(): boolean {
    if (!this.blocked()) return false;
    this.toast.push('导出已禁用', 'danger', '发布门禁未通过：' + this.blockReasons().join('；'));
    return true;
  }
  private comparisonCsv(): (string | number)[][] {
    return [
      ['参数', 'key', '维度', '强制条款', '招标要求', '我方', '判定', '判定说明'],
      ...this.store.comparisonRows().map((r) => [
        r.defLabel,
        r.defKey,
        DIMENSION_LABEL[r.dimension],
        r.mandatory ? '是' : '否',
        `${r.requirement.text}（${r.requirement.targetValue} ${r.requirement.unit}）`,
        this.ourValue(r),
        JUDGE_LABEL[r.judged],
        r.reason,
      ]),
    ];
  }

  exportCsv(): void {
    if (this.denied()) return;
    const tpl = this.selected();
    const data = this.comparisonCsv();
    downloadCsv(`BidScope-${tpl.name}-${this.store.activeProjectId()}.csv`, data);
    this.store.pushAudit('export', tpl.name, `CSV · 导出 ${data.length - 1} 行`);
    this.toast.push('已导出 CSV', 'ok', `${tpl.name} · 共 ${data.length - 1} 行`);
  }

  exportBrief(): void {
    if (this.denied()) return;
    const tpl = this.selected();
    const p = this.store.activeProject();
    const s = this.stats();
    const risk = this.topRisk();
    const lines = [
      `BidScope 文本简报 · ${tpl.name}`,
      `项目：${p?.name ?? '—'}（${p?.customer ?? '—'}）`,
      `规模：${p?.mw ?? 0} MW / ${p?.mwh ?? 0} MWh · 技术路线 ${p?.route ?? '—'}`,
      `日期：${this.today} · 作者：${this.userName()} · 受众：${tpl.audience}`,
      '----------------------------------------',
      `判定汇总：满足 ${s.compliant} · 潜在偏离 ${s.potential} · 明确偏离 ${s.deviation} · 不可比 ${s.incomparable} · 未披露 ${s.undisclosed}`,
      `强制条款：${s.mandatory} 项 · 废标风险：${s.mandatoryRisk} 项 · 证据引用：${this.evidenceCount()} 条`,
      `首要风险：${risk?.text ?? '暂无高风险项'}`,
      `处置建议：${risk?.suggestion ?? '按现有口径继续跟进'}`,
      '关键结论：',
      ...this.insights().map((i, idx) => `  [${idx + 1}] ${i.text}`),
      '----------------------------------------',
      `水印：${this.watermark()}`,
      '本文件由演示环境生成，数据为 Mock 数据，不构成正式报告。',
    ];
    downloadText(`BidScope-${tpl.name}-简报.txt`, lines.join('\n'));
    this.store.pushAudit('export', tpl.name, `文本简报 ${lines.length} 行`);
    this.toast.push('已导出文本简报', 'ok', tpl.name);
  }

  reExport(s: ReportSnapshot): void {
    if (this.denied()) return;
    const data = this.comparisonCsv();
    const name = this.templateName(s.templateId);
    downloadCsv(`BidScope-${name}-${s.version}.csv`, data);
    this.store.pushAudit('export', `${name} ${s.version} 重新导出`, `导出 ${data.length - 1} 行`);
    this.toast.push('已重新导出', 'ok', `${name} · ${s.version}`);
    this.snapshot.set(null);
  }

  private localDate(): string {
    const month = String(DEMO_TODAY.getMonth() + 1).padStart(2, '0');
    return `${DEMO_TODAY.getFullYear()}-${month}-${String(DEMO_TODAY.getDate()).padStart(2, '0')}`;
  }

  private sectionBody(heading: string): string {
    const s = this.stats();
    const cmp = this.comparability();
    const risk = this.topRisk();
    const insights = this.insights();
    const conclusion = insights.length
      ? insights.map((i, idx) => `[${idx + 1}] ${i.text}`).join(' ')
      : '当前项目尚无已采集证据的结论，建议先完成参数复核与高风险审核。';
    const p = this.store.activeProject();
    if (/范围|方法|背景/.test(heading)) return `分析对象为 ${p?.name ?? '—'}（${p?.customer ?? '—'}，${p?.mw ?? 0} MW / ${p?.mwh ?? 0} MWh，技术路线 ${p?.route ?? '—'}）。本次纳入 ${s.total} 项参数对比，其中强制条款 ${s.mandatory} 项；已确认参数 ${s.confirmed} 项，待复核 ${s.pending} 项。所有取值均来自可溯源证据，未取到值的字段标注「未披露」，不判为不满足。[1]`;
    if (/参数|字段/.test(heading)) return `参数矩阵共 ${s.total} 条记录：满足 ${s.compliant} 项、潜在偏离 ${s.potential} 项、明确偏离 ${s.deviation} 项、不可比 ${s.incomparable} 项、未披露 ${s.undisclosed} 项、证据不足 ${s.insufficient} 项。差异项均附判定说明与建议澄清话术，未做竞对总排名。[2]`;
    if (/口径|可比/.test(heading)) return `四要素可比性检查结果：层级不一致 ${cmp.level} 项、单位不一致 ${cmp.unit} 项、条件不一致 ${cmp.conditions} 项、边界不一致 ${cmp.boundary} 项。口径不一致的条目不作横向优劣判断，统一标注为「不可比」，并在澄清清单中要求业主统一测量边界。[3]`;
    if (/差距|摘要|风险|强制|影响|处置/.test(heading)) return `判定汇总：满足 ${s.compliant} 项、潜在偏离 ${s.potential} 项、明确偏离 ${s.deviation} 项、不可比 ${s.incomparable} 项、未披露 ${s.undisclosed} 项，废标风险 ${s.mandatoryRisk} 项。首要风险：${risk?.text ?? '当前无高风险项'}。处置建议：${risk?.suggestion ?? '按现有口径继续跟进'}。主要结论：${conclusion}`;
    if (/结论|胜负手|决策|建议|话术/.test(heading)) return `关键结论：${conclusion} 以上结论均限定在可比口径内，未通过四要素检查的条目不计入优劣判断；待决策项需由投标经理与商务负责人共同确认。`;
    if (/证据|引用/.test(heading)) return `本报告引用 ${this.evidenceCount()} 条参数证据与 ${s.total} 条对比记录，角标 [1]–[${this.evidenceCount()}] 对应原文页码与章节。来源可靠性分官方发布、公开渠道与第三方转述三档，第三方转述仅在无官方来源时使用，且标注「证据不足」。[1][2]`;
    if (/问题|澄清|待定/.test(heading)) return `本项目登记待澄清问题 ${this.store.clarifications().length} 项，集中在测量边界、测试条件与承诺范围三类；建议在答疑截止前统一发出，避免评标阶段出现口径争议。`;
    if (/审核|记录/.test(heading)) return `审核记录：待处理 ${this.store.unapprovedTaskCount()} 项，高风险任务须在发布前通过。报告导出与发布受门禁约束，未裁决的冲突与未通过的高风险审核将阻断发布。`;
    return `本节依据 ${s.total} 条对比记录与 ${this.evidenceCount()} 条证据生成，结论限定在可比口径内；未披露项不推断为不具备，不可比项不计入优劣判断。`;
  }
}
