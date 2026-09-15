import { Component, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon/icon';
import { ContactApi } from '../../core/api/contact-api';
import { Translation } from '../../core/services/translation';

interface SubjectOption {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-contact',
  imports: [Icon],
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact {
  private readonly contactApi = inject(ContactApi);
  protected readonly i18n = inject(Translation);

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  // `value` stays the canonical Spanish string sent to the backend, so
  // stored messages/admin views stay consistent regardless of UI language.
  protected readonly subjectOptions: SubjectOption[] = [
    { value: 'Compatibilidad de producto', labelKey: 'contact.subjectProductCompat' },
    { value: 'Estado de mi orden', labelKey: 'contact.subjectOrderStatus' },
    { value: 'Instalación', labelKey: 'contact.subjectInstallation' },
    { value: 'Garantía / Devoluciones', labelKey: 'contact.subjectWarranty' },
    { value: 'Otro', labelKey: 'contact.subjectOther' },
  ];

  submit(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.submitting.set(true);
    this.error.set(null);

    this.contactApi
      .send({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? '') || null,
        subject: String(data.get('subject') ?? ''),
        message: String(data.get('message') ?? ''),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(this.i18n.t('contact.errorGeneric'));
        },
      });
  }
}
