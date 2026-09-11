import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { Catalog } from '../../core/services/catalog';
import { ProductsApi } from '../../core/api/products-api';
import { Category, Product, VehicleYearTree } from '../../shared/models';
import { availableMakes, availableModels, availableYears } from '../../shared/vehicle-selector';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, Icon, ProductCard],
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly catalog = inject(Catalog);
  private readonly productsApi = inject(ProductsApi);
  private readonly router = inject(Router);

  protected readonly categories = signal<Category[]>([]);
  protected readonly bestSellers = signal<Product[]>([]);
  protected readonly vehicleTree = signal<VehicleYearTree[]>([]);

  protected year = '';
  protected make = '';
  protected model = '';

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => {
      this.categories.set(categories.slice(0, 6));
    });

    this.productsApi.getAll({ sort: 'relevance' }).subscribe((products) => {
      this.bestSellers.set(
        products.filter((p) => p.badge === 'Best Seller' || p.badge === 'Sale').slice(0, 4),
      );
    });

    this.catalog.getVehicleTree().subscribe((tree) => this.vehicleTree.set(tree));
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

  findVehicle(): void {
    const queryParams: Record<string, string> = {};
    if (this.year) queryParams['year'] = this.year;
    if (this.make) queryParams['make'] = this.make;
    if (this.model) queryParams['model'] = this.model;
    this.router.navigate(['/vehicle'], { queryParams });
  }
}
