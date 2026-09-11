import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { AdminBooking, BOOKING_STATUSES } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const PAGE_SIZE = 10;
type SortKey = 'name' | 'preferredDate' | 'createdAt';

const SORTERS: Record<SortKey, Sorter<AdminBooking>> = {
  name: (a, b) => a.name.localeCompare(b.name),
  preferredDate: (a, b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime(),
  createdAt: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
};

@Component({
  selector: 'app-bookings',
  imports: [DatePipe, FormsModule, Icon, Pagination],
  styleUrl: './bookings.css',
  templateUrl: './bookings.html',
})
export class Bookings implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly bookings = signal<AdminBooking[]>([]);
  protected readonly statuses = BOOKING_STATUSES;

  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly sortKey = signal<SortKey>('createdAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.bookings();
    const status = this.statusFilter();
    if (status) list = list.filter((b) => b.status === status);
    list = list.filter((b) =>
      matchesQuery(b, this.search(), [(x) => x.name, (x) => x.email, (x) => x.vehicleDescription]),
    );
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.adminApi.getBookings().subscribe((bookings) => this.bookings.set(bookings));
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

  updateStatus(booking: AdminBooking, status: string): void {
    if (status === booking.status) return;
    this.adminApi.updateBookingStatus(booking.id, status).subscribe({
      next: () => this.refresh(),
      error: () => this.toast.show('No se pudo actualizar el estado.'),
    });
  }

  remove(booking: AdminBooking): void {
    if (!confirm(`¿Eliminar la cita de "${booking.name}"?`)) return;
    this.adminApi.deleteBooking(booking.id).subscribe(() => this.refresh());
  }
}
