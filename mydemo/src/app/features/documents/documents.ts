import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Drawer } from '../../shared/ui/drawer';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { ToastService } from '../../shared/ui/toast.service';
import { PARSE_ISSUES } from '../../core/mock/documents';
import {
  DOC_TYPE_LABEL,
  PARSE_STATUS_LABEL,
  PARSE_STATUS_TONE,
  RELIABILITY_LABEL,
  RELIABILITY_TONE,
  RISK_LABEL,
  RISK_TONE,
  fmtDateTime,
} from '../../core/format';
import { DocType, Document, ParseIssue, ParseStatus, RiskLevel, SourceReliability, Tone } from '../../core/types';

const DOC_TYPES: DocType[] = ['tender', 'competitorBid', 'competitorManual', 'awardNotice', 'ourProduct', 'other'];
const RELIABILITIES: SourceReliability[] = ['official', 'public', 'thirdParty', 'unknown'];
const ISSUE_LEVELS: RiskLevel[] = ['high', 'mid', 'low'];

const RELIABILITY_TEXT: Record<SourceReliability, string> = {
  official: '由招标方、业主或制造商官方渠道发布，来源链路完整，可直接作为定标与承诺依据。',
  public: '来自公开招标平台、公开新闻稿或公开数据库，内容可能滞后于最新版本，引用时需核对版本号与发布日期。',
  thirdParty: '由行业媒体、咨询报告或其他投标方整理转述，存在转述失真风险，仅作为线索使用。',
  unknown: '未记录来源链路与获取渠道，禁止单独作为判定依据，需补充原始文件后重新评估。',
};

const RELIABILITY_ADVICE: Record<SourceReliability, string> = {
  official: '抽取值默认可信；如与其他来源冲突，以本来源为准并记录理由。',
  public: '与官方文件比对后再确认；差异项进入冲突裁决流程。',
  thirdParty: '仅用于交叉验证；关键参数须回溯到官方或公开原始文件。',
  unknown: '上传原始文件或在说明中补全来源；关键参数标注「证据不足」。',
};

const KIND_LABEL: Record<ParseIssue['kind'], string> = {
  missingPage: '缺页',
  crossPageTable: '跨页表格',
  lowOcr: '低 OCR',
  imageParam: '图片内参数',
};

