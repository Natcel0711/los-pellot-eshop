// Admin › Citas (installation bookings). Replaces AdminBookingsController.

import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { BOOKING_STATUSES, bookings, type BookingStatus } from '#lib/server/db/schema.ts';
import type { AdminBooking } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
	return {
		bookings: rows.map(({ userId: _userId, ...b }) => ({
			...b,
			createdAt: b.createdAt.toISOString()
		})) satisfies AdminBooking[]
	};
};

export const actions: Actions = {
	setStatus: async ({ request }) => {
		const form = await request.formData();
		const status = String(form.get('status')) as BookingStatus;
		if (!BOOKING_STATUSES.includes(status)) return fail(400, { error: 'Estado inválido.' });
		await db
			.update(bookings)
			.set({ status })
			.where(eq(bookings.id, Number(form.get('id'))));
	},

	delete: async ({ request }) => {
		await db.delete(bookings).where(eq(bookings.id, Number((await request.formData()).get('id'))));
	}
};
