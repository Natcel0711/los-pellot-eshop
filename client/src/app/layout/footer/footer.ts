import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Catalog } from '../../core/services/catalog';
import { Translation } from '../../core/services/translation';
import { Category } from '../../shared/models';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icon],
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer implements OnInit {
  private readonly catalog = inject(Catalog);
  protected readonly i18n = inject(Translation);

  protected readonly navLinks = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/products', labelKey: 'nav.products' },
    { path: '/vehicle', labelKey: 'nav.vehicle' },
    { path: '/installation', labelKey: 'nav.installation' },
    { path: '/contact', labelKey: 'nav.contact' },
  ];

  protected readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.catalog.getCategories().subscribe((categories) => {
      this.categories.set(categories.slice(0, 6));
    });
  }
}
