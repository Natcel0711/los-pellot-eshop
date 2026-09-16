export interface Category {
  id: string;
  name: string;
  icon: string;
  defaultBulbType: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice: number | null;
  lumens: string;
  warranty: string;
  badge: string | null;
  universal: boolean;
  fitsSelectedVehicle: boolean | null;
  imageUrl: string | null;
}

export interface VehicleModelTree {
  model: string;
  trims: string[];
}

export interface VehicleMakeTree {
  make: string;
  models: VehicleModelTree[];
}

export interface VehicleYearTree {
  year: number;
  makes: VehicleMakeTree[];
}

export interface VehicleSelection {
  year: string;
  make: string;
  model: string;
  trim: string;
}

export interface ProductFilters {
  categories?: string[];
  year?: string;
  make?: string;
  model?: string;
  q?: string;
  saleOnly?: boolean;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface CartLine {
  key: string;
  productId: string;
  qty: number;
  vehicleLabel: string | null;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  lines: CartLine[];
  subtotal: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  apt: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentInfo {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  vehicleLabel: string | null;
}

export type SimulateOutcome = 'Succeed' | 'Fail' | 'Cancel';

export interface Order {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shipping: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  currency: string;
  total: number;
  createdAt: string;
  // True only while the active backend payment provider is the mock —
  // drives whether the checkout UI shows its dev-only simulate-outcome
  // controls. Automatically false once a real provider (e.g. Stripe) is wired up.
  allowSimulatedOutcomes: boolean;
  paymentReference: string | null;
}
