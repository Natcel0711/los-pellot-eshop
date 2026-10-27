// The whole database, in one file. Each `sqliteTable` is one table; each
// property is one column. After changing anything here, run
// `npm run db:generate` to create a migration, then `npm run db:migrate`.
//
// Money is stored as whole cents (integers) to avoid floating-point rounding
// errors — $19.99 is stored as 1999. `src/lib/server/money.ts` converts.

import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());

// ---- Accounts --------------------------------------------------------------

export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	fullName: text('full_name').notNull(),
	passwordHash: text('password_hash').notNull(),
	isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
	createdAt: createdAt()
});

// One row per logged-in browser. The cookie holds a random token; only its
// SHA-256 hash is stored here, so a leaked database can't be used to log in.
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

// ---- Catalog ---------------------------------------------------------------

export const categories = sqliteTable('categories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	iconName: text('icon_name').notNull(),
	defaultBulbType: text('default_bulb_type').notNull().default('Universal'),
	// Curated display order (headlights first, etc.), not alphabetical.
	sortOrder: integer('sort_order').notNull().default(0)
});

export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	categoryId: text('category_id')
		.notNull()
		.references(() => categories.id, { onDelete: 'restrict' }),
	priceCents: integer('price_cents').notNull(),
	salePriceCents: integer('sale_price_cents'),
	lumens: text('lumens').notNull().default(''),
	warranty: text('warranty').notNull().default(''),
	badge: text('badge'),
	isUniversal: integer('is_universal', { mode: 'boolean' }).notNull().default(false),
	stockQuantity: integer('stock_quantity').notNull().default(0),
	// Full URL (Vercel Blob) or "/uploads/..." in local dev. Null = no photo
	// yet; the site falls back to the category icon.
	imageUrl: text('image_url')
});

// A null column acts as a wildcard: Year/Make/Model all null means "fits
// every vehicle" (universal products); Make set with Year/Model null means
// "every year/model of that make", and so on.
export const productFitments = sqliteTable('product_fitments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	productId: text('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	year: integer('year'),
	make: text('make'),
	model: text('model')
});

// ---- Vehicles (year → make → model → trim) ---------------------------------

export const vehicleYears = sqliteTable('vehicle_years', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	year: integer('year').notNull().unique()
});

export const vehicleMakes = sqliteTable('vehicle_makes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique()
});

// A (year, make, model) triple — the same model name can appear under
// several years with a different trim list each time.
export const vehicleModels = sqliteTable(
	'vehicle_models',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		yearId: integer('year_id')
			.notNull()
			.references(() => vehicleYears.id, { onDelete: 'cascade' }),
		makeId: integer('make_id')
			.notNull()
			.references(() => vehicleMakes.id, { onDelete: 'cascade' }),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('vehicle_models_year_make_name').on(t.yearId, t.makeId, t.name)]
);

export const vehicleTrims = sqliteTable('vehicle_trims', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	modelId: integer('model_id')
		.notNull()
		.references(() => vehicleModels.id, { onDelete: 'cascade' }),
	name: text('name').notNull()
});

// ---- Cart ------------------------------------------------------------------

// Belongs to either a logged-in user or a guest (identified by the random
// token in the `lp_cart` cookie). Merged into the user's cart on login.
export const carts = sqliteTable('carts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id')
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	guestToken: text('guest_token').unique(),
	createdAt: createdAt()
});

export const cartItems = sqliteTable('cart_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	cartId: integer('cart_id')
		.notNull()
		.references(() => carts.id, { onDelete: 'cascade' }),
	productId: text('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	qty: integer('qty').notNull().default(1),
	vehicleLabel: text('vehicle_label')
});

// ---- Orders & payments -----------------------------------------------------

