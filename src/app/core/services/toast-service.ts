import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly text: string;
}

const TTL_BY_KIND: Record<ToastKind, number> = {
  success: 3000,
  info: 3000,
  error: 6000,
};

@Injectable({ providedIn: 'root' })
export class ToastService { 
  private readonly items = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private sequence = 0;

  readonly toasts = this.items.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }
  success(text: string): number {
    return this.show('success', text);
  }

  error(text: string): number {
    return this.show('error', text);
  }

  info(text: string): number {
    return this.show('info', text);
  }

  private show(kind: ToastKind, text: string): number {
    const id = ++this.sequence;
    const toast: Toast = { id, kind, text };

    this.items.update((list) => [...list, toast]);

    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), TTL_BY_KIND[kind]),
    );

    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.items.set([]);
  }
}
