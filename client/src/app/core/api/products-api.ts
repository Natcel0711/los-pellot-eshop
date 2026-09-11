import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductFilters } from '../../shared/models';

@Service()
export class ProductsApi {
  private readonly http = inject(HttpClient);

  getAll(filters: ProductFilters = {}): Observable<Product[]> {
    let params = new HttpParams();
    for (const category of filters.categories ?? []) {
      params = params.append('category', category);
    }
    if (filters.year) params = params.set('year', filters.year);
    if (filters.make) params = params.set('make', filters.make);
    if (filters.model) params = params.set('model', filters.model);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.saleOnly) params = params.set('saleOnly', 'true');
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<Product[]>('/api/products', { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }
}
