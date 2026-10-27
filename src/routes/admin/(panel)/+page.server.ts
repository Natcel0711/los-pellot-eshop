import { count, eq, isNull, lt } from 'drizzle-orm';
import { LOW_STOCK_THRESHOLD } from '#lib/server/admin.ts';
import { db } from '#lib/server/db/index.ts';
import {
	bookings,
	categories,
	contactMessages,
	orders,
	products,
	users
} from '#lib/server/db/schema.ts';
import type { AdminDashboard } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const countOf = async (query: Promise<{ n: number }[]>) => (await query)[0].n;
	const n = { n: count() };

	const dashboard: AdminDashboard = {
		productCount: await countOf(db.select(n).from(products)),
		lowStockCount: await countOf(
			db.select(n).from(products).where(lt(products.stockQuantity, LOW_STOCK_THRESHOLD))
		),
		categoryCount: await countOf(db.select(n).from(categories)),
		userCount: await countOf(db.select(n).from(users)),
		orderCount: await countOf(db.select(n).from(orders)),
		pendingBookingCount: await countOf(
			db.select(n).from(bookings).where(eq(bookings.status, 'Pending'))
		),
		unhandledContactCount: await countOf(
			db.select(n).from(contactMessages).where(isNull(contactMessages.handledAt))
		)
	};
	return { dashboard };
};
