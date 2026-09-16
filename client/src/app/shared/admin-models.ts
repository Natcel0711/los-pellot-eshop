import { OrderItem, ShippingInfo } from './models';

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
  imageUrl: string | null;
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
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  isGuest: boolean;
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderDetail {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  isGuest: boolean;
  shipping: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  shippingLabels: ShippingLabel[];
}

// ---- Real carrier shipping labels (Shippo) ----
export interface PackageInfo {
  weightLb: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
}

export interface ShippingRate {
  rateId: string;
  carrier: string;
  serviceLevel: string;
  amount: number;
  currency: string;
  estimatedDays: string | null;
}

export interface ShippingLabel {
  provider: string;
  labelUrl: string;
  trackingNumber: string;
  trackingUrlProvider: string | null;
  carrier: string;
  serviceLevel: string;
  amount: number;
  currency: string;
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

// Settable values only — PendingPayment is a computed lifecycle state the
// backend rejects if set manually (see AdminOrdersController.UpdateStatus).
export const ORDER_STATUS_OPTIONS = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
// Includes PendingPayment since orders can genuinely be filtered to that state.
export const ORDER_STATUS_FILTERS = ['Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'PendingPayment'] as const;
export const PAYMENT_STATUSES = ['Pending', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Refunded'] as const;
export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;
