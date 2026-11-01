import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from '../../core/store';
import { COMPETITORS } from '../../core/mock/competitors';
import { Badge } from '../../shared/ui/badge';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Stat } from '../../shared/ui/stat';
import { COUNTRY_LABEL, DEMO_TODAY, DIMENSION_LABEL, DIMENSIONS, fmtDate } from '../../core/format';
import { Competitor, CompetitorHistoryItem, Country, Dimension, Tone } from '../../core/types';

const DIM_WORDS: Record<Dimension, string[]> = {
  technical: ['能量', '功率', '容量', '时长', '占地', '重量', '电芯', '温控', '防护', '成组'],
  performance: ['效率', '循环', '衰减', '可用率', '温度', '响应', '损耗', '寿命'],
  safety: ['消防', '认证', '并网', '谐波', '绝缘', '安全', '保护', '防爆'],
  warranty: ['质保', '保修', '服务', '运维', '延保'],
  delivery: ['交付', '周期', '海运', '供货', '发运'],
  commercial: ['报价', '价格', '付款', '保函', '违约', '商务', '条款', '账期'],
};

interface Parts {
  text: string;
  hit: boolean;
}

@Component({
  selector: 'app-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Empty, Icon, Stat],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">竞品情报库</h1>
          <p class="page-sub">
            {{ stats().competitors }} 家竞对 · {{ stats().entries }} 条情报 · 每条均标注来源与日期，超出有效期的条目需在投标前复核
          </p>
        </div>
        <div class="page-actions">
          <ui-badge label="只读演示" tone="dashed" icon="lock" ariaLabel="只读演示：情报库录入与来源管理属于 P2 范围" />
        </div>
      </header>

      <section class="section">
        <div class="grid grid--4">
          <ui-stat label="竞对数量" [value]="stats().competitors" hint="含 1 家中国同侪" />
          <ui-stat label="情报条目" [value]="stats().entries" hint="产品手册 / 投标文件 / 铭牌照片" tone="info" />
          <ui-stat label="过时条目" [value]="stats().stale" tone="warn" [hint]="'另有 ' + stats().aged + ' 条超出有效期'" />
          <ui-stat label="覆盖区域" [value]="stats().regions" [hint]="stats().regionText" />
        </div>
      </section>

      <div class="split">
        <aside class="card">
          <div class="card-hd">
            <h2 class="card-title">竞对列表</h2>
            <span class="card-sub mono">{{ list().length }} / {{ stats().competitors }}</span>
          </div>
          <div class="list-tools">
            <div class="row">
              <ui-icon name="search" [size]="14" />
              <input
                class="input"
                type="search"
                placeholder="按名称搜索竞对"
                aria-label="搜索竞对名称"
                [ngModel]="q()"
                (ngModelChange)="q.set($event)"
              />
            </div>
            <div class="row row--wrap">
              @for (t of tierChips; track t.key) {
                <button type="button" class="chip" [class.chip--active]="tier() === t.key" (click)="tier.set(t.key)">
                  {{ t.label }}
                </button>
              }
            </div>
          </div>
          @if (list().length === 0) {
            <div class="list-empty">
              <ui-empty title="没有匹配的竞对" hint="换一个名称关键词，或切回「全部」梯队。" actionLabel="清空筛选" (action)="clearList()" />
            </div>
          } @else {
            <div class="comp-list">
              @for (c of list(); track c.id) {
                <button
                  type="button"
                  class="comp"
                  [class.comp--active]="c.id === sel()"
                  [attr.aria-current]="c.id === sel() ? 'true' : null"
                  (click)="sel.set(c.id)"
                >
                  <span class="comp__name">{{ c.name }}</span>
                  <ui-badge [label]="tierLabel(c.tier)" [tone]="tierTone(c.tier)" />
                  <span class="comp__regions">
                    @for (r of c.regions; track r) {
                      <span class="tag">{{ country(r) }}</span>
                    }
                  </span>
                  <span class="comp__meta mono">{{ c.models.length }} 型号 · {{ c.paramHistory.length }} 情报</span>
                </button>
              }
            </div>
          }
        </aside>

        <div class="stack stack--loose">
          @if (selected(); as c) {
            <section class="card">
              <div class="card-hd">
                <div class="stack stack--tight">
                  <h2 class="card-title">{{ c.name }}</h2>
                  <span class="card-sub">{{ c.regions.length }} 个区域 · {{ c.models.length }} 个代表型号 · {{ c.paramHistory.length }} 条情报</span>
                </div>
                <div class="row row--wrap">
                  <ui-badge [label]="tierLabel(c.tier)" [tone]="tierTone(c.tier)" icon="scale" />
                  <ui-badge label="只读演示" tone="dashed" icon="lock" />
                </div>
              </div>
              <div class="card-bd stack">
                <dl class="kv">
                  <dt>梯队</dt>
                  <dd>{{ tierLabel(c.tier) }}</dd>
                  <dt>覆盖区域</dt>
                  <dd>
                    @for (r of c.regions; track r) {
                      <span class="tag">{{ country(r) }}</span>
                    }
                  </dd>
                  <dt>型号数</dt>
                  <dd class="mono">{{ c.models.length }}</dd>
                  <dt>情报时效</dt>
                  <dd>
                    @if (agedCount(c) > 0) {
                      <span class="text-warn">{{ agedCount(c) }} 条超出有效期</span>
                    } @else {
                      <span class="text-ok">全部条目在有效期内</span>
                    }
                  </dd>
                </dl>
                <p class="small muted">
                  只读演示：竞对档案用于投标前快速比对来源与口径。录入、来源管理与版本治理属于 P2 范围，本页不提供任何写操作。
                </p>
              </div>
            </section>

            <div class="banner" [class.banner--warn]="agedCount(c) > 0" [class.banner--info]="agedCount(c) === 0">
              <ui-icon name="clock" [size]="16" />
              <span>
                情报有效期 {{ validMonths() }} 个月：竞对参数按 {{ validMonths() }} 个月为有效期治理，超期条目视为「可能失效」，引用前必须复核最新手册或投标文件；
                @if (agedCount(c) > 0) {
                  当前有 {{ agedCount(c) }} 条已超期。
                } @else {
                  当前全部条目在有效期内。
                }
              </span>
            </div>

            <section class="card">
              <div class="card-hd">
                <h2 class="card-title">代表型号</h2>
                <span class="card-sub">能量口径来自公开手册，仅供比对</span>
              </div>
              @if (c.models.length === 0) {
                <div class="card-bd">
                  <ui-empty title="暂无型号信息" hint="该竞对仅获取到现场照片，型号待补充。" />
                </div>
              } @else {
                <div class="table-wrap table-wrap--flush">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>型号</th>
                        <th class="num" style="width: 96px">能量</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of c.models; track m.name) {
                        <tr>
                          <td class="strong">{{ m.name }}</td>
                          <td class="num">{{ m.mwh > 0 ? m.mwh + ' MWh' : '—' }}</td>
                          <td class="small muted">{{ m.note }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>

            <section class="card">
              <div class="card-hd">
                <h2 class="card-title">参数时间线</h2>
                <span class="card-sub mono">{{ history().length }} / {{ c.paramHistory.length }} 条</span>
              </div>
              <div class="card-bd card-bd--flush">
                <div class="filter-bar filter-bar--flush">
                  <div class="row" style="flex: 1">
                    <ui-icon name="search" [size]="14" />
                    <input
                      class="input"
                      type="search"
                      placeholder="检索参数名、key、值或来源"
                      aria-label="检索情报条目"
                      [ngModel]="sq()"
                      (ngModelChange)="sq.set($event)"
                    />
                  </div>
                  <select class="select" aria-label="按维度筛选情报" [ngModel]="dim()" (ngModelChange)="dim.set($event)">
                    <option value="all">全部维度</option>
                    @for (d of dimOptions; track d.key) {
                      <option [value]="d.key">{{ d.label }}</option>
                    }
                  </select>
                  @if (sq() || dim() !== 'all') {
                    <button type="button" class="chip" (click)="clearSearch()">清空</button>
                  }
                </div>

                @if (history().length === 0) {
                  <div class="card-bd">
                    <ui-empty
                      title="没有命中的情报"
                      hint="当前关键词与维度筛选下没有条目。情报按竞对产品手册与投标文件整理，可放宽维度或清空关键词。"
                      actionLabel="清空检索"
                      (action)="clearSearch()"
                    />
                  </div>
                } @else {
                  <div class="tl">
                    @for (h of history(); track $index) {
                      <div class="tl__item">
                        <div class="stack stack--tight">
                          <span class="tl__label">
                            @for (p of parts(h.label); track $index) {
                              @if (p.hit) {
                                <mark class="hl">{{ p.text }}</mark>
                              } @else {
                                {{ p.text }}
                              }
                            }
                          </span>
                          <span class="mono small muted">{{ h.defKey }}</span>
                        </div>
                        <div class="stack stack--tight">
                          <span class="mono tl__value">
                            @for (p of parts(h.value); track $index) {
                              @if (p.hit) {
                                <mark class="hl">{{ p.text }}</mark>
                              } @else {
                                {{ p.text }}
                              }
                            }
                            @if (h.unit !== '—') {
                              <span class="muted small">{{ h.unit }}</span>
                            }
                          </span>
                          <span class="small muted">
                            @for (p of parts(h.source); track $index) {
                              @if (p.hit) {
                                <mark class="hl">{{ p.text }}</mark>
                              } @else {
                                {{ p.text }}
                              }
                            }
                            · {{ date(h.date) }}
                          </span>
                        </div>
                        <div class="tl__foot">
                          @if (h.stale) {
                            <ui-badge label="可能过时" tone="dashed" icon="clock" />
                          }
                          @if (isAged(h)) {
                            <ui-badge label="超出有效期" tone="warn" icon="alert" />
                          }
                          <span class="small muted">距今 {{ ageMonths(h.date) }} 个月</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>

            <section class="card">
              <div class="card-hd">
                <h2 class="card-title">参与项目与中标结果</h2>
                <span class="card-sub">结果来自中标公示与公开渠道，未知表示未公开</span>
              </div>
              @if (c.projects.length === 0) {
                <div class="card-bd">
                  <ui-empty title="暂无项目记录" hint="该竞对在本库中尚无中标或投标记录。" />
                </div>
              } @else {
                <div class="table-wrap table-wrap--flush">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>项目</th>
                        <th class="num" style="width: 80px">年份</th>
                        <th style="width: 120px">结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of c.projects; track p.name) {
                        <tr>
                          <td>{{ p.name }}</td>
                          <td class="num">{{ p.year }}</td>
                          <td>
                            <ui-badge [label]="resultLabel(p.result)" [tone]="resultTone(p.result)" [icon]="resultIcon(p.result)" />
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          } @else {
            <ui-empty title="未选择竞对" hint="从左侧列表选择一家竞对查看档案。" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .list-tools {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
      }
      .list-tools .input {
        width: 100%;
        min-width: 0;
      }
      .list-empty {
        padding: 8px;
      }
      .comp-list {
        display: flex;
        flex-direction: column;
      }
      .comp {
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
      .comp:last-child {
        border-bottom: none;
      }
      .comp:hover {
        background: var(--bg-subtle);
      }
      .comp--active {
        background: var(--accent-weak);
        border-left-color: var(--accent);
      }
      .comp:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      .comp__name {
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
      }
      .comp__regions {
        grid-column: 1 / -1;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .comp__meta {
        grid-column: 1 / -1;
        font-size: 11px;
        color: var(--ink-3);
      }
      .table-wrap--flush {
        border: none;
        border-top: 1px solid var(--line);
      }
      .filter-bar--flush {
        border: none;
        border-bottom: 1px solid var(--line);
      }
      .tl {
        display: flex;
        flex-direction: column;
      }
      .tl__item {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
        gap: 4px 16px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--line);
      }
      .tl__item:last-child {
        border-bottom: none;
      }
      .tl__label {
        font-size: 13px;
        color: var(--ink);
      }
      .tl__value {
        font-size: 13px;
        color: var(--ink);
        overflow-wrap: anywhere;
      }
      .tl__foot {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .hl {
        background: var(--accent-weak);
        color: var(--ink);
        box-shadow: inset 0 -1px 0 var(--accent);
        padding: 0 1px;
      }
    `,
  ],
})
export class Library {
  private readonly store = inject(WorkspaceStore);

  readonly competitors = COMPETITORS;
  readonly tierChips = [
    { key: 'all', label: '全部' },
    { key: 't1', label: '第一梯队' },
    { key: 't2', label: '第二梯队' },
    { key: 'cn', label: '中国同侪' },
  ];
  readonly dimOptions = DIMENSIONS.map((d) => ({ key: d as string, label: DIMENSION_LABEL[d], words: DIM_WORDS[d] }));

  readonly sel = signal('c-a');
  readonly q = signal('');
  readonly tier = signal('all');
  readonly sq = signal('');
  readonly dim = signal('all');

  readonly validMonths = computed(() => this.store.thresholds().kbValidityMonths);

  readonly list = computed(() => {
    const q = this.q().trim().toLowerCase();
    const tier = this.tier();
    return this.competitors.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (tier === 't1') return c.tier === 1;
      if (tier === 't2') return c.tier === 2;
      if (tier === 'cn') return c.tier === 3 || c.name.includes('中国同侪');
      return true;
    });
  });

  readonly selected = computed(() => this.competitors.find((c) => c.id === this.sel()) ?? this.competitors[0]);

  readonly history = computed<CompetitorHistoryItem[]>(() => {
    const dimKey = this.dim();
    const words = this.dimOptions.find((d) => d.key === dimKey)?.words ?? [];
    const q = this.sq().trim().toLowerCase();
    const items = this.selected()?.paramHistory ?? [];
    return items
      .filter((h) => {
        if (dimKey !== 'all' && !words.some((w) => (h.label + ' ' + h.value).includes(w))) return false;
        if (!q) return true;
        return [h.label, h.defKey, h.value, h.source].some((t) => t.toLowerCase().includes(q));
      })
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly stats = computed(() => {
    const all = this.competitors;
    const regions = new Set<Country>();
    all.forEach((c) => c.regions.forEach((r) => regions.add(r)));
    const entries = all.reduce((n, c) => n + c.paramHistory.length, 0);
    return {
      competitors: all.length,
      entries,
      stale: all.reduce((n, c) => n + c.paramHistory.filter((h) => h.stale).length, 0),
      aged: all.reduce((n, c) => n + c.paramHistory.filter((h) => this.isAged(h)).length, 0),
      regions: regions.size,
      regionText: Array.from(regions)
        .map((r) => COUNTRY_LABEL[r])
        .join(' · '),
    };
  });

  country(code: Country): string {
    return COUNTRY_LABEL[code];
  }

  date(iso: string): string {
    return fmtDate(iso);
  }

  tierLabel(tier: number): string {
    return tier === 1 ? '第一梯队' : tier === 2 ? '第二梯队' : '第三梯队';
  }

  tierTone(tier: number): Tone {
    return tier === 1 ? 'info' : tier === 2 ? 'neutral' : 'dashed';
  }

  resultLabel(result: string): string {
    return result === 'win' ? '中标' : result === 'lose' ? '落标' : '未知';
  }

  resultTone(result: string): Tone {
    return result === 'win' ? 'ok' : result === 'lose' ? 'danger' : 'neutral';
  }

  resultIcon(result: string): string {
    return result === 'win' ? 'check' : result === 'lose' ? 'x' : 'help';
  }

  ageMonths(iso: string): number {
    const ms = DEMO_TODAY.getTime() - new Date(iso + 'T00:00:00').getTime();
    return Math.max(0, Math.floor(ms / 86400000 / 30.44));
  }

  isAged(item: CompetitorHistoryItem): boolean {
    return this.ageMonths(item.date) > this.validMonths();
  }

  agedCount(c: Competitor): number {
    return c.paramHistory.filter((h) => this.isAged(h)).length;
  }

  parts(text: string): Parts[] {
    const q = this.sq().trim().toLowerCase();
    if (!q) return [{ text, hit: false }];
    const lower = text.toLowerCase();
    const out: Parts[] = [];
    let from = 0;
    let at = lower.indexOf(q);
    while (at >= 0) {
      if (at > from) out.push({ text: text.slice(from, at), hit: false });
      out.push({ text: text.slice(at, at + q.length), hit: true });
      from = at + q.length;
      at = lower.indexOf(q, from);
    }
    if (from < text.length) out.push({ text: text.slice(from), hit: false });
    return out;
  }

  clearList(): void {
    this.q.set('');
    this.tier.set('all');
  }

  clearSearch(): void {
    this.sq.set('');
    this.dim.set('all');
  }
}
