// Starting catalog: categories, products and the vehicle tree, carried over
// from the C# SeedData.cs. Only runs on an empty database.

import { count, eq } from 'drizzle-orm';
import { hashPassword } from '../password.ts';
import type { DB } from './client.ts';
import {
	categories,
	productFitments,
	products,
	users,
	vehicleMakes,
	vehicleModels,
	vehicleTrims,
	vehicleYears
} from './schema.ts';

const CATEGORIES = [
	{ id: 'headlights', name: 'Faros Delanteros', iconName: 'headlight', defaultBulbType: 'H11' },
	{ id: 'fog-lights', name: 'Fog Lights', iconName: 'foglight', defaultBulbType: 'H8' },
	{ id: 'drl', name: 'DRL / Luces Diurnas', iconName: 'drl', defaultBulbType: 'H16' },
	{ id: 'turn-signals', name: 'Direccionales', iconName: 'signal', defaultBulbType: '7440' },
	{ id: 'tail-lights', name: 'Luces Traseras', iconName: 'taillight', defaultBulbType: '7443' },
	{ id: 'reverse', name: 'Luz de Reversa', iconName: 'reverse', defaultBulbType: '921' },
	{ id: 'side-markers', name: 'Side Markers', iconName: 'marker', defaultBulbType: '168' },
	{ id: 'license-plate', name: 'Luz de Placa', iconName: 'plate', defaultBulbType: '194' },
	{ id: 'interior', name: 'Interior / Cabina', iconName: 'cabin', defaultBulbType: '31mm Festoon' },
	{ id: 'underglow', name: 'Underglow', iconName: 'underglow', defaultBulbType: 'Universal RGB' },
	{ id: 'light-bars', name: 'Barras LED', iconName: 'bar', defaultBulbType: 'Universal' },
	{
		id: 'controllers',
		name: 'Switches y Controladores',
		iconName: 'controller',
		defaultBulbType: 'Universal'
	}
];

// [id, name, category, price, salePrice, lumens, warranty, badge, universal, stock]
type P = [
	string,
	string,
	string,
	number,
	number | null,
	string,
	string,
	string | null,
	boolean,
	number
];
const PRODUCTS: P[] = [
	[
		'p001',
		'Mini Chip LED Headlight Kit',
		'headlights',
		65,
		null,
		'60,000',
		'6 months',
		'Best Seller',
		false,
		42
	],
	['p002', '360° LED Headlight Kit', 'headlights', 45, 35, '40,000', '3 months', 'Sale', false, 18],
	[
		'p003',
		'Super Chip LED Headlight Kit',
		'headlights',
		85,
		null,
		'100,000',
		'1 year',
		null,
		false,
		27
	],
	[
		'p004',
		'Kamaleon Dual-Color LED Kit',
		'headlights',
		100,
		null,
		'70,000',
		'1 year',
		'Dual Color',
		false,
		9
	],
	['p005', 'Fog Light LED Pods', 'fog-lights', 55, 42, '30,000', '6 months', 'Sale', false, 33],
	[
		'p006',
		'H8/H11 Fog Light Bulb Set',
		'fog-lights',
		38,
		null,
		'24,000',
		'6 months',
		null,
		false,
		51
	],
	['p007', 'DRL Switchback Strip Kit', 'drl', 48, null, '18,000', '6 months', null, false, 24],
	['p008', 'H16 DRL LED Bulbs', 'drl', 32, null, '16,000', '3 months', null, false, 60],
	[
		'p009',
		'Amber Turn Signal LED Set',
		'turn-signals',
		22,
		null,
		'6,000',
		'3 months',
		null,
		false,
		45
	],
	[
		'p010',
		'Switchback Turn Signal Kit',
		'turn-signals',
		34,
		27,
		'8,000',
		'6 months',
		'Sale',
		false,
		15
	],
	[
		'p011',
		'7443 Tail Light LED Bulbs',
		'tail-lights',
		28,
		null,
		'9,000',
		'6 months',
		null,
		false,
		38
	],
	['p012', 'Sequential LED Tail Kit', 'tail-lights', 90, 72, '15,000', '1 year', 'Sale', false, 7],
	['p013', '921 Reverse Light Bulbs', 'reverse', 18, null, '4,000', '3 months', null, false, 70],
	[
		'p014',
		'168 Side Marker LED Set',
		'side-markers',
		16,
		null,
		'2,000',
		'3 months',
		null,
		false,
		55
	],
	[
		'p015',
		'Smoked Side Marker LEDs',
		'side-markers',
		24,
		null,
		'2,400',
		'3 months',
		'New',
		false,
		20
	],
	[
		'p016',
		'194 License Plate LED Bulbs',
		'license-plate',
		12,
		null,
		'1,200',
		'3 months',
		null,
		true,
		80
	],
	['p017', '31mm Festoon Interior Kit', 'interior', 20, null, '3,000', '6 months', null, true, 40],
	[
		'p018',
		'RGB Cabin Light Kit w/ App Control',
		'interior',
		58,
		46,
		'5,000',
		'1 year',
		'Sale',
		true,
		12
	],
	['p019', 'Footwell Ambient LED Kit', 'interior', 44, null, '4,500', '1 year', null, true, 22],
	['p020', 'RGB Underglow Kit — 4pc', 'underglow', 120, 96, '20,000', '1 year', 'Sale', true, 6],
	[
		'p021',
		'Bluetooth Underglow Controller Kit',
		'underglow',
		145,
		null,
		'24,000',
		'1 year',
		'Best Seller',
		true,
		14
	],
	['p022', '20" Curved LED Light Bar', 'light-bars', 110, null, '40,000', '1 year', null, true, 19],
	['p023', '30" Dual-Row Light Bar', 'light-bars', 160, 130, '60,000', '1 year', 'Sale', true, 3],
	['p024', 'RF Wireless LED Controller', 'controllers', 25, null, '—', '6 months', null, true, 65],
	['p025', 'App-Controlled RGB Relay Box', 'controllers', 40, null, '—', '1 year', 'New', true, 28]
];

