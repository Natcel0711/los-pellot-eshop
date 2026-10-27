// Checkout / payment / inventory rules, ported from the C# xUnit tests
// (server/LosPellot.Api.Tests). Each test gets its own fresh SQLite file.
// Run with `npm test`.

import { eq, count } from 'drizzle-orm';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PaymentInfo } from '../types.ts';
import { createDb, type DB } from './db/client.ts';
import { migrateDb } from './db/migrate.ts';
import { cartItems, carts, categories, orders, payments, products } from './db/schema.ts';
import { confirmPayment, createOrder, OrderError, type ShippingInput } from './orders.ts';
import { mockPaymentProvider, type PaymentProvider } from './payments.ts';

let dir: string;
let url: string;
let db: DB;

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'lp-test-'));
	url = 'file:' + join(dir, 'test.db');
	db = createDb(url);
	await migrateDb(db);
	await db.insert(categories).values({ id: 'cat1', name: 'Test Category', iconName: 'bolt' });
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

// ---- helpers ---------------------------------------------------------------

async function addProduct(id: string, price: number, stock: number) {
	await db.insert(products).values({
		id,
		name: 'Test Product ' + id,
		categoryId: 'cat1',
		priceCents: Math.round(price * 100),
		lumens: '1000',
		warranty: '1 year',
		stockQuantity: stock,
		isUniversal: true
	});
}

async function guestCart(...items: [productId: string, qty: number][]) {
	const guestToken = crypto.randomUUID();
	const [cart] = await db.insert(carts).values({ guestToken }).returning();
	for (const [productId, qty] of items)
		await db.insert(cartItems).values({ cartId: cart.id, productId, qty });
	return { owner: { userId: null, guestToken }, cartId: cart.id };
}

const shipping = (email = 'guest@example.com'): ShippingInput => ({
	name: 'Test Buyer',
	email,
	phone: '555-0100',
	address: '123 Main St',
	apt: null,
	city: 'San Juan',
	state: 'PR',
	zip: '00901'
});

const card = (number = '4242424242424242'): PaymentInfo => ({
	cardName: 'Test Buyer',
	cardNumber: number,
	expiry: '12/30',
	cvc: '123'
});

const stockOf = async (id: string, conn: DB = db) =>
	(await conn.select().from(products).where(eq(products.id, id)))[0].stockQuantity;

const viewerFor = (email: string) => ({ userId: null, email });

// Wraps the mock provider and counts confirm() calls.
function countingProvider() {
	const counter = { confirmCalls: 0 };
	const provider: PaymentProvider = {
		...mockPaymentProvider,
		confirm: (...args) => {
			counter.confirmCalls++;
			return mockPaymentProvider.confirm(...args);
		}
	};
	return { provider, counter };
}

async function expectOrderError(promise: Promise<unknown>, status: number) {
	const err = await promise.then(
		() => null,
		(e) => e
	);
	expect(err).toBeInstanceOf(OrderError);
	expect((err as OrderError).status).toBe(status);
}

// ---- tests -----------------------------------------------------------------

describe('checkout', () => {
	it('with a valid cart and successful payment: decrements stock, clears the cart, marks the order paid', async () => {
		await addProduct('p1', 50, 10);
		const { owner, cartId } = await guestCart(['p1', 3]);

		const order = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});
		expect(order.status).toBe('PendingPayment');
		expect(order.subtotal).toBe(150); // 50 × 3, computed on the server

		const paid = await confirmPayment(db, mockPaymentProvider, {
			orderNumber: order.orderNumber,
			viewer: viewerFor(order.shipping.email),
			owner,
			idempotencyKey: null,
			card: card(),
			simulateOutcome: null
		});
		expect(paid.status).toBe('Received');
		expect(paid.paymentStatus).toBe('Paid');

		expect(await stockOf('p1')).toBe(7); // 10 − 3
		const [{ n }] = await db
			.select({ n: count() })
			.from(cartItems)
			.where(eq(cartItems.cartId, cartId));
		expect(n).toBe(0);
	});

	it('computes the total from the database price, whatever the browser sends', async () => {
		await addProduct('p1', 99.99, 10);
		const { owner } = await guestCart(['p1', 2]);

		// The input has no price field to tamper with — shipping details only.
		const order = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});

		expect(order.subtotal).toBe(199.98);
		expect(order.items).toHaveLength(1);
		expect(order.items[0].unitPrice).toBe(99.99);
	});

	it('rejects a cart that exceeds current stock, with no order created', async () => {
		await addProduct('p1', 10, 1);
		const { owner } = await guestCart(['p1', 2]); // wants 2, only 1 in stock

		await expectOrderError(
			createOrder(db, mockPaymentProvider, { owner, shipping: shipping(), idempotencyKey: null }),
			400
		);
		const [{ n }] = await db.select({ n: count() }).from(orders);
		expect(n).toBe(0);
	});
});

