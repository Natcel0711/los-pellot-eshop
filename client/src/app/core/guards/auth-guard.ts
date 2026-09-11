import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { Auth } from '../services/auth';
import { UiState } from '../services/ui-state';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const ui = inject(UiState);

  return auth.ready$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (auth.isLoggedIn) return true;
      ui.openAccountModal('login');
      return router.createUrlTree(['/']);
    }),
  );
};
