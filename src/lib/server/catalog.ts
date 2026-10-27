// Read-only catalog queries: categories, products (with filters) and the
// year → make → model → trim vehicle tree.
// Replaces CategoriesController, ProductsController and VehiclesController.

import {
	and,
	asc,
	desc,
	eq,
	exists,
	inArray,
	isNotNull,
	isNull,
	like,
	or,
	sql,
	type SQL
} from 'drizzle-orm';
import type { Category, Product, ProductFilters, VehicleYearTree } from '../types.ts';
import type { DB } from './db/client.ts';
import {
	categories,
	productFitments,
	products,
	vehicleMakes,
	vehicleModels,
	vehicleTrims,
	vehicleYears
} from './db/schema.ts';
import { toDollars } from './money.ts';

type ProductRow = typeof products.$inferSelect;

export function toProduct(p: ProductRow, fitsSelectedVehicle: boolean | null = null): Product {
	return {
		id: p.id,
		name: p.name,
		category: p.categoryId,
		price: toDollars(p.priceCents),
		salePrice: p.salePriceCents === null ? null : toDollars(p.salePriceCents),
		lumens: p.lumens,
		warranty: p.warranty,
		badge: p.badge,
		universal: p.isUniversal,
		fitsSelectedVehicle,
		imageUrl: p.imageUrl
	};
}

export async function listCategories(db: DB): Promise<Category[]> {
	const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
	return rows.map((c) => ({
		id: c.id,
		name: c.name,
		icon: c.iconName,
		defaultBulbType: c.defaultBulbType
	}));
}

const effectivePrice = sql`coalesce(${products.salePriceCents}, ${products.priceCents})`;

export async function listProducts(db: DB, filters: ProductFilters = {}): Promise<Product[]> {
	const conditions: SQL[] = [];

	if (filters.categories?.length) conditions.push(inArray(products.categoryId, filters.categories));
	if (filters.saleOnly) conditions.push(isNotNull(products.salePriceCents));

	const q = filters.q?.trim();
	if (q) {
		conditions.push(or(like(products.name, `%${q}%`), like(categories.name, `%${q}%`))!);
	}

	// A fitment row matches when each of its columns is either a wildcard
	// (NULL) or equal to the chosen value. A field left unchosen only matches
	// wildcard rows — same rules as the original backend.
	const year = filters.year ? Number(filters.year) : null;
	const make = filters.make || null;
	const model = filters.model || null;
	const hasVehicleFilter = year !== null || make !== null || model !== null;
	if (hasVehicleFilter) {
		const f = productFitments;
		conditions.push(
			exists(
				db
					.select({ one: sql`1` })
					.from(f)
					.where(
						and(
							eq(f.productId, products.id),
							year === null ? isNull(f.year) : or(isNull(f.year), eq(f.year, year)),
							make === null ? isNull(f.make) : or(isNull(f.make), eq(f.make, make)),
							model === null ? isNull(f.model) : or(isNull(f.model), eq(f.model, model))
						)
					)
			)
		);
	}

	const order = {
		'price-asc': [asc(effectivePrice)],
		'price-desc': [desc(effectivePrice)],
		'name-asc': [asc(products.name)],
		relevance: [asc(products.id)]
	}[filters.sort ?? 'relevance'] ?? [asc(products.id)];

	const rows = await db
		.select({ product: products })
		.from(products)
		.innerJoin(categories, eq(categories.id, products.categoryId))
		.where(and(...conditions))
		.orderBy(...order);

	return rows.map((r) => toProduct(r.product, hasVehicleFilter ? true : null));
}

export async function getVehicleTree(db: DB): Promise<VehicleYearTree[]> {
	const [years, models, trims] = await Promise.all([
		db.select().from(vehicleYears).orderBy(desc(vehicleYears.year)),
		db
			.select({
				id: vehicleModels.id,
				yearId: vehicleModels.yearId,
				name: vehicleModels.name,
				make: vehicleMakes.name
			})
			.from(vehicleModels)
			.innerJoin(vehicleMakes, eq(vehicleMakes.id, vehicleModels.makeId))
			.orderBy(asc(vehicleModels.id)),
		db.select().from(vehicleTrims).orderBy(asc(vehicleTrims.id))
	]);

	return years.map((y) => {
		const byMake = new Map<string, { model: string; trims: string[] }[]>();
		for (const m of models.filter((m) => m.yearId === y.id)) {
			const list = byMake.get(m.make) ?? [];
			list.push({
				model: m.name,
				trims: trims.filter((t) => t.modelId === m.id).map((t) => t.name)
			});
			byMake.set(m.make, list);
		}
		return {
			year: y.year,
			makes: [...byMake.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([make, models]) => ({ make, models }))
		};
	});
}
