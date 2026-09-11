import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { AdminContactMessage } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const PAGE_SIZE = 8;
type SortKey = 'name' | 'createdAt';
type StatusFilter = '' | 'unhandled' | 'handled';

const SORTERS: Record<SortKey, Sorter<AdminContactMessage>> = {
  name: (a, b) => a.name.localeCompare(b.name),
  createdAt: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
};

@Component({
  selector: 'app-contact',
  imports: [DatePipe, FormsModule, Icon, Pagination],
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly messages = signal<AdminContactMessage[]>([]);
  protected readonly expandedId = signal<number | null>(null);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly sortKey = signal<SortKey>('createdAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.messages();
    const status = this.statusFilter();
    if (status === 'handled') list = list.filter((m) => m.handledAt);
    if (status === 'unhandled') list = list.filter((m) => !m.handledAt);
    list = list.filter((m) =>
      matchesQuery(m, this.search(), [(x) => x.name, (x) => x.email, (x) => x.subject]),
    );
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.adminApi.getContactMessages().subscribe((messages) => this.messages.set(messages));
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatusFilterChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  toggle(message: AdminContactMessage): void {
    this.expandedId.set(this.expandedId() === message.id ? null : message.id);
  }

  markHandled(message: AdminContactMessage, event: Event): void {
    event.stopPropagation();
    this.adminApi.markContactHandled(message.id).subscribe(() => this.refresh());
  }

  remove(message: AdminContactMessage, event: Event): void {
    event.stopPropagation();
    if (!confirm(`¿Eliminar el mensaje de "${message.name}"?`)) return;
    this.adminApi.deleteContactMessage(message.id).subscribe(() => this.refresh());
  }
}
