import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

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
    // Deliberately a sibling of 'admin', not nested under its layout, so the
    // printed page contains only the label — no admin sidebar/header chrome.
    path: 'admin/orders/:orderNumber/label',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/orders/shipping-label/shipping-label').then((m) => m.ShippingLabel),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/products').then((m) => m.Products),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./features/admin/vehicles/vehicles').then((m) => m.Vehicles),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/admin/bookings/bookings').then((m) => m.Bookings),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/admin/contact/contact').then((m) => m.Contact),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users').then((m) => m.Users),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
