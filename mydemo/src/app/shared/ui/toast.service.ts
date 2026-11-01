import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'warn' | 'danger' | 'info';
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  push(message: string, tone: Toast['tone'] = 'ok', detail?: string): void {
    this.seq += 1;
    const toast: Toast = { id: this.seq, message, tone, detail };
    this.toasts.update((list) => [toast, ...list].slice(0, 4));
    setTimeout(() => this.dismiss(toast.id), 4200);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
