import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AppConfig,
  Artifact,
  ArtifactContent,
  RunEvent,
  RunSummary,
  RunView,
  ToolView,
  abortRun,
  applyEvent,
  createRun,
  emptyView,
  errorMessage,
  fetchArtifact,
  fetchConfig,
  fetchRun,
  fetchRuns,
  formatBytes,
  formatCost,
  formatDuration,
  formatTokens,
  lastSeqOf,
  normalizeArtifactPath,
  noticeBlock,
  shortPrompt,
  startView,
  viewFromRecord,
} from '../../core/runner';
import { Tone } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Drawer } from '../../shared/ui/drawer';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { ToastService } from '../../shared/ui/toast.service';
import { MdBlock, MdInline, parseMarkdown } from './markdown';

const STATUS_LABEL: Record<string, string> = {
  idle: '待命',
  running: '执行中',
  succeeded: '已完成',
  failed: '失败',
  aborted: '已中止',
};

const KIND_LABEL: Record<string, string> = {
  markdown: 'MD',
  json: 'JSON',
  csv: 'CSV',
  code: 'CODE',
  text: 'TXT',
};

@Component({
  selector: 'app-assistant',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, FormsModule, Badge, Btn, Drawer, Empty, Icon],
  template: `
    <!-- markdown 渲染模板：块 + 行内 token，全程不注入 HTML -->
    <ng-template #mdBlocks let-blocks>
      <ng-template #inl let-list>
        @for (i of list; track $index) {
          @switch (i.kind) {
            @case ('code') {
              <code class="md__code">{{ i.text }}</code>
            }
            @case ('strong') {
              <strong>{{ i.text }}</strong>
            }
            @case ('em') {
              <em>{{ i.text }}</em>
            }
            @case ('link') {
              <a [href]="i.href" target="_blank" rel="noopener">{{ i.text }}</a>
            }
            @default {<ng-container>{{ i.text }}</ng-container>}
          }
        }
      </ng-template>

      @for (b of blocks; track $index) {
        @switch (b.kind) {
          @case ('heading') {
            <p class="md__h" [class.md__h--1]="level(b) === 1">
              <ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: inlines(b) }" />
            </p>
          }
          @case ('list') {
            <ul class="md__list" [class.md__list--num]="ordered(b)">
              @for (item of items(b); track $index) {
                <li><ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: item }" /></li>
              }
            </ul>
          }
          @case ('code') {
            <div class="codeblk">
              <div class="codeblk__bar">
                <span class="mono">{{ langOf(b) || 'text' }}</span>
                <button type="button" class="link-btn small" (click)="copy(codeOf(b))">复制</button>
              </div>
              <pre class="codeblk__pre">{{ codeOf(b) }}</pre>
            </div>
          }
          @case ('quote') {
            <blockquote class="md__quote">
              <ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: inlines(b) }" />
            </blockquote>
          }
          @case ('table') {
            <div class="table-wrap">
              <table class="table table--compact">
                <thead>
                  <tr>
                    @for (cell of tableHead(b); track $index) {
                      <th><ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: cell }" /></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of tableRows(b); track $index) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td><ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: cell }" /></td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('hr') {
            <hr class="md__hr" />
          }
          @default {
            <p class="md__p"><ng-container [ngTemplateOutlet]="inl" [ngTemplateOutletContext]="{ $implicit: inlines(b) }" /></p>
          }
        }
      }
    </ng-template>

    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">AI 助手</h1>
          <p class="page-sub">
            每轮新建 pi 会话并装载技能，思考 / 工具 / 正文按到达顺序回放；产出文件可点开查看
          </p>
        </div>
        <div class="page-actions">
          <span class="row small muted">
            <span class="dot" [class.dot--ok]="status() === 'succeeded'" [class.dot--warn]="running()" [class.dot--danger]="status() === 'failed'"></span>
            {{ statusLabel() }}
          </span>
          <ui-btn variant="secondary" size="sm" icon="refresh" (click)="reload()">刷新历史</ui-btn>
          <ui-btn variant="primary" size="sm" icon="plus" (click)="newRun()">新建对话</ui-btn>
        </div>
      </header>

      @if (configError()) {
        <div class="banner banner--danger section">
          <ui-icon name="alert" [size]="16" />
          <div class="stack stack--tight" style="flex: 1 1 auto">
            <strong class="small">后端没有响应</strong>
            <span class="small">{{ configError() }}</span>
            <span class="small muted">页面结构已就绪，启动 /api 服务后点「重试连接」即可。</span>
          </div>
          <ui-btn variant="secondary" size="sm" icon="refresh" (click)="reload()">重试连接</ui-btn>
        </div>
      }

      <div class="grid grid--sidebar chat">
        <section class="card chat__main">
          <div class="card-hd">
            <div class="stack stack--tight">
              <h2 class="card-title truncate">{{ headTitle() }}</h2>
              <span class="card-sub">{{ headSub() }}</span>
            </div>
            <ui-badge [label]="statusLabel()" [tone]="statusTone()" />
          </div>

          <div class="chat__scroll" #scroller (scroll)="onScroll()">
            @if (!booted()) {
              <div class="stack stack--tight">
                <span class="skeleton" style="width: 38%"></span>
                <span class="skeleton" style="width: 72%"></span>
                <span class="skeleton" style="width: 55%"></span>
              </div>
            } @else if (view().blocks.length === 0) {
              <ui-empty
                icon="chat"
                title="还没有对话"
                hint="在下方输入任务，选好技能后回车发送。运行中的会话会实时推送思考、工具调用与正文。"
              />
            } @else {
              @for (block of view().blocks; track block.key) {
                @switch (block.kind) {
                  @case ('user') {
                    <div class="msg msg--user">
                      <div class="msg__label msg__label--me">你</div>
                      <div class="msg__body">
                        @if (block.skill) {
                          <span class="tag">/skill:{{ block.skill }}</span>
                        }
                        <div class="bubble">{{ block.text }}</div>
                      </div>
                    </div>
                  }
                  @case ('notice') {
                    <div class="msg">
                      <div class="msg__label">系统</div>
                      <div class="msg__body">
                        <div
                          class="banner"
                          [class.banner--danger]="block.tone === 'error'"
                          [class.banner--info]="block.tone === 'info'"
                        >
                          <ui-icon [name]="block.tone === 'error' ? 'alert' : 'info'" [size]="16" />
                          <div class="stack stack--tight" style="flex: 1 1 auto">
                            <strong class="small">{{ block.title }}</strong>
                            @if (block.text) {
                              <span class="small mono">{{ block.text }}</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  @default {
                    <div class="msg">
                      <div class="msg__label msg__label--pi">{{ view().skill ? 'pi · ' + view().skill : 'pi' }}</div>
                      <div class="msg__body">
                        @for (seg of block.segments; track seg.key) {
                          @switch (seg.kind) {
                            @case ('thinking') {
                              <div class="fold">
                                <button type="button" class="fold__hd" (click)="toggleThinking(seg.key)">
                                  <ui-icon name="bulb" [size]="13" />
                                  <span class="strong">思考过程 · {{ seg.text.length }} 字</span>
                                  <span class="fold__meta mono">{{ thinkingOpen(seg.key) ? '收起' : '展开' }}</span>
                                  <ui-icon [name]="thinkingOpen(seg.key) ? 'chevron-down' : 'chevron-right'" [size]="12" />
                                </button>
                                @if (thinkingOpen(seg.key)) {
                                  <pre class="fold__bd">{{ seg.text }}</pre>
                                }
                              </div>
                            }
                            @case ('tool') {
                              @if (seg.tool; as tool) {
                                <div class="tool" [class.tool--error]="tool.status === 'error'">
                                  <button type="button" class="fold__hd" (click)="toggleTool(seg.key)">
                                    @if (tool.status === 'running') {
                                      <span class="spinner"></span>
                                    } @else if (tool.status === 'error') {
                                      <span class="text-danger">!</span>
                                    } @else {
                                      <ui-icon name="check" [size]="13" class="text-ok" />
                                    }
                                    <span class="tool__name">{{ tool.label }}</span>
                                    @if (tool.title) {
                                      <span class="tool__title mono">{{ tool.title }}</span>
                                    }
                                    <span class="fold__meta mono">{{ toolMeta(tool) }}</span>
                                    <ui-icon [name]="toolOpen(seg.key) ? 'chevron-down' : 'chevron-right'" [size]="12" />
                                  </button>
                                  @if (toolOpen(seg.key)) {
                                    <div class="tool__bd">
                                      <span class="label">参数</span>
                                      <pre class="tool__pre">{{ argsText(tool) }}</pre>
                                      @if (tool.preview) {
                                        <span class="label">结果</span>
                                        <pre class="tool__pre">{{ tool.preview }}</pre>
                                      }
                                    </div>
                                  }
                                </div>
                              }
                            }
                            @default {
                              <div class="md">
                                <ng-container
                                  [ngTemplateOutlet]="mdBlocks"
                                  [ngTemplateOutletContext]="{ $implicit: md(seg.text) }"
                                />
                              </div>
                            }
                          }
                        }
                        @if (block.streaming && block.segments.length === 0) {
                          <div class="row small muted"><span class="spinner"></span>pi 正在思考…</div>
                        }
                      </div>
                    </div>
                  }
                }
              }
            }

            @if (running()) {
              <div class="row small muted"><span class="spinner"></span>pi 正在执行技能…</div>
            }

            @if (artifacts().length > 0) {
              <div class="stack stack--tight">
                <span class="label">本轮产出 {{ artifacts().length }} 个文件 · 点击查看</span>
                @for (a of artifacts(); track a.path) {
                  <button type="button" class="art" [title]="a.path" (click)="openArtifact(a.path)">
                    <span class="art__kind mono">{{ kindLabel(a.kind) }}</span>
                    <span class="art__body">
                      <span class="art__name truncate">{{ a.name }}</span>
                      <span class="art__dir mono truncate">{{ a.dir || '工作区根目录' }}</span>
                    </span>
                    <span class="art__size mono">{{ bytes(a.size) }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="card-ft chat__ft">
            @if (requestError()) {
              <div class="banner banner--danger">
                <ui-icon name="alert" [size]="16" />
                <span class="small" style="flex: 1 1 auto">{{ requestError() }}</span>
                <button type="button" class="link-btn small" (click)="dismissError()">关闭</button>
              </div>
            }
            <div class="row row--wrap">
              <span class="label">技能</span>
              @for (s of skills(); track s.name) {
                <button
                  type="button"
                  class="chip"
                  [class.chip--active]="selectedSkill() === s.name"
                  [title]="s.description"
                  (click)="selectedSkill.set(s.name)"
                >
                  {{ s.name }}
                  @if (s.name === config()?.defaultSkill) {
                    <span class="chip__count">默认</span>
                  }
                </button>
              }
              <button
                type="button"
                class="chip"
                [class.chip--active]="selectedSkill() === null"
                title="不加载技能，直接与 agent 对话"
                (click)="selectedSkill.set(null)"
              >
                无技能
              </button>
            </div>
            <textarea
              class="input"
              rows="3"
              aria-label="技能任务输入"
              placeholder="描述这次要跑的任务，例如：帮我做一次中标复盘，项目 CZ-Morava 320MWh…"
              [ngModel]="draft()"
              (ngModelChange)="draft.set($event)"
              (keydown)="onKeydown($event)"
            ></textarea>
            <div class="row row--between">
              <span class="hint">Enter 发送 · Shift+Enter 换行 · 运行中不可发送</span>
              <div class="row">
                @if (running()) {
                  <ui-btn variant="danger" size="sm" icon="x" (click)="stop()">停止</ui-btn>
                } @else {
                  <ui-btn variant="primary" size="sm" icon="arrow-up" [disabled]="!canSend()" (click)="send()">发送</ui-btn>
                }
              </div>
            </div>
          </div>
        </section>

        <aside class="stack stack--tight">
          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">运行状态</h2>
              <span class="card-sub">本轮</span>
            </div>
            <div class="card-bd stack stack--tight">
              <div class="row small">
                <span
                  class="dot"
                  [class.dot--ok]="status() === 'succeeded'"
                  [class.dot--warn]="running()"
                  [class.dot--danger]="status() === 'failed'"
                ></span>
                <span>{{ statusLabel() }}</span>
              </div>
              <dl class="kv">
                <dt>用时</dt>
                <dd class="mono">{{ elapsedText() }}</dd>
                <dt>Token</dt>
                <dd class="mono">{{ tokenText() }}</dd>
                <dt>成本</dt>
                <dd class="mono">{{ costText() }}</dd>
                <dt>工具调用</dt>
                <dd class="mono">{{ toolCount() }}</dd>
                <dt>事件</dt>
                <dd class="mono">{{ view().eventCount }}</dd>
                <dt>模型</dt>
                <dd class="mono">{{ modelText() }}</dd>
                <dt>技能</dt>
                <dd class="mono">{{ skillText() }}</dd>
              </dl>
            </div>
          </section>

          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">pi 会话</h2>
              <span class="card-sub">点击 session 复制</span>
            </div>
            <div class="card-bd stack stack--tight">
              <button type="button" class="link-btn mono small truncate" [title]="sessionText()" (click)="copySession()">
                {{ sessionText() }}
              </button>
              <div class="stack stack--tight">
                <span class="label">工具集</span>
                <span class="small mono muted">{{ toolsText() }}</span>
              </div>
              <div class="stack stack--tight">
                <span class="label">工作区</span>
                <span class="small mono muted truncate" [title]="workspace()">{{ workspace() }}</span>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">产出文件</h2>
              <span class="card-sub mono">{{ artifacts().length }}</span>
            </div>
            <div class="card-bd card-bd--flush">
              @if (artifacts().length === 0) {
                <p class="small muted pad">本轮还没有产出文件</p>
              } @else {
                <div class="stack stack--tight pad">
                  @for (a of artifacts(); track a.path) {
                    <button type="button" class="art" [title]="a.path" (click)="openArtifact(a.path)">
                      <span class="art__kind mono">{{ kindLabel(a.kind) }}</span>
                      <span class="art__body">
                        <span class="art__name truncate">{{ a.name }}</span>
                        <span class="art__dir mono truncate">{{ a.dir || '工作区根目录' }}</span>
                      </span>
                      <span class="art__size mono">{{ bytes(a.size) }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          </section>

          <section class="card">
            <div class="card-hd">
              <h2 class="card-title">历史运行</h2>
              <span class="card-sub mono">{{ runs().length }}</span>
            </div>
            <div class="card-bd card-bd--flush">
              @if (runs().length === 0) {
                <p class="small muted pad">还没有运行记录</p>
              } @else {
                @for (r of runs(); track r.id) {
                  <button type="button" class="run" [class.run--active]="r.id === view().id" [title]="r.prompt" (click)="selectRun(r.id)">
                    <span
                      class="run__dot dot"
                      [class.dot--ok]="r.status === 'succeeded'"
                      [class.dot--warn]="r.status === 'running'"
                      [class.dot--danger]="r.status === 'failed'"
                    ></span>
                    <span class="run__body">
                      <span class="run__prompt truncate">{{ promptOf(r.prompt) }}</span>
                      <span class="run__meta">{{ runMeta(r) }}</span>
                    </span>
                  </button>
                }
              }
            </div>
          </section>
        </aside>
      </div>
    </div>

    <ui-drawer [open]="viewerOpen()" [title]="viewerTitle()" (close)="closeViewer()">
      <div class="stack">
        @if (artifactBusy()) {
          <div class="row small muted"><span class="spinner"></span>读取文件中…</div>
        } @else if (artifactError()) {
          <div class="banner banner--danger">
            <ui-icon name="alert" [size]="16" />
            <span class="small">{{ artifactError() }}</span>
          </div>
        } @else if (artifact(); as doc) {
          <div class="row row--between row--wrap">
            <span class="mono small muted">{{ doc.path }} · {{ bytes(doc.size) }} · {{ doc.kind }}</span>
            <ui-btn variant="secondary" size="sm" icon="file" (click)="copy(doc.content)">复制内容</ui-btn>
          </div>
          @if (doc.truncated) {
            <div class="banner banner--warn">
              <ui-icon name="alert" [size]="16" />
              <span class="small">文件较大，仅显示前一部分内容。</span>
            </div>
          }
          @if (doc.kind === 'binary') {
            <ui-empty icon="lock" title="二进制文件无法预览" [hint]="'该文件大小 ' + bytes(doc.size) + '，请在本地打开查看。'" />
          } @else if (doc.kind === 'markdown') {
            <div class="md">
              <ng-container [ngTemplateOutlet]="mdBlocks" [ngTemplateOutletContext]="{ $implicit: md(doc.content) }" />
            </div>
          } @else {
            <pre class="codeblk__pre codeblk__pre--flat">{{ doc.kind === 'json' ? prettyJson(doc.content) : doc.content }}</pre>
          }
        }
      </div>
    </ui-drawer>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .chat {
        align-items: start;
      }
      .chat__main {
        display: flex;
        flex-direction: column;
        height: clamp(440px, calc(100dvh - 240px), 860px);
      }
      .chat__scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
        padding: var(--sp-4);
      }
      .chat__ft {
        flex-direction: column;
        align-items: stretch;
        gap: var(--sp-2);
        background: var(--surface);
      }
      .chat__ft textarea {
        resize: vertical;
      }
      .pad {
        padding: var(--sp-3) var(--sp-4);
      }

      /* ---------------- 消息 ---------------- */
      .msg {
        display: grid;
        grid-template-columns: 68px minmax(0, 1fr);
        gap: var(--sp-3);
      }
      .msg__label {
        font-size: 11px;
        color: var(--ink-3);
        text-align: right;
        padding-top: 3px;
        overflow-wrap: anywhere;
      }
      .msg__label--me {
        color: var(--ink-2);
        font-weight: 500;
      }
      .msg__label--pi {
        color: var(--accent);
      }
      .msg__body {
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        min-width: 0;
      }
      .bubble {
        border: 1px solid var(--line);
        background: var(--bg-subtle);
        padding: var(--sp-3);
        font-size: 13px;
        line-height: 1.65;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      /* ---------------- 折叠块（思考 / 工具） ---------------- */
      .fold,
      .tool {
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .tool--error {
        border-color: #e7b4ae;
      }
      .fold__hd {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        width: 100%;
        padding: 5px var(--sp-2);
        border: none;
        background: transparent;
        font: inherit;
        font-size: 12px;
        color: var(--ink-2);
        text-align: left;
        cursor: pointer;
      }
      .fold__hd:hover {
        background: var(--bg-subtle);
      }
      .fold__meta {
        font-size: 11px;
        color: var(--ink-3);
        white-space: nowrap;
      }
      .tool__name {
        color: var(--ink);
        font-weight: 500;
        white-space: nowrap;
      }
      .tool__title {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ink-3);
        font-size: 11px;
      }
      .fold__bd {
        margin: 0;
        padding: var(--sp-2) var(--sp-3);
        border-top: 1px dashed var(--line-strong);
        font-family: var(--font-sans);
        font-size: 12px;
        line-height: 1.7;
        color: var(--ink-2);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: 260px;
        overflow-y: auto;
      }
      .tool__bd {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
        padding: var(--sp-2);
        border-top: 1px solid var(--line);
      }
      .tool__pre {
        margin: 0;
        padding: var(--sp-2);
        background: var(--bg-subtle);
        border: 1px solid var(--line);
        font-family: var(--font-mono);
        font-size: 11px;
        line-height: 1.55;
        max-height: 240px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      /* ---------------- markdown ---------------- */
      .md {
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        font-size: 13px;
        line-height: 1.75;
        overflow-wrap: anywhere;
      }
      .md__p {
        margin: 0;
        white-space: pre-wrap;
      }
      .md__h {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      .md__h--1 {
        font-size: 16px;
      }
      .md__list {
        margin: 0;
        padding-left: var(--sp-5);
        list-style: square;
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
      }
      .md__list--num {
        list-style: decimal;
      }
      .md__quote {
        margin: 0;
        padding: 2px var(--sp-3);
        border-left: 3px solid var(--line-strong);
        color: var(--ink-2);
      }
      .md__hr {
        width: 100%;
        margin: 0;
        border: none;
        border-top: 1px solid var(--line);
      }
      .md__code {
        font-family: var(--font-mono);
        font-size: 12px;
        background: var(--accent-weak);
        color: var(--ink);
        padding: 0 4px;
      }
      .codeblk {
        border: 1px solid var(--line);
        background: var(--bg-subtle);
        min-width: 0;
      }
      .codeblk__bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-2);
        padding: 2px var(--sp-2);
        border-bottom: 1px solid var(--line);
        font-size: 11px;
        color: var(--ink-3);
      }
      .codeblk__pre {
        margin: 0;
        padding: var(--sp-3);
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre;
      }
      .codeblk__pre--flat {
        border: 1px solid var(--line);
        background: var(--bg-subtle);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      /* ---------------- 产物卡片 ---------------- */
      .art {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--sp-2);
        padding: 5px var(--sp-2);
        border: 1px solid var(--line);
        background: var(--surface);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .art:hover {
        background: var(--bg-subtle);
        border-color: var(--line-strong);
      }
      .art__kind {
        font-size: 10px;
        letter-spacing: 0.04em;
        color: var(--ink-3);
        border: 1px solid var(--line);
        padding: 0 4px;
      }
      .art__body {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .art__name {
        font-size: 12px;
        color: var(--ink);
      }
      .art__dir,
      .art__size {
        font-size: 10px;
        color: var(--ink-3);
      }

      /* ---------------- 历史运行 ---------------- */
      .run {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--sp-2);
        width: 100%;
        padding: 8px var(--sp-3);
        border: none;
        border-bottom: 1px solid var(--line);
        border-left: 3px solid transparent;
        background: var(--surface);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .run:last-child {
        border-bottom: none;
      }
      .run:hover {
        background: var(--bg-subtle);
      }
      .run--active {
        background: var(--accent-weak);
        border-left-color: var(--accent);
      }
      .run__dot {
        margin-top: 5px;
      }
      .run__body {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .run__prompt {
        font-size: 12px;
        color: var(--ink);
      }
      .run__meta {
        font-size: 11px;
        color: var(--ink-3);
      }

      @media (max-width: 768px) {
        .msg {
          grid-template-columns: minmax(0, 1fr);
          gap: var(--sp-1);
        }
        .msg__label {
          text-align: left;
        }
        .chat__main {
          height: auto;
        }
        .chat__scroll {
          max-height: 70dvh;
        }
      }
    `,
  ],
})
export class Assistant {
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly configError = signal<string | null>(null);
  protected readonly runs = signal<RunSummary[]>([]);
  protected readonly view = signal<RunView>(emptyView());
  protected readonly draft = signal('');
  protected readonly selectedSkill = signal<string | null>(null);
  protected readonly requestError = signal<string | null>(null);
  protected readonly booted = signal(false);
  protected readonly clock = signal(Date.now());
  protected readonly viewerPath = signal<string | null>(null);
  protected readonly artifact = signal<ArtifactContent | null>(null);
  protected readonly artifactBusy = signal(false);
  protected readonly artifactError = signal<string | null>(null);

