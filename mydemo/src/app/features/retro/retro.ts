import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store';
import { COUNTRY_LABEL, fmtDate, fmtDateTime } from '../../core/format';
import { COMPETITORS } from '../../core/mock/competitors';
import {
  AwardedProject,
  Country,
  EvidenceLevel,
  Experience,
  FulfilmentRecord,
  Tone,
  WinFactor,
  WinFactorCategory,
} from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { TabItem, Tabs } from '../../shared/ui/tabs';
import { ToastService } from '../../shared/ui/toast.service';

interface LevelCounts {
  A: number;
  B: number;
  C: number;
}

interface LevelCard {
  level: EvidenceLevel;
  key: string;
  icon: string;
  tag: string;
  title: string;
  hint: string;
}

interface FactorView {
  factor: WinFactor;
  shownLevel: EvidenceLevel;
  downgraded: boolean;
  cardKey: string;
}

interface LevelGroup extends LevelCard {
  items: FactorView[];
}

interface ProjectRow {
  project: AwardedProject;
  counts: LevelCounts;
}

interface ExpBlock {
  key: string;
  title: string;
  hint: string;
  items: Experience[];
}

interface StatusMeta {
  label: string;
  tone: Tone;
  icon: string;
}

const LEVEL_ORDER: Record<EvidenceLevel, number> = { A: 1, B: 2, C: 3 };
const LEVEL_WORD: Record<EvidenceLevel, string> = { A: '已证实', B: '多材料', C: '待验证' };
const LEVEL_ICON: Record<EvidenceLevel, string> = { A: 'check', B: 'doc', C: 'help' };

const LEVEL_CARDS: LevelCard[] = [
  { level: 'A', key: 'a', icon: 'check', tag: '已证实', title: '已证实优势（A 级）', hint: '有正式评分表、客户书面认可等直接证据，可直接写入策略建议' },
  { level: 'B', key: 'b', icon: 'doc', tag: '多材料', title: '可能原因（B 级）', hint: '投标文件、澄清记录、谈判记录共同指向，可作参照但必须注明限制' },
  { level: 'C', key: 'c', icon: 'help', tag: '待验证', title: '待验证假设（C 级）', hint: '只有结果、没有因果证据，只能标注为假设' },
];

const CATEGORY_LABEL: Record<WinFactorCategory, string> = {
  delivery: '交付',
  efficiency: '效率',
  safety: '安全',
  compliance: '合规',
  price: '商务',
  tco: 'TCO',
  local: '本地服务',
  reference: '业绩',
};

const FULFIL_META: Record<FulfilmentRecord['status'], StatusMeta> = {
  met: { label: '已达成', tone: 'ok', icon: 'check' },
  partial: { label: '部分达成', tone: 'warn', icon: 'alert' },
  missed: { label: '未达成', tone: 'danger', icon: 'x' },
  pending: { label: '履约中', tone: 'neutral', icon: 'clock' },
};

const EXP_STATE_META: Record<Experience['state'], StatusMeta> = {
  draft: { label: '待复核', tone: 'warn', icon: 'clock' },
  verified: { label: '已复核', tone: 'ok', icon: 'check' },
  deprecated: { label: '已停用', tone: 'dashed', icon: 'lock' },
};

/** BR-13：无正式评分表的项目，A 级最高只能按 B 级展示（只改口径，不改数据） */
function effectiveLevel(project: AwardedProject, factor: WinFactor): EvidenceLevel {
  return !project.hasScoreSheet && factor.level === 'A' ? 'B' : factor.level;
}

function countLevels(project: AwardedProject): LevelCounts {
  const counts: LevelCounts = { A: 0, B: 0, C: 0 };
  for (const factor of project.factors) counts[effectiveLevel(project, factor)] += 1;
  return counts;
}

