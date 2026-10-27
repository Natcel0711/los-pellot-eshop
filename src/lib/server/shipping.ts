// Real shipping labels through Shippo (https://goshippo.com). Shippo's free
// test mode (a `shippo_test_...` token) returns realistic fake labels and
// tracking numbers with no money involved. Replaces ShippoLabelService.

import type { PackageInfo, ShippingRate } from '../types.ts';

export interface Address {
	name: string;
	street1: string;
	street2: string | null;
	city: string;
	state: string;
	zip: string;
	country: string;
	phone: string | null;
	email: string | null;
}

export interface PurchasedLabel {
	providerTransactionId: string;
	labelUrl: string;
	trackingNumber: string;
	trackingUrlProvider: string | null;
	carrier: string;
	serviceLevel: string;
	amount: number;
	currency: string;
}

/** Anything Shippo rejects (bad address, expired rate…), with a message fit to show. */
export class ShippingError extends Error {}

const API = 'https://api.goshippo.com/';

interface ShippoMessage {
	text: string;
}

// This shop ships within the US and Puerto Rico. Puerto Rico ships as US
// domestic mail (country "US", state "PR"), and checkout's country field is
// free text, so everything maps to "US".
const toIsoCountry = (_country: string) => 'US';

const describe = (messages?: ShippoMessage[]) =>
	messages && messages.length > 0 ? messages.map((m) => m.text).join(' ') : null;

function toShippoAddress(a: Address) {
	return {
		name: a.name,
		street1: a.street1,
		street2: a.street2 ?? '',
		city: a.city,
		state: a.state,
		zip: a.zip,
		country: toIsoCountry(a.country),
		phone: a.phone ?? '',
		email: a.email ?? ''
	};
}

async function call<T>(
	token: string | undefined,
	path: string,
	body: unknown
): Promise<{ ok: boolean; data: T }> {
	if (!token) {
		throw new ShippingError(
			'Shippo no está configurado. Agrega SHIPPO_API_TOKEN en las variables de entorno para cotizar envíos.'
		);
	}
	const response = await fetch(API + path, {
		method: 'POST',
		headers: { Authorization: `ShippoToken ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = (await response.json().catch(() => null)) as T | null;
	if (!data) throw new ShippingError('Respuesta vacía del proveedor de envíos.');
	return { ok: response.ok, data };
}

export async function getRates(
	token: string | undefined,
	from: Address,
	to: Address,
	pkg: PackageInfo
): Promise<ShippingRate[]> {
	const fmt = (n: number) => String(Math.round(n * 100) / 100);
	const { ok, data } = await call<{
		status: string;
		rates?: {
			object_id: string;
			amount: string;
			currency?: string;
			provider: string;
			servicelevel?: { name: string };
			estimated_days?: number | null;
		}[];
		messages?: ShippoMessage[];
	}>(token, 'shipments/', {
		address_from: toShippoAddress(from),
		address_to: toShippoAddress(to),
		parcels: [
			{
				length: fmt(pkg.lengthIn),
				width: fmt(pkg.widthIn),
				height: fmt(pkg.heightIn),
				distance_unit: 'in',
				weight: fmt(pkg.weightLb),
				mass_unit: 'lb'
			}
		],
		async: false
	});

	if (!ok || data.status?.toUpperCase() === 'ERROR') {
		throw new ShippingError(describe(data.messages) ?? 'No pudimos cotizar el envío.');
	}
	const rates = data.rates ?? [];
	if (rates.length === 0) {
		throw new ShippingError(
			describe(data.messages) ?? 'El proveedor no devolvió tarifas para esta dirección.'
		);
	}

	return rates
		.map((r) => ({
			rateId: r.object_id,
			carrier: r.provider,
			serviceLevel: r.servicelevel?.name ?? r.provider,
			amount: Number(r.amount) || 0,
			currency: r.currency ?? 'USD',
			estimatedDays: r.estimated_days != null ? `${r.estimated_days} día(s)` : null
		}))
		.sort((a, b) => a.amount - b.amount);
}

/**
 * Buys the chosen rate (real postage). The carrier/service/amount we keep come
 * from the rate the admin actually saw and picked.
 */
export async function purchaseLabel(
	token: string | undefined,
	rate: ShippingRate
): Promise<PurchasedLabel> {
	const { ok, data } = await call<{
		object_id: string;
		status: string;
		tracking_number?: string;
		tracking_url_provider?: string;
		label_url?: string;
		messages?: ShippoMessage[];
	}>(token, 'transactions/', { rate: rate.rateId, label_file_type: 'PDF', async: false });

	if (!ok || data.status?.toUpperCase() === 'ERROR') {
		throw new ShippingError(describe(data.messages) ?? 'No pudimos comprar la etiqueta de envío.');
	}

	return {
		providerTransactionId: data.object_id,
		labelUrl: data.label_url ?? '',
		trackingNumber: data.tracking_number ?? '',
		trackingUrlProvider: data.tracking_url_provider ?? null,
		carrier: rate.carrier,
		serviceLevel: rate.serviceLevel,
		amount: rate.amount,
		currency: rate.currency
	};
}
