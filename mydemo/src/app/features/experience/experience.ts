import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { downloadCsv } from '../../core/download';
import { COUNTRY_LABEL, fmtDate, fmtDateTime } from '../../core/format';
import { WorkspaceStore } from '../../core/store';
import { Country, EvidenceLevel, Experience, ExperienceCategory, LevelChange, Tone } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Confirm } from '../../shared/ui/confirm';
import { Drawer } from '../../shared/ui/drawer';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Stat } from '../../shared/ui/stat';
import { TabItem, Tabs } from '../../shared/ui/tabs';
import { ToastService } from '../../shared/ui/toast.service';

const CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  competitor: '竞品策略',
  deviation: '技术响应与偏差',
  commercial: '商务与交付',
  awarded: '中标项目',
};

const CATEGORY_ORDER: ExperienceCategory[] = ['competitor', 'deviation', 'commercial', 'awarded'];

const LEVEL_META: Record<EvidenceLevel, { label: string; tone: Tone; icon: string; rule: string }> = {
  A: { label: 'A 已证实', tone: 'ok', icon: 'check', rule: '有直接证据：正式评分表得分、澄清邮件明确认可、评标反馈点名优势' },
  B: { label: 'B 多材料', tone: 'info', icon: 'info', rule: '多项材料共同指向，但无评标直接证据；可作参照，引用须注明限制' },
  C: { label: 'C 待验证', tone: 'dashed', icon: 'help', rule: '只有结果、无因果证据；只能标注为假设，禁止作为结论' },
};

const STATE_META: Record<Experience['state'], { label: string; tone: Tone; icon: string }> = {
  verified: { label: '已核验', tone: 'ok', icon: 'check-square' },
  draft: { label: '待复核', tone: 'warn', icon: 'clock' },
  deprecated: { label: '已停用', tone: 'neutral', icon: 'minus' },
};

/** 建议原文要求的 12 个必填字段，缺任一不可入库（BR-11） */
const REQUIRED_FIELDS: { key: keyof Experience; label: string }[] = [
  { key: 'country', label: '国家/地区' },
  { key: 'scaleBand', label: '项目规模' },
  { key: 'customerType', label: '客户类型' },
  { key: 'bidMode', label: '投标模式' },
  { key: 'productModel', label: '产品型号' },
  { key: 'requirement', label: '招标要求' },
  { key: 'strategy', label: '采取的策略' },
  { key: 'result', label: '最终结果' },
  { key: 'evidenceSources', label: '证据来源' },
  { key: 'reviewer', label: '复盘人' },
  { key: 'reviewedAt', label: '复核日期' },
  { key: 'scope', label: '适用范围' },
];

