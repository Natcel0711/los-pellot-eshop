// Printable packing slip + real carrier label purchase via Shippo.
// Outside the (panel) group, so printing doesn't include the admin sidebar.

import { error, fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import * as env from '$app/env/private';
import { toAdminOrderDetail, toShippingLabel } from '#lib/server/admin.ts';
import { db } from '#lib/server/db/index.ts';
import { orderItems, orders, shippingLabels, users } from '#lib/server/db/schema.ts';
import { toCents } from '#lib/server/money.ts';
import { getRates, purchaseLabel, ShippingError, type Address } from '#lib/server/shipping.ts';
import type { PackageInfo, ShippingRate } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

async function findOrder(orderNumber: string) {
	const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
	return order;
}

export const load: PageServerLoad = async ({ params }) => {
	const order = await findOrder(params.orderNumber);
	if (!order) error(404, 'No se encontró esa orden.');
	const [items, labels, people] = await Promise.all([
		db
			.select()
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id))
			.orderBy(asc(orderItems.id)),
		db
			.select()
			.from(shippingLabels)
			.where(eq(shippingLabels.orderId, order.id))
			.orderBy(desc(shippingLabels.createdAt)),
		db.select({ id: users.id, fullName: users.fullName }).from(users)
	]);
	return {
		order: toAdminOrderDetail(order, items, labels, new Map(people.map((u) => [u.id, u.fullName])))
	};
};

/** The store's return address, from the SHIP_FROM_* environment variables. */
function shipFrom(): Address {
	return {
		name: env.SHIP_FROM_NAME ?? 'Los Pellot LED and Accessories Distributors',
		street1: env.SHIP_FROM_STREET1 ?? '',
		street2: env.SHIP_FROM_STREET2 ?? null,
		city: env.SHIP_FROM_CITY ?? '',
		state: env.SHIP_FROM_STATE ?? '',
		zip: env.SHIP_FROM_ZIP ?? '',
		country: env.SHIP_FROM_COUNTRY ?? 'US',
		phone: env.SHIP_FROM_PHONE ?? null,
		email: env.SHIP_FROM_EMAIL ?? null
	};
}

function readPackage(form: FormData): PackageInfo | null {
	const pkg = {
		weightLb: Number(form.get('weightLb')),
		lengthIn: Number(form.get('lengthIn')),
		widthIn: Number(form.get('widthIn')),
		heightIn: Number(form.get('heightIn'))
	};
	return Object.values(pkg).every((n) => Number.isFinite(n) && n > 0) ? pkg : null;
}

export const actions: Actions = {
	// Quotes real rates — nothing is bought yet.
	rates: async ({ request, params }) => {
		const order = await findOrder(params.orderNumber);
		if (!order) return fail(404, { error: 'No se encontró esa orden.' });
		const form = await request.formData();
		const pkg = readPackage(form);
		if (!pkg) return fail(400, { error: 'Ingresa un peso y dimensiones válidas.' });

		const to: Address = {
			name: order.shippingName,
			street1: order.shippingAddress,
			street2: order.shippingApt,
			city: order.shippingCity,
			state: order.shippingState,
			zip: order.shippingZip,
			country: order.shippingCountry,
			phone: order.shippingPhone,
			email: order.shippingEmail
		};
		try {
			return { rates: await getRates(env.SHIPPO_API_TOKEN, shipFrom(), to, pkg), pkg };
		} catch (err) {
			if (err instanceof ShippingError) return fail(400, { error: err.message });
			throw err;
		}
	},

	// Buys the chosen rate (real postage) and saves the label on the order.
	purchase: async ({ request, params }) => {
		const order = await findOrder(params.orderNumber);
		if (!order) return fail(404, { error: 'No se encontró esa orden.' });
		const form = await request.formData();
		const pkg = readPackage(form);
		let rate: ShippingRate;
		try {
			rate = JSON.parse(String(form.get('rate')));
		} catch {
			return fail(400, { error: 'Selecciona una tarifa.' });
		}
		if (!pkg || !rate?.rateId) return fail(400, { error: 'Selecciona una tarifa.' });

		try {
			const bought = await purchaseLabel(env.SHIPPO_API_TOKEN, rate);
			const [saved] = await db
				.insert(shippingLabels)
				.values({
					orderId: order.id,
					provider: 'shippo',
					providerTransactionId: bought.providerTransactionId,
					labelUrl: bought.labelUrl,
					trackingNumber: bought.trackingNumber,
					trackingUrlProvider: bought.trackingUrlProvider,
					carrier: bought.carrier,
					serviceLevel: bought.serviceLevel,
					amountCents: toCents(bought.amount),
					currency: bought.currency,
					...pkg
				})
				.returning();
			return { label: toShippingLabel(saved) };
		} catch (err) {
			if (err instanceof ShippingError) return fail(400, { error: err.message });
			throw err;
		}
	}
};
