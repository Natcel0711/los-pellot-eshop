import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, User } from '../../shared/models';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  register(fullName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { fullName, email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password });
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  me(): Observable<User> {
    return this.http.get<User>('/api/auth/me');
  }

  updateProfile(fullName: string, email: string): Observable<User> {
    return this.http.put<User>('/api/auth/me', { fullName, email });
  }
}
