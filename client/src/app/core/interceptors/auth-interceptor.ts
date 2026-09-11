import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import { TokenStore } from '../services/token-store';

// Attaches the access token to every request, and on a 401 tries exactly one
// silent refresh + retry before giving up (never retries the refresh call
// itself, to avoid looping).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStore);
  const authApi = inject(AuthApi);

  const accessToken = tokenStore.accessToken;
  const authedReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  const isAuthEndpoint = req.url.startsWith('/api/auth/');

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const refreshToken = tokenStore.refreshToken;
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        refreshToken &&
        !isAuthEndpoint
      ) {
        return authApi.refresh(refreshToken).pipe(
          switchMap((tokens) => {
            tokenStore.accessToken = tokens.accessToken;
            tokenStore.refreshToken = tokens.refreshToken;
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            return next(retried);
          }),
          catchError((refreshError: unknown) => {
            tokenStore.clearAuthTokens();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
