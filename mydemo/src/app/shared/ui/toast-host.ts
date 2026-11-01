import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { Icon } from './icon';

@Component({
  selector: 'ui-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="host" aria-live="polite" aria-atomic="false">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.tone">
          <ui-icon [name]="t.tone === 'danger' ? 'alert' : t.tone === 'warn' ? 'alert' : 'check'" [size]="16" />
          <div class="toast__body">
            <p class="toast__msg">{{ t.message }}</p>
            @if (t.detail) {
              <p class="toast__detail">{{ t.detail }}</p>
            }
          </div>
          <button type="button" class="toast__x" aria-label="关闭提示" (click)="toastService.dismiss(t.id)">
            <ui-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .host {
        position: fixed;
        top: 68px;
        right: 16px;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(360px, calc(100vw - 32px));
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        background: var(--surface);
        border: 1px solid var(--line-strong);
        border-left: 3px solid var(--ink-3);
        box-shadow: 0 4px 16px rgba(17, 18, 20, 0.08);
        animation: toast-in 180ms ease-out;
      }
      .toast--ok {
        border-left-color: var(--ok);
      }
      .toast--warn {
        border-left-color: var(--warn);
      }
      .toast--danger {
        border-left-color: var(--danger);
      }
      .toast--info {
        border-left-color: var(--accent);
      }
      .toast__body {
        flex: 1;
        min-width: 0;
      }
      .toast__msg {
        margin: 0;
        font-size: 13px;
        color: var(--ink);
        line-height: 1.5;
      }
      .toast__detail {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--ink-3);
        line-height: 1.5;
      }
      .toast__x {
        border: none;
        background: transparent;
        color: var(--ink-3);
        cursor: pointer;
        min-width: 24px;
        min-height: 24px;
      }
      .toast__x:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .toast {
          animation: none;
        }
      }
    `,
  ],
})
export class ToastHost {
  readonly toastService = inject(ToastService);
}
