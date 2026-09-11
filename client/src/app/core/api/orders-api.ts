import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, PaymentInfo, ShippingInfo } from '../../shared/models';

@Service()
export class OrdersApi {
  private readonly http = inject(HttpClient);

  checkout(shipping: ShippingInfo, payment: PaymentInfo): Observable<Order> {
    return this.http.post<Order>('/api/orders', { shipping, payment });
  }

  mine(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/mine');
  }

  getByNumber(orderNumber: string, email?: string): Observable<Order> {
    const params = email ? { email } : undefined;
    return this.http.get<Order>(`/api/orders/${orderNumber}`, { params });
  }
}
