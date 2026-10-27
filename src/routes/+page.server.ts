import { listProducts } from '#lib/server/catalog.ts';
import { db } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const products = await listProducts(db, { sort: 'relevance' });
	return {
		bestSellers: products.filter((p) => p.badge === 'Best Seller' || p.badge === 'Sale').slice(0, 4)
	};
};
