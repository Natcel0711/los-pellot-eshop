import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { AdminCategory } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const PAGE_SIZE = 10;

type SortKey = 'sortOrder' | 'id' | 'name';

const SORTERS: Record<SortKey, Sorter<AdminCategory>> = {
  sortOrder: (a, b) => a.sortOrder - b.sortOrder,
  id: (a, b) => a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name),
};

@Component({
  selector: 'app-categories',
  imports: [FormsModule, Icon, Pagination],
  styleUrl: './categories.css',
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly editing = signal<AdminCategory | null>(null);
  protected readonly showForm = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly sortKey = signal<SortKey>('sortOrder');
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    const list = this.categories().filter((c) =>
      matchesQuery(c, this.search(), [(x) => x.id, (x) => x.name]),
    );
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.adminApi.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  onSearchChange(value: string): void {
    this.search.set(value);
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

  startCreate(): void {
    this.editing.set(null);
    this.error.set(null);
    this.showForm.set(true);
  }

  startEdit(category: AdminCategory): void {
    this.editing.set(category);
    this.error.set(null);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  submit(form: HTMLFormElement): void {
    const data = new FormData(form);
    const request = {
      id: String(data.get('id') ?? '').trim(),
      name: String(data.get('name') ?? '').trim(),
      iconName: String(data.get('iconName') ?? '').trim(),
      defaultBulbType: String(data.get('defaultBulbType') ?? '').trim(),
      sortOrder: Number(data.get('sortOrder') ?? 0),
    };

    const editing = this.editing();
    const request$ = editing
      ? this.adminApi.updateCategory(editing.id, request)
      : this.adminApi.createCategory(request);

    request$.subscribe({
      next: () => {
        this.toast.show(editing ? 'Categoría actualizada.' : 'Categoría creada.');
        this.showForm.set(false);
        this.refresh();
      },
      error: (err) => this.error.set(err?.error?.error ?? 'No se pudo guardar la categoría.'),
    });
  }

  remove(category: AdminCategory): void {
    if (!confirm(`¿Eliminar "${category.name}"?`)) return;

    this.adminApi.deleteCategory(category.id).subscribe({
      next: () => {
        this.toast.show('Categoría eliminada.');
        this.refresh();
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo eliminar la categoría.'),
    });
  }
}