@Component({
  selector: 'app-retro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Badge, Btn, Empty, Icon, Modal, Tabs],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">中标复盘</h1>
          <p class="page-sub">
            v1.1 补齐投标后闭环：从 {{ rows().length }} 个中标项目的 {{ totalFactors() }} 条因素中区分「已证实」与「以为」，再用履约结果反向校准
          </p>
        </div>
        <div class="page-actions">
          <a class="ghost-link" routerLink="/experience"><ui-icon name="book" [size]="14" />经验库</a>
          <a class="ghost-link" routerLink="/match"><ui-icon name="target" [size]="14" />相似项目匹配</a>
        </div>
      </header>

      <div class="split">
        <aside class="card">
          <div class="card-hd">
            <h2 class="card-title">已中标项目</h2>
            <span class="card-sub mono">{{ rows().length }}</span>
          </div>
          @if (rows().length === 0) {
            <div class="card-bd">
              <ui-empty title="暂无中标项目" hint="复盘对象必须可回溯到原始标书与中标公示。" />
            </div>
          } @else {
            <div class="award-list">
              @for (r of rows(); track r.project.id) {
                <button
                  type="button"
                  class="award"
                  [class.award--active]="r.project.id === selectedId()"
                  [attr.aria-current]="r.project.id === selectedId() ? 'true' : null"
                  (click)="select(r.project.id)"
                >
                  <span class="award__name">{{ r.project.name }}</span>
                  <ui-badge [label]="country(r.project.country)" tone="neutral" />
                  <span class="award__meta mono">{{ r.project.mw }} MW / {{ r.project.mwh }} MWh · {{ r.project.awardedYear }}</span>
                  <span class="award__levels">
                    <span class="cnt cnt--a"><span class="mono">A</span>{{ r.counts.A }}</span>
                    <span class="cnt cnt--b"><span class="mono">B</span>{{ r.counts.B }}</span>
                    <span class="cnt cnt--c"><span class="mono">C</span>{{ r.counts.C }}</span>
                  </span>
                  @if (!r.project.hasScoreSheet) {
                    <span class="award__flag"><ui-badge label="无正式评分表" tone="warn" icon="alert" /></span>
                  }
                </button>
              }
            </div>
          }
          <div class="card-ft">
            <span>按中标年份与规模归档</span>
            <span class="mono">A / B / C 为因素条数</span>
          </div>
        </aside>

        @if (selected(); as p) {
          <section class="card">
            <div class="card-hd">
              <div class="stack stack--tight">
                <h2 class="card-title">{{ p.name }}</h2>
                <span class="card-sub">{{ country(p.country) }} · {{ p.route }} · {{ p.productModel }} · 快照 {{ date(p.snapshotAt) }}</span>
              </div>
              <div class="row row--wrap">
                <ui-badge
                  [label]="p.hasScoreSheet ? '有正式评分表' : '无正式评分表'"
                  [tone]="p.hasScoreSheet ? 'ok' : 'warn'"
                  [icon]="p.hasScoreSheet ? 'check' : 'alert'"
                />
                <ui-badge [label]="'中标 ' + p.awardedYear" tone="info" icon="flag" />
              </div>
            </div>
            <ui-tabs [tabs]="tabs()" [active]="tab()" label="复盘分区" (change)="tab.set($event)" />
            <div class="card-bd stack stack--loose">
              @switch (tab()) {
                @case ('evidence') {
                  <div class="banner banner--info">
                    <ui-icon name="info" [size]="16" />
                    <span>证据分级按 PRD v1.1 第 3 节：徽标以「形状 + 图标 + 文字」三重编码。A 实线可写结论，B 双线需注明限制，C 虚线仅作假设。</span>
                  </div>
                  @for (g of groups(); track g.level) {
                    <section class="fcard" [class]="'fcard--' + g.key">
                      <div class="fcard__hd">
                        <div class="row row--wrap">
                          <span class="lv" [class]="'lv--' + g.key">
                            <ui-icon [name]="g.icon" [size]="12" /><span class="mono">{{ g.level }}</span><span>{{ g.tag }}</span>
                          </span>
                          <h3 class="fcard__title">{{ g.title }}</h3>
                          <span class="mono small muted">{{ g.items.length }} 条</span>
                        </div>
                        <span class="small muted">{{ g.hint }}</span>
                      </div>
                      @if (g.level === 'C') {
                        <div class="fcard__warn">
                          <div class="banner banner--warn">
                            <ui-icon name="alert" [size]="16" />
                            <span>C 级不得作为结论使用：只能进入「待验证假设」区，补证后方可升级。</span>
                          </div>
                        </div>
                      }
                      @if (g.items.length === 0) {
                        <p class="fcard__empty muted small">本项目暂无 {{ g.level }} 级因素。</p>
                      } @else {
                        @for (v of g.items; track v.factor.id) {
                          <div class="frow">
                            <div class="frow__hd">
                              <span class="tag">{{ catLabel(v.factor.category) }}</span>
                              <span class="frow__title">{{ v.factor.title }}</span>
                              @if (v.downgraded) {
                                <span class="tag tag--note">原 A 级已按 BR-13 降级展示</span>
                              }
                            </div>
                            <dl class="frow__lines">
                              <dt>客户关注点</dt>
                              <dd>{{ v.factor.customerNeed }}</dd>
                              <dt>我方应答</dt>
                              <dd>{{ v.factor.ourResponse }}</dd>
                              <dt>竞对差距</dt>
                              <dd>{{ v.factor.competitorGap }}</dd>
                            </dl>
                            <ul class="ev">
                              @for (e of v.factor.evidence; track e) {
                                <li class="ev__item"><ui-icon name="link" [size]="12" /><span>{{ e }}</span></li>
                              }
                            </ul>
                            @if (v.factor.confirmedBy) {
                              <p class="small muted">确认人：{{ v.factor.confirmedBy }}</p>
                            }
                          </div>
                        }
                      }
                    </section>
                  }
                }

                @case ('factors') {
                  @if (!p.hasScoreSheet) {
                    <div class="banner banner--warn">
                      <ui-icon name="alert" [size]="16" />
                      <span>该项目无正式评分表，按规则其全部经验最高只能评为 B 级（BR-13）；原始数据不变，界面按降级口径展示。</span>
                      <button type="button" class="link-btn small" (click)="registerScoreSheet()">登记评分表补件</button>
                    </div>
                  }
                  <div class="row row--between row--wrap">
                    <span class="small muted">按证据等级 A → C 排序，共 {{ sortedViews().length }} 条因素</span>
                    <span class="small muted">确认人缺省表示尚未指定复核人</span>
                  </div>
                  <div class="table-wrap">
                    <table class="table">
                      <thead>
                        <tr>
                          <th style="width: 92px">类别</th>
                          <th>因素</th>
                          <th style="width: 130px">证据等级</th>
                          <th class="num" style="width: 88px">证据条数</th>
                          <th style="width: 92px">确认人</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (v of sortedViews(); track v.factor.id) {
                          <tr>
                            <td><span class="tag">{{ catLabel(v.factor.category) }}</span></td>
                            <td>
                              <span>{{ v.factor.title }}</span>
                              @if (v.downgraded) {
                                <span class="small text-warn" style="display: block; margin-top: 3px">原 A 级已按规则降级展示</span>
                              }
                            </td>
                            <td>
                              <span class="lv" [class]="'lv--' + v.cardKey">
                                <ui-icon [name]="levelIcon(v.shownLevel)" [size]="12" /><span class="mono">{{ v.shownLevel }}</span>
                                <span>{{ levelWord(v.shownLevel) }}</span>
                              </span>
                            </td>
                            <td class="num">{{ v.factor.evidence.length }}</td>
                            <td>{{ confirmer(v.factor) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                @case ('solution') {
                  <div class="section-head">
                    <h3 class="section-title">方案与商务复盘</h3>
                    <a class="link-btn small" routerLink="/experience">查看全部经验</a>
                  </div>
                  <div class="card">
                    <div class="card-bd">
                      <dl class="kv">
                        <dt>技术路线</dt>
                        <dd>{{ p.route }}</dd>
                        <dt>产品型号</dt>
                        <dd>{{ p.productModel }}</dd>
                        <dt>合同模式</dt>
                        <dd>{{ p.contractMode }}</dd>
                        <dt>投标模式</dt>
                        <dd>{{ p.bidMode }}</dd>
                        <dt>客户类型</dt>
                        <dd>{{ p.customerType }}</dd>
                        <dt>中标年份</dt>
                        <dd class="mono">{{ p.awardedYear }}</dd>
                        <dt>竞对</dt>
                        <dd>{{ competitors(p.competitorIds) }}</dd>
                      </dl>
                    </div>
                  </div>
                  <div class="grid grid--2">
                    @for (b of expBlocks(); track b.key) {
                      <section class="card">
                        <div class="card-hd">
                          <div class="stack stack--tight">
                            <h4 class="card-title">{{ b.title }}</h4>
                            <span class="card-sub">{{ b.hint }}</span>
                          </div>
                          <span class="mono small muted">{{ b.items.length }} 条</span>
                        </div>
                        <div class="card-bd card-bd--flush">
                          @if (b.items.length === 0) {
                            <p class="exp__empty small muted">暂无该类经验条目。</p>
                          } @else {
                            <ul class="exp">
                              @for (e of b.items; track e.id) {
                                <li class="exp__item">
                                  <span class="exp__title">{{ e.title }}</span>
                                  <span class="exp__meta">
                                    <span class="lv" [class]="'lv--' + levelKey(e.evidenceLevel)">
                                      <ui-icon [name]="levelIcon(e.evidenceLevel)" [size]="12" /><span class="mono">{{ e.evidenceLevel }}</span>
                                      <span>{{ levelWord(e.evidenceLevel) }}</span>
                                    </span>
                                    <ui-badge [label]="expMeta(e.state).label" [tone]="expMeta(e.state).tone" [icon]="expMeta(e.state).icon" />
                                    <span class="mono small muted">证据 {{ e.evidenceSources.length }} 条</span>
                                  </span>
                                </li>
                              }
                            </ul>
                          }
                        </div>
                      </section>
                    }
                  </div>
                  <p class="small muted">
                    经验适用范围见经验库 scope 字段；C 级在相似项目匹配中只能进入「待验证假设」区（BR-12），引用到在投项目必须留痕（BR-15）。
                  </p>
                }

                @case ('fulfilment') {
                  <div class="banner banner--warn">
                    <ui-icon name="alert" [size]="16" />
                    <span>BR-14：履约验证为「未达成」时，同项目 A/B 级经验自动降级一级（A→B、B→C）并退回待复核；降级需人工填写复核说明，不可静默执行。</span>
                  </div>
                  <div class="row row--between row--wrap">
                    <div class="row row--wrap">
                      <span class="tag">共 <span class="mono">{{ fulfilments().length }}</span> 条</span>
                      <span class="tag">已达成 <span class="mono">{{ fulfilSummary().met }}</span></span>
                      <span class="tag">部分达成 <span class="mono">{{ fulfilSummary().partial }}</span></span>
                      <span class="tag">未达成 <span class="mono">{{ fulfilSummary().missed }}</span></span>
                      <span class="tag">履约中 <span class="mono">{{ fulfilSummary().pending }}</span></span>
                    </div>
                    <span class="small muted">核验日期为最近一次人工核验</span>
                  </div>
                  @if (fulfilments().length === 0) {
                    <ui-empty title="该项目暂无履约记录" hint="履约记录用于验证「中标原因」是否真的成立，中标后按承诺逐条建立。" />
                  } @else {
                    <div class="table-wrap">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>承诺 / 备注</th>
                            <th style="width: 84px">目标</th>
                            <th style="width: 90px">实际</th>
                            <th style="width: 84px">偏差</th>
                            <th style="width: 108px">状态</th>
                            <th style="width: 96px">核验日期</th>
                            <th style="width: 170px">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (r of fulfilments(); track r.id) {
                            <tr>
                              <td>
                                <span>{{ r.commitment }}</span>
                                <span class="small muted" style="display: block; margin-top: 3px">{{ r.note }}</span>
                              </td>
                              <td class="mono small">{{ r.target }}</td>
                              <td class="mono small">{{ r.actual }}</td>
                              <td class="mono small">{{ r.variance }}</td>
                              <td>
                                <ui-badge [label]="fulfilMeta(r.status).label" [tone]="fulfilMeta(r.status).tone" [icon]="fulfilMeta(r.status).icon" />
                              </td>
                              <td class="mono small">{{ date(r.verifiedAt) }}</td>
                              <td>
                                @if (r.status === 'missed') {
                                  <ui-btn size="sm" variant="danger" icon="alert" (click)="openDowngrade(r)">按 BR-14 触发经验降级</ui-btn>
                                } @else {
                                  <ui-btn size="sm" variant="ghost" icon="check" (click)="verify(r)">确认核验</ui-btn>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <section class="card">
                    <div class="card-hd">
                      <h3 class="card-title">引用记录</h3>
                      <span class="card-sub mono">{{ citations().length }} 条</span>
                    </div>
                    <div class="card-bd">
                      @if (store.activeProject(); as ap) {
                        @if (citations().length === 0) {
                          <p class="small muted">{{ ap.name }} 尚无经验引用记录。引用经验到在投项目必须留痕（BR-15），记录同步写入审计日志。</p>
                        } @else {
                          <div class="timeline">
                            @for (c of citations(); track c.id) {
                              <div class="timeline__item">
                                <span class="timeline__dot"></span>
                                <div>
                                  <p class="timeline__body">
                                    <span class="lv" [class]="'lv--' + levelKey(c.level)">
                                      <ui-icon [name]="levelIcon(c.level)" [size]="12" /><span class="mono">{{ c.level }}</span>
                                      <span>{{ levelWord(c.level) }}</span>
                                    </span>
                                    {{ c.title }}
                                  </p>
                                  <p class="timeline__meta mono">{{ fmt(c.at) }} · {{ c.actor }} · {{ c.experienceId }} → {{ ap.name }}</p>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      } @else {
                        <p class="small muted">当前无在投项目，引用记录无处归属；请先在项目列表选择在投项目。</p>
                      }
                    </div>
                    <div class="card-ft">
                      <span>引用需人确认并留痕（BR-15）</span>
                      <a routerLink="/match" class="small">去相似项目匹配</a>
                    </div>
                  </section>
                }
              }
            </div>
          </section>
        } @else {
          <ui-empty title="未选择中标项目" hint="从左侧列表选择一个中标项目，查看其证据三栏、评分因素与履约验证。" />
        }
      </div>
    </div>

    <ui-modal [open]="downgrade() !== null" title="按 BR-14 触发经验降级" size="md" (close)="closeDowngrade()">
      @if (downgrade(); as r) {
        <div class="stack">
          <div class="banner banner--danger">
            <ui-icon name="alert" [size]="16" />
            <span>该履约记录为「未达成」。确认后，同项目 A/B 级经验将自动降级一级（A→B、B→C）并退回待复核状态。</span>
          </div>
          <dl class="kv">
            <dt>承诺</dt>
            <dd>{{ r.commitment }}</dd>
            <dt>目标 / 实际</dt>
            <dd class="mono">{{ r.target }} → {{ r.actual }}（{{ r.variance }}）</dd>
            <dt>核验日期</dt>
            <dd class="mono">{{ date(r.verifiedAt) }}</dd>
          </dl>
          <div class="field">
            <label for="dg-note">复核说明 *</label>
            <textarea
              id="dg-note"
              class="input"
              rows="3"
              placeholder="说明偏差原因、责任归属与后续措施，至少 6 个字"
              [class.input--error]="noteError().length > 0"
              [ngModel]="note()"
              (ngModelChange)="note.set($event)"
            ></textarea>
            @if (noteError()) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ noteError() }}</span>
            }
          </div>
          <p class="hint">降级后相关经验不再进入相似项目匹配的「可借鉴」区，需重新复核后方可使用。</p>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="closeDowngrade()">取消</ui-btn>
        <ui-btn variant="danger" icon="alert" (click)="submitDowngrade()">确认降级并留痕</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .ghost-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--ink);
        font-size: 13px;
      }
      .ghost-link:hover {
        background: var(--bg-subtle);
        text-decoration: none;
      }
      .award-list {
        display: flex;
        flex-direction: column;
      }
      .award {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px 8px;
        padding: 10px 12px;
        border: none;
        border-bottom: 1px solid var(--line);
        border-left: 3px solid transparent;
        background: var(--surface);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .award:last-child {
        border-bottom: none;
      }
      .award:hover {
        background: var(--bg-subtle);
      }
      .award--active {
        background: var(--accent-weak);
        border-left-color: var(--accent);
      }
      .award:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      .award__name {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.4;
      }
      .award__meta {
        grid-column: 1 / -1;
        font-size: 11px;
        color: var(--ink-3);
      }
      .award__levels {
        grid-column: 1 / -1;
        display: flex;
        gap: 4px;
      }
      .award__flag {
        grid-column: 1 / -1;
        display: flex;
      }
      .cnt {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0 5px;
        font-size: 11px;
        line-height: 17px;
        font-family: var(--font-mono);
        color: var(--ink-2);
        border: 1px solid var(--line-strong);
      }
      .cnt--a {
        border-left-width: 3px;
        border-left-color: var(--ok);
      }
      .cnt--b {
        border: 3px double var(--line-strong);
        padding: 0 3px;
      }
      .cnt--c {
        border-style: dashed;
      }
      .lv {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 1px 7px;
        font-size: 12px;
        line-height: 18px;
        white-space: nowrap;
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--ink-2);
      }
      .lv--a {
        border: 2px solid #b7d8c3;
        border-left-width: 4px;
        color: var(--ok);
        background: #f2f8f4;
      }
      .lv--b {
        border: 3px double #c3cef5;
        color: var(--accent);
        background: var(--accent-weak);
      }
      .lv--c {
        border: 1px dashed var(--line-strong);
        color: var(--ink-3);
      }
      .fcard {
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .fcard--a {
        border-left: 3px solid var(--ok);
      }
      .fcard--b {
        border-left: 3px solid var(--accent);
      }
      .fcard--c {
        border: 1px dashed var(--line-strong);
      }
      .fcard__hd {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px 12px;
        flex-wrap: wrap;
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .fcard__title {
        font-size: 13px;
      }
      .fcard__warn {
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .fcard__empty {
        padding: 14px 16px;
      }
      .frow {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--line);
      }
      .frow:last-child {
        border-bottom: none;
      }
      .frow__hd {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        flex-wrap: wrap;
      }
      .frow__title {
        flex: 1;
        min-width: 12ch;
        font-size: 13px;
        line-height: 1.45;
      }
      .tag--note {
        border-color: #e0cfa8;
        color: var(--warn);
        background: #fbf6ea;
      }
      .frow__lines {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 3px 10px;
        margin: 0;
        font-size: 13px;
      }
      .frow__lines dt {
        font-size: 12px;
        color: var(--ink-3);
      }
      .frow__lines dd {
        margin: 0;
        color: var(--ink-2);
        line-height: 1.55;
      }
      .ev {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .ev__item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink-2);
      }
      .exp {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .exp__item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .exp__item:last-child {
        border-bottom: none;
      }
      .exp__empty {
        padding: 12px 16px;
      }
      .exp__title {
        font-size: 13px;
        line-height: 1.45;
      }
      .exp__meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class Retro {
  readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly projects = this.store.awardedProjects;
  readonly selectedId = signal(this.initialSelection());
  readonly tab = signal('evidence');

  readonly downgrade = signal<FulfilmentRecord | null>(null);
  readonly note = signal('');
  readonly noteError = signal('');

  readonly rows = computed<ProjectRow[]>(() =>
    this.projects().map((project) => ({ project, counts: countLevels(project) })),
  );

  readonly totalFactors = computed(() => this.rows().reduce((n, r) => n + r.project.factors.length, 0));

  readonly selected = computed<AwardedProject | undefined>(
    () => this.store.awardedById(this.selectedId()) ?? this.projects()[0],
  );

  readonly views = computed<FactorView[]>(() => {
    const project = this.selected();
    if (!project) return [];
    return project.factors.map((factor) => {
      const shownLevel = effectiveLevel(project, factor);
      return { factor, shownLevel, downgraded: shownLevel !== factor.level, cardKey: shownLevel.toLowerCase() };
    });
  });

  readonly groups = computed<LevelGroup[]>(() => {
    const views = this.views();
    return LEVEL_CARDS.map((card) => ({ ...card, items: views.filter((v) => v.shownLevel === card.level) }));
  });

  readonly sortedViews = computed<FactorView[]>(() =>
    [...this.views()].sort((a, b) => LEVEL_ORDER[a.shownLevel] - LEVEL_ORDER[b.shownLevel]),
  );

  readonly fulfilments = computed<FulfilmentRecord[]>(() => {
    const project = this.selected();
    return project ? this.store.fulfilmentsFor(project.id) : [];
  });

  readonly fulfilSummary = computed(() => {
    const list = this.fulfilments();
    const count = (status: FulfilmentRecord['status']) => list.filter((f) => f.status === status).length;
    return { met: count('met'), partial: count('partial'), missed: count('missed'), pending: count('pending') };
  });

  readonly expBlocks = computed<ExpBlock[]>(() => {
    const project = this.selected();
    if (!project) return [];
    return [
      {
        key: 'competitor',
        title: '竞品策略经验',
        hint: '对手方案特点、产品差异与证据来源',
        items: this.store.experiencesFor(project.id, 'competitor'),
      },
      {
        key: 'commercial',
        title: '商务与交付经验',
        hint: '报价结构、合同风险、交期与本地化',
        items: this.store.experiencesFor(project.id, 'commercial'),
      },
    ];
  });

  readonly citations = computed(() => {
    const projectId = this.store.activeProjectId();
    return this.store.citations().filter((c) => c.projectId === projectId).slice(0, 4);
  });

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'evidence', label: '经验三栏' },
    { id: 'factors', label: '评分因素', count: this.views().length },
    { id: 'solution', label: '方案与商务', count: this.expBlocks().reduce((n, b) => n + b.items.length, 0) },
    { id: 'fulfilment', label: '履约验证', count: this.fulfilments().length },
  ]);

  private initialSelection(): string {
    const param = this.route.snapshot.paramMap.get('retroId');
    const list = this.store.awardedProjects();
    if (param && list.some((p) => p.id === param)) return param;
    return list[0]?.id ?? '';
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  country(code: Country): string {
    return COUNTRY_LABEL[code];
  }

  date(iso: string): string {
    return fmtDate(iso);
  }

  fmt(at: string): string {
    return fmtDateTime(at);
  }

  catLabel(category: WinFactorCategory): string {
    return CATEGORY_LABEL[category];
  }

  confirmer(factor: WinFactor): string {
    return factor.confirmedBy ?? '未指定';
  }

  competitors(ids: string[]): string {
    if (ids.length === 0) return '未记录';
    return ids.map((id) => COMPETITORS.find((c) => c.id === id)?.name ?? id).join(' · ');
  }

  levelKey(level: EvidenceLevel): string {
    return level.toLowerCase();
  }

  levelWord(level: EvidenceLevel): string {
    return LEVEL_WORD[level];
  }

  levelIcon(level: EvidenceLevel): string {
    return LEVEL_ICON[level];
  }

  fulfilMeta(status: FulfilmentRecord['status']): StatusMeta {
    return FULFIL_META[status];
  }

  expMeta(state: Experience['state']): StatusMeta {
    return EXP_STATE_META[state];
  }

  registerScoreSheet(): void {
    const project = this.selected();
    if (!project) return;
    this.store.pushAudit('upload', `补登 ${project.id} 正式评分表`, `${project.name}：登记后按 BR-13 可恢复 A 级展示`);
    this.toast.push('已登记评分表补件', 'info', '演示环境不落库；登记成功后 A 级因素可恢复，刷新后回到初始数据');
  }

  verify(record: FulfilmentRecord): void {
    const note = `人工核验：实际 ${record.actual}（偏差 ${record.variance}）`;
    this.store.verifyFulfilment(record.id, note);
    this.toast.push('履约核验已记录', 'ok', `${record.commitment} · ${note}`);
  }

  openDowngrade(record: FulfilmentRecord): void {
    this.downgrade.set(record);
    this.note.set('');
    this.noteError.set('');
  }

  closeDowngrade(): void {
    this.downgrade.set(null);
    this.noteError.set('');
  }

  submitDowngrade(): void {
    const record = this.downgrade();
    if (!record) return;
    const text = this.note().trim();
    if (text.length < 6) {
      this.noteError.set('复核说明至少 6 个字，需写明偏差原因与后续措施');
      return;
    }
    this.store.verifyFulfilment(record.id, text);
    this.downgrade.set(null);
    this.toast.push('已触发经验降级', 'warn', '同项目 A/B 级经验已降级并退回待复核，复核说明已写入审计日志');
  }
}
