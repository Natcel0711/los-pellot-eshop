import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import { categoryIcon } from '../category-icons';
import { Cart } from '../../core/services/cart';
import { Toast } from '../../core/services/toast';
import { Catalog } from '../../core/services/catalog';
import { Category, Product } from '../models';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, Icon],
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCard implements OnInit {
  @Input({ required: true }) product!: Product;
  @Input() vehicleLabel: string | null = null;

  private readonly cart = inject(Cart);
  private readonly toast = inject(Toast);
  private readonly catalog = inject(Catalog);

  protected readonly categoryIcon = categoryIcon;
  private readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  get categoryName(): string {
    return this.categories().find((c) => c.id === this.product.category)?.name ?? this.product.category;
  }

  get onSale(): boolean {
    return this.product.salePrice != null;
  }

  get price(): number {
    return this.onSale ? this.product.salePrice! : this.product.price;
  }

  badgeClasses(badge: string | null): string {
    if (badge === 'Sale') return 'bg-amber text-black';
    if (badge === 'Best Seller') return 'bg-blue text-white';
    if (badge === 'New') return 'bg-white/90 text-black';
    return 'bg-white/10 text-white';
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.addToCart(this.product.id, 1, this.vehicleLabel).subscribe(() => {
      this.toast.show(`${this.product.name} añadido al carrito`);
    });
  }
}
