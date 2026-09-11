import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface BookingRequest {
  name: string;
  phone: string;
  email: string;
  vehicleDescription: string;
  serviceType: string;
  preferredDate: string;
  notes?: string | null;
}

@Service()
export class BookingsApi {
  private readonly http = inject(HttpClient);

  create(request: BookingRequest): Observable<{ id: number; status: string }> {
    return this.http.post<{ id: number; status: string }>('/api/bookings', request);
  }
}
