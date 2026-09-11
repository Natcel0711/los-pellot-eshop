import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { BookingsApi } from '../../core/api/bookings-api';

@Component({
  selector: 'app-installation',
  imports: [RouterLink, Icon],
  styleUrl: './installation.css',
  templateUrl: './installation.html',
})
export class Installation {
  private readonly bookingsApi = inject(BookingsApi);

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly serviceOptions = [
    'Faros LED',
    'Fog Lights',
    'Luces Traseras',
    'DRL / Direccionales',
    'Interior / Cabina',
    'Underglow',
    'Barra LED',
    'Diagnóstico Eléctrico',
    'No estoy seguro',
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
          this.error.set('No pudimos enviar tu solicitud, intenta de nuevo.');
        },
      });
  }
}
