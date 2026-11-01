import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../../core/types';

@Component({
  selector: 'ui-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat" [class.stat--link]="hint()">
      <div class="stat__label">{{ label() }}</div>
      <div class="stat__value" [class]="'stat__value--' + tone()">{{ value() }}</div>
      @if (hint()) {
        <div class="stat__hint">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .stat {
        padding: 16px 18px;
        border: 1px solid var(--line);
        background: var(--surface);
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .stat--link:hover {
        border-color: var(--line-strong);
        cursor: pointer;
      }
      .stat__label {
        font-size: 12px;
        color: var(--ink-3);
        letter-spacing: 0.02em;
      }
      .stat__value {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 28px;
        line-height: 1.1;
        font-weight: 500;
        color: var(--ink);
      }
      .stat__value--danger {
        color: var(--danger);
      }
      .stat__value--warn {
        color: var(--warn);
      }
      .stat__value--ok {
        color: var(--ok);
      }
      .stat__value--info {
        color: var(--accent);
      }
      .stat__hint {
        font-size: 12px;
        color: var(--ink-3);
      }
    `,
  ],
})
export class Stat {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly tone = input<Tone>('neutral');
}