  private readonly config = signal<AppConfig | null>(null);
  private readonly openFolds = signal<ReadonlySet<string>>(new Set<string>());
  private readonly mdCache = new Map<string, MdBlock[]>();

  private source: EventSource | null = null;
  private pending: RunEvent[] = [];
  private frame: number | null = null;
  private stick = true;

  protected readonly status = computed(() => this.view().status);
  protected readonly running = computed(() => this.status() === 'running');
  protected readonly skills = computed(() => this.config()?.skills ?? []);
  protected readonly artifacts = computed(() => this.view().artifacts);
  protected readonly workspace = computed(() => this.config()?.workspace ?? '—');
  protected readonly canSend = computed(() => this.draft().trim().length > 0 && !this.running());
  protected readonly viewerOpen = computed(() => this.viewerPath() !== null);
  protected readonly viewerTitle = computed(() => {
    const path = this.viewerPath();
    if (!path) return '文件预览';
    return path.split('/').pop() ?? path;
  });

  protected readonly statusLabel = computed(() => STATUS_LABEL[this.status()] ?? this.status());
  protected readonly statusTone = computed<Tone>(() => {
    const status = this.status();
    if (status === 'running') return 'info';
    if (status === 'succeeded') return 'ok';
    if (status === 'failed') return 'danger';
    if (status === 'aborted') return 'neutral';
    return 'dashed';
  });

