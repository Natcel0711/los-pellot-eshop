import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import { ProductThumb } from '../product-thumb/product-thumb';
import { categoryIcon } from '../category-icons';
import { Cart } from '../../core/services/cart';
import { Toast } from '../../core/services/toast';
import { Catalog } from '../../core/services/catalog';
import { Translation } from '../../core/services/translation';
import { Category, Product } from '../models';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, Icon, ProductThumb],
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCard implements OnInit {
  @Input({ required: true }) product!: Product;
  @Input() vehicleLabel: string | null = null;

  private readonly cart = inject(Cart);
  private readonly toast = inject(Toast);
  private readonly catalog = inject(Catalog);
  protected readonly i18n = inject(Translation);

  protected readonly categoryIcon = categoryIcon;
  private readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  get categoryName(): string {
    const name = this.categories().find((c) => c.id === this.product.category)?.name ?? this.product.category;
    return this.i18n.categoryLabel(this.product.category, name);
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
      this.toast.show(this.i18n.t('productCard.addedToast', { name: this.product.name }));
    });
  }
}
