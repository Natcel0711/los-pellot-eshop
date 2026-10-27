// The shopping cart. A cart belongs to a logged-in user, or to a guest
// identified by the random token in the `lp_cart` cookie. When a guest logs
// in, their guest cart is merged into their account's cart.
// Replaces CartController and CartResolver.

import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Cart } from '../types.ts';
import { toProduct } from './catalog.ts';
import type { DB } from './db/client.ts';
import { cartItems, carts, products } from './db/schema.ts';
import { toDollars } from './money.ts';

/** Who the cart belongs to. Logged-in users win over the guest token. */
export interface CartOwner {
	userId: string | null;
	guestToken: string | null;
}

export class CartError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

/** Cookie holding a guest's cart token. */
export const GUEST_CART_COOKIE = 'lp_cart';

export const EMPTY_CART: Cart = { lines: [], subtotal: 0 };

/** Identifies one line in the cart: the same product for two vehicles is two lines. */
export function cartKey(item: { productId: string; vehicleLabel: string | null }): string {
	return item.productId + (item.vehicleLabel ? '::' + item.vehicleLabel : '');
}

export async function findCartId(db: DB, owner: CartOwner): Promise<number | null> {
	const where = owner.userId
		? eq(carts.userId, owner.userId)
		: owner.guestToken
			? eq(carts.guestToken, owner.guestToken)
			: null;
	if (!where) return null;
	const [row] = await db.select({ id: carts.id }).from(carts).where(where);
	return row?.id ?? null;
}

async function findOrCreateCartId(db: DB, owner: CartOwner): Promise<number> {
	const existing = await findCartId(db, owner);
	if (existing !== null) return existing;
	if (!owner.userId && !owner.guestToken) throw new Error('A cart needs a user or a guest token');
	const [created] = await db
		.insert(carts)
		.values(owner.userId ? { userId: owner.userId } : { guestToken: owner.guestToken })
		.returning({ id: carts.id });
	return created.id;
}

/** The cart's lines with current product prices (sale price wins). */
export async function loadCartLines(db: DB, cartId: number) {
	return db
		.select({ item: cartItems, product: products })
		.from(cartItems)
		.innerJoin(products, eq(products.id, cartItems.productId))
		.where(eq(cartItems.cartId, cartId))
		.orderBy(asc(cartItems.id));
}

export async function getCart(db: DB, owner: CartOwner): Promise<Cart> {
	const cartId = await findCartId(db, owner);
	if (cartId === null) return EMPTY_CART;

	const lines = (await loadCartLines(db, cartId)).map(({ item, product }) => {
		const unitCents = product.salePriceCents ?? product.priceCents;
		return {
			key: cartKey(item),
			productId: item.productId,
			qty: item.qty,
			vehicleLabel: item.vehicleLabel,
			product: toProduct(product),
			unitPrice: toDollars(unitCents),
			lineTotal: toDollars(unitCents * item.qty)
		};
	});
	const subtotalCents = lines.reduce((sum, l) => sum + Math.round(l.lineTotal * 100), 0);
	return { lines, subtotal: toDollars(subtotalCents) };
}

export async function addToCart(
	db: DB,
	owner: CartOwner,
	productId: string,
	qty: number,
	vehicleLabel: string | null
): Promise<void> {
	if (!Number.isInteger(qty) || qty <= 0)
		throw new CartError(400, 'La cantidad debe ser mayor a cero.');

	const [product] = await db
		.select({ id: products.id })
		.from(products)
		.where(eq(products.id, productId));
	if (!product) throw new CartError(404, 'Producto no encontrado.');

	const cartId = await findOrCreateCartId(db, owner);
	const [existing] = await db
		.select()
		.from(cartItems)
		.where(
			and(
				eq(cartItems.cartId, cartId),
				eq(cartItems.productId, productId),
				vehicleLabel ? eq(cartItems.vehicleLabel, vehicleLabel) : isNull(cartItems.vehicleLabel)
			)
		);

	if (existing) {
		await db
			.update(cartItems)
			.set({ qty: existing.qty + qty })
			.where(eq(cartItems.id, existing.id));
	} else {
		await db.insert(cartItems).values({ cartId, productId, qty, vehicleLabel });
	}
}

/** Sets a line's quantity; zero or less removes the line. */
export async function setCartQty(
	db: DB,
	owner: CartOwner,
	key: string,
	qty: number
): Promise<void> {
	const cartId = await findCartId(db, owner);
	if (cartId === null) return;
	const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
	const item = items.find((i) => cartKey(i) === key);
	if (!item) return;

	if (qty <= 0) await db.delete(cartItems).where(eq(cartItems.id, item.id));
	else await db.update(cartItems).set({ qty }).where(eq(cartItems.id, item.id));
}

/** Moves a guest cart's lines into the user's cart, then deletes the guest cart. */
export async function mergeGuestCart(
	db: DB,
	userId: string,
	guestToken: string | null
): Promise<void> {
	if (!guestToken) return;
	const guestCartId = await findCartId(db, { userId: null, guestToken });
	if (guestCartId === null) return;

	const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCartId));
	if (guestItems.length > 0) {
		const userCartId = await findOrCreateCartId(db, { userId, guestToken: null });
		const userItems = await db.select().from(cartItems).where(eq(cartItems.cartId, userCartId));
		for (const guestItem of guestItems) {
			const match = userItems.find((u) => cartKey(u) === cartKey(guestItem));
			if (match) {
				await db
					.update(cartItems)
					.set({ qty: match.qty + guestItem.qty })
					.where(eq(cartItems.id, match.id));
			} else {
				await db.insert(cartItems).values({
					cartId: userCartId,
					productId: guestItem.productId,
					qty: guestItem.qty,
					vehicleLabel: guestItem.vehicleLabel
				});
			}
		}
	}
	await db.delete(carts).where(eq(carts.id, guestCartId)); // its items cascade
}
