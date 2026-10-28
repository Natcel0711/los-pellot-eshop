// Checkout and payment. Replaces OrdersController.
//
// Checkout happens in two steps, like a real payment gateway:
//   Step A — createOrder():    turns the cart into an order waiting for payment.
//   Step B — confirmPayment(): charges the card; only when the provider says
//                              "paid" is stock taken off and the cart emptied.
// So an abandoned or failed payment never costs the shopper their cart and
// never holds inventory hostage.
//
// Safety rules carried over from the C# version (and covered by
// orders.test.ts):
//   - prices always come from the database, never from the browser
//   - stock can never go below zero, even when two people buy the last unit
//     at the same moment
//   - submitting the same request twice (double-click, refresh) never
//     creates a second order or charges twice (idempotency keys)

import { and, asc, desc, eq, gte, inArray, sql, type SQL } from 'drizzle-orm';
import type { Order, PaymentInfo, ShippingInfo, SimulateOutcome } from '../types.ts';
import { countryForState, isUsState, ZIP_PATTERN } from '../us-states.ts';
import { findCartId, loadCartLines, type CartOwner } from './cart.ts';
import { retryIfBusy, type DB } from './db/client.ts';
import { carts, cartItems, orderItems, orders, payments, products } from './db/schema.ts';
import { toDollars } from './money.ts';
import type { PaymentProvider } from './payments.ts';

export const FREE_SHIPPING_MIN_CENTS = 7500;
export const FLAT_SHIPPING_CENTS = 999;
const CURRENCY = 'usd';

export class OrderError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

function totalCents(o: OrderRow): number {
	return o.subtotalCents - o.discountCents + o.shippingCents + o.taxCents;
}

export function toOrderDto(o: OrderRow, items: OrderItemRow[], provider: PaymentProvider): Order {
	return {
		orderNumber: o.orderNumber,
		status: o.status,
		paymentStatus: o.paymentStatus,
		shipping: {
			name: o.shippingName,
			email: o.shippingEmail,
			phone: o.shippingPhone,
			address: o.shippingAddress,
			apt: o.shippingApt,
			city: o.shippingCity,
			state: o.shippingState,
			zip: o.shippingZip,
			country: o.shippingCountry
		},
		items: items.map((i) => ({
			productId: i.productId,
			productName: i.productName,
			unitPrice: toDollars(i.unitPriceCents),
			qty: i.qty,
			vehicleLabel: i.vehicleLabel
		})),
		subtotal: toDollars(o.subtotalCents),
		shippingCost: toDollars(o.shippingCents),
		discount: toDollars(o.discountCents),
		tax: toDollars(o.taxCents),
		currency: o.currency,
		total: toDollars(totalCents(o)),
		createdAt: o.createdAt.toISOString(),
		allowSimulatedOutcomes: !provider.isLive,
		paymentReference: o.providerReference
	};
}

async function loadOrder(db: DB, where: SQL) {
	const [order] = await db.select().from(orders).where(where);
	if (!order) return null;
	const [items, attempts] = await Promise.all([
		db
			.select()
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id))
			.orderBy(asc(orderItems.id)),
		db.select().from(payments).where(eq(payments.orderId, order.id)).orderBy(desc(payments.id))
	]);
	return { order, items, attempts };
}

async function generateOrderNumber(db: DB): Promise<string> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const candidate = 'LP-' + (100000 + Math.floor(Math.random() * 900000));
		const [taken] = await db
			.select({ id: orders.id })
			.from(orders)
			.where(eq(orders.orderNumber, candidate));
		if (!taken) return candidate;
	}
	return 'LP-' + crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
}

// The country isn't asked for: it follows from the state (PR or a US state).
export type ShippingInput = Omit<ShippingInfo, 'country'>;

