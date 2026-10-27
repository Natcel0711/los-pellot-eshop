// Admin › Órdenes. Replaces AdminOrdersController (list + status).

import { fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { toAdminOrder } from '#lib/server/admin.ts';
import { db } from '#lib/server/db/index.ts';
import {
	orderItems,
	orders,
	ORDER_STATUSES,
	users,
	type OrderStatus
} from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [rows, items, people] = await Promise.all([
		db.select().from(orders).orderBy(desc(orders.createdAt)),
		db.select().from(orderItems).orderBy(asc(orderItems.id)),
		db.select({ id: users.id, fullName: users.fullName }).from(users)
	]);
	const names = new Map(people.map((u) => [u.id, u.fullName]));
	return {
		orders: rows.map((o) =>
			toAdminOrder(
				o,
				items.filter((i) => i.orderId === o.id),
				names
			)
		)
	};
};

export const actions: Actions = {
	setStatus: async ({ request }) => {
		const form = await request.formData();
		const status = String(form.get('status')) as OrderStatus;
		if (!ORDER_STATUSES.includes(status)) return fail(400, { error: 'Estado inválido.' });
		// "PendingPayment" is set by checkout only.
		if (status === 'PendingPayment')
			return fail(400, { error: 'No se puede establecer manualmente este estado.' });
		await db
			.update(orders)
			.set({ status })
			.where(eq(orders.orderNumber, String(form.get('orderNumber'))));
	}
};
