import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductThumb } from '../../shared/product-thumb/product-thumb';
import { categoryIcon } from '../../shared/category-icons';
import { Cart } from '../../core/services/cart';
import { Catalog } from '../../core/services/catalog';
import { Translation } from '../../core/services/translation';
import { OrdersApi } from '../../core/api/orders-api';
import { Category, Order } from '../../shared/models';

const FREE_SHIPPING_MIN = 75;
const FLAT_SHIPPING = 9.99;

@Component({
  selector: 'app-checkout',
  imports: [AsyncPipe, CurrencyPipe, RouterLink, Icon, ProductThumb],
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout {
  protected readonly cart = inject(Cart);
  private readonly catalog = inject(Catalog);
  private readonly ordersApi = inject(OrdersApi);
  protected readonly i18n = inject(Translation);

  protected readonly categoryIcon = categoryIcon;
  protected readonly categories = signal<Category[]>([]);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmedOrder = signal<Order | null>(null);

  constructor() {
    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
  }

  categoryName(id: string): string {
    return this.i18n.categoryLabel(id, this.categories().find((c) => c.id === id)?.name ?? id);
  }

  shipping(subtotal: number): number {
    return subtotal >= FREE_SHIPPING_MIN ? 0 : FLAT_SHIPPING;
  }

  freeShippingNote(subtotal: number): string {
    return subtotal >= FREE_SHIPPING_MIN
      ? this.i18n.t('checkout.freeShippingQualify')
      : this.i18n.t('checkout.freeShippingAdd', { amount: (FREE_SHIPPING_MIN - subtotal).toFixed(2) });
  }

  submit(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.submitting.set(true);
    this.error.set(null);

    this.ordersApi
      .checkout(
        {
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
          address: String(data.get('address') ?? ''),
          apt: String(data.get('apt') ?? '') || null,
          city: String(data.get('city') ?? ''),
          state: String(data.get('state') ?? ''),
          zip: String(data.get('zip') ?? ''),
          country: String(data.get('country') ?? ''),
        },
        {
          cardName: String(data.get('cardName') ?? ''),
          cardNumber: String(data.get('cardNumber') ?? ''),
          expiry: String(data.get('expiry') ?? ''),
          cvc: String(data.get('cvc') ?? ''),
        },
      )
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.confirmedOrder.set(order);
          this.cart.refresh();
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(this.i18n.t('checkout.errorGeneric'));
        },
      });
  }
}
