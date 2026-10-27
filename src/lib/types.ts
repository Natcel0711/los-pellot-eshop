// Shapes of the data that pages receive. These match the old Angular
// `shared/models.ts` and `shared/admin-models.ts`, so the page markup could be
// ported as-is. Money here is in dollars (the database stores cents).

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

export type ProductSort = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

export interface ProductFilters {
	categories?: string[];
	year?: string;
	make?: string;
	model?: string;
	q?: string;
	saleOnly?: boolean;
	sort?: ProductSort;
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
	// True only while the payment provider is the mock — shows the checkout's
	// test-mode controls. Automatically false once a real provider is wired up.
	allowSimulatedOutcomes: boolean;
	paymentReference: string | null;
}

// ---- Admin -----------------------------------------------------------------

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

export interface AdminCategory {
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

export interface AdminOrderDetail extends Omit<AdminOrder, 'itemCount'> {
	shipping: ShippingInfo;
	items: OrderItem[];
	shippingLabels: ShippingLabel[];
}

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

export const ORDER_STATUS_OPTIONS = [
	'Received',
	'Processing',
	'Shipped',
	'Delivered',
	'Cancelled'
] as const;
// Includes PendingPayment since orders can genuinely be filtered to that state.
export const ORDER_STATUS_FILTERS = [...ORDER_STATUS_OPTIONS, 'PendingPayment'] as const;
export const BOOKING_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cancelled'] as const;
