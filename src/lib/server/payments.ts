// The payment-provider seam. `mockPaymentProvider` is the only provider
// today: it never charges anything. Connecting a real gateway (Stripe, etc.)
// means writing another object with the same shape and using it in
// `routes/checkout/+page.server.ts` — see PAYMENT_INTEGRATION.md.
//
// DEVELOPMENT/TESTING ONLY: never use the mock in a deployment that takes
// real money. No card data is ever logged or stored anywhere in this app.

import type { PaymentStatus } from './db/schema.ts';
import type { PaymentInfo, SimulateOutcome } from '../types.ts';

export interface PaymentResult {
	providerPaymentIntentId: string;
	status: PaymentStatus;
	failureReason: string | null;
}

export interface PaymentProvider {
	/** False for the mock. Drives whether checkout shows its test-mode controls. */
	readonly isLive: boolean;
	readonly name: string;
	createIntent(orderNumber: string, amountCents: number, currency: string): Promise<PaymentResult>;
	confirm(
		intentId: string,
		card: PaymentInfo | null,
		simulateOutcome: SimulateOutcome | null,
		idempotencyKey: string | null
	): Promise<PaymentResult>;
	cancel(intentId: string): Promise<PaymentResult>;
	refund(intentId: string, amountCents: number | null): Promise<PaymentResult>;
}

// Stripe's published test-card numbers, so the mock behaves realistically.
const DECLINE_TEST_CARD = '4000000000000002';
const INSUFFICIENT_FUNDS_TEST_CARD = '4000000000009995';

const result = (
	id: string,
	status: PaymentStatus,
	failureReason: string | null = null
): PaymentResult => ({
	providerPaymentIntentId: id,
	status,
	failureReason
});

export const mockPaymentProvider: PaymentProvider = {
	isLive: false,
	name: 'mock',

	async createIntent() {
		return result('mock_pi_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16), 'Pending');
	},

	async confirm(intentId, card, simulateOutcome) {
		// An explicit choice from checkout's test-mode controls wins.
		if (simulateOutcome === 'Fail')
			return result(intentId, 'Failed', 'Simulación: pago rechazado (modo de prueba).');
		if (simulateOutcome === 'Cancel') return result(intentId, 'Cancelled');
		if (simulateOutcome === 'Succeed') return result(intentId, 'Paid');

		const digits = (card?.cardNumber ?? '').replace(/\D/g, '');
		if (digits === DECLINE_TEST_CARD)
			return result(
				intentId,
				'Failed',
				'Simulación: tarjeta declinada (número de prueba de Stripe).'
			);
		if (digits === INSUFFICIENT_FUNDS_TEST_CARD)
			return result(
				intentId,
				'Failed',
				'Simulación: fondos insuficientes (número de prueba de Stripe).'
			);
		return result(intentId, 'Paid');
	},

	async cancel(intentId) {
		return result(intentId, 'Cancelled');
	},

	async refund(intentId) {
		return result(intentId, 'Refunded');
	}
};

// The provider the shop uses. Swapping in a real gateway is this one line.
export const paymentProvider: PaymentProvider = mockPaymentProvider;
