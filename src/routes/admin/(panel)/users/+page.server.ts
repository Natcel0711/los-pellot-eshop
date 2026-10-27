// Admin › Usuarios. Replaces AdminUsersController.
// An admin can't remove their own admin rights or delete their own account.

import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { toUser } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	users: (await db.select().from(users).orderBy(desc(users.createdAt))).map(toUser)
});

export const actions: Actions = {
	setAdmin: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id'));
		const isAdmin = form.get('isAdmin') === 'true';
		if (id === locals.user?.id && !isAdmin) {
			return fail(400, { error: 'No puedes quitarte tus propios permisos de administrador.' });
		}
		await db.update(users).set({ isAdmin }).where(eq(users.id, id));
	},

	delete: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id'));
		if (id === locals.user?.id) return fail(400, { error: 'No puedes eliminar tu propia cuenta.' });
		await db.delete(users).where(eq(users.id, id)); // their sessions and cart go too
	}
};
