import { Service, computed, signal } from '@angular/core';

// Tracks in-flight HTTP requests (see loading-interceptor) so any part of the
// UI can show global "something is happening" feedback without each
// component wiring up its own request-tracking state.
@Service()
export class Loading {
  private readonly activeRequests = signal(0);
  readonly isLoading = computed(() => this.activeRequests() > 0);

  start(): void {
    this.activeRequests.update((n) => n + 1);
  }

  stop(): void {
    this.activeRequests.update((n) => Math.max(0, n - 1));
  }
}
