import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { Catalog } from '../../core/services/catalog';
import { ProductsApi } from '../../core/api/products-api';
import { Category, Product, ProductFilters, VehicleYearTree } from '../../shared/models';
import { availableMakes, availableModels, availableYears } from '../../shared/vehicle-selector';

interface Chip {
  label: string;
  clear: () => void;
}

@Component({
  selector: 'app-products',
  imports: [FormsModule, Icon, ProductCard],
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly catalog = inject(Catalog);
  private readonly productsApi = inject(ProductsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly categories = signal<Category[]>([]);
  protected readonly vehicleTree = signal<VehicleYearTree[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loaded = signal(false);
  protected filtersPanelOpen = false;

  protected selectedCategories = new Set<string>();
  protected year = '';
  protected make = '';
  protected model = '';
  protected q = '';
  protected saleOnly = false;
  protected sort: ProductFilters['sort'] = 'relevance';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const category = params.get('category');
    if (category) this.selectedCategories.add(category);
    this.year = params.get('year') ?? '';
    this.make = params.get('make') ?? '';
    this.model = params.get('model') ?? '';
    this.q = params.get('q') ?? '';

    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
    this.catalog.getVehicleTree().subscribe((tree) => this.vehicleTree.set(tree));
    this.refresh();
  }

  get years(): number[] {
    return availableYears(this.vehicleTree(), this.make, this.model);
  }

  get makes(): string[] {
    return availableMakes(this.vehicleTree(), this.year, this.model);
  }

  get models(): string[] {
    return availableModels(this.vehicleTree(), this.year, this.make);
  }

  get vehicleSelected(): boolean {
    return Boolean(this.year && this.make && this.model);
  }

  get vehicleLabel(): string | null {
    return this.vehicleSelected ? `${this.year} ${this.make} ${this.model}` : null;
  }

  categoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  isCategoryChecked(id: string): boolean {
    return this.selectedCategories.has(id);
  }

  toggleCategory(id: string, checked: boolean): void {
    checked ? this.selectedCategories.add(id) : this.selectedCategories.delete(id);
    this.refresh();
  }

  onYearChange(): void {
    this.make = '';
    this.model = '';
    this.refresh();
  }

  onMakeChange(): void {
    this.model = '';
    this.refresh();
  }

  onModelChange(): void {
    this.refresh();
  }

  onSaleOnlyChange(): void {
    this.refresh();
  }

  onSortChange(): void {
    this.refresh();
  }

  toggleFiltersPanel(): void {
    this.filtersPanelOpen = !this.filtersPanelOpen;
  }

  clearAll(): void {
    this.selectedCategories.clear();
    this.year = this.make = this.model = this.q = '';
    this.saleOnly = false;
    this.refresh();
  }

  get chips(): Chip[] {
    const chips: Chip[] = [];
    this.selectedCategories.forEach((id) =>
      chips.push({
        label: this.categoryName(id),
        clear: () => {
          this.selectedCategories.delete(id);
          this.refresh();
        },
      }),
    );
    if (this.year) {
      chips.push({
        label: this.year,
        clear: () => {
          this.year = this.make = this.model = '';
          this.refresh();
        },
      });
    }
    if (this.make) {
      chips.push({
        label: this.make,
        clear: () => {
          this.make = this.model = '';
          this.refresh();
        },
      });
    }
    if (this.model) {
      chips.push({
        label: this.model,
        clear: () => {
          this.model = '';
          this.refresh();
        },
      });
    }
    if (this.saleOnly) {
      chips.push({
        label: 'Solo ofertas',
        clear: () => {
          this.saleOnly = false;
          this.refresh();
        },
      });
    }
    return chips;
  }

  private refresh(): void {
    this.syncUrl();
    this.productsApi
      .getAll({
        categories: [...this.selectedCategories],
        year: this.year,
        make: this.make,
        model: this.model,
        q: this.q,
        saleOnly: this.saleOnly,
        sort: this.sort,
      })
      .subscribe((products) => {
        this.products.set(products);
        this.loaded.set(true);
      });
  }

  private syncUrl(): void {
    const queryParams: Record<string, string> = {};
    if (this.year) queryParams['year'] = this.year;
    if (this.make) queryParams['make'] = this.make;
    if (this.model) queryParams['model'] = this.model;
    if (this.q) queryParams['q'] = this.q;
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
