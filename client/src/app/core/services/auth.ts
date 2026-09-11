import { Service, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import { User } from '../../shared/models';
import { TokenStore } from './token-store';
import { Cart } from './cart';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

@Service()
export class Auth {
  private readonly authApi = inject(AuthApi);
  private readonly tokenStore = inject(TokenStore);
  private readonly cart = inject(Cart);

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  // Resolves once the initial session-restore check (below) has settled —
  // guards awaiting this avoid a false "not logged in" on a fresh page
  // load/refresh, before the async /auth/me call has had a chance to run.
  private readonly readySubject = new BehaviorSubject(false);
  readonly ready$ = this.readySubject.asObservable();

  constructor() {
    if (this.tokenStore.accessToken) {
      this.authApi.me().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.readySubject.next(true);
        },
        error: () => {
          this.tokenStore.clearAuthTokens();
          this.readySubject.next(true);
        },
      });
    } else {
      this.readySubject.next(true);
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  register(fullName: string, email: string, password: string): Observable<AuthResult> {
    return this.authApi.register(fullName, email, password).pipe(
      tap((res) => this.onAuthenticated(res.user, res.accessToken, res.refreshToken)),
      map(() => ({ ok: true }) as AuthResult),
      catchError((err) => of(this.toError(err))),
    );
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.authApi.login(email, password).pipe(
      tap((res) => this.onAuthenticated(res.user, res.accessToken, res.refreshToken)),
      map(() => ({ ok: true }) as AuthResult),
      catchError((err) => of(this.toError(err))),
    );
  }

  updateProfile(fullName: string, email: string): Observable<AuthResult> {
    return this.authApi.updateProfile(fullName, email).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      map(() => ({ ok: true }) as AuthResult),
      catchError((err) => of(this.toError(err))),
    );
  }

  logout(): void {
    this.authApi.logout().subscribe({ complete: () => {}, error: () => {} });
    this.tokenStore.clearAuthTokens();
    this.currentUserSubject.next(null);
  }

  private onAuthenticated(user: User, accessToken: string, refreshToken: string): void {
    this.tokenStore.accessToken = accessToken;
    this.tokenStore.refreshToken = refreshToken;
    this.currentUserSubject.next(user);
    this.cart.mergeGuestCartAfterLogin();
  }

  private toError(err: unknown): AuthResult {
    const message =
      (err as { error?: { error?: string } })?.error?.error ?? 'Algo salió mal, intenta de nuevo.';
    return { ok: false, error: message };
  }
}
