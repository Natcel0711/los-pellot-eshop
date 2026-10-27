// Data every page needs: who's logged in, their cart, the categories and the
// vehicle tree (for the menus and vehicle pickers), and the UI language.

import { getCart } from '#lib/server/cart.ts';
import { getVehicleTree, listCategories } from '#lib/server/catalog.ts';
import { db } from '#lib/server/db/index.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// Lets components refresh just the cart with `invalidate('app:cart')`.
	depends('app:cart');

	const [categories, vehicleTree, cart] = await Promise.all([
		listCategories(db),
		getVehicleTree(db),
		getCart(db, { userId: locals.user?.id ?? null, guestToken: locals.guestToken })
	]);

	return { user: locals.user, lang: locals.lang, categories, vehicleTree, cart };
};
