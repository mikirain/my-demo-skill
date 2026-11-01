import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()" [attr.width]="size()" [attr.height]="size()">
        <circle
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          fill="none"
          stroke="var(--bg-subtle)"
          [attr.stroke-width]="stroke"
        />
        <circle
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          fill="none"
          stroke="var(--accent)"
          [attr.stroke-width]="stroke"
          [attr.stroke-dasharray]="dash()"
          [attr.stroke-dashoffset]="offset()"
          [attr.transform]="'rotate(-90 ' + size() / 2 + ' ' + size() / 2 + ')'"
          stroke-linecap="butt"
        />
      </svg>
      <div class="ring__center">
        <span class="ring__value">{{ clamped() }}%</span>
        @if (label()) {
          <span class="ring__label">{{ label() }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ring {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        display: block;
      }
      .ring__center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
      }
      .ring__value {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-size: 20px;
        color: var(--ink);
      }
      .ring__label {
        font-size: 11px;
        color: var(--ink-3);
      }
    `,
  ],
})
export class Ring {
  readonly value = input.required<number>();
  readonly size = input(96);
  readonly label = input('');
  readonly stroke = 6;
  readonly clamped = computed(() => Math.max(0, Math.min(100, Math.round(this.value()))));
  readonly radius = computed(() => this.size() / 2 - this.stroke);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());
  readonly dash = computed(() => `${this.circumference()} ${this.circumference()}`);
  readonly offset = computed(() => this.circumference() * (1 - this.clamped() / 100));
}