// year → make → model → trims
const VEHICLES: Record<number, Record<string, Record<string, string[]>>> = {
	2024: {
		Toyota: {
			RAV4: ['LE', 'XLE', 'TRD Off-Road', 'Limited'],
			Camry: ['LE', 'SE', 'XSE'],
			Tacoma: ['SR', 'TRD Sport', 'Limited']
		},
		Honda: { Civic: ['LX', 'Sport', 'Type R'], 'CR-V': ['LX', 'EX-L', 'Sport Touring'] },
		Ford: { Mustang: ['EcoBoost', 'GT', 'Dark Horse'], 'F-150': ['XL', 'Lariat', 'Raptor'] },
		Jeep: { Wrangler: ['Sport', 'Sahara', 'Rubicon'], 'Grand Cherokee': ['Laredo', 'Limited'] },
		Chevrolet: { 'Silverado 1500': ['WT', 'LT', 'Trail Boss'], Camaro: ['LT1', 'SS', 'ZL1'] }
	},
	2020: {
		Toyota: {
			RAV4: ['LE', 'XLE', 'TRD Off-Road', 'Limited'],
			Camry: ['LE', 'SE', 'XSE'],
			Corolla: ['L', 'LE', 'SE']
		},
		Honda: { Civic: ['LX', 'Sport', 'Si'], Accord: ['LX', 'Sport', 'Touring'] },
		Ford: { Mustang: ['EcoBoost', 'GT'], 'F-150': ['XL', 'Lariat', 'Raptor'] },
		Jeep: { Wrangler: ['Sport', 'Sahara', 'Rubicon'] },
		Chevrolet: { 'Silverado 1500': ['WT', 'LT'], Camaro: ['LT1', 'SS'] }
	},
	2016: {
		Toyota: { RAV4: ['LE', 'XLE', 'Limited'], Camry: ['LE', 'SE'], Tacoma: ['SR', 'TRD Sport'] },
		Honda: { Civic: ['LX', 'EX'], 'CR-V': ['LX', 'EX-L'] },
		Ford: { Mustang: ['V6', 'EcoBoost', 'GT'], 'F-150': ['XL', 'Lariat'] },
		Jeep: { Wrangler: ['Sport', 'Sahara', 'Rubicon'] },
		Chevrolet: { 'Silverado 1500': ['WT', 'LT'], Camaro: ['LT', 'SS'] }
	},
	2012: {
		Toyota: { Camry: ['LE', 'SE'], Corolla: ['L', 'LE'] },
		Honda: { Civic: ['LX', 'EX'], Accord: ['LX', 'EX'] },
		Ford: { Mustang: ['V6', 'GT'], 'F-150': ['XL', 'Lariat'] },
		Jeep: { Wrangler: ['Sport', 'Sahara'] },
		Chevrolet: { Camaro: ['LT', 'SS'] }
	}
};

/** Adds the starting catalog if the database has no categories yet. Returns whether it did. */
export async function seedCatalog(db: DB): Promise<boolean> {
	const [{ n }] = await db.select({ n: count() }).from(categories);
	if (n > 0) return false;

	await db.insert(categories).values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })));
	await db.insert(products).values(
		PRODUCTS.map(
			([
				id,
				name,
				categoryId,
				price,
				sale,
				lumens,
				warranty,
				badge,
				isUniversal,
				stockQuantity
			]) => ({
				id,
				name,
				categoryId,
				priceCents: price * 100,
				salePriceCents: sale === null ? null : sale * 100,
				lumens,
				warranty,
				badge,
				isUniversal,
				stockQuantity
			})
		)
	);
	// Universal products fit every vehicle (one all-wildcard fitment row).
	// Non-universal products have no fitment data yet — a content gap to fill.
	await db
		.insert(productFitments)
		.values(PRODUCTS.filter((p) => p[8]).map(([productId]) => ({ productId })));

	const makeIds = new Map<string, number>();
	for (const [year, makes] of Object.entries(VEHICLES)) {
		const [y] = await db
			.insert(vehicleYears)
			.values({ year: Number(year) })
			.returning();
		for (const [makeName, models] of Object.entries(makes)) {
			let makeId = makeIds.get(makeName);
			if (makeId === undefined) {
				const [m] = await db.insert(vehicleMakes).values({ name: makeName }).returning();
				makeId = m.id;
				makeIds.set(makeName, makeId);
			}
			for (const [modelName, trims] of Object.entries(models)) {
				const [model] = await db
					.insert(vehicleModels)
					.values({ yearId: y.id, makeId, name: modelName })
					.returning();
				await db.insert(vehicleTrims).values(trims.map((name) => ({ modelId: model.id, name })));
			}
		}
	}
	return true;
}

/** Makes sure an admin account exists with this email. Returns what happened. */
export async function ensureAdmin(
	db: DB,
	email: string,
	password: string
): Promise<'created' | 'promoted' | 'exists'> {
	const normalized = email.trim().toLowerCase();
	const [existing] = await db.select().from(users).where(eq(users.email, normalized));
	if (existing) {
		if (existing.isAdmin) return 'exists';
		await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
		return 'promoted';
	}
	await db.insert(users).values({
		email: normalized,
		fullName: 'Admin',
		passwordHash: await hashPassword(password),
		isAdmin: true
	});
	return 'created';
}
