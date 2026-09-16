import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/icon/icon';
import { AdminApi } from '../../../../core/api/admin-api';
import {
  AdminOrderDetail,
  PackageInfo,
  ShippingLabel as PurchasedLabel,
  ShippingRate,
} from '../../../../shared/admin-models';

// Store's own ship-from address — same public-facing info as Contact/footer.
// The REAL street address Shippo needs to quote/buy postage lives in the
// backend's ShipFrom:* config (see appsettings.json / README), not here —
// this is only what prints on the packing-slip half of the page.
const SHIP_FROM = {
  name: 'Los Pellot LED and Accessories Distributors',
  address: 'Massachusetts, USA',
  phone: '(787) 555-0142',
  email: 'info@lospellotled.com',
};

@Component({
  selector: 'app-shipping-label',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icon],
  styleUrl: './shipping-label.css',
  templateUrl: './shipping-label.html',
})
export class ShippingLabel implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminApi);

  protected readonly shipFrom = SHIP_FROM;
  protected readonly order = signal<AdminOrderDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly printedAt = new Date();

  protected readonly fetchingRates = signal(false);
  protected readonly ratesError = signal<string | null>(null);
  protected readonly rates = signal<ShippingRate[] | null>(null);
  protected readonly selectedRate = signal<ShippingRate | null>(null);
  protected readonly purchasing = signal(false);
  protected readonly purchaseError = signal<string | null>(null);

  private orderNumber = '';
  private lastPackage: PackageInfo | null = null;

  ngOnInit(): void {
    this.orderNumber = this.route.snapshot.paramMap.get('orderNumber') ?? '';
    if (!this.orderNumber) {
      this.notFound.set(true);
      return;
    }
    this.adminApi.getOrder(this.orderNumber).subscribe({
      next: (order) => this.order.set(order),
      error: () => this.notFound.set(true),
    });
  }

  print(): void {
    window.print();
  }

  getRates(form: HTMLFormElement): void {
    const data = new FormData(form);
    const pkg: PackageInfo = {
      weightLb: Number(data.get('weightLb') ?? 0),
      lengthIn: Number(data.get('lengthIn') ?? 0),
      widthIn: Number(data.get('widthIn') ?? 0),
      heightIn: Number(data.get('heightIn') ?? 0),
    };
    if (pkg.weightLb <= 0 || pkg.lengthIn <= 0 || pkg.widthIn <= 0 || pkg.heightIn <= 0) {
      this.ratesError.set('Ingresa un peso y dimensiones válidas.');
      return;
    }

    this.fetchingRates.set(true);
    this.ratesError.set(null);
    this.rates.set(null);
    this.selectedRate.set(null);

    this.adminApi.getShippingRates(this.orderNumber, pkg).subscribe({
      next: (rates) => {
        this.fetchingRates.set(false);
        this.lastPackage = pkg;
        this.rates.set(rates);
        if (rates.length === 0) this.ratesError.set('El proveedor no devolvió tarifas para esta dirección.');
      },
      error: (err: HttpErrorResponse) => {
        this.fetchingRates.set(false);
        this.ratesError.set(err.error?.error ?? 'No pudimos cotizar el envío.');
      },
    });
  }

  selectRate(rate: ShippingRate): void {
    this.selectedRate.set(rate);
  }

  purchaseLabel(): void {
    const rate = this.selectedRate();
    if (!rate || !this.lastPackage) return;

    this.purchasing.set(true);
    this.purchaseError.set(null);

    this.adminApi.purchaseShippingLabel(this.orderNumber, rate, this.lastPackage).subscribe({
      next: (label: PurchasedLabel) => {
        this.purchasing.set(false);
        this.order.update((o) => (o ? { ...o, shippingLabels: [label, ...o.shippingLabels] } : o));
        this.rates.set(null);
        this.selectedRate.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.purchasing.set(false);
        this.purchaseError.set(err.error?.error ?? 'No pudimos comprar la etiqueta de envío.');
      },
    });
  }
}
