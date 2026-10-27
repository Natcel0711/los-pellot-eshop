import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	// The booking form. Replaces POST /api/bookings.
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '').trim();

		const [name, phone, email, serviceType, preferredDate] = [
			field('name'),
			field('phone'),
			field('email'),
			field('service'),
			field('date')
		];
		if (!name || !phone || !email || !serviceType || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
			return fail(400, { error: 'Completa todos los campos requeridos.' });
		}

		await db.insert(bookings).values({
			name,
			phone,
			email: email.toLowerCase(),
			vehicleDescription: field('vehicle'),
			serviceType,
			preferredDate,
			notes: field('notes') || null,
			userId: locals.user?.id ?? null
		});
		return { success: true };
	}
};
