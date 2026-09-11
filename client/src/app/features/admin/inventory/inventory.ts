import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { AdminCategory, AdminProduct } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 10;

type SortKey = 'name' | 'category' | 'stock';

const SORTERS: Record<SortKey, Sorter<AdminProduct>> = {
  name: (a, b) => a.name.localeCompare(b.name),
  category: (a, b) => a.categoryId.localeCompare(b.categoryId),
  stock: (a, b) => a.stockQuantity - b.stockQuantity,
};

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, Icon, Pagination],
  styleUrl: './inventory.css',
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly savingId = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly onlyLowStock = signal(false);
  protected readonly sortKey = signal<SortKey>('name');
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.products();
    if (this.onlyLowStock()) list = list.filter((p) => p.stockQuantity < LOW_STOCK_THRESHOLD);
    list = list.filter((p) => matchesQuery(p, this.search(), [(x) => x.id, (x) => x.name]));
    return sortRows(list, this.sortKey(), this.sortDir(), SORTERS);
  });

  protected readonly pageCount = computed(() => totalPages(this.filtered().length, this.pageSize));
  protected readonly pageItems = computed(() => paginate(this.filtered(), this.page(), this.pageSize));

  ngOnInit(): void {
    this.refresh();
    this.adminApi.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  private refresh(): void {
    this.adminApi.getProducts().subscribe((products) => this.products.set(products));
  }

  isLow(stock: number): boolean {
    return stock < LOW_STOCK_THRESHOLD;
  }

  categoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onLowStockToggle(value: boolean): void {
    this.onlyLowStock.set(value);
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

  adjust(product: AdminProduct, delta: number): void {
    const next = Math.max(0, product.stockQuantity + delta);
    this.saveStock(product, next);
  }

  onStockInput(product: AdminProduct, value: string): void {
    const next = Math.max(0, Number(value) || 0);
    this.saveStock(product, next);
  }

  private saveStock(product: AdminProduct, quantity: number): void {
    if (quantity === product.stockQuantity) return;
    this.savingId.set(product.id);
    this.adminApi.updateStock(product.id, quantity).subscribe({
      next: (updated) => {
        this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.savingId.set(null);
      },
      error: () => {
        this.savingId.set(null);
        this.toast.show('No se pudo actualizar el inventario.');
      },
    });
  }
}
