import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { VehicleSceneView } from './vehicle-scene-view/vehicle-scene-view';
import { Catalog } from '../../core/services/catalog';
import { ProductsApi } from '../../core/api/products-api';
import { Category, Product, VehicleYearTree } from '../../shared/models';
import { availableMakes, availableModels, availableTrims, availableYears } from '../../shared/vehicle-selector';
import { VehicleView as CameraView } from './vehicle-scene';

interface Tooltip {
  label: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-vehicle',
  imports: [FormsModule, RouterLink, Icon, ProductCard, VehicleSceneView],
  styleUrl: './vehicle.css',
  templateUrl: './vehicle.html',
})
export class Vehicle implements OnInit {
  private readonly catalog = inject(Catalog);
  private readonly productsApi = inject(ProductsApi);
  private readonly route = inject(ActivatedRoute);

  @ViewChild(VehicleSceneView) sceneView?: VehicleSceneView;

  protected readonly categories = signal<Category[]>([]);
  protected readonly vehicleTree = signal<VehicleYearTree[]>([]);

  protected year = '';
  protected make = '';
  protected model = '';
  protected trim = '';

  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly selectedCategoryLabel = signal<string | null>(null);
  protected readonly panelProducts = signal<Product[]>([]);
  protected readonly tooltip = signal<Tooltip | null>(null);
  protected readonly autoRotate = signal(true);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.year = params.get('year') ?? '';
    this.make = params.get('make') ?? '';
    this.model = params.get('model') ?? '';

    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
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

  get trims(): string[] {
    return availableTrims(this.vehicleTree(), this.year, this.make, this.model);
  }

  get vehicleReady(): boolean {
    return Boolean(this.year && this.make && this.model);
  }

  get vehicleLabel(): string {
    return `${this.year} ${this.make} ${this.model}`.trim();
  }

  get vehicleLabelWithTrim(): string {
    return (this.vehicleLabel + (this.trim ? ` ${this.trim}` : '')).toUpperCase();
  }

  onYearChange(): void {
    this.make = '';
    this.model = '';
    this.trim = '';
  }

  onMakeChange(): void {
    this.model = '';
    this.trim = '';
  }

  onModelChange(): void {
    this.trim = '';
  }

  categoryIcon(id: string): string {
    return this.categories().find((c) => c.id === id)?.icon ?? 'bolt';
  }

  categoryBulbType(id: string): string {
    return this.categories().find((c) => c.id === id)?.defaultBulbType ?? 'Universal';
  }

  selectCategory(category: string, label: string): void {
    this.selectedCategory.set(category);
    this.selectedCategoryLabel.set(label);
    this.productsApi.getAll({ categories: [category] }).subscribe((products) => {
      this.panelProducts.set(products);
    });
  }

  onHotspotClick(event: { category: string; label: string }): void {
    this.selectCategory(event.category, event.label);
  }

  onHotspotHover(event: { label: string; x: number; y: number } | null): void {
    this.tooltip.set(event);
  }

  onAutoRotateChange(isOn: boolean): void {
    this.autoRotate.set(isOn);
  }

  onShortcutClick(category: string, label: string): void {
    this.sceneView?.focusCategory(category);
    this.selectCategory(category, label);
  }

  goToView(view: CameraView): void {
    this.sceneView?.goToView(view);
  }

  toggleAutoRotate(): void {
    this.autoRotate.set(this.sceneView?.toggleAutoRotate() ?? false);
  }
}
