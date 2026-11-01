import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'ui-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="label()">
      @for (t of tabs(); track t.id) {
        <button
          type="button"
          role="tab"
          class="tab"
          [class.tab--active]="t.id === active()"
          [attr.aria-selected]="t.id === active()"
          [attr.tabindex]="t.id === active() ? 0 : -1"
          (click)="change.emit(t.id)"
          (keydown)="onKey($event, t.id)"
        >
          {{ t.label }}
          @if (t.count !== undefined) {
            <span class="tab__count">{{ t.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      .tabs {
        display: flex;
        gap: 2px;
        border-bottom: 1px solid var(--line);
        overflow-x: auto;
      }
      .tab {
        font: inherit;
        font-size: 13px;
        color: var(--ink-3);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 10px 14px;
        min-height: 40px;
        cursor: pointer;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: color 160ms ease-out, border-color 160ms ease-out;
      }
      .tab:hover {
        color: var(--ink);
      }
      .tab--active {
        color: var(--ink);
        border-bottom-color: var(--accent);
      }
      .tab:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      .tab__count {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-3);
        background: var(--bg-subtle);
        border: 1px solid var(--line);
        padding: 0 5px;
      }
      @media (prefers-reduced-motion: reduce) {
        .tab {
          transition: none;
        }
      }
    `,
  ],
})
export class Tabs {
  readonly tabs = input.required<TabItem[]>();
  readonly active = input.required<string>();
  readonly label = input('分页导航');
  readonly change = output<string>();

  onKey(event: KeyboardEvent, id: string): void {
    const list = this.tabs();
    const index = list.findIndex((t) => t.id === id);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? (index + 1) % list.length : (index - 1 + list.length) % list.length;
      this.change.emit(list[next].id);
    }
  }
}
