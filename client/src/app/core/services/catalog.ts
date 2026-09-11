import { Service, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { CategoriesApi } from '../api/categories-api';
import { VehiclesApi } from '../api/vehicles-api';
import { Category, VehicleYearTree } from '../../shared/models';

// Categories and the vehicle year/make/model/trim tree rarely change, so
// cache them for the session instead of refetching on every page.
@Service()
export class Catalog {
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly vehiclesApi = inject(VehiclesApi);

  private categories$?: Observable<Category[]>;
  private vehicleTree$?: Observable<VehicleYearTree[]>;

  getCategories(): Observable<Category[]> {
    this.categories$ ??= this.categoriesApi.getAll().pipe(shareReplay(1));
    return this.categories$;
  }

  getVehicleTree(): Observable<VehicleYearTree[]> {
    this.vehicleTree$ ??= this.vehiclesApi.getTree().pipe(shareReplay(1));
    return this.vehicleTree$;
  }
}
