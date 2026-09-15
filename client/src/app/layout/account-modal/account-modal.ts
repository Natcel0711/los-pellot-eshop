import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { initials } from '../../shared/initials';
import { Auth } from '../../core/services/auth';
import { AccountView, UiState } from '../../core/services/ui-state';
import { Translation } from '../../core/services/translation';

interface AccountMessage {
  text: string;
  kind: 'error' | 'ok';
}

@Component({
  selector: 'app-account-modal',
  imports: [AsyncPipe, DatePipe, RouterLink, Icon],
  styleUrl: './account-modal.css',
  templateUrl: './account-modal.html',
})
export class AccountModal {
  protected readonly auth = inject(Auth);
  protected readonly ui = inject(UiState);
  protected readonly i18n = inject(Translation);
  protected readonly initials = initials;

  protected readonly message = signal<AccountMessage | null>(null);

  setView(view: AccountView): void {
    this.message.set(null);
    this.ui.setAccountView(view);
  }

  close(): void {
    this.message.set(null);
    this.ui.closeAccountModal();
  }

  submitLogin(email: HTMLInputElement, password: HTMLInputElement): void {
    this.auth.login(email.value, password.value).subscribe((res) => {
      if (!res.ok) {
        this.message.set({ text: res.error!, kind: 'error' });
        return;
      }
      this.message.set(null);
      this.ui.setAccountView('profile');
    });
  }

  submitSignup(name: HTMLInputElement, email: HTMLInputElement, password: HTMLInputElement): void {
    this.auth.register(name.value, email.value, password.value).subscribe((res) => {
      if (!res.ok) {
        this.message.set({ text: res.error!, kind: 'error' });
        return;
      }
      this.ui.setAccountView('profile');
      this.message.set({ text: this.i18n.t('account.accountCreatedMsg'), kind: 'ok' });
    });
  }

  submitProfile(name: HTMLInputElement): void {
    this.auth.updateProfile(name.value).subscribe((res) => {
      this.message.set(
        res.ok ? { text: this.i18n.t('account.changesSavedMsg'), kind: 'ok' } : { text: res.error!, kind: 'error' },
      );
    });
  }

  logout(): void {
    this.auth.logout();
    this.close();
  }
}
