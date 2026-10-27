// Login, sign-up, profile and logout — posted to by the account modal.
// There's no account *page* — visiting /account goes home.

import { fail, redirect } from '@sveltejs/kit';
import {
	AuthError,
	createSession,
	login,
	logout,
	register,
	updateProfile
} from '#lib/server/auth.ts';
import { GUEST_CART_COOKIE, mergeGuestCart } from '#lib/server/cart.ts';
import { db } from '#lib/server/db/index.ts';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = () => redirect(303, '/');

/** After login/sign-up: start the session and move the guest cart into the account. */
async function signIn(event: RequestEvent, userId: string) {
	await createSession(db, event.cookies, userId);
	await mergeGuestCart(db, userId, event.locals.guestToken);
	event.cookies.delete(GUEST_CART_COOKIE, { path: '/' });
}

const text = (form: FormData, name: string) => String(form.get(name) ?? '');

export const actions: Actions = {
	login: async (event) => {
		const form = await event.request.formData();
		try {
			const user = await login(db, text(form, 'email'), text(form, 'password'));
			await signIn(event, user.id);
		} catch (err) {
			if (err instanceof AuthError) return fail(400, { error: err.message });
			throw err;
		}
	},

	register: async (event) => {
		const form = await event.request.formData();
		try {
			const user = await register(db, {
				fullName: text(form, 'fullName'),
				email: text(form, 'email'),
				password: text(form, 'password')
			});
			await signIn(event, user.id);
		} catch (err) {
			if (err instanceof AuthError) return fail(400, { error: err.message });
			throw err;
		}
	},

	profile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Inicia sesión de nuevo.' });
		const form = await request.formData();
		try {
			await updateProfile(db, locals.user.id, text(form, 'fullName'));
		} catch (err) {
			if (err instanceof AuthError) return fail(400, { error: err.message });
			throw err;
		}
	},

	logout: async ({ cookies }) => {
		await logout(db, cookies);
	}
};
