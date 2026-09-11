export interface AdminProduct {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  salePrice: number | null;
  lumens: string;
  warranty: string;
  badge: string | null;
  isUniversal: boolean;
  stockQuantity: number;
}

export interface UpsertProductRequest {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  salePrice: number | null;
  lumens: string;
  warranty: string;
  badge: string | null;
  isUniversal: boolean;
  stockQuantity: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  iconName: string;
  defaultBulbType: string;
  sortOrder: number;
}

export interface UpsertCategoryRequest {
  id: string;
  name: string;
  iconName: string;
  defaultBulbType: string;
  sortOrder: number;
}

export interface AdminYear {
  id: number;
  year: number;
}

export interface AdminMake {
  id: number;
  name: string;
}

export interface AdminModel {
  id: number;
  yearId: number;
  year: number;
  makeId: number;
  makeName: string;
  name: string;
}

export interface AdminTrim {
  id: number;
  modelId: number;
  name: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface AdminOrder {
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  isGuest: boolean;
  subtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface AdminBooking {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicleDescription: string;
  serviceType: string;
  preferredDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  createdAt: string;
  handledAt: string | null;
}

export interface AdminDashboard {
  productCount: number;
  lowStockCount: number;
  categoryCount: number;
  userCount: number;
  orderCount: number;
  pendingBookingCount: number;
  unhandledContactCount: number;
}

export const ORDER_STATUSES = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;
