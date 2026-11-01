import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COUNTRY_LABEL, fmtDateTime } from '../../core/format';
import { WorkspaceStore } from '../../core/store';
import { Country, EvidenceLevel, Experience, Tone } from '../../core/types';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Confirm } from '../../shared/ui/confirm';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Progress } from '../../shared/ui/progress';
import { ToastService } from '../../shared/ui/toast.service';

const LEVEL_META: Record<EvidenceLevel, { label: string; tone: Tone; icon: string }> = {
  A: { label: 'A 已证实', tone: 'ok', icon: 'check' },
  B: { label: 'B 多材料', tone: 'info', icon: 'info' },
  C: { label: 'C 待验证', tone: 'dashed', icon: 'help' },
};

@Component({
  selector: 'app-match',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Confirm, Empty, Icon, Progress],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">相似项目匹配</h1>
          <p class="page-sub">匹配度只用于排序，不代表经验可直接套用</p>
        </div>
        <div class="page-actions">
          <span class="small muted">历史中标项目 {{ results().length }} 个 · 已引用 {{ citations().length }} 条</span>
        </div>
      </header>

      <section class="card section">
        <div class="card-hd">
          <h2 class="card-title">当前项目</h2>
          <span class="card-sub">权重：国家 30 · 规模 25 · 技术路线 15 · 客户类型 15 · 合同模式 15</span>
        </div>
        <div class="card-bd stack">
          <div class="field">
            <label for="match-project">选择项目</label>
            <select id="match-project" class="select" [ngModel]="store.activeProjectId()" (ngModelChange)="selectProject($event)">
              @for (p of projects(); track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>
          @if (active(); as p) {
            <dl class="kv">
              <dt>国别</dt>
              <dd>{{ country(p.country) }}</dd>
              <dt>规模</dt>
              <dd class="mono">{{ p.mw }} MW / {{ p.mwh }} MWh</dd>
              <dt>技术路线</dt>
              <dd>{{ p.route }}</dd>
              <dt>客户类型</dt>
              <dd>{{ p.customerType }}</dd>
              <dt>合同模式</dt>
              <dd>{{ p.contractMode }}</dd>
            </dl>
          }
          <p class="hint">匹配度 = 国家匹配（30）+ 规模相近（25）+ 技术路线（15）+ 客户类型（15）+ 合同模式（15）。命中项用于判断可比性，差异条件用于判断可复制性，两者必须同时阅读。</p>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">历史中标项目</h2>
          <span class="section-hint">按匹配度降序 · 分数高不等于可照搬</span>
        </div>

        @if (results().length === 0) {
          <ui-empty title="暂无可匹配的历史项目" hint="当前项目信息不完整，或历史中标项目尚未复盘入库。补齐国别、规模、技术路线后可重新匹配。" />
        } @else {
          <div class="stack stack--loose">
            @for (r of results(); track r.project.id) {
              <article class="card">
                <div class="card-hd match__hd">
                  <div class="stack stack--tight">
                    <h3 class="card-title">{{ r.project.name }}</h3>
                    <div class="row row--wrap small muted">
                      <ui-badge [label]="country(r.project.country)" tone="neutral" icon="flag" />
                      <span class="mono">{{ r.project.awardedYear }} 中标</span>
                      <span class="mono">{{ r.project.mw }} MW / {{ r.project.mwh }} MWh</span>
                      <span>{{ r.project.route }}</span>
                      <span>{{ r.project.contractMode }}</span>
                    </div>
                  </div>
                  <div class="score">
                    <span class="mono score__num">匹配度 {{ r.score }}</span>
                    <ui-progress [value]="r.score" [tone]="scoreTone(r.score)" [showValue]="false" [label]="'匹配度 ' + r.score" />
                    <span class="small muted">匹配度不代表可直接套用</span>
                  </div>
                </div>

                <div class="card-bd stack">
                  <div class="stack stack--tight">
                    <span class="label">命中的条件（{{ r.matched.length }}）</span>
                    <div class="row row--wrap">
                      @for (m of r.matched; track m) {
                        <span class="tag">{{ m }}</span>
                      }
                      @if (r.matched.length === 0) {
                        <span class="small muted">无命中条件，仅作排序参考</span>
                      }
                    </div>
                  </div>

                  <div class="banner banner--warn">
                    <ui-icon name="alert" [size]="16" />
                    <div class="stack stack--tight" style="flex: 1">
                      <strong class="small">差异条件（{{ r.differences.length }}）· 以下维度不可直接照搬</strong>
                      @if (r.differences.length === 0) {
                        <span class="small muted">五个维度全部命中；仍需核对当地并网规范与合同细则。</span>
                      } @else {
                        <ul class="diff-list">
                          @for (d of r.differences; track d) {
                            <li>{{ d }}</li>
                          }
                        </ul>
                      }
                    </div>
                  </div>

                  <div class="stack stack--tight">
                    <span class="label">可借鉴经验（A/B）· {{ r.usableExperiences.length }} 条</span>
                    @if (r.usableExperiences.length === 0) {
                      <p class="small muted" style="margin: 0">该项目暂无 A/B 级经验可借鉴。</p>
                    } @else {
                      @for (e of r.usableExperiences; track e.id) {
                        <div class="exp">
                          <div class="exp__main">
                            <span class="small">{{ e.title }}</span>
                            <span class="small muted">适用边界：{{ e.scope }}</span>
                          </div>
                          <div class="row">
                            <ui-badge [label]="levelMeta[e.evidenceLevel].label" [tone]="levelMeta[e.evidenceLevel].tone" [icon]="levelMeta[e.evidenceLevel].icon" />
                            <ui-btn size="sm" variant="ghost" icon="link" (click)="cite(e)">引用</ui-btn>
                          </div>
                        </div>
                      }
                    }
                  </div>

                  <div class="stack stack--tight">
                    <span class="label">待验证假设（C）· {{ r.hypotheses.length }} 条</span>
                    @if (r.hypotheses.length === 0) {
                      <p class="small muted" style="margin: 0">该项目无 C 级假设。</p>
                    } @else {
                      @for (e of r.hypotheses; track e.id) {
                        <div class="hyp">
                          <div class="exp__main">
                            <span class="small">{{ e.title }}</span>
                            <span class="small muted">仅作假设，不得作为结论 · 适用边界：{{ e.scope }}</span>
                          </div>
                          <div class="row">
                            <ui-badge [label]="levelMeta[e.evidenceLevel].label" [tone]="levelMeta[e.evidenceLevel].tone" [icon]="levelMeta[e.evidenceLevel].icon" />
                            <ui-btn size="sm" variant="ghost" icon="link" (click)="cite(e)">引用</ui-btn>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">已引用到当前项目</h2>
          <span class="section-hint">{{ activeName() }} · 共 {{ citations().length }} 条</span>
        </div>
        <div class="card">
          <div class="card-bd card-bd--flush">
            @if (citations().length === 0) {
              <p class="muted small" style="padding: 16px">尚未引用任何经验。引用会留痕（谁、何时、引用了哪条）并写入审计日志，供复盘页与项目内查询。</p>
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

    <ui-confirm [open]="!!pendingCite()" title="引用 C 级经验" message="C 级为待验证假设，确认引用？"
      detail="引用后只可作为调研方向标注，不得写入结论或策略建议。引用记录会写入审计日志。"
      confirmText="仍然引用" (confirm)="confirmCite()" (cancel)="pendingCite.set(null)" />
  `,
  styles: [
    `
      .match__hd {
        align-items: flex-start;
      }
      .score {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 168px;
        text-align: right;
      }
      .score__num {
        font-size: 15px;
        font-weight: 500;
      }
      .diff-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .diff-list li {
        font-size: 12px;
        line-height: 1.65;
        color: var(--ink);
        padding-left: 8px;
        border-left: 2px solid var(--warn);
      }
      .exp,
      .hyp {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 10px;
        border: 1px solid var(--line);
      }
      .exp {
        border-left: 3px solid var(--ok);
      }
      .hyp {
        border: 1px dashed var(--line-strong);
        border-left: 3px dashed var(--ink-3);
        background: var(--surface);
      }
      .exp__main {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
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
    `,
  ],
})
export class Match {
  readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);

  readonly levelMeta = LEVEL_META;
  readonly projects = this.store.projects;
  readonly active = this.store.activeProject;
  readonly results = this.store.matchResults;
  readonly activeName = computed(() => this.store.activeProject()?.name ?? '未选择项目');

  readonly pendingCite = signal<Experience | null>(null);
  readonly citations = computed(() => this.store.citations().filter((c) => c.projectId === this.store.activeProjectId()));

  country(code: Country): string {
    return COUNTRY_LABEL[code];
  }

  when(at: string): string {
    return fmtDateTime(at);
  }

  scoreTone(score: number): Tone {
    if (score >= 70) return 'ok';
    if (score >= 40) return 'info';
    return 'warn';
  }

  selectProject(id: string): void {
    if (id === this.store.activeProjectId()) return;
    this.store.setActiveProject(id);
    this.toast.push('当前项目已切换', 'info', this.activeName());
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
}
