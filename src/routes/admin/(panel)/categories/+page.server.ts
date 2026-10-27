// Admin › Categorías. Replaces AdminCategoriesController.

import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { categories, products } from '#lib/server/db/schema.ts';
import type { AdminCategory } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	adminCategories: (await db
		.select()
		.from(categories)
		.orderBy(asc(categories.sortOrder))) satisfies AdminCategory[]
});

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '').trim();
		const isNew = field('mode') === 'create';
		const id = field('id');
		const values = {
			name: field('name'),
			iconName: field('iconName'),
			defaultBulbType: field('defaultBulbType'),
			sortOrder: Math.trunc(Number(field('sortOrder')) || 0)
		};
		if (!id || !values.name) return fail(400, { error: 'Id y nombre son requeridos.' });

		const [existing] = await db.select().from(categories).where(eq(categories.id, id));
		if (isNew) {
			if (existing) return fail(400, { error: 'Ya existe una categoría con ese Id.' });
			await db.insert(categories).values({ id, ...values });
		} else {
			if (!existing) return fail(404, { error: 'Categoría no encontrada.' });
			await db.update(categories).set(values).where(eq(categories.id, id));
		}
		return { created: isNew };
	},

	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [inUse] = await db
			.select({ id: products.id })
			.from(products)
			.where(eq(products.categoryId, id))
			.limit(1);
		if (inUse)
			return fail(409, { error: 'No se puede eliminar una categoría con productos asignados.' });
		await db.delete(categories).where(eq(categories.id, id));
	}
};
