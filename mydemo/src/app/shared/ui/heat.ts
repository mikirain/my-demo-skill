import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface HeatRow {
  name: string;
  scores: (number | null)[];
}

@Component({
  selector: 'ui-heat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="heat" role="table" [attr.aria-label]="'维度得分热力图，' + caption()">
      <div class="heat__row heat__row--head" role="row">
        <span class="heat__name" role="columnheader">对象</span>
        @for (c of cols(); track c) {
          <span class="heat__col" role="columnheader">{{ c }}</span>
        }
      </div>
      @for (r of rows(); track r.name) {
        <div class="heat__row" role="row">
          <span class="heat__name" role="rowheader">{{ r.name }}</span>
          @for (s of r.scores; track $index) {
            <span class="heat__cell" [class]="band(s)" role="cell" [attr.aria-label]="cellLabel(s)">
              @if (s === null) {
                <span class="heat__na">不可比</span>
              } @else {
                {{ s }}
              }
            </span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .heat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        font-size: 12px;
      }
      .heat__row {
        display: grid;
        grid-template-columns: minmax(88px, 120px) repeat(6, 1fr);
        gap: 2px;
        align-items: stretch;
      }
      .heat__row--head .heat__col,
      .heat__row--head .heat__name {
        color: var(--ink-3);
        font-weight: 500;
        padding-bottom: 6px;
        text-align: center;
      }
      .heat__name {
        display: flex;
        align-items: center;
        color: var(--ink-2);
      }
      .heat__cell {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink-2);
      }
      .heat__cell--ok {
        background: #eef7f1;
        color: var(--ok);
        border-color: #cfe6d7;
      }
      .heat__cell--warn {
        background: #fbf5e8;
        color: var(--warn);
        border-color: #ecdcb9;
      }
      .heat__cell--danger {
        background: #fdf1ef;
        color: var(--danger);
        border-color: #efc7c0;
      }
      .heat__cell--na {
        background: repeating-linear-gradient(45deg, #f4f5f6 0 4px, #fbfbfc 4px 8px);
        border-style: dashed;
        border-color: var(--line-strong);
        color: var(--ink-3);
      }
      .heat__na {
        font-family: var(--font-sans);
        font-size: 11px;
      }
    `,
  ],
})
export class Heat {
  readonly cols = input.required<string[]>();
  readonly rows = input.required<HeatRow[]>();
  readonly caption = computed(() => this.rows().map((r) => r.name).join('、'));

  band(s: number | null): string {
    if (s === null) return 'heat__cell--na';
    if (s >= 85) return 'heat__cell--ok';
    if (s >= 60) return 'heat__cell--warn';
    return 'heat__cell--danger';
  }

  cellLabel(s: number | null): string {
    return s === null ? '不可比' : `得分 ${s}`;
  }
}