  protected readonly elapsedMs = computed(() => {
    const view = this.view();
    if (view.status === 'running') {
      const started = view.createdAt ?? this.clock();
      return Math.max(0, this.clock() - started);
    }
    return view.durationMs;
  });
  protected readonly elapsedText = computed(() => formatDuration(this.elapsedMs()));
  protected readonly tokenText = computed(() => formatTokens(this.view().usage));
  protected readonly costText = computed(() => formatCost(this.view().usage));
  protected readonly toolCount = computed(() => {
    let total = 0;
    for (const block of this.view().blocks) {
      for (const segment of block.segments) {
        if (segment.kind === 'tool') total += 1;
      }
    }
    return total;
  });
  protected readonly sessionText = computed(() => this.view().session?.sessionId ?? '—');
  protected readonly modelText = computed(() => {
    const session = this.view().session;
    if (session?.model) return `${session.model.provider}/${session.model.id}`;
    const model = this.config()?.model;
    return model ? `${model.provider}/${model.id}` : '由 SDK 解析';
  });
  protected readonly skillText = computed(() => {
    const view = this.view();
    const base = view.skill ?? '无技能';
    return view.skillLoaded ? `${base} · 已加载` : base;
  });
  protected readonly toolsText = computed(() => {
    const tools = this.view().session?.tools ?? [];
    return tools.length > 0 ? tools.join(', ') : '由 SDK 决定';
  });
  protected readonly headTitle = computed(() => {
    const prompt = this.view().prompt;
    return prompt ? shortPrompt(prompt, 56) : '新对话';
  });
  protected readonly headSub = computed(
    () => `${this.statusLabel()} · ${this.elapsedText()} · ${this.view().eventCount} 事件`,
  );

