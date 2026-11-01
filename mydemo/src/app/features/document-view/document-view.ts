import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { ToastService } from '../../shared/ui/toast.service';
import { DOC_PAGES, PAGE_ANCHORS } from '../../core/mock';
import {
  DOC_TYPE_LABEL,
  PARSE_STATUS_LABEL,
  PARSE_STATUS_TONE,
  RELIABILITY_LABEL,
  RELIABILITY_TONE,
  confidenceTone,
  fmtPct,
} from '../../core/format';
import { PageAnchor, ParseStatus, Tone } from '../../core/types';

const CORRECT_REASONS = ['原文有误', '条件理解错误', '单位识别错误', '其他'];

interface Seg {
  text: string;
  anchorId: string | null;
}

interface RenderPage {
  page: number;
  section: string;
  lines: Seg[][];
}

function splitLine(line: string, anchors: PageAnchor[]): Seg[] {
  const hits = anchors
    .filter((a) => a.snippet.length > 0 && line.includes(a.snippet))
    .sort((a, b) => line.indexOf(a.snippet) - line.indexOf(b.snippet));
  if (hits.length === 0) return [{ text: line, anchorId: null }];
  const out: Seg[] = [];
  let rest = line;
  for (const a of hits) {
    const idx = rest.indexOf(a.snippet);
    if (idx < 0) continue;
    if (idx > 0) out.push({ text: rest.slice(0, idx), anchorId: null });
    out.push({ text: a.snippet, anchorId: a.id });
    rest = rest.slice(idx + a.snippet.length);
  }
  if (rest.length > 0) out.push({ text: rest, anchorId: null });
  return out;
}

