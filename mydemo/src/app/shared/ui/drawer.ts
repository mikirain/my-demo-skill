import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'ui-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div class="scrim" (click)="close.emit()" aria-hidden="true"></div>
      <aside
        class="drawer"
        [class.drawer--left]="side() === 'left'"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        tabindex="-1"
        #panel
      >
        <header class="drawer__hd">
          <h2 class="drawer__title">{{ title() }}</h2>
          <button type="button" class="icon-btn" aria-label="关闭抽屉" (click)="close.emit()">
            <ui-icon name="x" [size]="18" />
          </button>
        </header>
        <div class="drawer__bd"><ng-content /></div>
      </aside>
    }
  `,
  styles: [
    `
      .scrim {
        position: fixed;
        inset: 0;
        background: rgba(17, 18, 20, 0.4);
        z-index: 100;
        animation: fade-in 160ms ease-out;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(520px, 92vw);
        background: var(--surface);
        border-left: 1px solid var(--line-strong);
        box-shadow: 0 8px 24px rgba(17, 18, 20, 0.12);
        z-index: 101;
        display: flex;
        flex-direction: column;
        animation: slide-in 240ms ease-out;
      }
      .drawer--left {
        right: auto;
        left: 0;
        border-left: none;
        border-right: 1px solid var(--line-strong);
      }
      .drawer__hd {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
      }
      .drawer__title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .drawer__bd {
        padding: 18px;
        overflow: auto;
        flex: 1;
      }
      .icon-btn {
        border: 1px solid transparent;
        background: transparent;
        color: var(--ink-2);
        cursor: pointer;
        min-width: 32px;
        min-height: 32px;
      }
      .icon-btn:hover {
        background: var(--bg-subtle);
        color: var(--ink);
      }
      .icon-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
      }
      @keyframes slide-in {
        from {
          transform: translateX(16px);
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .scrim,
        .drawer {
          animation: none;
        }
      }
    `,
  ],
})
export class Drawer {
  readonly open = input(false);
  readonly title = input('');
  readonly side = input<'right' | 'left'>('right');
  readonly close = output<void>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.panel()?.nativeElement.focus());
      }
    });
  }

  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}
