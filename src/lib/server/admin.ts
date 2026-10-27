// Converts database rows into the shapes the admin pages use.

import { toDollars } from './money.ts';
import type { orderItems, orders, products, shippingLabels } from './db/schema.ts';
import type { AdminOrder, AdminOrderDetail, AdminProduct, ShippingLabel } from '../types.ts';

export const LOW_STOCK_THRESHOLD = 10;

export function toAdminProduct(p: typeof products.$inferSelect): AdminProduct {
	return {
		id: p.id,
		name: p.name,
		categoryId: p.categoryId,
		price: toDollars(p.priceCents),
		salePrice: p.salePriceCents === null ? null : toDollars(p.salePriceCents),
		lumens: p.lumens,
		warranty: p.warranty,
		badge: p.badge,
		isUniversal: p.isUniversal,
		stockQuantity: p.stockQuantity,
		imageUrl: p.imageUrl
	};
}

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;

/** Registered customers show their account name; guests show the shipping name. */
function customer(o: OrderRow, userNames: Map<string, string>) {
	const isGuest = o.userId === null;
	return {
		isGuest,
		customerName: isGuest ? o.shippingName : (userNames.get(o.userId!) ?? o.shippingName),
		customerEmail: isGuest ? (o.guestEmail ?? o.shippingEmail) : o.shippingEmail
	};
}

function totals(o: OrderRow) {
	return {
		subtotal: toDollars(o.subtotalCents),
		shippingCost: toDollars(o.shippingCents),
		discount: toDollars(o.discountCents),
		tax: toDollars(o.taxCents),
		total: toDollars(o.subtotalCents - o.discountCents + o.shippingCents + o.taxCents)
	};
}

export function toAdminOrder(
	o: OrderRow,
	items: ItemRow[],
	userNames: Map<string, string>
): AdminOrder {
	return {
		orderNumber: o.orderNumber,
		status: o.status,
		paymentStatus: o.paymentStatus,
		...customer(o, userNames),
		...totals(o),
		itemCount: items.reduce((n, i) => n + i.qty, 0),
		createdAt: o.createdAt.toISOString()
	};
}

export function toShippingLabel(l: typeof shippingLabels.$inferSelect): ShippingLabel {
	return {
		provider: l.provider,
		labelUrl: l.labelUrl,
		trackingNumber: l.trackingNumber,
		trackingUrlProvider: l.trackingUrlProvider,
		carrier: l.carrier,
		serviceLevel: l.serviceLevel,
		amount: toDollars(l.amountCents),
		currency: l.currency,
		createdAt: l.createdAt.toISOString()
	};
}

export function toAdminOrderDetail(
	o: OrderRow,
	items: ItemRow[],
	labels: (typeof shippingLabels.$inferSelect)[],
	userNames: Map<string, string>
): AdminOrderDetail {
	return {
		orderNumber: o.orderNumber,
		status: o.status,
		paymentStatus: o.paymentStatus,
		...customer(o, userNames),
		...totals(o),
		createdAt: o.createdAt.toISOString(),
		shipping: {
			name: o.shippingName,
			email: o.shippingEmail,
			phone: o.shippingPhone,
			address: o.shippingAddress,
			apt: o.shippingApt,
			city: o.shippingCity,
			state: o.shippingState,
			zip: o.shippingZip,
			country: o.shippingCountry
		},
		items: items.map((i) => ({
			productId: i.productId,
			productName: i.productName,
			unitPrice: toDollars(i.unitPriceCents),
			qty: i.qty,
			vehicleLabel: i.vehicleLabel
		})),
		shippingLabels: labels.map(toShippingLabel)
	};
}
