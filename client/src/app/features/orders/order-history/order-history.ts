import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
import { OrdersApi } from '../../../core/api/orders-api';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-order-history',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icon],
  styleUrl: './order-history.css',
  templateUrl: './order-history.html',
})
export class OrderHistory implements OnInit {
  private readonly ordersApi = inject(OrdersApi);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loaded = signal(false);

  ngOnInit(): void {
    this.ordersApi.mine().subscribe((orders) => {
      this.orders.set(orders);
      this.loaded.set(true);
    });
  }
}
