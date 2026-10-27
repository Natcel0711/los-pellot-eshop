// Admin › Mensajes (contact form). Replaces AdminContactController.

import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { contactMessages } from '#lib/server/db/schema.ts';
import type { AdminContactMessage } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
	return {
		messages: rows.map((m) => ({
			...m,
			createdAt: m.createdAt.toISOString(),
			handledAt: m.handledAt?.toISOString() ?? null
		})) satisfies AdminContactMessage[]
	};
};

export const actions: Actions = {
	markHandled: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		await db
			.update(contactMessages)
			.set({ handledAt: new Date() })
			.where(eq(contactMessages.id, id));
	},

	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		await db.delete(contactMessages).where(eq(contactMessages.id, id));
	}
};
