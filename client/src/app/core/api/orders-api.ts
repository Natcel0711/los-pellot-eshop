import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, PaymentInfo, ShippingInfo, SimulateOutcome } from '../../shared/models';

@Service()
export class OrdersApi {
  private readonly http = inject(HttpClient);

  // Phase A — creates a PendingPayment order from the server-resolved cart.
  checkout(shipping: ShippingInfo, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(
      '/api/orders',
      { shipping },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }

  // Phase B — confirms payment against the active IPaymentService.
  confirmPayment(
    orderNumber: string,
    payment: PaymentInfo,
    idempotencyKey: string,
    simulateOutcome?: SimulateOutcome,
    email?: string,
  ): Observable<Order> {
    const params = email ? { email } : undefined;
    return this.http.post<Order>(
      `/api/orders/${orderNumber}/payment`,
      { payment, simulateOutcome },
      { headers: { 'Idempotency-Key': idempotencyKey }, params },
    );
  }

  mine(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/mine');
  }

  getByNumber(orderNumber: string, email?: string): Observable<Order> {
    const params = email ? { email } : undefined;
    return this.http.get<Order>(`/api/orders/${orderNumber}`, { params });
  }
}