@Component({
  selector: 'app-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Badge, Btn, Drawer, Empty, Icon, Modal, Progress],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">资料管理</h1>
          <p class="page-sub">
            {{ store.activeProject()?.name }} · 共 {{ docs().length }} 份资料 · 解析完成 {{ doneCount() }} 份 · 需核对
            {{ reviewCount() }} 份 · 解析异常 {{ openIssueCount() }} 项待处理
          </p>
        </div>
        <div class="page-actions">
          <ui-btn variant="primary" icon="plus" (click)="openDrawer()">上传资料</ui-btn>
        </div>
      </header>

      <div class="banner banner--info section">
        <ui-icon name="info" [size]="16" />
        <span>
          每份资料均记录哈希、来源可靠性与质量分。质量分低于 70 必须人工核对后才可进入参数抽取；来源未知的资料不得单独作为判定依据。
        </span>
      </div>

      <section class="section">
        <div class="row row--wrap" style="margin-bottom: 12px">
          @for (c of chips(); track c.key) {
            <button type="button" class="chip" [class.chip--active]="status() === c.key" (click)="pickStatus(c.key)">
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
              placeholder="搜索文件名或哈希"
              aria-label="搜索资料"
              [ngModel]="q()"
              (ngModelChange)="q.set($event)"
            />
          </div>
          <select class="select" aria-label="按类型筛选" [ngModel]="type()" (ngModelChange)="type.set($event)">
            <option value="all">全部类型</option>
            @for (t of types; track t) {
              <option [value]="t">{{ typeLabel(t) }}</option>
            }
          </select>
          <button type="button" class="chip" (click)="clearFilters()">清空筛选</button>
        </div>

        @if (docs().length === 0) {
          <ui-empty
            title="当前项目尚未上传资料"
            hint="上传招标文件、竞对标书与竞对手册后，系统才会开始参数抽取与对比。"
            icon="file"
            actionLabel="上传资料"
            (action)="openDrawer()"
          />
        } @else if (filtered().length === 0) {
          <ui-empty
            title="没有匹配的资料"
            hint="当前筛选条件下没有资料。尝试放宽解析状态或类型条件。"
            icon="search"
            actionLabel="清空筛选"
            (action)="clearFilters()"
          />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>来源可靠性</th>
                  <th>语言</th>
                  <th class="num">页数</th>
                  <th style="width: 160px">质量分</th>
                  <th>解析状态</th>
                  <th>更新时间</th>
                  <th style="width: 200px">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (d of filtered(); track d.id) {
                  <tr>
                    <td>
                      <div class="file">
                        <a class="link-btn" [routerLink]="['/projects', projectId, 'documents', d.id]">{{ d.name }}</a>
                        <span class="mono small muted">{{ d.hash }}</span>
                      </div>
                    </td>
                    <td><span class="tag">{{ typeLabel(d.type) }}</span></td>
                    <td>
                      <ui-badge
                        [label]="reliabilityLabel(d.reliability)"
                        [tone]="reliabilityTone(d.reliability)"
                        [attr.aria-label]="'来源可靠性：' + reliabilityLabel(d.reliability)"
                      />
                    </td>
                    <td class="small">{{ d.language }}</td>
                    <td class="num">{{ d.pages }}</td>
                    <td>
                      <div class="stack stack--tight">
                        <ui-progress [value]="d.qualityScore" [tone]="qualityTone(d.qualityScore)" [label]="'质量分 ' + d.qualityScore" />
                        @if (d.qualityScore < 70) {
                          <span class="small text-danger">需人工核对</span>
                        }
                      </div>
                    </td>
                    <td>
                      <ui-badge
                        [label]="statusLabel(d.parseStatus)"
                        [tone]="statusTone(d.parseStatus)"
                        [icon]="statusIcon(d.parseStatus)"
                        [attr.aria-label]="'解析状态：' + statusLabel(d.parseStatus)"
                      />
                    </td>
                    <td class="mono small">{{ updated(d.uploadedAt) }}</td>
                    <td>
                      <div class="row row--wrap">
                        <a class="link-btn small" [routerLink]="['/projects', projectId, 'documents', d.id]">查看原文</a>
                        @if (canRetry(d) || busy().has(d.id)) {
                          <ui-btn size="sm" variant="ghost" icon="refresh" [loading]="busy().has(d.id)" (click)="retry(d)">
                            重试
                          </ui-btn>
                        }
                        <ui-btn size="sm" variant="ghost" icon="info" (click)="sourceModal.set(d)">来源详情</ui-btn>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">解析异常</h2>
          <span class="section-hint">缺页、跨页表格、低 OCR、图片内参数 · 共 {{ openIssueCount() }} 项待处理</span>
        </div>

        @if (issueGroups().length === 0) {
          <ui-empty title="当前项目没有解析异常" hint="所有资料均已完成解析，未检出缺页、跨页断裂或低置信度 OCR。" icon="check" />
        } @else {
          <div class="stack">
            @for (g of issueGroups(); track g.level) {
              <div class="issue-group">
                <div class="issue-group__hd">
                  <ui-badge [label]="g.label" [tone]="g.tone" icon="alert" />
                  <span class="small muted">{{ g.items.length }} 项</span>
                </div>
                <ul class="issue-list">
                  @for (i of g.items; track i.id) {
                    <li class="issue" [class.issue--done]="isHandled(i)">
                      <div class="issue__main">
                        <div class="row row--wrap">
                          <span class="tag">{{ kindLabel(i.kind) }}</span>
                          <span class="mono small">P.{{ i.page }}</span>
                          <span class="small muted truncate">{{ docName(i.documentId) }}</span>
                          @if (isHandled(i)) {
                            <ui-badge label="已处理" tone="ok" icon="check" />
                          }
                        </div>
                        <p class="issue__text">{{ i.text }}</p>
                      </div>
                      <div class="row">
                        @if (!isHandled(i)) {
                          <ui-btn size="sm" variant="secondary" icon="edit" (click)="issueModal.set(i)">去处理</ui-btn>
                          <ui-btn size="sm" variant="ghost" icon="check" (click)="markHandled(i)">标记已处理</ui-btn>
                        }
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      </section>
    </div>

    <ui-drawer [open]="drawerOpen()" title="上传资料" (close)="closeDrawer()">
      <div class="stack">
        <div class="banner banner--info">
          <ui-icon name="info" [size]="16" />
          <span>演示环境不写入磁盘：填写文件名即模拟选择文件，上传后立即进入解析队列。</span>
        </div>
        <div class="field">
          <label for="up-name">文件名 *</label>
          <input
            id="up-name"
            class="input"
            placeholder="例如 CZ-Morava_RFP_补充附件.pdf"
            [class.input--error]="!!errors()['name']"
            [ngModel]="fileName()"
            (ngModelChange)="fileName.set($event)"
          />
          @if (errors()['name']) {
            <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['name'] }}</span>
          }
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="up-type">资料类型 *</label>
            <select id="up-type" class="select" [ngModel]="docType()" (ngModelChange)="docType.set($event)">
              @for (t of types; track t) {
                <option [value]="t">{{ typeLabel(t) }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="up-rel">来源可靠性 *</label>
            <select id="up-rel" class="select" [ngModel]="reliability()" (ngModelChange)="reliability.set($event)">
              @for (r of reliabilities; track r) {
                <option [value]="r">{{ reliabilityLabel(r) }}</option>
              }
            </select>
          </div>
        </div>
        <div class="field">
          <label for="up-lang">文档语言 *</label>
          <input
            id="up-lang"
            class="input"
            placeholder="例如 英文 / 捷克语"
            [class.input--error]="!!errors()['language']"
            [ngModel]="language()"
            (ngModelChange)="language.set($event)"
          />
          @if (errors()['language']) {
            <span class="error"><ui-icon name="alert" [size]="12" />{{ errors()['language'] }}</span>
          }
        </div>
        <dl class="kv">
          <dt>页数</dt>
          <dd class="mono">120（演示固定值）</dd>
          <dt>初始质量分</dt>
          <dd class="mono">82 · 需人工抽检</dd>
          <dt>初始状态</dt>
          <dd>解析中</dd>
        </dl>
        <div class="row">
          <ui-btn variant="secondary" (click)="closeDrawer()">取消</ui-btn>
          <ui-btn variant="primary" icon="plus" (click)="submitUpload()">开始解析</ui-btn>
        </div>
      </div>
    </ui-drawer>

    <ui-modal [open]="!!sourceModal()" title="来源可靠性说明" [hasFooter]="true" (close)="sourceModal.set(null)">
      @if (sourceModal(); as d) {
        <div class="stack">
          <dl class="kv">
            <dt>资料</dt>
            <dd>{{ d.name }}</dd>
            <dt>类型</dt>
            <dd>{{ typeLabel(d.type) }}</dd>
            <dt>来源可靠性</dt>
            <dd>
              <ui-badge [label]="reliabilityLabel(d.reliability)" [tone]="reliabilityTone(d.reliability)" icon="link" />
            </dd>
            <dt>哈希</dt>
            <dd class="mono">{{ d.hash }}</dd>
            <dt>页数 / 质量分</dt>
            <dd class="mono">{{ d.pages }} 页 / {{ d.qualityScore }}</dd>
          </dl>
          <p class="issue__text">{{ reliabilityText(d.reliability) }}</p>
          <div class="banner banner--warn">
            <ui-icon name="alert" [size]="16" />
            <span>{{ reliabilityAdvice(d.reliability) }}</span>
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="sourceModal.set(null)">关闭</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="!!issueModal()" title="处理解析异常" [hasFooter]="true" (close)="issueModal.set(null)">
      @if (issueModal(); as i) {
        <div class="stack">
          <dl class="kv">
            <dt>异常类型</dt>
            <dd>{{ kindLabel(i.kind) }}</dd>
            <dt>位置</dt>
            <dd class="mono">P.{{ i.page }}</dd>
            <dt>涉及资料</dt>
            <dd>{{ docName(i.documentId) }}</dd>
          </dl>
          <p class="issue__text">{{ i.text }}</p>
          <div class="stack stack--tight">
            <span class="label">处理路径</span>
            <ol class="steps">
              @for (s of issueSteps(i.kind); track s) {
                <li>{{ s }}</li>
              }
            </ol>
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="issueModal.set(null)">取消</ui-btn>
        <ui-btn variant="primary" (click)="markHandled(issueModal())">标记已处理</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .file {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .issue-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .issue-group {
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .issue-group__hd {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--line);
        background: var(--bg-subtle);
      }
      .issue {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid var(--line);
      }
      .issue:last-child {
        border-bottom: none;
      }
      .issue--done {
        background: var(--bg-subtle);
      }
      .issue__main {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .issue__text {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink-2);
      }
      .steps {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.9;
        color: var(--ink-2);
      }
    `,
  ],
})
export class Documents implements OnInit {
  readonly store = inject(WorkspaceStore);
  readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly types = DOC_TYPES;
  readonly reliabilities = RELIABILITIES;

  projectId = '';
  readonly docs = this.store.documents;

  readonly status = signal<'all' | ParseStatus>('all');
  readonly q = signal('');
  readonly type = signal<'all' | DocType>('all');
  readonly busy = signal<ReadonlySet<string>>(new Set<string>());

  readonly drawerOpen = signal(false);
  readonly fileName = signal('');
  readonly docType = signal<DocType>('tender');
  readonly reliability = signal<SourceReliability>('official');
  readonly language = signal('英文');
  readonly errors = signal<Record<string, string>>({});

  readonly sourceModal = signal<Document | null>(null);
  readonly issueModal = signal<ParseIssue | null>(null);
  readonly handled = signal<string[]>([]);

  readonly doneCount = computed(() => this.docs().filter((d) => d.parseStatus === 'done').length);
  readonly reviewCount = computed(() => this.docs().filter((d) => d.parseStatus === 'review').length);

  readonly chips = computed(() => {
    const list = this.docs();
    return [
      { key: 'all' as const, label: '全部', count: list.length },
      { key: 'parsing' as const, label: '解析中', count: list.filter((d) => d.parseStatus === 'parsing').length },
      { key: 'done' as const, label: '完成', count: list.filter((d) => d.parseStatus === 'done').length },
      { key: 'review' as const, label: '需核对', count: list.filter((d) => d.parseStatus === 'review').length },
      { key: 'failed' as const, label: '失败', count: list.filter((d) => d.parseStatus === 'failed').length },
    ];
  });

  readonly filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    const status = this.status();
    const type = this.type();
    return this.docs().filter((d) => {
      if (status !== 'all' && d.parseStatus !== status) return false;
      if (type !== 'all' && d.type !== type) return false;
      if (q && !(d.name.toLowerCase().includes(q) || d.hash.toLowerCase().includes(q))) return false;
      return true;
    });
  });

  readonly issues = computed(() => {
    const ids = new Set(this.docs().map((d) => d.id));
    return PARSE_ISSUES.filter((i) => ids.has(i.documentId));
  });

  readonly openIssueCount = computed(() => this.issues().filter((i) => !this.isHandled(i)).length);

  readonly issueGroups = computed(() => {
    const list = this.issues();
    return ISSUE_LEVELS.map((level) => ({
      level,
      label: RISK_LABEL[level] + '风险',
      tone: RISK_TONE[level],
      items: list.filter((i) => i.severity === level),
    })).filter((g) => g.items.length > 0);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId = id;
      this.store.setActiveProject(id);
    } else {
      this.projectId = this.store.activeProjectId();
    }
  }

  typeLabel(t: DocType): string {
    return DOC_TYPE_LABEL[t];
  }
  reliabilityLabel(r: SourceReliability): string {
    return RELIABILITY_LABEL[r];
  }
  reliabilityTone(r: SourceReliability): Tone {
    return RELIABILITY_TONE[r];
  }
  reliabilityText(r: SourceReliability): string {
    return RELIABILITY_TEXT[r];
  }
  reliabilityAdvice(r: SourceReliability): string {
    return RELIABILITY_ADVICE[r];
  }
  statusLabel(s: ParseStatus): string {
    return PARSE_STATUS_LABEL[s];
  }
  statusTone(s: ParseStatus): Tone {
    return PARSE_STATUS_TONE[s];
  }
  statusIcon(s: ParseStatus): string {
    switch (s) {
      case 'done':
        return 'check';
      case 'parsing':
        return 'refresh';
      case 'review':
      case 'failed':
        return 'alert';
      default:
        return 'clock';
    }
  }
  qualityTone(v: number): Tone {
    return v >= 85 ? 'ok' : v >= 70 ? 'warn' : 'danger';
  }
  updated(at: string): string {
    return fmtDateTime(at);
  }
  kindLabel(kind: ParseIssue['kind']): string {
    return KIND_LABEL[kind];
  }
  docName(id: string): string {
    return this.store.allDocuments().find((d) => d.id === id)?.name ?? id;
  }
  canRetry(d: Document): boolean {
    return d.parseStatus === 'failed' || d.parseStatus === 'review';
  }
  isHandled(i: ParseIssue): boolean {
    return i.handled || this.handled().includes(i.id);
  }

  issueSteps(kind: ParseIssue['kind']): string[] {
    switch (kind) {
      case 'missingPage':
        return [
          '向招标方索取缺失页码的原始文件，补齐后在本页重新上传',
          '在参数矩阵中手工录入该页涉及的参数，理由标注「原文缺页」',
          '处理完成后标记已处理，审计日志记录操作人与时间',
        ];
      case 'lowOcr':
        return [
          '对照原始 PDF 逐项校对页码、数值与单位，不采用识别置信度低的数字',
          '在参数矩阵中修正取值，理由选择「原文有误：识别或 OCR 错误」',
          '无法辨认的内容标注「证据不足」，并生成澄清问题',
        ];
      case 'crossPageTable':
        return ['核对拆分后的表格关联关系是否正确', '在参数矩阵中确认跨页参数取值完整', '确认无误后标记已处理'];
      default:
        return ['打开原始图像，人工读取型号、容值与序列号', '在参数矩阵中手工录入，理由标注「图片内参数」', '无法读数时标注「证据不足」并申请澄清'];
    }
  }

  pickStatus(key: 'all' | ParseStatus): void {
    this.status.set(key);
  }
  clearFilters(): void {
    this.status.set('all');
    this.type.set('all');
    this.q.set('');
  }

  openDrawer(): void {
    this.errors.set({});
    this.drawerOpen.set(true);
  }
  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.errors.set({});
    this.fileName.set('');
    this.language.set('英文');
  }

  submitUpload(): void {
    const name = this.fileName().trim();
    const language = this.language().trim();
    const errors: Record<string, string> = {};
    if (!name) errors['name'] = '请填写文件名以模拟选择文件';
    else if (!/\.[a-z0-9]{2,5}$/i.test(name)) errors['name'] = '文件名需包含扩展名，例如 .pdf';
    if (!language) errors['language'] = '请填写文档语言';
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) {
      this.toast.push('表单校验未通过', 'danger', '请检查标红字段后重试');
      return;
    }
    const seq = this.store.allDocuments().length + 1;
    const doc: Document = {
      id: 'doc-new-' + seq,
      projectId: this.projectId,
      name,
      type: this.docType(),
      reliability: this.reliability(),
      language,
      pages: 120,
      qualityScore: 82,
      parseStatus: 'parsing',
      uploadedBy: this.store.currentUser().id,
      uploadedAt: '2026-10-24T09:00:00',
      hash: 'new…001',
    };
    this.store.addDocument(doc);
    this.closeDrawer();
    this.status.set('all');
    this.type.set('all');
    this.q.set('');
    this.toast.push('资料已上传', 'ok', `${doc.name} · 已进入解析队列（演示不落盘）`);
  }

  retry(doc: Document): void {
    if (this.busy().has(doc.id)) return;
    this.setBusy(doc.id, true);
    this.store.setDocStatus(doc.id, 'parsing');
    setTimeout(() => {
      this.store.setDocStatus(doc.id, 'done', Math.max(doc.qualityScore, 85));
      this.setBusy(doc.id, false);
      this.toast.push('解析已重试完成', 'ok', `${doc.name} · 质量分 ${Math.max(doc.qualityScore, 85)}`);
    }, 1200);
  }

  markHandled(issue: ParseIssue | null): void {
    if (!issue) return;
    this.issueModal.set(null);
    if (this.isHandled(issue)) return;
    this.handled.update((list) => [...list, issue.id]);
    this.store.pushAudit('parse', `处理解析异常 ${issue.id}`, `${this.kindLabel(issue.kind)} · P.${issue.page} · ${this.docName(issue.documentId)}`);
    this.toast.push('异常已标记处理', 'ok', `${this.kindLabel(issue.kind)} · P.${issue.page} 已记录到审计日志`);
  }

  private setBusy(id: string, on: boolean): void {
    this.busy.update((set) => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