  constructor() {
    effect((onCleanup) => {
      if (this.status() !== 'running') return;
      const timer = setInterval(() => this.clock.set(Date.now()), 1000);
      onCleanup(() => clearInterval(timer));
    });
    this.destroyRef.onDestroy(() => {
      this.closeStream();
      if (this.frame !== null) cancelAnimationFrame(this.frame);
    });
    void this.boot();
  }

  /* ------------------------------------------------------------ 启动与加载 */

  protected reload(): void {
    this.configError.set(null);
    void this.boot();
  }

  private async boot(): Promise<void> {
    try {
      const [config, runs] = await Promise.all([fetchConfig(), fetchRuns()]);
      this.config.set(config);
      this.runs.set(runs);
      this.selectedSkill.set(config.defaultSkill ?? config.skills[0]?.name ?? null);
      const newest = runs[0];
      if (newest) await this.loadRun(newest.id, false);
    } catch (error) {
      this.configError.set(errorMessage(error));
    } finally {
      this.booted.set(true);
    }
  }

  private async refreshRuns(): Promise<void> {
    try {
      this.runs.set(await fetchRuns());
    } catch {
      /* 历史刷新是尽力而为，失败不打断对话 */
    }
  }

  private async loadRun(id: string, notify = true): Promise<void> {
    this.closeStream();
    try {
      const record = await fetchRun(id);
      this.view.set(viewFromRecord(record));
      this.syncErroredTools();
      this.autoScroll(true);
      if (record.status === 'running') this.openStream(record.id, lastSeqOf(record));
    } catch (error) {
      const message = errorMessage(error);
      this.requestError.set(message);
      if (notify) this.toast.push('加载运行失败', 'danger', message);
    }
  }

