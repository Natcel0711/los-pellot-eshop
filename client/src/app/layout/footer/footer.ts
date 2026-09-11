import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Catalog } from '../../core/services/catalog';
import { Category } from '../../shared/models';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icon],
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer implements OnInit {
  private readonly catalog = inject(Catalog);

  protected readonly navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/products', label: 'Productos' },
    { path: '/vehicle', label: 'Por Vehículo' },
    { path: '/installation', label: 'Instalación' },
    { path: '/contact', label: 'Contáctanos' },
  ];

  protected readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => {
      this.categories.set(categories.slice(0, 6));
    });
  }
}
