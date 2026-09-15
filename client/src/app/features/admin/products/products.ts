import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/icon/icon';
import { ProductThumb } from '../../../shared/product-thumb/product-thumb';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { categoryIcon } from '../../../shared/category-icons';
import { AdminCategory, AdminProduct } from '../../../shared/admin-models';
import { Sorter, matchesQuery, paginate, sortRows, totalPages } from '../../../shared/table-utils';

type SortKey = 'id' | 'name' | 'category' | 'price' | 'stock';

const SORTERS: Record<SortKey, Sorter<AdminProduct>> = {
  id: (a, b) => a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name),
  category: (a, b) => a.categoryId.localeCompare(b.categoryId),
  price: (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
  stock: (a, b) => a.stockQuantity - b.stockQuantity,
};

const PAGE_SIZE = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, FormsModule, Icon, ProductThumb, Pagination],
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly categoryIcon = categoryIcon;
  protected readonly badgeOptions = ['', 'Best Seller', 'Sale', 'New'];

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly editing = signal<AdminProduct | null>(null);
  protected readonly showForm = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadingImage = signal(false);
  protected readonly imageError = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly categoryFilter = signal('');
  protected readonly sortKey = signal<SortKey>('id');
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly filtered = computed(() => {
    let list = this.products();
    const cat = this.categoryFilter();
    if (cat) list = list.filter((p) => p.categoryId === cat);
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
    this.adminApi.getProducts().subscribe((products) => {
      this.products.set(products);
      // Keep the open edit form's preview in sync with the freshly-fetched row
      // (e.g. right after an image upload/removal).
      const editing = this.editing();
      if (editing) {
        const updated = products.find((p) => p.id === editing.id);
        if (updated) this.editing.set(updated);
      }
    });
  }

  categoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value);
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
    this.imageError.set(null);
    this.showForm.set(true);
  }

  startEdit(product: AdminProduct): void {
    this.editing.set(product);
    this.error.set(null);
    this.imageError.set(null);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  submit(form: HTMLFormElement): void {
    const data = new FormData(form);
    const salePriceRaw = String(data.get('salePrice') ?? '').trim();
    const badgeRaw = String(data.get('badge') ?? '').trim();

    const request = {
      id: String(data.get('id') ?? '').trim(),
      name: String(data.get('name') ?? '').trim(),
      categoryId: String(data.get('categoryId') ?? ''),
      price: Number(data.get('price') ?? 0),
      salePrice: salePriceRaw ? Number(salePriceRaw) : null,
      lumens: String(data.get('lumens') ?? ''),
      warranty: String(data.get('warranty') ?? ''),
      badge: badgeRaw || null,
      isUniversal: data.get('isUniversal') === 'on',
      stockQuantity: Number(data.get('stockQuantity') ?? 0),
    };

    const editing = this.editing();
    const request$ = editing
      ? this.adminApi.updateProduct(editing.id, request)
      : this.adminApi.createProduct(request);

    request$.subscribe({
      next: (saved) => {
        this.toast.show(editing ? 'Producto actualizado.' : 'Producto creado.');
        this.error.set(null);
        this.editing.set(saved);
        this.refresh();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo guardar el producto.');
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const editing = this.editing();
    if (!editing) return;

    if (file.size > MAX_IMAGE_BYTES) {
      this.imageError.set('La imagen no puede pesar más de 5 MB.');
      return;
    }

    this.imageError.set(null);
    this.uploadingImage.set(true);
    this.adminApi.uploadProductImage(editing.id, file).subscribe({
      next: (updated) => {
        this.editing.set(updated);
        this.uploadingImage.set(false);
        this.refresh();
      },
      error: (err) => {
        this.imageError.set(err?.error?.error ?? 'No se pudo subir la imagen.');
        this.uploadingImage.set(false);
      },
    });
  }

  removeImage(): void {
    const editing = this.editing();
    if (!editing || !confirm('¿Quitar la foto de este producto?')) return;

    this.adminApi.deleteProductImage(editing.id).subscribe({
      next: (updated) => {
        this.editing.set(updated);
        this.refresh();
      },
      error: () => this.toast.show('No se pudo quitar la imagen.'),
    });
  }

  remove(product: AdminProduct): void {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    this.adminApi.deleteProduct(product.id).subscribe({
      next: () => {
        this.toast.show('Producto eliminado.');
        this.refresh();
      },
      error: () => this.toast.show('No se pudo eliminar el producto.'),
    });
  }
}
