import { Service } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AccountView = 'login' | 'signup' | 'profile';

// Cross-component chrome state (account modal, cart drawer, mobile menu,
// search bar) that the header needs to trigger and sibling layout
// components need to react to.
@Service()
export class UiState {
  private readonly accountModalOpenSubject = new BehaviorSubject(false);
  readonly accountModalOpen$ = this.accountModalOpenSubject.asObservable();

  private readonly accountViewSubject = new BehaviorSubject<AccountView>('login');
  readonly accountView$ = this.accountViewSubject.asObservable();

  private readonly cartDrawerOpenSubject = new BehaviorSubject(false);
  readonly cartDrawerOpen$ = this.cartDrawerOpenSubject.asObservable();

  private readonly mobileMenuOpenSubject = new BehaviorSubject(false);
  readonly mobileMenuOpen$ = this.mobileMenuOpenSubject.asObservable();

  private readonly searchBarOpenSubject = new BehaviorSubject(false);
  readonly searchBarOpen$ = this.searchBarOpenSubject.asObservable();

  openAccountModal(view: AccountView = 'login'): void {
    this.accountViewSubject.next(view);
    this.accountModalOpenSubject.next(true);
  }

  setAccountView(view: AccountView): void {
    this.accountViewSubject.next(view);
  }

  closeAccountModal(): void {
    this.accountModalOpenSubject.next(false);
  }

  openCartDrawer(): void {
    this.cartDrawerOpenSubject.next(true);
  }

  closeCartDrawer(): void {
    this.cartDrawerOpenSubject.next(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpenSubject.next(!this.mobileMenuOpenSubject.value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpenSubject.next(false);
  }

  toggleSearchBar(): void {
    this.searchBarOpenSubject.next(!this.searchBarOpenSubject.value);
  }
}
