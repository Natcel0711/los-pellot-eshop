// Admin › Vehículos: the year → make → model → trim tree.
// Replaces AdminVehiclesController.

import { fail } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { vehicleMakes, vehicleModels, vehicleTrims, vehicleYears } from '#lib/server/db/schema.ts';
import type { AdminModel } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [years, makes, models, trims] = await Promise.all([
		db.select().from(vehicleYears).orderBy(desc(vehicleYears.year)),
		db.select().from(vehicleMakes).orderBy(asc(vehicleMakes.name)),
		db
			.select({
				id: vehicleModels.id,
				yearId: vehicleModels.yearId,
				year: vehicleYears.year,
				makeId: vehicleModels.makeId,
				makeName: vehicleMakes.name,
				name: vehicleModels.name
			})
			.from(vehicleModels)
			.innerJoin(vehicleYears, eq(vehicleYears.id, vehicleModels.yearId))
			.innerJoin(vehicleMakes, eq(vehicleMakes.id, vehicleModels.makeId))
			.orderBy(desc(vehicleYears.year), asc(vehicleMakes.name), asc(vehicleModels.name)),
		db.select().from(vehicleTrims).orderBy(asc(vehicleTrims.name))
	]);
	return { years, makes, models: models satisfies AdminModel[], trims };
};

async function read(request: Request) {
	const form = await request.formData();
	return {
		text: (name: string) => String(form.get(name) ?? '').trim(),
		id: (name: string) => Number(form.get(name))
	};
}

export const actions: Actions = {
	addYear: async ({ request }) => {
		const year = (await read(request)).id('year');
		if (!Number.isInteger(year) || year < 1900) return fail(400, { error: 'Año inválido.' });
		const [exists] = await db.select().from(vehicleYears).where(eq(vehicleYears.year, year));
		if (exists) return fail(400, { error: 'Ese año ya existe.' });
		await db.insert(vehicleYears).values({ year });
	},

	deleteYear: async ({ request }) => {
		await db.delete(vehicleYears).where(eq(vehicleYears.id, (await read(request)).id('id'))); // models & trims cascade
	},

	addMake: async ({ request }) => {
		const name = (await read(request)).text('name');
		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		const [exists] = await db.select().from(vehicleMakes).where(eq(vehicleMakes.name, name));
		if (exists) return fail(400, { error: 'Esa marca ya existe.' });
		await db.insert(vehicleMakes).values({ name });
	},

	deleteMake: async ({ request }) => {
		const id = (await read(request)).id('id');
		const [inUse] = await db
			.select()
			.from(vehicleModels)
			.where(eq(vehicleModels.makeId, id))
			.limit(1);
		if (inUse) return fail(409, { error: 'No se puede eliminar una marca con modelos asignados.' });
		await db.delete(vehicleMakes).where(eq(vehicleMakes.id, id));
	},

	addModel: async ({ request }) => {
		const f = await read(request);
		const [yearId, makeId, name] = [f.id('yearId'), f.id('makeId'), f.text('name')];
		const [year] = await db.select().from(vehicleYears).where(eq(vehicleYears.id, yearId));
		const [make] = await db.select().from(vehicleMakes).where(eq(vehicleMakes.id, makeId));
		if (!year || !make) return fail(400, { error: 'Año o marca inválidos.' });
		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		const [exists] = await db
			.select()
			.from(vehicleModels)
			.where(
				and(
					eq(vehicleModels.yearId, yearId),
					eq(vehicleModels.makeId, makeId),
					eq(vehicleModels.name, name)
				)
			);
		if (exists) return fail(400, { error: 'Ese modelo ya existe para ese año/marca.' });
		await db.insert(vehicleModels).values({ yearId, makeId, name });
	},

	deleteModel: async ({ request }) => {
		await db.delete(vehicleModels).where(eq(vehicleModels.id, (await read(request)).id('id'))); // trims cascade
	},

	addTrim: async ({ request }) => {
		const f = await read(request);
		const [modelId, name] = [f.id('modelId'), f.text('name')];
		const [model] = await db.select().from(vehicleModels).where(eq(vehicleModels.id, modelId));
		if (!model) return fail(400, { error: 'Modelo inválido.' });
		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		await db.insert(vehicleTrims).values({ modelId, name });
	},

	deleteTrim: async ({ request }) => {
		await db.delete(vehicleTrims).where(eq(vehicleTrims.id, (await read(request)).id('id')));
	}
};
