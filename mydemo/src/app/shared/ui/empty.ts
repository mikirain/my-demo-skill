import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'ui-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="empty">
      <ui-icon [name]="icon()" [size]="28" />
      <p class="empty__title">{{ title() }}</p>
      @if (hint()) {
        <p class="empty__hint">{{ hint() }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="empty__action" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 48px 24px;
        text-align: center;
        border: 1px dashed var(--line-strong);
        color: var(--ink-3);
        background: var(--surface);
      }
      .empty__title {
        margin: 0;
        font-size: 14px;
        color: var(--ink);
      }
      .empty__hint {
        margin: 0;
        font-size: 13px;
        max-width: 42ch;
        line-height: 1.6;
      }
      .empty__action {
        margin-top: 8px;
        font: inherit;
        font-size: 13px;
        padding: 6px 14px;
        min-height: 36px;
        border: 1px solid var(--line-strong);
        background: var(--surface);
        color: var(--ink);
        cursor: pointer;
      }
      .empty__action:hover {
        background: var(--bg-subtle);
      }
      .empty__action:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    `,
  ],
})
export class Empty {
  readonly title = input.required<string>();
  readonly hint = input('');
  readonly icon = input('info');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
