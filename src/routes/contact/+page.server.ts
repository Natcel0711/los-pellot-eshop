import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { contactMessages } from '#lib/server/db/schema.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	// The contact form. Replaces POST /api/contact.
	default: async ({ request }) => {
		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '').trim();

		const [name, email, subject, message] = [
			field('name'),
			field('email'),
			field('subject'),
			field('message')
		];
		if (!name || !email || !subject || !message) {
			return fail(400, { error: 'Completa todos los campos requeridos.' });
		}

		await db.insert(contactMessages).values({
			name,
			email: email.toLowerCase(),
			phone: field('phone') || null,
			subject,
			message
		});
		return { success: true };
	}
};
