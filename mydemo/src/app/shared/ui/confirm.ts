import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Btn } from './btn';
import { Modal } from './modal';

@Component({
  selector: 'ui-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal, Btn],
  template: `
    <ui-modal [open]="open()" [title]="title()" size="sm" (close)="cancel.emit()">
      <p class="msg">{{ message() }}</p>
      @if (detail()) {
        <p class="detail">{{ detail() }}</p>
      }
      <div modal-footer>
        <ui-btn variant="secondary" (click)="cancel.emit()">{{ cancelText() }}</ui-btn>
        <ui-btn [variant]="danger() ? 'danger' : 'primary'" (click)="confirm.emit()">{{ confirmText() }}</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .msg {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--ink);
        line-height: 1.6;
      }
      .detail {
        margin: 0;
        font-size: 13px;
        color: var(--ink-3);
        line-height: 1.6;
      }
    `,
  ],
})
export class Confirm {
  readonly open = input(false);
  readonly title = input('确认操作');
  readonly message = input.required<string>();
  readonly detail = input('');
  readonly confirmText = input('确认');
  readonly cancelText = input('取消');
  readonly danger = input(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
