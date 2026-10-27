// The catalog. Every filter lives in the URL (?category=…&year=…&sort=…), so
// a filtered view can be bookmarked or shared, and changing a filter just
// changes the URL, which re-runs this load.

import { listProducts } from '#lib/server/catalog.ts';
import { db } from '#lib/server/db/index.ts';
import type { ProductSort } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const SORTS: ProductSort[] = ['relevance', 'price-asc', 'price-desc', 'name-asc'];

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;
	const sortParam = params.get('sort') as ProductSort | null;
	const filters = {
		categories: params.getAll('category'),
		year: params.get('year') ?? '',
		make: params.get('make') ?? '',
		model: params.get('model') ?? '',
		q: params.get('q') ?? '',
		saleOnly: params.get('sale') === '1',
		sort: sortParam && SORTS.includes(sortParam) ? sortParam : 'relevance'
	} satisfies Record<string, unknown>;

	return { filters, products: await listProducts(db, filters) };
};
