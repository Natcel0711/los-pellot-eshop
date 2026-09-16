import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { TokenStore } from '../services/token-store';

const GUEST_TOKEN_HEADER = 'X-Guest-Cart-Token';
// Checkout (both phases) resolves the same server-side cart as /api/cart, so
// it needs the same guest-identity header — without this, guest checkout
// can never find the guest's cart.
const GUEST_TOKEN_URL_PREFIXES = ['/api/cart', '/api/orders'];

// Attaches the stored guest cart token to cart/order requests and captures a
// newly minted one from the response the first time a guest adds an item.
export const guestCartInterceptor: HttpInterceptorFn = (req, next) => {
  if (!GUEST_TOKEN_URL_PREFIXES.some((prefix) => req.url.startsWith(prefix))) return next(req);

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
