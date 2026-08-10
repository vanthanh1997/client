import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly counter = signal(0);

  readonly pending = this.counter.asReadonly();

  readonly isLoading = computed(() => this.counter() > 0);

  start(): void {
    this.counter.update((value) => value + 1);
  }

  stop(): void {
    this.counter.update((value) => (value > 0 ? value - 1 : 0));
  }

  reset(): void {
    this.counter.set(0);
  }
}
