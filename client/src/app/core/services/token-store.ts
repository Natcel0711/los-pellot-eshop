import { Service } from '@angular/core';

const ACCESS_TOKEN_KEY = 'lp_access_token';
const REFRESH_TOKEN_KEY = 'lp_refresh_token';
const GUEST_CART_TOKEN_KEY = 'lp_guest_cart_token';

// Thin localStorage wrapper — isolated here so both the auth/cart services
// and the HTTP interceptors can read/write tokens without depending on each
// other. Wrapped in try/catch since some browser contexts (private windows,
// blocked site data) can throw on storage access.
@Service()
export class TokenStore {
  get accessToken(): string | null {
    return this.read(ACCESS_TOKEN_KEY);
  }
  set accessToken(value: string | null) {
    this.write(ACCESS_TOKEN_KEY, value);
  }

  get refreshToken(): string | null {
    return this.read(REFRESH_TOKEN_KEY);
  }
  set refreshToken(value: string | null) {
    this.write(REFRESH_TOKEN_KEY, value);
  }

  get guestCartToken(): string | null {
    return this.read(GUEST_CART_TOKEN_KEY);
  }
  set guestCartToken(value: string | null) {
    this.write(GUEST_CART_TOKEN_KEY, value);
  }

  clearAuthTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string | null): void {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — tokens just won't persist across reloads */
    }
  }
}
