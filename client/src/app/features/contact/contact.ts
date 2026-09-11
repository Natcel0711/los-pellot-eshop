import { Component, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon/icon';
import { ContactApi } from '../../core/api/contact-api';

@Component({
  selector: 'app-contact',
  imports: [Icon],
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact {
  private readonly contactApi = inject(ContactApi);

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly subjectOptions = [
    'Compatibilidad de producto',
    'Estado de mi orden',
    'Instalación',
    'Garantía / Devoluciones',
    'Otro',
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
          this.error.set('No pudimos enviar tu mensaje, intenta de nuevo.');
        },
      });
  }
}