describe('payment', () => {
	it('when stock runs out after the order was created: cancels the payment and leaves the order pending', async () => {
		await addProduct('p1', 10, 1);
		const { owner } = await guestCart(['p1', 1]);
		const order = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});

		// Someone else buys the last unit between step A and step B.
		await db.update(products).set({ stockQuantity: 0 }).where(eq(products.id, 'p1'));

		await expectOrderError(
			confirmPayment(db, mockPaymentProvider, {
				orderNumber: order.orderNumber,
				viewer: viewerFor(order.shipping.email),
				owner,
				idempotencyKey: null,
				card: card(),
				simulateOutcome: 'Succeed' // provider says yes; stock says no
			}),
			409
		);

		const [after] = await db.select().from(orders).where(eq(orders.orderNumber, order.orderNumber));
		expect(after.status).toBe('PendingPayment'); // no partial state
		expect(after.paymentStatus).toBe('Cancelled');
		const attempts = await db.select().from(payments).where(eq(payments.orderId, after.id));
		expect(attempts).toHaveLength(1);
		expect(attempts[0].status).toBe('Cancelled');
		expect(await stockOf('p1')).toBe(0); // never negative
	});

	it('when the payment fails: stock and order are untouched, and a retry works', async () => {
		await addProduct('p1', 20, 5);
		const { owner } = await guestCart(['p1', 1]);
		const order = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});
		const pay = (simulateOutcome: 'Fail' | 'Succeed') =>
			confirmPayment(db, mockPaymentProvider, {
				orderNumber: order.orderNumber,
				viewer: viewerFor(order.shipping.email),
				owner,
				idempotencyKey: null,
				card: card(),
				simulateOutcome
			});

		await expectOrderError(pay('Fail'), 400);

		const [afterFailure] = await db
			.select()
			.from(orders)
			.where(eq(orders.orderNumber, order.orderNumber));
		expect(afterFailure.status).toBe('PendingPayment');
		expect(afterFailure.paymentStatus).toBe('Failed');
		expect(
			await db.select().from(payments).where(eq(payments.orderId, afterFailure.id))
		).toHaveLength(1);
		expect(await stockOf('p1')).toBe(5); // untouched

		// Retry with success — creates a second payment row.
		const paid = await pay('Succeed');
		expect(paid.paymentStatus).toBe('Paid');
		expect(
			await db.select().from(payments).where(eq(payments.orderId, afterFailure.id))
		).toHaveLength(2);
		expect(await stockOf('p1')).toBe(4); // taken once, by the successful attempt
	});

	it('two orders for the last unit paid at the same moment: exactly one succeeds and stock never goes negative', async () => {
		await addProduct('p1', 30, 1); // exactly one unit left
		const a = await guestCart(['p1', 1]);
		const b = await guestCart(['p1', 1]);

		// Both reach step A fine (it only soft-checks; nothing is reserved).
		const orderA = await createOrder(db, mockPaymentProvider, {
			owner: a.owner,
			shipping: shipping('a@example.com'),
			idempotencyKey: null
		});
		const orderB = await createOrder(db, mockPaymentProvider, {
			owner: b.owner,
			shipping: shipping('b@example.com'),
			idempotencyKey: null
		});

		// Pay both truly at the same time, each over its own connection, like
		// two separate server requests.
		const dbA = createDb(url);
		const dbB = createDb(url);
		const results = await Promise.allSettled([
			confirmPayment(dbA, mockPaymentProvider, {
				orderNumber: orderA.orderNumber,
				viewer: viewerFor('a@example.com'),
				owner: a.owner,
				idempotencyKey: null,
				card: card(),
				simulateOutcome: 'Succeed'
			}),
			confirmPayment(dbB, mockPaymentProvider, {
				orderNumber: orderB.orderNumber,
				viewer: viewerFor('b@example.com'),
				owner: b.owner,
				idempotencyKey: null,
				card: card(),
				simulateOutcome: 'Succeed'
			})
		]);

		const succeeded = results.filter(
			(r) => r.status === 'fulfilled' && r.value.paymentStatus === 'Paid'
		);
		const conflicted = results.filter(
			(r) => r.status === 'rejected' && r.reason instanceof OrderError && r.reason.status === 409
		);
		expect(succeeded).toHaveLength(1);
		expect(conflicted).toHaveLength(1);
		expect(await stockOf('p1')).toBe(0); // exactly one unit taken, never negative
	});
});

describe('idempotency', () => {
	it('replaying a checkout with the same key never creates a second order', async () => {
		await addProduct('p1', 15, 10);
		const { owner } = await guestCart(['p1', 1]);
		const key = crypto.randomUUID();

		const first = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: key
		});
		const second = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: key
		});

		expect(second.orderNumber).toBe(first.orderNumber);
		const [{ n }] = await db.select({ n: count() }).from(orders);
		expect(n).toBe(1);
	});

	it('replaying a payment with the same key calls the provider once and never duplicates the payment', async () => {
		await addProduct('p1', 15, 10);
		const { owner } = await guestCart(['p1', 1]);
		const { provider, counter } = countingProvider();
		const order = await createOrder(db, provider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});

		const key = crypto.randomUUID();
		const pay = () =>
			confirmPayment(db, provider, {
				orderNumber: order.orderNumber,
				viewer: viewerFor(order.shipping.email),
				owner,
				idempotencyKey: key,
				card: card(),
				simulateOutcome: 'Succeed'
			});

		expect((await pay()).paymentStatus).toBe('Paid');
		expect((await pay()).paymentStatus).toBe('Paid');
		expect(counter.confirmCalls).toBe(1); // the replay short-circuited on "already paid"

		const [row] = await db.select().from(orders).where(eq(orders.orderNumber, order.orderNumber));
		expect(await db.select().from(payments).where(eq(payments.orderId, row.id))).toHaveLength(1);
	});
});

describe('access', () => {
	it('a guest must know the order email to pay for it', async () => {
		await addProduct('p1', 15, 10);
		const { owner } = await guestCart(['p1', 1]);
		const order = await createOrder(db, mockPaymentProvider, {
			owner,
			shipping: shipping(),
			idempotencyKey: null
		});

		await expectOrderError(
			confirmPayment(db, mockPaymentProvider, {
				orderNumber: order.orderNumber,
				viewer: viewerFor('someone-else@example.com'),
				owner,
				idempotencyKey: null,
				card: card(),
				simulateOutcome: 'Succeed'
			}),
			403
		);
	});
});
