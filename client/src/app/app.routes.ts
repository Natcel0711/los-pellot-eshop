import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products').then((m) => m.Products),
  },
  {
    path: 'vehicle',
    loadComponent: () => import('./features/vehicle/vehicle').then((m) => m.Vehicle),
  },
  {
    path: 'installation',
    loadComponent: () => import('./features/installation/installation').then((m) => m.Installation),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'account/orders',
    loadComponent: () =>
      import('./features/orders/order-history/order-history').then((m) => m.OrderHistory),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