  protected selectRun(id: string): void {
    if (id === this.view().id) return;
    void this.loadRun(id);
  }

  protected newRun(): void {
    this.closeStream();
    this.view.set(emptyView());
    this.draft.set('');
    this.requestError.set(null);
    this.stick = true;
  }

  /* ------------------------------------------------------------ 发送与中止 */

  protected async send(): Promise<void> {
    const prompt = this.draft().trim();
    if (!prompt || this.running()) return;
    const skill = this.selectedSkill();
    this.requestError.set(null);
    this.draft.set('');
    this.view.set(startView(prompt, skill, null));
    this.autoScroll(true);
    try {
      const record = await createRun(prompt, skill);
      this.view.set(viewFromRecord(record));
      this.syncErroredTools();
      this.autoScroll(true);
      this.openStream(record.id, lastSeqOf(record));
      void this.refreshRuns();
    } catch (error) {
      const message = errorMessage(error);
      this.requestError.set(message);
      this.view.update((current) => ({
        ...current,
        status: 'failed',
        error: message,
        blocks: [...current.blocks, noticeBlock('error', '无法创建 pi 会话', message)],
      }));
    }
  }

  protected async stop(): Promise<void> {
    const id = this.view().id;
    if (!id) return;
    try {
      const aborted = await abortRun(id);
      this.toast.push(aborted ? '已请求中止' : '运行已结束', aborted ? 'warn' : 'info');
    } catch (error) {
      this.requestError.set(errorMessage(error));
    }
  }

