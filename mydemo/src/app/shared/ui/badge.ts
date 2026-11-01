import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../../core/types';
import { Icon } from './icon';

@Component({
  selector: 'ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <span class="badge" [class]="'badge--' + tone()" [attr.aria-label]="ariaLabel() || label()">
      @if (icon()) {
        <ui-icon [name]="icon()" [size]="12" />
      }
      <span>{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        font-size: 12px;
        line-height: 18px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink-2);
        white-space: nowrap;
      }
      .badge--ok {
        color: var(--ok);
        border-color: #b7d8c3;
        background: #f2f8f4;
      }
      .badge--warn {
        color: var(--warn);
        border-color: #e0cfa8;
        background: #fbf6ea;
      }
      .badge--danger {
        color: var(--danger);
        border-color: #e7b4ae;
        background: #fdf3f2;
      }
      .badge--info {
        color: var(--accent);
        border-color: #c3cef5;
        background: var(--accent-weak);
      }
      .badge--neutral {
        color: var(--ink-3);
        border-color: var(--line);
        background: var(--bg-subtle);
      }
      .badge--dashed {
        color: var(--ink-2);
        border-style: dashed;
        border-color: var(--line-strong);
        background: var(--surface);
      }
    `,
  ],
})
export class Badge {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('neutral');
  readonly icon = input('');
  readonly ariaLabel = input('');
}
