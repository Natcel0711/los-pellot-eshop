import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminBooking,
  AdminCategory,
  AdminContactMessage,
  AdminDashboard,
  AdminMake,
  AdminModel,
  AdminOrder,
  AdminProduct,
  AdminTrim,
  AdminUser,
  AdminYear,
  UpsertCategoryRequest,
  UpsertProductRequest,
} from '../../shared/admin-models';

@Service()
export class AdminApi {
  private readonly http = inject(HttpClient);

  // Dashboard
  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>('/api/admin/dashboard');
  }

  // Products
  getProducts(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>('/api/admin/products');
  }

  createProduct(request: UpsertProductRequest): Observable<AdminProduct> {
    return this.http.post<AdminProduct>('/api/admin/products', request);
  }

  updateProduct(id: string, request: UpsertProductRequest): Observable<AdminProduct> {
    return this.http.put<AdminProduct>(`/api/admin/products/${id}`, request);
  }

  updateStock(id: string, stockQuantity: number): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(`/api/admin/products/${id}/stock`, { stockQuantity });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }

  uploadProductImage(id: string, file: File): Observable<AdminProduct> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<AdminProduct>(`/api/admin/products/${id}/image`, form);
  }

  deleteProductImage(id: string): Observable<AdminProduct> {
    return this.http.delete<AdminProduct>(`/api/admin/products/${id}/image`);
  }

  // Categories
  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>('/api/admin/categories');
  }

  createCategory(request: UpsertCategoryRequest): Observable<AdminCategory> {
    return this.http.post<AdminCategory>('/api/admin/categories', request);
  }

  updateCategory(id: string, request: UpsertCategoryRequest): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(`/api/admin/categories/${id}`, request);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/categories/${id}`);
  }

  // Vehicles
  getYears(): Observable<AdminYear[]> {
    return this.http.get<AdminYear[]>('/api/admin/vehicles/years');
  }

  createYear(year: number): Observable<AdminYear> {
    return this.http.post<AdminYear>('/api/admin/vehicles/years', { year });
  }

  deleteYear(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/vehicles/years/${id}`);
  }

  getMakes(): Observable<AdminMake[]> {
    return this.http.get<AdminMake[]>('/api/admin/vehicles/makes');
  }

  createMake(name: string): Observable<AdminMake> {
    return this.http.post<AdminMake>('/api/admin/vehicles/makes', { name });
  }

  deleteMake(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/vehicles/makes/${id}`);
  }

  getModels(): Observable<AdminModel[]> {
    return this.http.get<AdminModel[]>('/api/admin/vehicles/models');
  }

  createModel(yearId: number, makeId: number, name: string): Observable<AdminModel> {
    return this.http.post<AdminModel>('/api/admin/vehicles/models', { yearId, makeId, name });
  }

  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/vehicles/models/${id}`);
  }

  getTrims(modelId: number): Observable<AdminTrim[]> {
    return this.http.get<AdminTrim[]>(`/api/admin/vehicles/models/${modelId}/trims`);
  }

  createTrim(modelId: number, name: string): Observable<AdminTrim> {
    return this.http.post<AdminTrim>('/api/admin/vehicles/trims', { modelId, name });
  }

  deleteTrim(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/vehicles/trims/${id}`);
  }

  // Users
  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/admin/users');
  }

  setUserAdmin(id: string, isAdmin: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`/api/admin/users/${id}/admin`, { isAdmin });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }

  // Orders
  getOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>('/api/admin/orders');
  }

  updateOrderStatus(orderNumber: string, status: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`/api/admin/orders/${orderNumber}/status`, { status });
  }

  // Bookings
  getBookings(): Observable<AdminBooking[]> {
    return this.http.get<AdminBooking[]>('/api/admin/bookings');
  }

  updateBookingStatus(id: number, status: string): Observable<AdminBooking> {
    return this.http.patch<AdminBooking>(`/api/admin/bookings/${id}/status`, { status });
  }

  deleteBooking(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/bookings/${id}`);
  }

  // Contact messages
  getContactMessages(): Observable<AdminContactMessage[]> {
    return this.http.get<AdminContactMessage[]>('/api/admin/contact-messages');
  }

  markContactHandled(id: number): Observable<AdminContactMessage> {
    return this.http.patch<AdminContactMessage>(`/api/admin/contact-messages/${id}/handled`, {});
  }

  deleteContactMessage(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/contact-messages/${id}`);
  }
}
