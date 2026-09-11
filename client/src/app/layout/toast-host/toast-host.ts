import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon/icon';
import { Toast } from '../../core/services/toast';

interface ToastEntry {
  id: number;
  message: string;
  leaving: boolean;
}

let nextId = 1;

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  styleUrl: './toast-host.css',
  templateUrl: './toast-host.html',
})
export class ToastHost implements OnDestroy {
  private readonly toast = inject(Toast);
  protected readonly toasts = signal<ToastEntry[]>([]);

  private readonly subscription = this.toast.message$.subscribe((message) => this.push(message));

  private push(message: string): void {
    const entry: ToastEntry = { id: nextId++, message, leaving: false };
    this.toasts.update((list) => [...list, entry]);

    setTimeout(() => {
      this.toasts.update((list) => list.map((t) => (t.id === entry.id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        this.toasts.update((list) => list.filter((t) => t.id !== entry.id));
      }, 300);
    }, 2200);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