function cleanShipping(s: ShippingInput): ShippingInfo {
	const t = (v: string | null | undefined) => (v ?? '').trim();
	const state = t(s.state).toUpperCase();
	const cleaned = {
		name: t(s.name),
		email: t(s.email),
		phone: t(s.phone),
		address: t(s.address),
		apt: t(s.apt) || null,
		city: t(s.city),
		state,
		zip: t(s.zip),
		country: countryForState(state)
	};
	const { apt: _optional, ...required } = cleaned;
	if (Object.values(required).some((v) => !v)) {
		throw new OrderError(400, 'Completa todos los campos requeridos.');
	}
	if (!isUsState(cleaned.state)) throw new OrderError(400, 'Selecciona un estado válido.');
	if (!ZIP_PATTERN.test(cleaned.zip)) {
		throw new OrderError(400, 'El código postal debe tener 5 dígitos (ej. 00901).');
	}
	return cleaned;
}

// ---- Step A ----------------------------------------------------------------

export async function createOrder(
	db: DB,
	provider: PaymentProvider,
	input: { owner: CartOwner; shipping: ShippingInput; idempotencyKey: string | null }
): Promise<Order> {
	const { owner, idempotencyKey } = input;

	// The same request sent twice gets the same order back.
	if (idempotencyKey) {
		const existing = await loadOrder(db, eq(orders.idempotencyKey, idempotencyKey));
		if (existing) return toOrderDto(existing.order, existing.items, provider);
	}

	const cartId = await findCartId(db, owner);
	const lines = cartId === null ? [] : await loadCartLines(db, cartId);
	if (lines.length === 0) throw new OrderError(400, 'Tu carrito está vacío.');

	const shipping = cleanShipping(input.shipping);

	// A soft check only — nothing is reserved here. Two shoppers can both pass
	// it for the last unit; only one wins in step B, where stock is enforced.
	const short = lines.filter((l) => l.product.stockQuantity < l.item.qty);
	if (short.length > 0) {
		throw new OrderError(
			400,
			`Stock insuficiente para: ${short.map((l) => l.product.name).join(', ')}.`
		);
	}

	const subtotalCents = lines.reduce(
		(sum, l) => sum + (l.product.salePriceCents ?? l.product.priceCents) * l.item.qty,
		0
	);
	const shippingCents = subtotalCents >= FREE_SHIPPING_MIN_CENTS ? 0 : FLAT_SHIPPING_CENTS;
	const orderNumber = await generateOrderNumber(db);

	let orderId: number;
	try {
		orderId = await retryIfBusy(() =>
			db.transaction(async (tx) => {
				const [created] = await tx
					.insert(orders)
					.values({
						orderNumber,
						userId: owner.userId,
						guestEmail: owner.userId ? null : shipping.email,
						status: 'PendingPayment',
						paymentStatus: 'Pending',
						currency: CURRENCY,
						idempotencyKey,
						shippingName: shipping.name,
						shippingEmail: shipping.email,
						shippingPhone: shipping.phone,
						shippingAddress: shipping.address,
						shippingApt: shipping.apt,
						shippingCity: shipping.city,
						shippingState: shipping.state,
						shippingZip: shipping.zip,
						shippingCountry: shipping.country,
						subtotalCents,
						shippingCents
					})
					.returning({ id: orders.id });
				await tx.insert(orderItems).values(
					lines.map((l) => ({
						orderId: created.id,
						productId: l.item.productId,
						productName: l.product.name,
						unitPriceCents: l.product.salePriceCents ?? l.product.priceCents,
						qty: l.item.qty,
						vehicleLabel: l.item.vehicleLabel
					}))
				);
				return created.id;
			})
		);
	} catch (err) {
		// A simultaneous request with the same idempotency key won the race.
		if (idempotencyKey) {
			const winner = await loadOrder(db, eq(orders.idempotencyKey, idempotencyKey));
			if (winner) return toOrderDto(winner.order, winner.items, provider);
		}
		throw err;
	}

	const amountCents = subtotalCents + shippingCents;
	const intent = await provider.createIntent(orderNumber, amountCents, CURRENCY);
	await retryIfBusy(() =>
		db.batch([
			db.insert(payments).values({
				orderId,
				provider: provider.name,
				providerPaymentIntentId: intent.providerPaymentIntentId,
				status: 'Pending',
				amountCents,
				currency: CURRENCY
			}),
			db
				.update(orders)
				.set({ providerReference: intent.providerPaymentIntentId })
				.where(eq(orders.id, orderId))
		])
	);

	const created = await loadOrder(db, eq(orders.id, orderId));
	return toOrderDto(created!.order, created!.items, provider);
}

