// Admin › Productos. Replaces AdminProductsController.

import { fail } from '@sveltejs/kit';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { toAdminProduct } from '#lib/server/admin.ts';
import { db } from '#lib/server/db/index.ts';
import { categories, productFitments, products } from '#lib/server/db/schema.ts';
import { deleteProductImage, ImageError, saveProductImage } from '#lib/server/images.ts';
import { toCents } from '#lib/server/money.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [rows, cats] = await Promise.all([
		db.select().from(products).orderBy(asc(products.id)),
		db.select().from(categories).orderBy(asc(categories.sortOrder))
	]);
	return { products: rows.map(toAdminProduct), adminCategories: cats };
};

/** Universal products get one all-wildcard fitment row, so they match every vehicle. */
async function syncUniversalFitment(productId: string, isUniversal: boolean) {
	const wildcard = and(
		eq(productFitments.productId, productId),
		isNull(productFitments.year),
		isNull(productFitments.make),
		isNull(productFitments.model)
	);
	const [existing] = await db.select().from(productFitments).where(wildcard);
	if (isUniversal && !existing) await db.insert(productFitments).values({ productId });
	if (!isUniversal && existing)
		await db.delete(productFitments).where(eq(productFitments.id, existing.id));
}

async function findProduct(id: string) {
	const [row] = await db.select().from(products).where(eq(products.id, id));
	return row;
}

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const field = (name: string) => String(form.get(name) ?? '').trim();
		const isNew = field('mode') === 'create';
		const id = field('id');
		const salePrice = field('salePrice');

		const values = {
			name: field('name'),
			categoryId: field('categoryId'),
			priceCents: toCents(Number(field('price')) || 0),
			salePriceCents: salePrice ? toCents(Number(salePrice)) : null,
			lumens: field('lumens'),
			warranty: field('warranty'),
			badge: field('badge') || null,
			isUniversal: form.get('isUniversal') === 'on',
			stockQuantity: Math.max(0, Math.trunc(Number(field('stockQuantity')) || 0))
		};

		if (!id || !values.name) return fail(400, { error: 'Id y nombre son requeridos.' });
		const [category] = await db
			.select()
			.from(categories)
			.where(eq(categories.id, values.categoryId));
		if (!category) return fail(400, { error: 'Categoría inválida.' });

		if (isNew) {
			if (await findProduct(id)) return fail(400, { error: 'Ya existe un producto con ese Id.' });
			await db.insert(products).values({ id, ...values });
		} else {
			if (!(await findProduct(id))) return fail(404, { error: 'Producto no encontrado.' });
			await db.update(products).set(values).where(eq(products.id, id));
		}
		await syncUniversalFitment(id, values.isUniversal);
		return { savedId: id, created: isNew };
	},

	uploadImage: async ({ request }) => {
		const form = await request.formData();
		const product = await findProduct(String(form.get('id') ?? ''));
		if (!product) return fail(404, { error: 'Producto no encontrado.' });
		const file = form.get('file');
		if (!(file instanceof File)) return fail(400, { error: 'Selecciona una imagen.' });

		try {
			const url = await saveProductImage(product.id, file);
			await deleteProductImage(product.imageUrl);
			await db.update(products).set({ imageUrl: url }).where(eq(products.id, product.id));
		} catch (err) {
			if (err instanceof ImageError) return fail(400, { error: err.message });
			console.error(err);
			return fail(500, { error: 'No se pudo subir la imagen.' });
		}
	},

	removeImage: async ({ request }) => {
		const form = await request.formData();
		const product = await findProduct(String(form.get('id') ?? ''));
		if (!product) return fail(404, { error: 'Producto no encontrado.' });
		await deleteProductImage(product.imageUrl);
		await db.update(products).set({ imageUrl: null }).where(eq(products.id, product.id));
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const product = await findProduct(String(form.get('id') ?? ''));
		if (!product) return fail(404, { error: 'Producto no encontrado.' });
		await db.delete(products).where(eq(products.id, product.id));
		await deleteProductImage(product.imageUrl);
	}
};
