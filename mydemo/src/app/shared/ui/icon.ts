import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
    >
      @switch (name()) {
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        }
        @case ('folder') {
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        }
        @case ('file') {
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        }
        @case ('table') {
          <rect x="3" y="4" width="18" height="16" />
          <path d="M3 9h18M3 14h18M9 9v11" />
        }
        @case ('scale') {
          <path d="M12 3v18M7 7l-4 8h8zM17 7l4 8h-8z" />
          <path d="M5 21h14" />
        }
        @case ('bulb') {
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z" />
        }
        @case ('check-square') {
          <rect x="3" y="3" width="18" height="18" />
          <path d="M8 12l3 3 5-6" />
        }
        @case ('doc') {
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        }
        @case ('library') {
          <path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5 15" />
          <path d="M3 20h18" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
        }
        @case ('chevron-right') {
          <path d="M9 6l6 6-6 6" />
        }
        @case ('chevron-down') {
          <path d="M6 9l6 6 6-6" />
        }
        @case ('arrow-up') {
          <path d="M12 19V5M6 11l6-6 6 6" />
        }
        @case ('arrow-down') {
          <path d="M12 5v14M6 13l6 6 6-6" />
        }
        @case ('x') {
          <path d="M6 6l12 12M18 6L6 18" />
        }
        @case ('check') {
          <path d="M5 13l4 4L19 7" />
        }
        @case ('alert') {
          <path d="M12 3l9 17H3z" />
          <path d="M12 9v5M12 17h.01" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        }
        @case ('filter') {
          <path d="M3 5h18l-7 8v6l-4 2v-8z" />
        }
        @case ('download') {
          <path d="M12 4v11M8 11l4 4 4-4M4 20h16" />
        }
        @case ('edit') {
          <path d="M4 20h4l10-10-4-4L4 16z" />
          <path d="M14 6l4 4" />
        }
        @case ('link') {
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        }
        @case ('lock') {
          <rect x="5" y="10" width="14" height="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        }
        @case ('refresh') {
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v4h-4" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('minus') {
          <path d="M6 12h12" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7v.5M12 17h.01" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.5" />
        }
        @case ('target') {
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        }
        @case ('book') {
          <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z" />
          <path d="M4 19a2 2 0 0 1 2-2h13" />
        }
        @case ('flag') {
          <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
        }
        @case ('chat') {
          <path d="M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 13 4a8 8 0 0 1 8 8z" />
          <path d="M9 11h8M9 15h5" />
        }
        @default {
          <circle cx="12" cy="12" r="9" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
      svg {
        display: block;
      }
    `,
  ],
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(16);
  readonly label = input('');
}
