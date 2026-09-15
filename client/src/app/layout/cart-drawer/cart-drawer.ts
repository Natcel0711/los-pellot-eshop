import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductThumb } from '../../shared/product-thumb/product-thumb';
import { categoryIcon } from '../../shared/category-icons';
import { Cart } from '../../core/services/cart';
import { UiState } from '../../core/services/ui-state';
import { Catalog } from '../../core/services/catalog';
import { Translation } from '../../core/services/translation';
import { CartLine, Category } from '../../shared/models';

@Component({
  selector: 'app-cart-drawer',
  imports: [AsyncPipe, CurrencyPipe, RouterLink, Icon, ProductThumb],
  styleUrl: './cart-drawer.css',
  templateUrl: './cart-drawer.html',
})
export class CartDrawer implements OnInit {
  protected readonly cart = inject(Cart);
  protected readonly ui = inject(UiState);
  protected readonly i18n = inject(Translation);
  private readonly catalog = inject(Catalog);

  protected readonly categoryIcon = categoryIcon;
  private readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  categoryName(categoryId: string): string {
    return this.i18n.categoryLabel(categoryId, this.categories().find((c) => c.id === categoryId)?.name ?? categoryId);
  }

  changeQty(line: CartLine, delta: number): void {
    this.cart.setQty(line.key, line.qty + delta).subscribe();
  }

  remove(line: CartLine): void {
    this.cart.removeFromCart(line.key).subscribe();
  }
}
