import { Service, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { CartApi } from '../api/cart-api';
import { Cart as CartModel } from '../../shared/models';

const EMPTY_CART: CartModel = { lines: [], subtotal: 0 };

@Service()
export class Cart {
  private readonly cartApi = inject(CartApi);

  private readonly cartSubject = new BehaviorSubject<CartModel>(EMPTY_CART);
  readonly cart$ = this.cartSubject.asObservable();
  readonly count$ = this.cart$.pipe(map((c) => c.lines.reduce((n, l) => n + l.qty, 0)));

  constructor() {
    this.refresh();
  }

  get snapshot(): CartModel {
    return this.cartSubject.value;
  }

  refresh(): void {
    this.cartApi.get().subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: () => this.cartSubject.next(EMPTY_CART),
    });
  }

  addToCart(productId: string, qty = 1, vehicleLabel?: string | null): Observable<CartModel> {
    return this.cartApi.addItem(productId, qty, vehicleLabel).pipe(
      tap((cart) => this.cartSubject.next(cart)),
    );
  }

  setQty(key: string, qty: number): Observable<CartModel> {
    const request = qty <= 0 ? this.cartApi.removeItem(key) : this.cartApi.updateItem(key, qty);
    return request.pipe(tap((cart) => this.cartSubject.next(cart)));
  }

  removeFromCart(key: string): Observable<CartModel> {
    return this.cartApi.removeItem(key).pipe(tap((cart) => this.cartSubject.next(cart)));
  }

  mergeGuestCartAfterLogin(): void {
    this.cartApi.merge().subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: () => {
        /* nothing to merge, or already merged — keep the current cart as-is */
      },
    });
  }
}
