import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { BookingsApi } from '../../core/api/bookings-api';
import { Translation } from '../../core/services/translation';

interface ServiceOption {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-installation',
  imports: [RouterLink, Icon],
  styleUrl: './installation.css',
  templateUrl: './installation.html',
})
export class Installation {
  private readonly bookingsApi = inject(BookingsApi);
  protected readonly i18n = inject(Translation);

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  // `value` stays the canonical Spanish string sent to the backend, so
  // stored bookings/admin views stay consistent regardless of UI language.
  protected readonly serviceOptions: ServiceOption[] = [
    { value: 'Faros LED', labelKey: 'installation.serviceHeadlights' },
    { value: 'Fog Lights', labelKey: '' },
    { value: 'Luces Traseras', labelKey: 'installation.serviceTaillights' },
    { value: 'DRL / Direccionales', labelKey: 'installation.serviceDrl' },
    { value: 'Interior / Cabina', labelKey: 'installation.serviceInterior' },
    { value: 'Underglow', labelKey: '' },
    { value: 'Barra LED', labelKey: 'installation.serviceLedBar' },
    { value: 'Diagnóstico Eléctrico', labelKey: 'installation.serviceDiagnostics' },
    { value: 'No estoy seguro', labelKey: 'installation.serviceNotSure' },
  ];

  submit(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.submitting.set(true);
    this.error.set(null);

    this.bookingsApi
      .create({
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        email: String(data.get('email') ?? ''),
        vehicleDescription: String(data.get('vehicle') ?? ''),
        serviceType: String(data.get('service') ?? ''),
        preferredDate: String(data.get('date') ?? ''),
        notes: String(data.get('notes') ?? '') || null,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(this.i18n.t('installation.errorGeneric'));
        },
      });
  }
}