@Component({
  selector: 'app-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Confirm, Drawer, Empty, Icon, Modal, Stat, Tabs],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">经验库</h1>
          <p class="page-sub">四类可复用数据资产 · 每条经验必须带证据等级与来源</p>
        </div>
        <div class="page-actions">
          <ui-btn variant="secondary" icon="download" (click)="exportCsv()">导出 CSV</ui-btn>
          <ui-btn variant="secondary" icon="info" (click)="auditInfo.set(true)">入库审核说明</ui-btn>
        </div>
      </header>

      <section class="section">
        <div class="grid grid--3">
          <ui-stat label="经验总数" [value]="stats().total" hint="覆盖 4 类经验库" />
          <ui-stat label="已核验" [value]="stats().verified" tone="ok" hint="方可写入策略建议" />
          <ui-stat label="待复核" [value]="stats().draft" tone="warn" hint="含 C 级假设，不得作结论" />
          <ui-stat label="A 级" [value]="stats().levelA" tone="ok" hint="有直接证据" />
          <ui-stat label="B 级" [value]="stats().levelB" tone="info" hint="多材料共同支持" />
          <ui-stat label="C 级" [value]="stats().levelC" tone="warn" hint="待验证假设" />
        </div>
      </section>

      <section class="section">
        <ui-tabs [tabs]="tabs()" [active]="category()" label="经验库分类" (change)="setCategory($event)" />

        <div class="filter-bar">
          <div class="row" style="flex: 1">
            <ui-icon name="search" [size]="14" />
            <input class="input" type="search" placeholder="搜索标题、摘要或招标要求" aria-label="搜索经验"
              [ngModel]="q()" (ngModelChange)="q.set($event); page.set(0)" />
          </div>
          <select class="select" aria-label="按证据等级筛选" [ngModel]="level()" (ngModelChange)="level.set($event); page.set(0)">
            <option value="all">全部等级</option>
            <option value="A">A 已证实</option>
            <option value="B">B 多材料</option>
            <option value="C">C 待验证</option>
          </select>
          <select class="select" aria-label="按状态筛选" [ngModel]="state()" (ngModelChange)="state.set($event); page.set(0)">
            <option value="all">全部状态</option>
            <option value="verified">已核验</option>
            <option value="draft">待复核</option>
            <option value="deprecated">已停用</option>
          </select>
          <select class="select" aria-label="按国家筛选" [ngModel]="country()" (ngModelChange)="country.set($event); page.set(0)">
            <option value="all">全部国家</option>
            @for (c of countries; track c.code) {
              <option [value]="c.code">{{ c.label }}</option>
            }
          </select>
          <button type="button" class="chip" (click)="clearFilters()">清空筛选</button>
        </div>

        @if (filtered().length === 0) {
          <ui-empty title="当前筛选条件下没有经验条目" actionLabel="清空筛选" (action)="clearFilters()"
            hint="尝试放宽证据等级、状态或国家筛选。经验库只收录带证据来源的条目，未复盘的项目不会出现在这里。" />
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th style="width: 132px">类别</th>
                  <th style="width: 176px">来源项目</th>
                  <th style="width: 84px">国家</th>
                  <th style="width: 108px">规模</th>
                  <th style="width: 112px">证据等级</th>
                  <th style="width: 96px">状态</th>
                  <th style="width: 76px">复核人</th>
                  <th style="width: 100px">复核日期</th>
                  <th style="width: 212px">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (e of paged(); track e.id) {
                  <tr>
                    <td>
                      <div class="stack stack--tight">
                        <button type="button" class="link-btn" (click)="openDetail(e)">{{ e.title }}</button>
                        <span class="small muted summary">{{ e.summary }}</span>
                      </div>
                    </td>
                    <td><span class="tag">{{ categoryLabel(e.category) }}</span></td>
                    <td>
                      <div class="stack stack--tight">
                        <span class="small truncate" style="max-width: 180px" [title]="projectName(e.projectId)">{{ projectName(e.projectId) }}</span>
                        <span class="mono small muted">{{ projectYear(e.projectId) }}</span>
                      </div>
                    </td>
                    <td class="small">{{ countryName(e.country) }}</td>
                    <td class="mono small">{{ e.scaleBand }}</td>
                    <td>
                      <ui-badge [label]="levelMeta[e.evidenceLevel].label" [tone]="levelMeta[e.evidenceLevel].tone" [icon]="levelMeta[e.evidenceLevel].icon" />
                    </td>
                    <td>
                      <ui-badge [label]="stateMeta[e.state].label" [tone]="stateMeta[e.state].tone" [icon]="stateMeta[e.state].icon" />
                      @if (pendingLc(e.id)) {
                        <span style="display: block; margin-top: 4px">
                          <ui-badge label="等级待审" tone="warn" icon="clock" />
                        </span>
                      }
                    </td>
                    <td class="small">{{ e.reviewer }}</td>
                    <td class="mono small">{{ date(e.reviewedAt) }}</td>
                    <td>
                      <div class="row row--wrap">
                        <ui-btn size="sm" variant="ghost" icon="eye" (click)="openDetail(e)">详情</ui-btn>
                        <ui-btn size="sm" variant="ghost" icon="link" [attr.title]="citeHint(e)" (click)="cite(e)">引用</ui-btn>
                        @if (e.state === 'draft') {
                          <ui-btn size="sm" variant="ghost" icon="check" [disabled]="missingOf(e).length > 0"
                            [attr.title]="entryHint(e)" (click)="verify(e)">入库</ui-btn>
                        } @else if (e.state === 'verified') {
                          <ui-btn size="sm" variant="ghost" icon="minus" (click)="openDeprecate(e)">停用</ui-btn>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span>共 {{ filtered().length }} 条 · 第 {{ page() + 1 }} / {{ totalPages() }} 页 · 每页 {{ pageSize }} 条</span>
            <div class="row">
              <ui-btn size="sm" variant="secondary" [disabled]="page() === 0" (click)="prev()">上一页</ui-btn>
              <ui-btn size="sm" variant="secondary" [disabled]="page() >= totalPages() - 1" (click)="next()">下一页</ui-btn>
            </div>
          </div>
        }
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">引用记录</h2>
          <span class="section-hint">当前项目：{{ activeName() }} · 共 {{ citations().length }} 条</span>
        </div>
        <div class="card">
          <div class="card-bd card-bd--flush">
            @if (citations().length === 0) {
              <p class="muted small" style="padding: 16px">当前项目尚未引用任何经验。引用后会留痕（谁、何时、引用了哪条），并写入审计日志。</p>
            } @else {
              <ul class="cite-list">
                @for (c of citations(); track c.id) {
                  <li class="cite-item">
                    <div class="stack stack--tight">
                      <span class="small">{{ c.title }}</span>
                      <span class="mono small muted">{{ when(c.at) }} · {{ c.actor }}</span>
                    </div>
                    <ui-badge [label]="levelMeta[c.level].label" [tone]="levelMeta[c.level].tone" [icon]="levelMeta[c.level].icon" />
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </section>
    </div>

    <ui-drawer [open]="!!detail()" title="经验详情" (close)="detail.set(null)">
      @if (detail(); as e) {
        <div class="stack">
          <div class="stack stack--tight">
            <h3 class="detail-title">{{ e.title }}</h3>
            <div class="row row--wrap">
              <ui-badge [label]="levelMeta[e.evidenceLevel].label" [tone]="levelMeta[e.evidenceLevel].tone" [icon]="levelMeta[e.evidenceLevel].icon" />
              <ui-badge [label]="stateMeta[e.state].label" [tone]="stateMeta[e.state].tone" [icon]="stateMeta[e.state].icon" />
              <span class="tag">{{ categoryLabel(e.category) }}</span>
            </div>
          </div>

          <div class="banner" [class.banner--warn]="e.evidenceLevel === 'C'" [class.banner--info]="e.evidenceLevel !== 'C'">
            <ui-icon name="info" [size]="16" />
            <span>{{ levelMeta[e.evidenceLevel].rule }}</span>
          </div>

          @if (missingOf(e).length > 0) {
            <div class="banner banner--danger">
              <ui-icon name="alert" [size]="16" />
              <span>缺少必填字段：{{ missingOf(e).join('、') }}。按 BR-11，缺任一必填字段不可入库，需补齐后重新复核。</span>
            </div>
          }

          <p class="small muted detail-summary">{{ e.summary }}</p>

          <dl class="kv">
            <dt>来源项目</dt>
            <dd>{{ projectName(e.projectId) }} <span class="mono small muted">{{ projectYear(e.projectId) }}</span></dd>
            <dt>国家/地区</dt>
            <dd>{{ countryName(e.country) }}</dd>
            <dt>项目规模</dt>
            <dd class="mono">{{ e.scaleBand }}</dd>
            <dt>客户类型</dt>
            <dd>{{ e.customerType }}</dd>
            <dt>投标模式</dt>
            <dd>{{ e.bidMode }}</dd>
            <dt>产品型号</dt>
            <dd>{{ e.productModel }}</dd>
            <dt>招标要求</dt>
            <dd>{{ e.requirement }}</dd>
            <dt>采取的策略</dt>
            <dd>{{ e.strategy }}</dd>
            <dt>最终结果</dt>
            <dd>{{ e.result }}</dd>
            <dt>证据来源</dt>
            <dd>
              @if (e.evidenceSources.length === 0) {
                <span class="muted">无来源（不可入库）</span>
              } @else {
                <ul class="src-list">
                  @for (s of e.evidenceSources; track s) {
                    <li><ui-icon name="doc" [size]="12" />{{ s }}</li>
                  }
                </ul>
              }
            </dd>
            <dt>复盘人</dt>
            <dd>{{ e.reviewer }}</dd>
            <dt>复核日期</dt>
            <dd class="mono">{{ date(e.reviewedAt) }}</dd>
            <dt>适用范围</dt>
            <dd>{{ e.scope }}</dd>
          </dl>

          <div class="lv">
            <div class="row row--between">
              <span class="label">证据等级变更</span>
              <ui-btn
                variant="secondary"
                size="sm"
                icon="edit"
                [disabled]="!!pendingLc(e.id)"
                [attr.title]="pendingLc(e.id) ? '已有待审批的等级变更' : '申请变更等级（需证据来源与理由）'"
                (click)="openLevelChange(e)"
                >申请变更</ui-btn
              >
            </div>

            @if (pendingLc(e.id); as lc) {
              <div class="banner banner--warn">
                <ui-icon name="clock" [size]="16" />
                <span>待审批：{{ lc.from }} → {{ lc.to }} · 发起人 {{ lc.requestedBy }} · {{ when(lc.requestedAt) }}</span>
              </div>
              @if (lc.evidenceSources.length > 0) {
                <ul class="src-list">
                  @for (s of lc.evidenceSources; track s) {
                    <li><ui-icon name="doc" [size]="12" />{{ s }}</li>
                  }
                </ul>
              }
              <p class="small muted">{{ lc.reason }}</p>
              <div class="row row--wrap">
                <ui-btn
                  variant="primary"
                  size="sm"
                  icon="check"
                  [disabled]="lc.requestedBy === me()"
                  [attr.title]="lc.requestedBy === me() ? '按 BR-08 双人规则，不可审批本人发起的变更' : '审批通过后等级生效'"
                  (click)="approveLc(lc)"
                  >通过</ui-btn
                >
                <ui-btn variant="danger" size="sm" icon="x" (click)="openReject(lc)">驳回</ui-btn>
              </div>
              @if (lc.requestedBy === me()) {
                <p class="error"><ui-icon name="alert" [size]="12" />你本人发起了该变更，需由他人审批（BR-08）</p>
              }
            }

            @if (levelHistory(e.id).length > 0) {
              <div class="timeline">
                @for (lc of levelHistory(e.id); track lc.id) {
                  <div class="timeline__item">
                    <span class="timeline__dot" [class]="lc.state === 'approved' ? 'timeline__dot dot--ok' : 'timeline__dot dot--danger'"></span>
                    <div>
                      <p class="timeline__body">
                        {{ lc.from }} → {{ lc.to }}
                        <ui-badge
                          [label]="lc.state === 'approved' ? '已通过' : '已驳回'"
                          [tone]="lc.state === 'approved' ? 'ok' : 'danger'"
                          [icon]="lc.state === 'approved' ? 'check' : 'x'"
                        />
                      </p>
                      <p class="timeline__meta">
                        {{ lc.requestedBy }} 发起 · {{ when(lc.requestedAt) }}
                        @if (lc.reviewedBy) {
                          · {{ lc.reviewedBy }} 于 {{ when(lc.reviewedAt ?? '') }} 处理
                        }
                      </p>
                      @if (lc.reviewNote) {
                        <p class="timeline__meta">{{ lc.reviewNote }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="small muted">暂无等级变更记录。</p>
            }
          </div>

          <div class="row row--wrap">
            <ui-btn variant="secondary" size="sm" icon="link" [attr.title]="citeHint(e)" (click)="cite(e)">引用到当前项目</ui-btn>
            @if (e.state === 'draft') {
              <ui-btn variant="primary" size="sm" icon="check" [disabled]="missingOf(e).length > 0" [attr.title]="entryHint(e)" (click)="verify(e)">
                入库核验
              </ui-btn>
            } @else if (e.state === 'verified') {
              <ui-btn variant="secondary" size="sm" icon="minus" (click)="openDeprecate(e)">停用</ui-btn>
            }
          </div>
        </div>
      }
    </ui-drawer>

    <ui-modal [open]="!!levelTarget()" title="申请变更证据等级" (close)="levelTarget.set(null)">
      @if (levelTarget(); as e) {
        <div class="stack">
          <dl class="kv">
            <dt>经验条目</dt>
            <dd>{{ e.title }}</dd>
            <dt>当前等级</dt>
            <dd>{{ levelMeta[e.evidenceLevel].label }}</dd>
            <dt>来源项目</dt>
            <dd>{{ projectName(e.projectId) }}</dd>
          </dl>
          <div class="banner banner--info">
            <ui-icon name="info" [size]="16" />
            <span>{{ levelMeta[e.evidenceLevel].rule }}</span>
          </div>
          <div class="field">
            <label for="lc-to">目标等级 *</label>
            <select id="lc-to" class="select" [ngModel]="lcTo()" (ngModelChange)="lcTo.set($event)">
              @for (lv of levels; track lv) {
                @if (lv !== e.evidenceLevel) {
                  <option [value]="lv">{{ levelMeta[lv].label }}</option>
                }
              }
            </select>
          </div>
          <div class="field">
            <label for="lc-src">新增证据来源（每行一条，升级必填）*</label>
            <textarea id="lc-src" class="input" rows="3" [ngModel]="lcSources()" (ngModelChange)="lcSources.set($event)" placeholder="例：正式评分表第 4 项 / 业主澄清邮件 2026-10-18"></textarea>
            <span class="hint">升级必须新增证据；降级可不附证据，但需写明原因。</span>
          </div>
          <div class="field">
            <label for="lc-reason">变更理由 *</label>
            <textarea id="lc-reason" class="input" rows="2" [ngModel]="lcReason()" (ngModelChange)="lcReason.set($event)" placeholder="说明为什么应调整等级"></textarea>
          </div>
          @if (lcError()) {
            <span class="error"><ui-icon name="alert" [size]="12" />{{ lcError() }}</span>
          }
          <p class="hint">升级需第二人审批（BR-08）；无正式评分表的项目最高只能评 B 级（BR-13）。</p>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="levelTarget.set(null)">取消</ui-btn>
        <ui-btn variant="primary" (click)="saveLevelChange()">提交申请</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="!!rejecting()" title="驳回等级变更" size="sm" (close)="rejecting.set(null)">
      <div class="stack">
        <p class="small muted">驳回后经验等级保持不变，本次申请会保留在变更历史中。</p>
        <div class="field">
          <label for="lc-reject">驳回理由 *</label>
          <textarea id="lc-reject" class="input" rows="3" [ngModel]="rejectNote()" (ngModelChange)="rejectNote.set($event)" placeholder="说明证据不足或适用条件不符"></textarea>
          @if (rejectError()) {
            <span class="error"><ui-icon name="alert" [size]="12" />{{ rejectError() }}</span>
          }
        </div>
      </div>
      <div modal-footer>
        <ui-btn variant="secondary" (click)="rejecting.set(null)">取消</ui-btn>
        <ui-btn variant="danger" (click)="saveReject()">确认驳回</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="!!deprecating()" title="停用经验条目" size="sm" (close)="deprecating.set(null)">
      @if (deprecating(); as e) {
        <div class="stack">
          <div class="banner banner--warn">
            <ui-icon name="alert" [size]="16" />
            <span>停用后该条经验不再进入相似项目匹配的「可借鉴经验」区，历史引用记录保留。</span>
          </div>
          <dl class="kv">
            <dt>经验</dt>
            <dd>{{ e.title }}</dd>
            <dt>证据等级</dt>
            <dd>{{ levelMeta[e.evidenceLevel].label }}</dd>
          </dl>
          <div class="field">
            <label for="dep-reason">停用理由 *</label>
            <textarea id="dep-reason" class="input" rows="3" placeholder="例如：履约未达标，交付承诺未兑现；或结论已被后续项目推翻"
              [ngModel]="reason()" (ngModelChange)="reason.set($event)"></textarea>
            @if (reasonError()) {
              <span class="error"><ui-icon name="alert" [size]="12" />{{ reasonError() }}</span>
            }
          </div>
        </div>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="deprecating.set(null)">取消</ui-btn>
        <ui-btn variant="danger" (click)="saveDeprecate()">确认停用</ui-btn>
      </div>
    </ui-modal>

    <ui-modal [open]="auditInfo()" title="入库审核说明" size="lg" (close)="auditInfo.set(false)">
      <div class="stack">
        <p class="small muted">入库不是「写完就进来」：必须同时满足证据等级、来源与 12 字段完整性。证据等级由人工确认，系统只提供建议。</p>
        <div class="rule">
          <span class="rule__code mono">A</span>
          <div class="stack stack--tight">
            <strong class="small">已证实 · 实线徽标「A 已证实」</strong>
            <span class="small muted">{{ levelMeta['A'].rule }}。可直接写入策略建议。</span>
          </div>
        </div>
        <div class="rule">
          <span class="rule__code mono">B</span>
          <div class="stack stack--tight">
            <strong class="small">多材料支持 · 双线徽标「B 多材料」</strong>
            <span class="small muted">{{ levelMeta['B'].rule }}。无正式评分表的项目，其经验最高只能评 B 级（BR-13）。</span>
          </div>
        </div>
        <div class="rule">
          <span class="rule__code mono">C</span>
          <div class="stack stack--tight">
            <strong class="small">待验证假设 · 虚线徽标「C 待验证」</strong>
            <span class="small muted">{{ levelMeta['C'].rule }}。匹配结果中只能进入「待验证假设」区（BR-12）。</span>
          </div>
        </div>
        <div class="banner banner--warn">
          <ui-icon name="alert" [size]="16" />
          <span>BR-11 无来源不得入库；BR-14 履约 missed 时对应经验自动降级并提示复核；BR-15 引用必须留痕（谁、何时、哪条、用于哪份文件）。</span>
        </div>
      </div>
      <div modal-footer>
        <ui-btn variant="primary" (click)="auditInfo.set(false)">知道了</ui-btn>
      </div>
    </ui-modal>

    <ui-confirm [open]="!!pendingCite()" title="引用 C 级经验" message="C 级为待验证假设，确认引用？"
      detail="引用后只可作为调研方向标注，不得写入结论或策略建议。引用记录会写入审计日志。"
      confirmText="仍然引用" (confirm)="confirmCite()" (cancel)="pendingCite.set(null)" />
  `,
  styles: [
    `
      .summary {
        display: block;
        max-width: 46ch;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .detail-title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.5;
      }
      .detail-summary {
        margin: 0;
        line-height: 1.7;
      }
      .src-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        color: var(--ink-2);
      }
      .src-list li {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .lv {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }
      .cite-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .cite-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--line);
      }
      .cite-item:last-child {
        border-bottom: none;
      }
      .rule {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 10px 12px;
        border: 1px solid var(--line);
      }
      .rule__code {
        font-size: 15px;
        line-height: 1.2;
        text-align: center;
        border: 1px solid var(--line-strong);
        padding: 4px 0;
      }
    `,
  ],
})
export class ExperienceLibrary {
  private readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);

  readonly levelMeta = LEVEL_META;
  readonly stateMeta = STATE_META;
  readonly pageSize = 10;
  readonly countries = Object.entries(COUNTRY_LABEL).map(([code, label]) => ({ code, label }));

  readonly category = signal('all');
  readonly level = signal('all');
  readonly state = signal('all');
  readonly country = signal('all');
  readonly q = signal('');
  readonly page = signal(0);

  readonly detail = signal<Experience | null>(null);
  readonly deprecating = signal<Experience | null>(null);
  readonly reason = signal('');
  readonly reasonError = signal('');
  readonly auditInfo = signal(false);
  readonly pendingCite = signal<Experience | null>(null);

  readonly levels: EvidenceLevel[] = ['A', 'B', 'C'];
  readonly levelTarget = signal<Experience | null>(null);
  readonly lcTo = signal<EvidenceLevel>('B');
  readonly lcSources = signal('');
  readonly lcReason = signal('');
  readonly lcError = signal('');
  readonly rejecting = signal<LevelChange | null>(null);
  readonly rejectNote = signal('');
  readonly rejectError = signal('');
  readonly me = computed(() => this.store.currentUser().name);

  readonly stats = this.store.experienceStats;
  readonly activeName = computed(() => this.store.activeProject()?.name ?? '未选择项目');
  readonly citations = computed(() => this.store.citations().filter((c) => c.projectId === this.store.activeProjectId()));

  readonly tabs = computed<TabItem[]>(() => {
    const list = this.store.experiences();
    return [
      { id: 'all', label: '全部', count: list.length },
      ...CATEGORY_ORDER.map((c) => ({
        id: c,
        label: CATEGORY_LABEL[c],
        count: list.filter((e) => e.category === c).length,
      })),
    ];
  });

  readonly filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.store.experiences().filter((e) => {
      if (q && !`${e.title} ${e.summary} ${e.requirement}`.toLowerCase().includes(q)) return false;
      if (this.category() !== 'all' && e.category !== this.category()) return false;
      if (this.level() !== 'all' && e.evidenceLevel !== this.level()) return false;
      if (this.state() !== 'all' && e.state !== this.state()) return false;
      if (this.country() !== 'all' && e.country !== this.country()) return false;
      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paged = computed(() => this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize));

  categoryLabel(c: ExperienceCategory): string {
    return CATEGORY_LABEL[c];
  }
  countryName(c: Country): string {
    return COUNTRY_LABEL[c];
  }
  date(iso: string): string {
    return fmtDate(iso);
  }
  when(at: string): string {
    return fmtDateTime(at);
  }
  projectName(id: string): string {
    return this.store.awardedById(id)?.name ?? id;
  }
  projectYear(id: string): string {
    const p = this.store.awardedById(id);
    return p ? `${p.awardedYear} 中标` : '—';
  }

  missingOf(e: Experience): string[] {
    return REQUIRED_FIELDS.filter((f) => {
      const v: unknown = e[f.key];
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === 'string') return v.trim().length === 0;
      return v === null || v === undefined;
    }).map((f) => f.label);
  }

  entryHint(e: Experience): string {
    const miss = this.missingOf(e);
    return miss.length ? `缺少必填字段：${miss.join('、')}（BR-11 不可入库）` : '核验通过后入库';
  }

  citeHint(e: Experience): string {
    return e.evidenceLevel === 'C'
      ? 'C 级为待验证假设，引用前会提示风险，且不得作为结论'
      : `引用到当前项目：${this.activeName()}`;
  }

  setCategory(id: string): void {
    this.category.set(id);
    this.page.set(0);
  }

  clearFilters(): void {
    this.q.set('');
    this.category.set('all');
    this.level.set('all');
    this.state.set('all');
    this.country.set('all');
    this.page.set(0);
  }

  prev(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  next(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  openDetail(e: Experience): void {
    this.detail.set(e);
  }

  verify(e: Experience): void {
    const miss = this.missingOf(e);
    if (miss.length > 0) {
      this.toast.push('不可入库', 'danger', `缺少必填字段：${miss.join('、')}`);
      return;
    }
    this.store.verifyExperience(e.id);
    if (this.detail()?.id === e.id) this.detail.set(null);
    this.toast.push('经验已入库', 'ok', `${e.title} · ${LEVEL_META[e.evidenceLevel].label}`);
  }

  openDeprecate(e: Experience): void {
    this.deprecating.set(e);
    this.reason.set('');
    this.reasonError.set('');
  }

  saveDeprecate(): void {
    const e = this.deprecating();
    if (!e) return;
    const text = this.reason().trim();
    if (text.length < 4) {
      this.reasonError.set('请填写停用理由（至少 4 个字）');
      return;
    }
    this.store.deprecateExperience(e.id, text);
    this.deprecating.set(null);
    if (this.detail()?.id === e.id) this.detail.set(null);
    this.toast.push('经验已停用', 'warn', `${e.title} · 理由：${text}`);
  }

  cite(e: Experience): void {
    if (e.evidenceLevel === 'C') {
      this.pendingCite.set(e);
      return;
    }
    this.doCite(e);
  }

  confirmCite(): void {
    const e = this.pendingCite();
    this.pendingCite.set(null);
    if (e) this.doCite(e);
  }

  private doCite(e: Experience): void {
    this.store.citeExperience(e.id);
    this.toast.push('已引用到当前项目', 'info', `${e.title} · ${this.activeName()}`);
  }

  /* ---------- 证据等级变更 ---------- */

  pendingLc(experienceId: string): LevelChange | undefined {
    return this.store.pendingLevelChangeFor(experienceId);
  }

  levelHistory(experienceId: string): LevelChange[] {
    return this.store.levelChangesFor(experienceId).filter((c) => c.state !== 'pending');
  }

  openLevelChange(e: Experience): void {
    this.levelTarget.set(e);
    this.lcTo.set(e.evidenceLevel === 'A' ? 'B' : 'A');
    this.lcSources.set('');
    this.lcReason.set('');
    this.lcError.set('');
  }

  saveLevelChange(): void {
    const e = this.levelTarget();
    if (!e) return;
    const sources = this.lcSources()
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = this.store.requestLevelChange(e.id, this.lcTo(), this.lcReason(), sources);
    if (!result.ok) {
      this.lcError.set(result.message ?? '提交失败');
      return;
    }
    this.levelTarget.set(null);
    this.refreshDetail(e.id);
    this.toast.push('等级变更已提交', 'info', `${e.title}：${e.evidenceLevel} → ${this.lcTo()}，待第二人审批`);
  }

  approveLc(lc: LevelChange): void {
    const result = this.store.approveLevelChange(lc.id);
    this.refreshDetail(lc.experienceId);
    if (!result.ok) {
      this.toast.push('无法通过该变更', 'danger', result.message ?? '');
      return;
    }
    this.toast.push('等级变更已通过', 'ok', `${lc.from} → ${lc.to} 已生效并写入审计日志`);
  }

  openReject(lc: LevelChange): void {
    this.rejecting.set(lc);
    this.rejectNote.set('');
    this.rejectError.set('');
  }

  saveReject(): void {
    const lc = this.rejecting();
    if (!lc) return;
    const result = this.store.rejectLevelChange(lc.id, this.rejectNote());
    if (!result.ok) {
      this.rejectError.set(result.message ?? '驳回失败');
      return;
    }
    this.rejecting.set(null);
    this.refreshDetail(lc.experienceId);
    this.toast.push('等级变更已驳回', 'warn', lc.reason);
  }

  private refreshDetail(id: string): void {
    const next = this.store.experiences().find((x) => x.id === id);
    if (next && this.detail()?.id === id) this.detail.set(next);
  }

  exportCsv(): void {
    const rows: (string | number)[][] = [
      ['标题', '类别', '来源项目', '国家', '规模', '客户类型', '投标模式', '产品型号', '招标要求', '采取的策略', '最终结果', '证据来源', '证据等级', '状态', '复盘人', '复核日期', '适用范围'],
      ...this.filtered().map((e) => [
        e.title,
        CATEGORY_LABEL[e.category],
        this.projectName(e.projectId),
        COUNTRY_LABEL[e.country],
        e.scaleBand,
        e.customerType,
        e.bidMode,
        e.productModel,
        e.requirement,
        e.strategy,
        e.result,
        e.evidenceSources.join(' / '),
        LEVEL_META[e.evidenceLevel].label,
        STATE_META[e.state].label,
        e.reviewer,
        fmtDate(e.reviewedAt),
        e.scope,
      ]),
    ];
    downloadCsv('BidScope-经验库.csv', rows);
    this.store.pushAudit('export', '经验库 CSV', `导出 ${this.filtered().length} 行`);
    this.toast.push('已导出 CSV', 'ok', `共 ${this.filtered().length} 行，遵循当前筛选条件`);
  }
}
