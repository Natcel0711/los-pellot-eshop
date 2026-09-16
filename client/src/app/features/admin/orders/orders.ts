import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { AdminOrder, ORDER_STATUS_FILTERS, ORDER_STATUS_OPTIONS } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const PAGE_SIZE = 10;
type SortKey = 'orderNumber' | 'customer' | 'total' | 'createdAt';

const SORTERS: Record<SortKey, Sorter<AdminOrder>> = {
  orderNumber: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
  customer: (a, b) => a.customerName.localeCompare(b.customerName),
  total: (a, b) => a.total - b.total,
  createdAt: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
};

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, FormsModule, Icon, Pagination],
  styleUrl: './orders.css',
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly statusFilters = ORDER_STATUS_FILTERS;
  protected readonly settableStatuses = ORDER_STATUS_OPTIONS;

  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly sortKey = signal<SortKey>('createdAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.orders();
    const status = this.statusFilter();
    if (status) list = list.filter((o) => o.status === status);
    list = list.filter((o) =>
      matchesQuery(o, this.search(), [(x) => x.orderNumber, (x) => x.customerName, (x) => x.customerEmail]),
    );
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.adminApi.getOrders().subscribe((orders) => this.orders.set(orders));
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatusFilterChange(value: string): void {
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

  updateStatus(order: AdminOrder, status: string): void {
    if (status === order.status) return;
    this.adminApi.updateOrderStatus(order.orderNumber, status).subscribe({
      next: () => this.refresh(),
      error: () => this.toast.show('No se pudo actualizar el estado de la orden.'),
    });
  }
}
