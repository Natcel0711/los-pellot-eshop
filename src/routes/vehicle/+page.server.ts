import { listProducts } from '#lib/server/catalog.ts';
import { db } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';

// The side panel lists products by category, so send the (small) catalog once.
export const load: PageServerLoad = async () => ({ products: await listProducts(db) });