export const ORDER_STATUSES = [
	'PendingPayment',
	'Received',
	'Processing',
	'Shipped',
	'Delivered',
	'Cancelled'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
	'Pending',
	'Processing',
	'Paid',
	'Failed',
	'Cancelled',
	'Refunded'
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const orders = sqliteTable('orders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderNumber: text('order_number').notNull().unique(),
	// Plain column, not a foreign key: deleting a user keeps their order history.
	userId: text('user_id'),
	guestEmail: text('guest_email'),
	status: text('status', { enum: ORDER_STATUSES }).notNull().default('PendingPayment'),

	shippingName: text('shipping_name').notNull(),
	shippingEmail: text('shipping_email').notNull(),
	shippingPhone: text('shipping_phone').notNull(),
	shippingAddress: text('shipping_address').notNull(),
	shippingApt: text('shipping_apt'),
	shippingCity: text('shipping_city').notNull(),
	shippingState: text('shipping_state').notNull(),
	shippingZip: text('shipping_zip').notNull(),
	shippingCountry: text('shipping_country').notNull(),

	subtotalCents: integer('subtotal_cents').notNull(),
	shippingCents: integer('shipping_cents').notNull(),
	discountCents: integer('discount_cents').notNull().default(0),
	taxCents: integer('tax_cents').notNull().default(0),
	currency: text('currency').notNull().default('usd'),

	// Copied from the latest payment row so lists don't need a join.
	paymentStatus: text('payment_status', { enum: PAYMENT_STATUSES }).notNull().default('Pending'),
	providerReference: text('provider_reference'),
	// Makes a replayed "create order" request return the same order.
	idempotencyKey: text('idempotency_key').unique(),
	createdAt: createdAt()
});

export const orderItems = sqliteTable('order_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderId: integer('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	// Snapshot of the product at purchase time — later edits or deletes of
	// the product don't change past orders.
	productId: text('product_id').notNull(),
	productName: text('product_name').notNull(),
	unitPriceCents: integer('unit_price_cents').notNull(),
	qty: integer('qty').notNull(),
	vehicleLabel: text('vehicle_label')
});

// One row per payment *attempt*. A retry after a failure creates a new row,
// which keeps an audit trail of every attempt.
export const payments = sqliteTable('payments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderId: integer('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull().default('mock'),
	providerPaymentIntentId: text('provider_payment_intent_id').notNull(),
	status: text('status', { enum: PAYMENT_STATUSES }).notNull().default('Pending'),
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull().default('usd'),
	idempotencyKey: text('idempotency_key').unique(),
	failureReason: text('failure_reason'),
	createdAt: createdAt(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
});

// One row per purchased carrier label (real postage via Shippo).
export const shippingLabels = sqliteTable('shipping_labels', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderId: integer('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull().default('shippo'),
	providerTransactionId: text('provider_transaction_id').notNull(),
	labelUrl: text('label_url').notNull(),
	trackingNumber: text('tracking_number').notNull(),
	trackingUrlProvider: text('tracking_url_provider'),
	carrier: text('carrier').notNull(),
	serviceLevel: text('service_level').notNull(),
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull().default('usd'),
	weightLb: real('weight_lb').notNull(),
	lengthIn: real('length_in').notNull(),
	widthIn: real('width_in').notNull(),
	heightIn: real('height_in').notNull(),
	createdAt: createdAt()
});

// ---- Bookings & contact ----------------------------------------------------

export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const bookings = sqliteTable('bookings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	phone: text('phone').notNull(),
	email: text('email').notNull(),
	vehicleDescription: text('vehicle_description').notNull().default(''),
	serviceType: text('service_type').notNull(),
	preferredDate: text('preferred_date').notNull(), // "YYYY-MM-DD"
	notes: text('notes'),
	userId: text('user_id'),
	status: text('status', { enum: BOOKING_STATUSES }).notNull().default('Pending'),
	createdAt: createdAt()
});

export const contactMessages = sqliteTable('contact_messages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	subject: text('subject').notNull(),
	message: text('message').notNull(),
	createdAt: createdAt(),
	handledAt: integer('handled_at', { mode: 'timestamp_ms' })
});