// ---- Looking up an order ---------------------------------------------------

/** Who is asking: a logged-in user, or a guest proving ownership with the order's email. */
export interface OrderViewer {
	userId: string | null;
	email: string | null;
}

function canAccess(order: OrderRow, viewer: OrderViewer): boolean {
	const ownedByUser = order.userId !== null && order.userId === viewer.userId;
	const matchesGuestEmail =
		order.userId === null &&
		order.guestEmail !== null &&
		order.guestEmail.toLowerCase() === (viewer.email ?? '').toLowerCase();
	return ownedByUser || matchesGuestEmail;
}

export async function getOrderForViewer(
	db: DB,
	provider: PaymentProvider,
	orderNumber: string,
	viewer: OrderViewer
): Promise<Order> {
	const found = await loadOrder(db, eq(orders.orderNumber, orderNumber));
	if (!found) throw new OrderError(404, 'Orden no encontrada.');
	if (!canAccess(found.order, viewer)) throw new OrderError(403, 'No tienes acceso a esta orden.');
	return toOrderDto(found.order, found.items, provider);
}

export async function listOrdersForUser(
	db: DB,
	provider: PaymentProvider,
	userId: string
): Promise<Order[]> {
	const rows = await db
		.select()
		.from(orders)
		.where(eq(orders.userId, userId))
		.orderBy(desc(orders.createdAt));
	if (rows.length === 0) return [];
	const items = await db
		.select()
		.from(orderItems)
		.where(
			inArray(
				orderItems.orderId,
				rows.map((o) => o.id)
			)
		)
		.orderBy(asc(orderItems.id));
	return rows.map((o) =>
		toOrderDto(
			o,
			items.filter((i) => i.orderId === o.id),
			provider
		)
	);
}

// ---- Step B ----------------------------------------------------------------

class OutOfStock extends Error {}

