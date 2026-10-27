// Admin › Inventario: per-product stock editor.

import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { toAdminProduct } from '#lib/server/admin.ts';
import { db } from '#lib/server/db/index.ts';
import { categories, products } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [rows, cats] = await Promise.all([
		db.select().from(products).orderBy(asc(products.id)),
		db.select().from(categories).orderBy(asc(categories.sortOrder))
	]);
	return { products: rows.map(toAdminProduct), adminCategories: cats };
};

export const actions: Actions = {
	setStock: async ({ request }) => {
		const form = await request.formData();
		const stock = Number(form.get('stockQuantity'));
		if (!Number.isInteger(stock) || stock < 0)
			return fail(400, { error: 'El inventario no puede ser negativo.' });
		const updated = await db
			.update(products)
			.set({ stockQuantity: stock })
			.where(eq(products.id, String(form.get('id') ?? '')))
			.returning();
		if (updated.length === 0) return fail(404, { error: 'Producto no encontrado.' });
	}
};
