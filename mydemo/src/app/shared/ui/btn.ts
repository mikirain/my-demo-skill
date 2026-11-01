import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'ui-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [class]="'btn btn--' + variant() + ' btn--' + size()"
    >
      @if (loading()) {
        <span class="btn__spin" aria-hidden="true"></span>
      } @else if (icon()) {
        <ui-icon [name]="icon()" [size]="size() === 'sm' ? 14 : 16" />
      }
      <span class="btn__label"><ng-content /></span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid transparent;
        background: transparent;
        font: inherit;
        font-size: 14px;
        line-height: 1;
        padding: 0 14px;
        min-height: 36px;
        min-width: 36px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out;
      }
      .btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .btn:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }
      .btn--sm {
        min-height: 28px;
        padding: 0 10px;
        font-size: 13px;
      }
      .btn--primary {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
      .btn--primary:hover:not(:disabled) {
        background: #1739a8;
        border-color: #1739a8;
      }
      .btn--secondary {
        background: var(--surface);
        color: var(--ink);
        border-color: var(--line-strong);
      }
      .btn--secondary:hover:not(:disabled) {
        background: var(--bg-subtle);
      }
      .btn--ghost {
        color: var(--ink-2);
        border-color: transparent;
      }
      .btn--ghost:hover:not(:disabled) {
        background: var(--bg-subtle);
        color: var(--ink);
      }
      .btn--danger {
        background: var(--surface);
        color: var(--danger);
        border-color: #e7b4ae;
      }
      .btn--danger:hover:not(:disabled) {
        background: #fdf3f2;
      }
      .btn__spin {
        width: 13px;
        height: 13px;
        border: 1.5px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: btn-spin 700ms linear infinite;
      }
      @keyframes btn-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .btn {
          transition: none;
        }
        .btn__spin {
          animation: none;
        }
      }
    `,
  ],
})
export class Btn {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('secondary');
  readonly size = input<'sm' | 'md'>('md');
  readonly icon = input('');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
}
