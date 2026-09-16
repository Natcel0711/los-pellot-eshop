import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { ProductThumb } from '../../shared/product-thumb/product-thumb';
import { categoryIcon } from '../../shared/category-icons';
import { Cart } from '../../core/services/cart';
import { Catalog } from '../../core/services/catalog';
import { Translation } from '../../core/services/translation';
import { OrdersApi } from '../../core/api/orders-api';
import { Category, Order, PaymentInfo, ShippingInfo, SimulateOutcome } from '../../shared/models';

const ATTEMPT_STORAGE_KEY = 'lp_checkout_attempt';
// Step 1 display estimate only, before the order exists — the server
// computes the authoritative shipping cost/total in its Phase-A response,
// which Step 2 displays instead of these.
const FREE_SHIPPING_MIN = 75;
const FLAT_SHIPPING = 9.99;

interface StoredAttempt {
  idempotencyKey: string;
  orderNumber: string;
  email?: string;
}

@Component({
  selector: 'app-checkout',
  imports: [AsyncPipe, CurrencyPipe, FormsModule, RouterLink, Icon, ProductThumb],
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

  // Step 1 -> pendingOrder unset -> shipping form (creates the order).
  // Step 2 -> pendingOrder set, confirmedOrder unset -> payment form.
  // Step 3 -> confirmedOrder set -> thank-you view.
  protected readonly pendingOrder = signal<Order | null>(null);
  protected readonly confirmedOrder = signal<Order | null>(null);
  protected readonly placingOrder = signal(false);
  protected readonly payingOrder = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly retrying = signal(false);
  protected readonly simulateOutcome = signal<SimulateOutcome>('Succeed');

  private idempotencyKey: string | null = null;

  constructor() {
    this.catalog.getCategories().subscribe((categories) => this.categories.set(categories));
    this.resumeAttempt();
  }

  get step(): 1 | 2 | 3 {
    if (this.confirmedOrder()) return 3;
    if (this.pendingOrder()) return 2;
    return 1;
  }

  categoryName(id: string): string {
    return this.i18n.categoryLabel(id, this.categories().find((c) => c.id === id)?.name ?? id);
  }

  estimatedShipping(subtotal: number): number {
    return subtotal >= FREE_SHIPPING_MIN ? 0 : FLAT_SHIPPING;
  }

  freeShippingNote(subtotal: number, shippingCost: number): string {
    return shippingCost === 0
      ? this.i18n.t('checkout.freeShippingQualify')
      : this.i18n.t('checkout.freeShippingAdd', { amount: (FREE_SHIPPING_MIN - subtotal).toFixed(2) });
  }

  placeOrder(form: HTMLFormElement): void {
    const data = new FormData(form);
    const shipping: ShippingInfo = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      address: String(data.get('address') ?? ''),
      apt: String(data.get('apt') ?? '') || null,
      city: String(data.get('city') ?? ''),
      state: String(data.get('state') ?? ''),
      zip: String(data.get('zip') ?? ''),
      country: String(data.get('country') ?? ''),
    };

    this.placingOrder.set(true);
    this.error.set(null);
    this.idempotencyKey = this.idempotencyKey ?? crypto.randomUUID();

    this.ordersApi.checkout(shipping, this.idempotencyKey).subscribe({
      next: (order) => {
        this.placingOrder.set(false);
        this.pendingOrder.set(order);
        this.saveAttempt({ idempotencyKey: this.idempotencyKey!, orderNumber: order.orderNumber, email: shipping.email });
      },
      error: (err: HttpErrorResponse) => {
        this.placingOrder.set(false);
        this.error.set(err.error?.error ?? this.i18n.t('checkout.errorGeneric'));
      },
    });
  }

  payNow(form: HTMLFormElement): void {
    const order = this.pendingOrder();
    if (!order) return;

    const data = new FormData(form);
    const payment: PaymentInfo = {
      cardName: String(data.get('cardName') ?? ''),
      cardNumber: String(data.get('cardNumber') ?? ''),
      expiry: String(data.get('expiry') ?? ''),
      cvc: String(data.get('cvc') ?? ''),
    };

    this.payingOrder.set(true);
    this.error.set(null);
    // Each confirm attempt is its own logical operation (a genuine retry
    // after a failure gets a fresh Payment row server-side) — a fresh key
    // per call, unrelated to the Phase-A key stored for refresh-resume.
    const confirmKey = crypto.randomUUID();

    this.ordersApi
      .confirmPayment(order.orderNumber, payment, confirmKey, order.allowSimulatedOutcomes ? this.simulateOutcome() : undefined, order.shipping.email)
      .subscribe({
        next: (updated) => {
          this.payingOrder.set(false);
          if (updated.paymentStatus === 'Paid') {
            this.confirmedOrder.set(updated);
            this.clearAttempt();
            this.cart.refresh();
          } else {
            this.pendingOrder.set(updated);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.payingOrder.set(false);
          this.retrying.set(true);
          this.error.set(err.error?.error ?? this.i18n.t('checkout.errorGeneric'));
        },
      });
  }

  private resumeAttempt(): void {
    const stored = this.loadAttempt();
    if (!stored) return;
    this.idempotencyKey = stored.idempotencyKey;

    this.ordersApi.getByNumber(stored.orderNumber, stored.email).subscribe({
      next: (order) => {
        if (order.status === 'Received' && order.paymentStatus === 'Paid') {
          this.confirmedOrder.set(order);
          this.clearAttempt();
          this.cart.refresh();
        } else if (order.status === 'PendingPayment') {
          this.pendingOrder.set(order);
        } else {
          this.clearAttempt();
        }
      },
      error: () => this.clearAttempt(),
    });
  }

  private loadAttempt(): StoredAttempt | null {
    try {
      const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredAttempt) : null;
    } catch {
      return null;
    }
  }

  private saveAttempt(attempt: StoredAttempt): void {
    try {
      sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
    } catch {
      /* storage unavailable — refresh-resume just won't work this session */
    }
  }

  private clearAttempt(): void {
    try {
      sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
  }
}
