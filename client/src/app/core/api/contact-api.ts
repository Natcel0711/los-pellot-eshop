import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

@Service()
export class ContactApi {
  private readonly http = inject(HttpClient);

  send(request: ContactRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/api/contact', request);
  }
}
