import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cart } from '../../shared/models';

@Service()
export class CartApi {
  private readonly http = inject(HttpClient);

  get(): Observable<Cart> {
    return this.http.get<Cart>('/api/cart');
  }

  addItem(productId: string, qty: number, vehicleLabel?: string | null): Observable<Cart> {
    return this.http.post<Cart>('/api/cart/items', { productId, qty, vehicleLabel: vehicleLabel ?? null });
  }

  updateItem(key: string, qty: number): Observable<Cart> {
    return this.http.patch<Cart>(`/api/cart/items/${encodeURIComponent(key)}`, { qty });
  }

  removeItem(key: string): Observable<Cart> {
    return this.http.delete<Cart>(`/api/cart/items/${encodeURIComponent(key)}`);
  }

  merge(): Observable<Cart> {
    return this.http.post<Cart>('/api/cart/merge', {});
  }
}