export async function confirmPayment(
	db: DB,
	provider: PaymentProvider,
	input: {
		orderNumber: string;
		viewer: OrderViewer;
		owner: CartOwner;
		idempotencyKey: string | null;
		card: PaymentInfo | null;
		simulateOutcome: SimulateOutcome | null;
		/** Runs once, only on the request that actually marks the order paid (e.g. the confirmation email). */
		onPaid?: (order: Order) => Promise<unknown>;
	}
): Promise<Order> {
	const { idempotencyKey } = input;
	const found = await loadOrder(db, eq(orders.orderNumber, input.orderNumber));
	if (!found) throw new OrderError(404, 'Orden no encontrada.');
	const { order, items, attempts } = found;
	if (!canAccess(order, input.viewer)) throw new OrderError(403, 'No tienes acceso a esta orden.');

	const current = () => getOrderForViewer(db, provider, order.orderNumber, input.viewer);

	// Already paid — a double-click or refresh is a harmless no-op.
	if (order.status === 'Received' && order.paymentStatus === 'Paid') return current();
	if (order.status !== 'PendingPayment')
		throw new OrderError(400, 'Esta orden ya no admite pagos.');

	// A previous request with this exact key already finished.
	if (
		idempotencyKey &&
		attempts.some((p) => p.idempotencyKey === idempotencyKey && p.status !== 'Pending')
	) {
		return current();
	}

	const latest = attempts[0];
	let attempt: { id: number; intentId: string };

	if (!latest || latest.status === 'Failed' || latest.status === 'Cancelled') {
		// Fresh attempt: a dead payment can't be re-confirmed with a real
		// provider, so retries get a new one (and a new row, for the audit trail).
		const intent = await provider.createIntent(
			order.orderNumber,
			totalCents(order),
			order.currency
		);
		const [row] = await retryIfBusy(() =>
			db
				.insert(payments)
				.values({
					orderId: order.id,
					provider: provider.name,
					providerPaymentIntentId: intent.providerPaymentIntentId,
					status: 'Processing',
					amountCents: totalCents(order),
					currency: order.currency,
					idempotencyKey
				})
				.returning({ id: payments.id })
		);
		attempt = { id: row.id, intentId: intent.providerPaymentIntentId };
	} else {
		// Claim the pending attempt in one atomic UPDATE, so a simultaneous
		// duplicate request can't also call the provider (no double charge).
		const claimed = await retryIfBusy(() =>
			db
				.update(payments)
				.set({
					status: 'Processing',
					updatedAt: new Date(),
					...(latest.idempotencyKey === null && idempotencyKey ? { idempotencyKey } : {})
				})
				.where(and(eq(payments.id, latest.id), eq(payments.status, 'Pending')))
				.returning({ id: payments.id })
		);
		if (claimed.length === 0) return current(); // another request is already handling it
		attempt = { id: latest.id, intentId: latest.providerPaymentIntentId };
	}

	const simulate = provider.isLive ? null : input.simulateOutcome;
	const result = await provider.confirm(attempt.intentId, input.card, simulate, idempotencyKey);

	if (result.status !== 'Paid') {
		await retryIfBusy(() =>
			db.batch([
				db
					.update(payments)
					.set({
						status: result.status,
						failureReason: result.failureReason,
						updatedAt: new Date()
					})
					.where(eq(payments.id, attempt.id)),
				db.update(orders).set({ paymentStatus: result.status }).where(eq(orders.id, order.id))
			])
		);
		throw new OrderError(
			400,
			result.failureReason ?? 'No pudimos procesar tu pago. Puedes intentarlo de nuevo.'
		);
	}

	// The provider says "paid". Now take the stock, all-or-nothing.
	try {
		await retryIfBusy(() =>
			db.transaction(async (tx) => {
				for (const item of items) {
					// Only succeeds if enough stock is left at this exact moment.
					const taken = await tx
						.update(products)
						.set({ stockQuantity: sql`${products.stockQuantity} - ${item.qty}` })
						.where(and(eq(products.id, item.productId), gte(products.stockQuantity, item.qty)))
						.returning({ id: products.id });
					if (taken.length === 0) throw new OutOfStock(); // undoes every change in this transaction
				}

				// Empty the buyer's cart.
				const cartOwner = input.owner.userId
					? eq(carts.userId, input.owner.userId)
					: input.owner.guestToken
						? eq(carts.guestToken, input.owner.guestToken)
						: null;
				if (cartOwner) {
					await tx
						.delete(cartItems)
						.where(
							inArray(cartItems.cartId, tx.select({ id: carts.id }).from(carts).where(cartOwner))
						);
				}

				await tx
					.update(payments)
					.set({ status: 'Paid', failureReason: null, updatedAt: new Date() })
					.where(eq(payments.id, attempt.id));
				await tx
					.update(orders)
					.set({ status: 'Received', paymentStatus: 'Paid', providerReference: attempt.intentId })
					.where(eq(orders.id, order.id));
			})
		);
	} catch (err) {
		if (!(err instanceof OutOfStock)) throw err;

		// Stock ran out between step A and step B. The provider already said
		// yes — we must not keep money for stock we don't have, so cancel it.
		await provider.cancel(attempt.intentId);
		await retryIfBusy(() =>
			db.batch([
				db
					.update(payments)
					.set({
						status: 'Cancelled',
						failureReason: 'Stock agotado después de procesar el pago.',
						updatedAt: new Date()
					})
					.where(eq(payments.id, attempt.id)),
				db.update(orders).set({ paymentStatus: 'Cancelled' }).where(eq(orders.id, order.id))
			])
		);
		throw new OrderError(
			409,
			'Uno de los productos se agotó mientras procesábamos tu pago. No se realizó ningún cargo permanente. Por favor revisa tu carrito.'
		);
	}

	const paid = await current();
	await input.onPaid?.(paid);
	return paid;
}