  protected dismissError(): void {
    this.requestError.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void this.send();
    }
  }

  /* ------------------------------------------------------------ SSE */

  private openStream(id: string, after: number): void {
    this.closeStream();
    const source = new EventSource(`/api/runs/${encodeURIComponent(id)}/events?after=${after}`);
    this.source = source;
    let lastSeq = after;

    source.onmessage = (message: MessageEvent) => {
      let event: RunEvent;
      try {
        event = JSON.parse(String(message.data)) as RunEvent;
      } catch {
        return;
      }
      if (!event || typeof event.type !== 'string') return;
      if (typeof event.seq === 'number') {
        if (event.seq <= lastSeq) return;
        lastSeq = event.seq;
      }
      this.pending.push(event);
      this.scheduleFlush();
      if (event.type === 'run_end') void this.refreshRuns();
    };
    source.addEventListener('done', () => {
      this.flush();
      this.closeStream();
      void this.refreshRuns();
    });
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        this.flush();
        this.closeStream();
        void this.refreshRuns();
      }
    };
  }

  private closeStream(): void {
    if (this.source) {
      this.source.close();
      this.source = null;
    }
  }

  private scheduleFlush(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.flush();
    });
  }

  private flush(): void {
    if (this.pending.length === 0) return;
    const events = this.pending.splice(0);
    this.view.update((current) => events.reduce((acc, event) => applyEvent(acc, event), current));
    this.syncErroredTools();
    this.autoScroll();
  }

  /* ------------------------------------------------------------ 滚动 */

  protected onScroll(): void {
    const element = this.scroller()?.nativeElement;
    if (!element) return;
    this.stick = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  }

  private autoScroll(force = false): void {
    if (force) this.stick = true;
    setTimeout(() => {
      const element = this.scroller()?.nativeElement;
      if (element && this.stick) element.scrollTop = element.scrollHeight;
    }, 0);
  }

  /* ------------------------------------------------------------ 折叠状态 */

  protected thinkingOpen(key: string): boolean {
    return this.openFolds().has(`think:${key}`);
  }

  protected toggleThinking(key: string): void {
    this.toggleFold(`think:${key}`);
  }

  protected toolOpen(key: string): boolean {
    return this.openFolds().has(`tool:${key}`);
  }

  protected toggleTool(key: string): void {
    this.toggleFold(`tool:${key}`);
  }

  private toggleFold(key: string): void {
    const next = new Set(this.openFolds());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.openFolds.set(next);
  }

  private syncErroredTools(): void {
    let next: Set<string> | null = null;
    for (const block of this.view().blocks) {
      for (const segment of block.segments) {
        if (segment.kind !== 'tool' || segment.tool?.status !== 'error') continue;
        const key = `tool:${segment.key}`;
        if (this.openFolds().has(key)) continue;
        next = next ?? new Set(this.openFolds());
        next.add(key);
      }
    }
    if (next) this.openFolds.set(next);
  }

  /* ------------------------------------------------------------ 产物查看 */

  protected openArtifact(path: string): void {
    const clean = normalizeArtifactPath(path, this.config()?.workspace ?? '');
    this.viewerPath.set(clean);
    this.artifact.set(null);
    this.artifactError.set(null);
    this.artifactBusy.set(true);
    void this.loadArtifact(clean);
  }

  private async loadArtifact(path: string): Promise<void> {
    try {
      const content = await fetchArtifact(path);
      if (this.viewerPath() === path) this.artifact.set(content);
    } catch (error) {
      if (this.viewerPath() === path) this.artifactError.set(errorMessage(error));
    } finally {
      if (this.viewerPath() === path) this.artifactBusy.set(false);
    }
  }

  protected closeViewer(): void {
    this.viewerPath.set(null);
    this.artifact.set(null);
    this.artifactError.set(null);
    this.artifactBusy.set(false);
  }

  /* ------------------------------------------------------------ markdown */

  protected md(text: string): MdBlock[] {
    if (!text) return [];
    const hit = this.mdCache.get(text);
    if (hit) return hit;
    const blocks = parseMarkdown(text);
    if (this.mdCache.size > 400) this.mdCache.clear();
    this.mdCache.set(text, blocks);
    return blocks;
  }

  /** 块字段访问器：让模板在收窄不确定时也能安全取值。 */
  protected inlines(block: MdBlock): MdInline[] {
    return block.kind === 'heading' || block.kind === 'paragraph' || block.kind === 'quote' ? block.inlines : [];
  }

  protected level(block: MdBlock): number {
    return block.kind === 'heading' ? block.level : 1;
  }

  protected ordered(block: MdBlock): boolean {
    return block.kind === 'list' ? block.ordered : false;
  }

  protected items(block: MdBlock): MdInline[][] {
    return block.kind === 'list' ? block.items : [];
  }

  protected codeOf(block: MdBlock): string {
    return block.kind === 'code' ? block.code : '';
  }

  protected langOf(block: MdBlock): string {
    return block.kind === 'code' ? block.lang : '';
  }

  protected tableHead(block: MdBlock): MdInline[][] {
    return block.kind === 'table' ? block.head : [];
  }

  protected tableRows(block: MdBlock): MdInline[][][] {
    return block.kind === 'table' ? block.rows : [];
  }

  /* ------------------------------------------------------------ 展示工具 */

  protected promptOf(prompt: string): string {
    return shortPrompt(prompt, 34);
  }

  protected runMeta(run: RunSummary): string {
    const label = STATUS_LABEL[run.status] ?? run.status;
    return `${label} · ${formatDuration(run.durationMs)} · ${run.artifactCount} 文件`;
  }

  protected kindLabel(kind: Artifact['kind']): string {
    return KIND_LABEL[kind] ?? 'FILE';
  }

  protected bytes(size: number): string {
    return formatBytes(size);
  }

  protected toolMeta(tool: ToolView): string {
    if (tool.status === 'running') return '执行中';
    const label = tool.status === 'error' ? 'failed' : 'ok';
    return tool.durationMs === null ? label : `${label} · ${formatDuration(tool.durationMs)}`;
  }

  protected argsText(tool: ToolView): string {
    try {
      return JSON.stringify(tool.args ?? {}, null, 2);
    } catch {
      return String(tool.args);
    }
  }

  protected prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw) as unknown, null, 2);
    } catch {
      return raw;
    }
  }

  protected copy(value: string): void {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => this.toast.push('已复制', 'ok'))
      .catch(() => this.toast.push('复制失败', 'danger', '浏览器拒绝了剪贴板访问'));
  }

  protected copySession(): void {
    const id = this.view().session?.sessionId;
    if (!id) return;
    this.copy(id);
  }
}
