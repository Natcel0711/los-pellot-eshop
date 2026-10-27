// Cart actions, posted to from anywhere on the site (product cards, the cart
// drawer). There's no cart *page* — visiting /cart goes home.

import { fail, redirect } from '@sveltejs/kit';
import {
	addToCart,
	CartError,
	GUEST_CART_COOKIE,
	setCartQty,
	type CartOwner
} from '#lib/server/cart.ts';
import { db } from '#lib/server/db/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	add: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const owner: CartOwner = { userId: locals.user?.id ?? null, guestToken: locals.guestToken };

		// First item for a guest: give them a cart token cookie.
		if (!owner.userId && !owner.guestToken) {
			owner.guestToken = crypto.randomUUID();
			cookies.set(GUEST_CART_COOKIE, owner.guestToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 60
			});
		}

		try {
			await addToCart(
				db,
				owner,
				String(form.get('productId') ?? ''),
				Number(form.get('qty') ?? 1),
				String(form.get('vehicleLabel') ?? '') || null
			);
		} catch (err) {
			if (err instanceof CartError) return fail(err.status, { error: err.message });
			throw err;
		}
	},

	setQty: async ({ request, locals }) => {
		const form = await request.formData();
		await setCartQty(
			db,
			{ userId: locals.user?.id ?? null, guestToken: locals.guestToken },
			String(form.get('key') ?? ''),
			Number(form.get('qty') ?? 0)
		);
	}
};
