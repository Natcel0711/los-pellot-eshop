import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleYearTree } from '../../shared/models';

@Service()
export class VehiclesApi {
  private readonly http = inject(HttpClient);

  getTree(): Observable<VehicleYearTree[]> {
    return this.http.get<VehicleYearTree[]>('/api/vehicles/tree');
  }
}
