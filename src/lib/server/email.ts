// Customer emails through Resend (https://resend.com): one plain HTTP call, no
// SDK. Without RESEND_API_KEY the email is printed to the terminal instead, so
// local development needs no setup.
//
// Sending never throws: a failed email must not fail an order that is already
// paid. Problems are logged and the caller carries on.

import { currency, dateTime } from '../format.ts';
import type { Order } from '../types.ts';

export interface EmailConfig {
	apiKey: string | undefined;
	/** e.g. "Los Pellot <pedidos@lospellotled.com>" — the domain must be verified in Resend. */
	from: string | undefined;
}

interface Email {
	to: string;
	subject: string;
	html: string;
	text: string;
}

export async function sendEmail(config: EmailConfig, email: Email): Promise<boolean> {
	if (!config.apiKey) {
		console.info(
			`[email] RESEND_API_KEY not set — would send to ${email.to}:\n${email.subject}\n\n${email.text}`
		);
		return false;
	}
	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: config.from || 'Los Pellot <onboarding@resend.dev>',
				to: [email.to],
				subject: email.subject,
				html: email.html,
				text: email.text
			})
		});
		if (!response.ok) {
			console.error(
				`[email] Resend rejected "${email.subject}" (${response.status}):`,
				await response.text()
			);
			return false;
		}
		return true;
	} catch (err) {
		console.error(`[email] could not send "${email.subject}":`, err);
		return false;
	}
}

// ---- Templates -------------------------------------------------------------

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function orderConfirmationEmail(order: Order): Email {
	const s = order.shipping;
	const lines = order.items.map((i) => ({
		name: i.productName + (i.vehicleLabel ? ` · ${i.vehicleLabel}` : ''),
		qty: i.qty,
		amount: currency(i.unitPrice * i.qty)
	}));
	const shippingCost = order.shippingCost === 0 ? 'Gratis' : currency(order.shippingCost);
	const address = [
		s.name,
		s.address + (s.apt ? `, ${s.apt}` : ''),
		`${s.city}, ${s.state} ${s.zip}`,
		s.country
	];

	const text = [
		`¡Gracias por tu compra, ${s.name}!`,
		'',
		`Recibimos tu pedido #${order.orderNumber} (${dateTime(order.createdAt)}).`,
		'',
		...lines.map((l) => `${l.qty} × ${l.name} — ${l.amount}`),
		'',
		`Subtotal: ${currency(order.subtotal)}`,
		`Envío: ${shippingCost}`,
		`Total: ${currency(order.total)}`,
		'',
		'Enviar a:',
		...address,
		'',
		'Te escribiremos de nuevo cuando tu pedido salga.',
		'Los Pellot LED and Accessories Distributors'
	].join('\n');

	const td = 'padding:8px 0;border-bottom:1px solid #eee;';
	const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
	<h1 style="font-size:22px">¡Gracias por tu compra, ${escape(s.name)}!</h1>
	<p>Recibimos tu pedido <strong>#${escape(order.orderNumber)}</strong> (${escape(dateTime(order.createdAt))}).</p>
	<table style="width:100%;border-collapse:collapse;font-size:14px">
		${lines
			.map(
				(l) =>
					`<tr><td style="${td}">${l.qty} × ${escape(l.name)}</td><td style="${td}text-align:right">${l.amount}</td></tr>`
			)
			.join('')}
		<tr><td style="padding:8px 0">Subtotal</td><td style="padding:8px 0;text-align:right">${currency(order.subtotal)}</td></tr>
		<tr><td style="padding:8px 0">Envío</td><td style="padding:8px 0;text-align:right">${shippingCost}</td></tr>
		<tr><td style="padding:8px 0"><strong>Total</strong></td><td style="padding:8px 0;text-align:right"><strong>${currency(order.total)}</strong></td></tr>
	</table>
	<h2 style="font-size:16px;margin-top:24px">Enviar a</h2>
	<p style="font-size:14px;line-height:1.5">${address.map(escape).join('<br>')}</p>
	<p style="font-size:14px">Te escribiremos de nuevo cuando tu pedido salga.</p>
	<p style="font-size:12px;color:#888">Los Pellot LED and Accessories Distributors</p>
</div>`;

	return {
		to: s.email,
		subject: `Confirmación de pedido #${order.orderNumber} — Los Pellot`,
		html,
		text
	};
}
