import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { CartDrawer } from './layout/cart-drawer/cart-drawer';
import { AccountModal } from './layout/account-modal/account-modal';
import { ToastHost } from './layout/toast-host/toast-host';
import { LoadingBar } from './layout/loading-bar/loading-bar';

@Component({
  imports: [RouterOutlet, Header, Footer, CartDrawer, AccountModal, ToastHost, LoadingBar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  // The admin panel has its own layout/nav — hide the customer-facing
  // header/footer/cart drawer while inside it instead of stacking both.
  protected readonly isAdminRoute = signal(this.router.url.startsWith('/admin'));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.isAdminRoute.set(e.urlAfterRedirects.startsWith('/admin')));
  }
}
