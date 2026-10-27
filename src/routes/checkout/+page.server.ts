// Checkout: step 1 (shipping) creates the order, step 2 (payment) pays it.
// Replaces POST /api/orders, POST /api/orders/{no}/payment and GET /api/orders/{no}.
//
// While a checkout is in progress, the `lp_checkout` cookie remembers which
// order it is, so a page refresh lands back on the payment step.

import { fail, type Cookies } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { confirmPayment, createOrder, getOrderForViewer, OrderError } from '#lib/server/orders.ts';
import { paymentProvider } from '#lib/server/payments.ts';
import type { Order, SimulateOutcome } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

const CHECKOUT_COOKIE = 'lp_checkout';

interface CheckoutAttempt {
	orderNumber: string;
	email: string;
}

function readAttempt(cookies: Cookies): CheckoutAttempt | null {
	try {
		const value = JSON.parse(cookies.get(CHECKOUT_COOKIE) ?? 'null');
		return value?.orderNumber ? value : null;
	} catch {
		return null;
	}
}

const clearAttempt = (cookies: Cookies) => cookies.delete(CHECKOUT_COOKIE, { path: '/checkout' });

export const load: PageServerLoad = async ({ cookies, locals }) => {
	let pendingOrder: Order | null = null;
	let confirmedOrder: Order | null = null;

	const attempt = readAttempt(cookies);
	if (attempt) {
		try {
			const order = await getOrderForViewer(db, paymentProvider, attempt.orderNumber, {
				userId: locals.user?.id ?? null,
				email: attempt.email
			});
			if (order.status === 'Received' && order.paymentStatus === 'Paid') {
				confirmedOrder = order;
				clearAttempt(cookies);
			} else if (order.status === 'PendingPayment') {
				pendingOrder = order;
			} else {
				clearAttempt(cookies);
			}
		} catch {
			clearAttempt(cookies);
		}
	}

	return {
		pendingOrder,
		confirmedOrder,
		// Sent back with step 1 so a double-submit can't create two orders.
		idempotencyKey: crypto.randomUUID()
	};
};

export const actions: Actions = {
	createOrder: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '');
		const shipping = {
			name: field('name'),
			email: field('email'),
			phone: field('phone'),
			address: field('address'),
			apt: field('apt') || null,
			city: field('city'),
			state: field('state'),
			zip: field('zip'),
			country: field('country')
		};

		try {
			const order = await createOrder(db, paymentProvider, {
				owner: { userId: locals.user?.id ?? null, guestToken: locals.guestToken },
				shipping,
				idempotencyKey: field('idempotencyKey') || null
			});
			cookies.set(
				CHECKOUT_COOKIE,
				JSON.stringify({ orderNumber: order.orderNumber, email: order.shipping.email }),
				{
					path: '/checkout',
					httpOnly: true,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24
				}
			);
		} catch (err) {
			if (err instanceof OrderError) return fail(err.status, { error: err.message });
			throw err;
		}
	},

	pay: async ({ request, locals, cookies }) => {
		const attempt = readAttempt(cookies);
		if (!attempt)
			return fail(400, { error: 'Tu sesión de pago expiró. Vuelve a empezar.', retry: false });

		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '');
		const outcome = field('simulateOutcome');

		try {
			await confirmPayment(db, paymentProvider, {
				orderNumber: attempt.orderNumber,
				viewer: { userId: locals.user?.id ?? null, email: attempt.email },
				owner: { userId: locals.user?.id ?? null, guestToken: locals.guestToken },
				// A fresh key per attempt: a genuine retry after a failure is a new payment.
				idempotencyKey: field('idempotencyKey') || null,
				card: {
					cardName: field('cardName'),
					cardNumber: field('cardNumber'),
					expiry: field('expiry'),
					cvc: field('cvc')
				},
				simulateOutcome: ['Succeed', 'Fail', 'Cancel'].includes(outcome)
					? (outcome as SimulateOutcome)
					: null
			});
		} catch (err) {
			if (err instanceof OrderError) return fail(err.status, { error: err.message, retry: true });
			throw err;
		}
	}
};
