import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../../core/types';

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
}

@Component({
  selector: 'ui-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bars" role="img" [attr.aria-label]="summary()">
      @for (d of data(); track d.label) {
        <div class="bars__row">
          <span class="bars__label">{{ d.label }}</span>
          <span class="bars__track">
            <span class="bars__fill" [class]="'bars__fill--' + (d.tone || 'info')" [style.width.%]="pct(d.value)"></span>
          </span>
          <span class="bars__value">{{ d.value }}{{ unit() }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bars {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      .bars__row {
        display: grid;
        grid-template-columns: minmax(72px, 108px) 1fr 48px;
        align-items: center;
        gap: 10px;
      }
      .bars__label {
        font-size: 12px;
        color: var(--ink-2);
      }
      .bars__track {
        height: 10px;
        background: var(--bg-subtle);
        border: 1px solid var(--line);
        display: block;
        position: relative;
      }
      .bars__fill {
        display: block;
        height: 100%;
        background: var(--accent);
        transition: width 220ms ease-out;
      }
      .bars__fill--ok {
        background: var(--ok);
      }
      .bars__fill--warn {
        background: var(--warn);
      }
      .bars__fill--danger {
        background: var(--danger);
      }
      .bars__fill--neutral {
        background: var(--ink-3);
      }
      .bars__fill--dashed {
        background: repeating-linear-gradient(45deg, var(--ink-3) 0 3px, transparent 3px 6px);
      }
      .bars__value {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 12px;
        color: var(--ink-2);
        text-align: right;
      }
      @media (prefers-reduced-motion: reduce) {
        .bars__fill {
          transition: none;
        }
      }
    `,
  ],
})
export class Bars {
  readonly data = input.required<BarDatum[]>();
  readonly unit = input('');
  private readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.value)));
  readonly summary = computed(() =>
    this.data()
      .map((d) => `${d.label} ${d.value}${this.unit()}`)
      .join('，'),
  );

  pct(v: number): number {
    return Math.round((v / this.max()) * 100);
  }
}