@Component({
  selector: 'app-document-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Badge, Btn, Empty, Icon, Modal, Progress],
  template: `
    @if (doc(); as d) {
      <div class="page">
        <header class="page-head">
          <div class="page-head__main">
            <a class="back" [routerLink]="['/projects', projectId, 'documents']">
              <ui-icon name="chevron-right" [size]="12" />
              <span>返回资料管理</span>
            </a>
            <h1 class="page-title">{{ d.name }}</h1>
            <p class="page-sub">
              {{ typeLabel() }} · <span class="mono">{{ d.id }}</span> · {{ d.pages }} 页 · {{ d.language }} · 质量分
              <span class="mono">{{ d.qualityScore }}</span>
            </p>
          </div>
          <div class="page-actions">
            <ui-btn variant="primary" icon="edit" (click)="openFlag()">原文理解有误</ui-btn>
          </div>
        </header>

        <div class="card section">
          <div class="card-bd toolbar">
            <div class="row row--wrap">
              <span class="label">当前位置</span>
              <span class="mono">{{ focusPageLabel() }}</span>
              <span class="small muted">{{ focusSection() }}</span>
              <ui-badge
                [label]="reliabilityLabel()"
                [tone]="reliabilityTone()"
                icon="link"
                [attr.aria-label]="'来源可靠性：' + reliabilityLabel()"
              />
              <ui-badge
                [label]="statusLabel()"
                [tone]="statusTone()"
                [icon]="statusIcon()"
                [attr.aria-label]="'解析状态：' + statusLabel()"
              />
              @if (flagged()) {
                <ui-badge label="修正建议待审核" tone="warn" icon="alert" />
              }
            </div>
            <div class="row">
              <span class="mono small muted">{{ position() }}</span>
              <ui-btn size="sm" variant="secondary" icon="arrow-up" [disabled]="anchors().length === 0" (click)="step(-1)">
                上一处
              </ui-btn>
              <ui-btn size="sm" variant="secondary" icon="arrow-down" [disabled]="anchors().length === 0" (click)="step(1)">
                下一处
              </ui-btn>
            </div>
          </div>
        </div>

        <div class="viewer section">
          <div class="stack stack--loose">
            @if (pages().length === 0) {
              <div class="banner banner--warn">
                <ui-icon name="alert" [size]="16" />
                <span>该文档没有可检索的正文片段，仅保留解析结果摘要。右侧锚点（如有）为抽取阶段生成的证据定位。</span>
              </div>
              <div class="card">
                <div class="card-hd">
                  <h2 class="card-title">解析摘要</h2>
                  <ui-badge [label]="statusLabel()" [tone]="statusTone()" [icon]="statusIcon()" />
                </div>
                <div class="card-bd">
                  <dl class="kv">
                    <dt>文件名</dt>
                    <dd>{{ d.name }}</dd>
                    <dt>文档 ID</dt>
                    <dd class="mono">{{ d.id }}</dd>
                    <dt>类型</dt>
                    <dd>{{ typeLabel() }}</dd>
                    <dt>页数</dt>
                    <dd class="mono">{{ d.pages }}</dd>
                    <dt>质量分</dt>
                    <dd class="mono">{{ d.qualityScore }}</dd>
                    <dt>来源可靠性</dt>
                    <dd><ui-badge [label]="reliabilityLabel()" [tone]="reliabilityTone()" /></dd>
                    <dt>文件哈希</dt>
                    <dd class="mono">{{ d.hash }}</dd>
                    <dt>更新时间</dt>
                    <dd class="mono">{{ d.uploadedAt }}</dd>
                  </dl>
                </div>
              </div>
              <ui-empty [title]="fallbackTitle()" [hint]="fallbackHint()" icon="file" />
            } @else {
              <p class="small muted">
                演示正文片段共 {{ pages().length }} 页（{{ pageRange() }}）。高亮片段为参数抽取时引用的原文，点击可直接联动右侧锚点。
              </p>
              @for (p of pages(); track p.page) {
                <article
                  class="doc-page"
                  [id]="'page-' + p.page"
                  tabindex="-1"
                  [class.doc-page--active]="focusPageNumber() === p.page"
                >
                  <header class="doc-page__hd">
                    <span class="mono">P.{{ p.page }}</span>
                    <span class="doc-page__sec">{{ p.section }}</span>
                    @if (anchorCountOnPage(p.page) > 0) {
                      <span class="tag">{{ anchorCountOnPage(p.page) }} 处锚点</span>
                    }
                  </header>
                  <div class="doc-page__bd">
                    @for (line of p.lines; track $index) {
                      <p class="doc-line">
                        @for (seg of line; track $index) {
                          @if (seg.anchorId) {
                            <button
                              type="button"
                              class="hl-wrap"
                              [attr.aria-label]="'查看证据锚点 ' + labelOf(seg.anchorId)"
                              (click)="activateById(seg.anchorId)"
                            >
                              <mark class="hl" [class.hl--on]="activeAnchor() === seg.anchorId">{{ seg.text }}</mark>
                            </button>
                          } @else {
                            <span>{{ seg.text }}</span>
                          }
                        }
                      </p>
                    }
                  </div>
                </article>
              }
            }
          </div>

          <aside class="stack stack--tight">
            <div class="section-head">
              <h2 class="section-title">证据锚点</h2>
              <span class="section-hint">{{ anchors().length }} 处</span>
            </div>
            @if (anchors().length === 0) {
              <ui-empty
                title="该文档尚未抽取"
                hint="解析中或解析失败的文档不产生参数锚点。请先在资料管理中完成解析，再进行原文核对。"
                icon="link"
              />
            } @else {
              <ul class="anc-list">
                @for (a of anchors(); track a.id) {
                  <li class="anc" [class.anc--active]="activeAnchor() === a.id">
                    <button
                      type="button"
                      class="anc__main"
                      [attr.aria-current]="activeAnchor() === a.id ? 'true' : null"
                      (click)="activate(a)"
                    >
                      <span class="anc__label">{{ a.paramLabel }}</span>
                      <span class="mono small muted">{{ a.paramKey }}</span>
                      <span class="row row--between small muted">
                        <span class="mono">P.{{ a.page }}</span>
                        <span>置信度 {{ pct(a.confidence) }}</span>
                      </span>
                    </button>
                    <div class="row">
                      <ui-progress
                        class="anc__bar"
                        [value]="a.confidence * 100"
                        [tone]="confTone(a.confidence)"
                        [showValue]="false"
                        [label]="'锚点置信度 ' + pct(a.confidence)"
                      />
                      <ui-btn size="sm" variant="ghost" icon="eye" (click)="evidenceModal.set(a)">证据</ui-btn>
                    </div>
                  </li>
                }
              </ul>
              <p class="small muted">置信度低于 0.85 的锚点需人工复核原文后才可用于对比判定。</p>
            }
          </aside>
        </div>
      </div>

      <ui-modal [open]="!!evidenceModal()" title="证据详情" [hasFooter]="true" (close)="evidenceModal.set(null)">
        @if (evidenceModal(); as a) {
          <div class="stack">
            <dl class="kv">
              <dt>参数</dt>
              <dd>{{ a.paramLabel }} <span class="mono small muted">{{ a.paramKey }}</span></dd>
              <dt>位置</dt>
              <dd class="mono">P.{{ a.page }} · {{ a.section }}</dd>
              <dt>置信度</dt>
              <dd class="mono">{{ pct(a.confidence) }}</dd>
              <dt>来源可靠性</dt>
              <dd><ui-badge [label]="reliabilityLabel()" [tone]="reliabilityTone()" icon="link" /></dd>
            </dl>
            <div class="quote">
              <p class="doc-line">{{ a.snippet }}</p>
            </div>
            <p class="small muted">参数仅引用上述原文片段；超出片段范围的补充解读不计入置信度，也不作为对比依据。</p>
          </div>
        }
        <div modal-footer>
          <ui-btn variant="secondary" (click)="evidenceModal.set(null)">关闭</ui-btn>
          <ui-btn variant="primary" (click)="locate(evidenceModal())">定位到该页</ui-btn>
        </div>
      </ui-modal>

      <ui-modal [open]="flagOpen()" title="原文理解有误" [hasFooter]="true" (close)="flagOpen.set(false)">
        <div class="stack">
          <div class="banner banner--warn">
            <ui-icon name="alert" [size]="16" />
            <span>提交后生成修正建议并进入待审核队列。原文与抽取结果不会被直接改写，需审核通过后生效。</span>
          </div>
          <div class="field">
            <label for="cv-reason">问题类型 *</label>
            <select id="cv-reason" class="select" [ngModel]="reason()" (ngModelChange)="reason.set($event)">
              @for (r of reasons; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="cv-note">具体说明{{ reason() === '其他' ? ' *' : '' }}</label>
            <textarea
              id="cv-note"
              class="input"
              rows="3"
              placeholder="指出页码、原文表述与正确理解，例如：P.13 循环寿命条件应为 DoD 90%"
              [ngModel]="note()"
              (ngModelChange)="note.set($event)"
            ></textarea>
            @if (flagError()) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ flagError() }}</span>
            }
          </div>
          <dl class="kv">
            <dt>当前页</dt>
            <dd class="mono">{{ focusPageLabel() }}</dd>
            <dt>当前锚点</dt>
            <dd>{{ activeAnchorObj()?.paramLabel ?? '未选中' }}</dd>
          </dl>
        </div>
        <div modal-footer>
          <ui-btn variant="secondary" (click)="flagOpen.set(false)">取消</ui-btn>
          <ui-btn variant="primary" (click)="submitFlag()">生成修正建议</ui-btn>
        </div>
      </ui-modal>
    } @else {
      <div class="page">
        <ui-empty
          title="文档不存在"
          [hint]="'未找到文档 ' + docId + '，可能已被移除或链接有误。请返回资料管理重新选择。'"
          icon="file"
        />
      </div>
    }
  `,
  styles: [
    `
      .back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ink-3);
        margin-bottom: 2px;
      }
      .back:hover {
        color: var(--accent);
      }
      .back ui-icon {
        transform: rotate(180deg);
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .viewer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: var(--sp-4);
        align-items: start;
      }
      .doc-page {
        border: 1px solid var(--line);
        background: var(--surface);
        scroll-margin-top: 80px;
      }
      .doc-page--active {
        border-color: var(--accent);
        box-shadow: inset 3px 0 0 var(--accent);
      }
      .doc-page__hd {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 16px;
        border-bottom: 1px solid var(--line);
        background: var(--bg-subtle);
        flex-wrap: wrap;
      }
      .doc-page__hd .mono {
        font-size: 12px;
        color: var(--ink-2);
      }
      .doc-page__sec {
        font-size: 13px;
        color: var(--ink);
      }
      .doc-page__bd {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px 18px;
      }
      .doc-line {
        margin: 0;
        font-size: 14px;
        line-height: 1.75;
        color: var(--ink);
      }
      .hl-wrap {
        display: inline;
        border: none;
        background: none;
        padding: 0;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      .hl-wrap:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .hl {
        background: var(--accent-weak);
        color: var(--ink);
        border-bottom: 2px solid var(--accent);
        padding: 1px 2px;
      }
      .hl--on {
        border-bottom-width: 3px;
        background: #dde4fb;
      }
      .anc-list {
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .anc {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
      }
      .anc:last-child {
        border-bottom: none;
      }
      .anc--active {
        background: var(--accent-weak);
        box-shadow: inset 3px 0 0 var(--accent);
      }
      .anc__main {
        display: flex;
        flex-direction: column;
        gap: 3px;
        border: none;
        background: none;
        padding: 0;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      .anc__main:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .anc__label {
        font-size: 13px;
        color: var(--ink);
      }
      .anc__bar {
        flex: 1;
        min-width: 0;
      }
      .quote {
        border-left: 2px solid var(--accent);
        background: var(--bg-subtle);
        padding: 10px 12px;
      }
      @media (max-width: 1024px) {
        .viewer {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
})
export class DocumentView implements OnInit {
  private readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly reasons = CORRECT_REASONS;

  projectId = '';
  docId = '';

  readonly activeAnchor = signal<string | null>(null);
  readonly evidenceModal = signal<PageAnchor | null>(null);
  readonly flagOpen = signal(false);
  readonly flagged = signal(false);
  readonly reason = signal(CORRECT_REASONS[0]);
  readonly note = signal('');
  readonly flagError = signal('');

  readonly doc = computed(() => this.store.documentById(this.docId));
  readonly anchors = computed(() => PAGE_ANCHORS.filter((a) => a.documentId === this.docId));

  readonly pages = computed<RenderPage[]>(() => {
    const raw = DOC_PAGES[this.docId] ?? [];
    const anchors = this.anchors();
    return raw.map((p) => ({
      page: p.page,
      section: p.section,
      lines: p.lines.map((line) => splitLine(line, anchors)),
    }));
  });

  readonly activeAnchorObj = computed(() => this.anchors().find((a) => a.id === this.activeAnchor()) ?? null);

  readonly focusPageLabel = computed(() => {
    const a = this.activeAnchorObj();
    if (a) return 'P.' + a.page;
    const first = this.pages()[0];
    return first ? 'P.' + first.page : '—';
  });

  readonly focusSection = computed(() => {
    const a = this.activeAnchorObj();
    if (a) return a.section;
    const first = this.pages()[0];
    return first ? first.section : '未提供正文章节';
  });

  readonly focusPageNumber = computed(() => this.activeAnchorObj()?.page ?? null);

  readonly position = computed(() => {
    const list = this.anchors();
    const idx = list.findIndex((a) => a.id === this.activeAnchor());
    return idx < 0 ? '0 / ' + list.length : idx + 1 + ' / ' + list.length;
  });

  readonly pageRange = computed(() => {
    const list = this.pages().map((p) => 'P.' + p.page);
    return list.length > 0 ? list.join('、') : '无正文';
  });

  readonly fallbackTitle = computed(() => {
    const d = this.doc();
    if (!d) return '文档不存在';
    if (d.parseStatus === 'failed') return '解析失败，无可检索正文';
    if (d.parseStatus === 'review') return '该文档需人工核对，未提供正文片段';
    return '该文档未提供逐页正文';
  });

  readonly fallbackHint = computed(() => {
    const d = this.doc();
    if (!d) return '';
    if (d.parseStatus === 'failed') {
      return `质量分 ${d.qualityScore}，文本层为空或 OCR 置信度不足，解析已中止。请上传可检索版本，或在参数矩阵中人工录入并标注「证据不足」。`;
    }
    if (d.parseStatus === 'review') {
      return `质量分 ${d.qualityScore}，低于 70 的资料必须人工核对后才能进入参数抽取。可回到资料管理，在解析异常面板逐项处理。`;
    }
    return '演示数据仅包含 doc-01 / doc-02 / doc-03 的逐页正文片段；该文档只保留锚点摘要，因此不渲染页码正文。';
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const id = params.get('id');
    const docId = params.get('docId');
    this.projectId = id ?? this.store.activeProjectId();
    if (id) this.store.setActiveProject(id);
    this.docId = docId ?? '';

    const qp = this.route.snapshot.queryParamMap;
    const key = qp.get('key');
    const rawPage = qp.get('page');
    const parsed = rawPage === null || rawPage === '' ? Number.NaN : Number(rawPage);
    const page = Number.isFinite(parsed) ? parsed : null;
    const list = this.anchors();
    const match =
      (key ? list.find((a) => a.paramKey === key && (page === null || a.page === page)) : undefined) ??
      (key ? list.find((a) => a.paramKey === key) : undefined) ??
      (page !== null ? list.find((a) => a.page === page) : undefined);
    if (match) {
      this.activeAnchor.set(match.id);
      setTimeout(() => this.scrollTo(match.page));
    }
  }

  typeLabel(): string {
    const d = this.doc();
    return d ? DOC_TYPE_LABEL[d.type] : '—';
  }
  reliabilityLabel(): string {
    const d = this.doc();
    return d ? RELIABILITY_LABEL[d.reliability] : '来源未知';
  }
  reliabilityTone(): Tone {
    const d = this.doc();
    return d ? RELIABILITY_TONE[d.reliability] : 'neutral';
  }
  statusLabel(): string {
    const d = this.doc();
    return d ? PARSE_STATUS_LABEL[d.parseStatus] : '—';
  }
  statusTone(): Tone {
    const d = this.doc();
    return d ? PARSE_STATUS_TONE[d.parseStatus] : 'neutral';
  }
  statusIcon(): string {
    const d = this.doc();
    const status: ParseStatus = d ? d.parseStatus : 'queued';
    switch (status) {
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
  confTone(v: number): Tone {
    return confidenceTone(v);
  }
  pct(v: number): string {
    return fmtPct(v);
  }
  anchorCountOnPage(page: number): number {
    return this.anchors().filter((a) => a.page === page).length;
  }
  labelOf(id: string | null): string {
    if (!id) return '';
    return this.anchors().find((a) => a.id === id)?.paramLabel ?? id;
  }

  activate(a: PageAnchor): void {
    this.activeAnchor.set(a.id);
    this.scrollTo(a.page);
  }

  activateById(id: string | null): void {
    if (!id) return;
    const a = this.anchors().find((x) => x.id === id);
    if (a) this.activate(a);
  }

  step(delta: number): void {
    const list = this.anchors();
    if (list.length === 0) return;
    const idx = list.findIndex((a) => a.id === this.activeAnchor());
    const next = idx < 0 ? (delta > 0 ? 0 : list.length - 1) : (idx + delta + list.length) % list.length;
    this.activate(list[next]);
  }

  locate(a: PageAnchor | null): void {
    this.evidenceModal.set(null);
    if (a) this.activate(a);
  }

  openFlag(): void {
    this.reason.set(this.reasons[0]);
    this.note.set('');
    this.flagError.set('');
    this.flagOpen.set(true);
  }

  submitFlag(): void {
    const d = this.doc();
    if (!d) return;
    const reason = this.reason();
    const note = this.note().trim();
    if (!reason) {
      this.flagError.set('请选择问题类型');
      return;
    }
    if (reason === '其他' && note.length < 4) {
      this.flagError.set('请说明具体问题（至少 4 个字）');
      return;
    }
    this.store.pushAudit('correct', `${d.name} 修正建议`, note ? `${reason}：${note}` : reason);
    this.flagged.set(true);
    this.flagOpen.set(false);
    this.note.set('');
    this.flagError.set('');
    this.toast.push('已生成修正建议（待审核）', 'ok', `${d.name} · ${reason}`);
  }

  private scrollTo(page: number): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('page-' + page);
    if (!el) {
      this.toast.push('该页不在演示片段中', 'warn', `正文片段仅含 ${this.pageRange()}，可在右侧锚点列表中查看该处原文摘要`);
      return;
    }
    el.scrollIntoView({ block: 'center' });
    el.focus();
  }
}
