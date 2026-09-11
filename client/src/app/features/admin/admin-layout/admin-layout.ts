import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
import { Auth } from '../../../core/services/auth';

interface AdminNavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, Icon],
  styleUrl: './admin-layout.css',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly navLinks: AdminNavLink[] = [
    { path: '/admin', label: 'Panel', icon: 'bolt' },
    { path: '/admin/products', label: 'Productos', icon: 'headlight' },
    { path: '/admin/inventory', label: 'Inventario', icon: 'bar' },
    { path: '/admin/categories', label: 'Categorías', icon: 'controller' },
    { path: '/admin/vehicles', label: 'Vehículos', icon: 'truck' },
    { path: '/admin/orders', label: 'Órdenes', icon: 'cart' },
    { path: '/admin/bookings', label: 'Citas', icon: 'calendar' },
    { path: '/admin/contact', label: 'Mensajes', icon: 'mail' },
    { path: '/admin/users', label: 'Usuarios', icon: 'user' },
  ];

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
