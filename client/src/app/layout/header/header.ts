import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Icon } from '../../shared/icon/icon';
import { initials } from '../../shared/initials';
import { Auth } from '../../core/services/auth';
import { Cart } from '../../core/services/cart';
import { UiState } from '../../core/services/ui-state';
import { Translation } from '../../core/services/translation';

interface NavLink {
  path: string;
  labelKey: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe, Icon],
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected readonly auth = inject(Auth);
  protected readonly cart = inject(Cart);
  protected readonly ui = inject(UiState);
  protected readonly i18n = inject(Translation);
  private readonly router = inject(Router);

  protected readonly navLinks: NavLink[] = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/products', labelKey: 'nav.products' },
    { path: '/vehicle', labelKey: 'nav.vehicle' },
    { path: '/installation', labelKey: 'nav.installation' },
    { path: '/contact', labelKey: 'nav.contact' },
  ];

  protected readonly initials = initials;

  submitSearch(input: HTMLInputElement): void {
    const q = input.value.trim();
    this.ui.toggleSearchBar();
    input.value = '';
    this.router.navigate(['/products'], q ? { queryParams: { q } } : {});
  }

  onAccountClick(): void {
    this.ui.openAccountModal(this.auth.isLoggedIn ? 'profile' : 'login');
  }
}
