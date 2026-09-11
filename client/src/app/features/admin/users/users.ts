import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Auth } from '../../../core/services/auth';
import { Toast } from '../../../core/services/toast';
import { AdminUser } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const PAGE_SIZE = 10;
type SortKey = 'name' | 'email' | 'createdAt';
type RoleFilter = '' | 'admin' | 'customer';

const SORTERS: Record<SortKey, Sorter<AdminUser>> = {
  name: (a, b) => a.fullName.localeCompare(b.fullName),
  email: (a, b) => a.email.localeCompare(b.email),
  createdAt: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
};

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, Icon, Pagination],
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);

  protected readonly users = signal<AdminUser[]>([]);

  protected readonly search = signal('');
  protected readonly roleFilter = signal<RoleFilter>('');
  protected readonly sortKey = signal<SortKey>('createdAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.users();
    const role = this.roleFilter();
    if (role === 'admin') list = list.filter((u) => u.isAdmin);
    if (role === 'customer') list = list.filter((u) => !u.isAdmin);
    list = list.filter((u) => matchesQuery(u, this.search(), [(x) => x.fullName, (x) => x.email]));
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.adminApi.getUsers().subscribe((users) => this.users.set(users));
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onRoleFilterChange(value: RoleFilter): void {
    this.roleFilter.set(value);
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

  isSelf(user: AdminUser): boolean {
    return this.auth.currentUser?.id === user.id;
  }

  toggleAdmin(user: AdminUser): void {
    this.adminApi.setUserAdmin(user.id, !user.isAdmin).subscribe({
      next: () => this.refresh(),
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo actualizar el usuario.'),
    });
  }

  remove(user: AdminUser): void {
    if (!confirm(`¿Eliminar la cuenta de "${user.fullName}"?`)) return;

    this.adminApi.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.show('Usuario eliminado.');
        this.refresh();
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo eliminar el usuario.'),
    });
  }
}
