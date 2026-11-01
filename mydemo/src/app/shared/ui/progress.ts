import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../../core/types';

@Component({
  selector: 'ui-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div
        class="track"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label() || '进度'"
      >
        <div class="fill" [class]="'fill--' + tone()" [style.width.%]="clamped()"></div>
      </div>
      @if (showValue()) {
        <span class="num">{{ clamped() }}%</span>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .track {
        flex: 1;
        height: 6px;
        background: var(--bg-subtle);
        border: 1px solid var(--line);
        overflow: hidden;
        min-width: 40px;
      }
      .fill {
        height: 100%;
        background: var(--ink-3);
        transition: width 200ms ease-out;
      }
      .fill--ok {
        background: var(--ok);
      }
      .fill--warn {
        background: var(--warn);
      }
      .fill--danger {
        background: var(--danger);
      }
      .fill--info {
        background: var(--accent);
      }
      .num {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 12px;
        color: var(--ink-2);
        min-width: 34px;
        text-align: right;
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
    `,
  ],
})
export class Progress {
  readonly value = input.required<number>();
  readonly tone = input<Tone>('info');
  readonly label = input('');
  readonly showValue = input(true);
  readonly clamped = computed(() => Math.max(0, Math.min(100, Math.round(this.value()))));
}
