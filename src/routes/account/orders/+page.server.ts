import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { listOrdersForUser } from '#lib/server/orders.ts';
import { paymentProvider } from '#lib/server/payments.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Guests are sent home with the login modal open.
	if (!locals.user) redirect(303, '/?login');
	return { orders: await listOrdersForUser(db, paymentProvider, locals.user.id) };
};
