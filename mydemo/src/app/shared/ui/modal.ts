import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'ui-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div class="scrim" (click)="close.emit()" aria-hidden="true"></div>
      <div class="panel" [class]="'panel--' + size()" role="dialog" aria-modal="true" [attr.aria-label]="title()" tabindex="-1" #panel>
        <header class="panel__hd">
          <h2 class="panel__title">{{ title() }}</h2>
          <button type="button" class="icon-btn" aria-label="关闭弹窗" (click)="close.emit()">
            <ui-icon name="x" [size]="18" />
          </button>
        </header>
        <div class="panel__bd"><ng-content /></div>
        @if (hasFooter()) {
          <footer class="panel__ft"><ng-content select="[modal-footer]" /></footer>
        }
      </div>
    }
  `,
  styles: [
    `
      .scrim {
        position: fixed;
        inset: 0;
        background: rgba(17, 18, 20, 0.48);
        z-index: 100;
        animation: fade-in 160ms ease-out;
      }
      .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface);
        border: 1px solid var(--line-strong);
        box-shadow: 0 8px 24px rgba(17, 18, 20, 0.12);
        z-index: 101;
        width: min(560px, calc(100vw - 32px));
        max-height: calc(100vh - 96px);
        display: flex;
        flex-direction: column;
        animation: panel-in 200ms ease-out;
      }
      .panel--sm {
        width: min(420px, calc(100vw - 32px));
      }
      .panel--lg {
        width: min(880px, calc(100vw - 32px));
      }
      .panel__hd {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
      }
      .panel__title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--ink);
      }
      .panel__bd {
        padding: 18px;
        overflow: auto;
      }
      .panel__ft:empty {
        display: none;
      }
      .panel__ft {
        padding: 12px 18px;
        border-top: 1px solid var(--line);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        background: var(--bg-subtle);
      }
      .icon-btn {
        border: 1px solid transparent;
        background: transparent;
        color: var(--ink-2);
        cursor: pointer;
        min-width: 32px;
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
      @keyframes panel-in {
        from {
          opacity: 0;
          transform: translate(-50%, calc(-50% + 8px));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .scrim,
        .panel {
          animation: none;
        }
      }
    `,
  ],
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly hasFooter = input(true);
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
