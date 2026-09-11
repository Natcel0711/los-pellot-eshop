import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { TokenStore } from '../services/token-store';

const GUEST_TOKEN_HEADER = 'X-Guest-Cart-Token';

// Attaches the stored guest cart token to /api/cart requests and captures a
// newly minted one from the response the first time a guest adds an item.
export const guestCartInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/cart')) return next(req);

  const tokenStore = inject(TokenStore);
  const guestToken = tokenStore.guestCartToken;
  const outgoing = guestToken
    ? req.clone({ setHeaders: { [GUEST_TOKEN_HEADER]: guestToken } })
    : req;

  return next(outgoing).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const header = event.headers.get(GUEST_TOKEN_HEADER);
        if (header) tokenStore.guestCartToken = header;
      }
    }),
  );
};
