# Payment integration guide

Checkout, orders and inventory are fully working: the cart lives on the
server, prices come from the database, stock is taken atomically, repeated
requests are safe (idempotency keys), and orders and payments track their
status separately. The **only** missing piece is a real payment gateway.
Today `mockPaymentProvider` stands in for one and never charges anything.
This is the checklist for replacing it (Stripe is the example; any gateway
built on create-intent → confirm → webhooks fits the same shape).

## How checkout works today

Two steps, matching how real gateways behave:

- **Step A — "Continuar al Pago"** (`createOrder` in `src/lib/server/orders.ts`):
  reads the shopper's cart from the database, soft-checks stock, computes
  the total from database prices, creates an order with status
  `PendingPayment`, and calls `provider.createIntent`.
- **Step B — "Pagar Ahora"** (`confirmPayment` in the same file): calls
  `provider.confirm`. Only when the _provider_ says `Paid` does the server
  take the stock (one transaction; each line only succeeds while
  `stock >= qty`) and mark the order `Received` / `Paid`. If stock ran out
  between the steps, the payment is cancelled and the order stays
  `PendingPayment`, so nobody is charged for something that isn't there.

The page code for both steps is `src/routes/checkout/`. **The server never
trusts the browser's word that a payment succeeded** — only the provider's
answer moves an order forward. That's the same rule a webhook integration
relies on.

## Where the real provider goes

Write a `stripePaymentProvider` object in `src/lib/server/payments.ts` with
the same shape as `mockPaymentProvider` (the `PaymentProvider` interface):

```ts
export interface PaymentProvider {
	readonly isLive: boolean; // true for a real gateway
	readonly name: string; // stored on each payment row, e.g. 'stripe'
	createIntent(orderNumber, amountCents, currency): Promise<PaymentResult>;
	confirm(intentId, card, simulateOutcome, idempotencyKey): Promise<PaymentResult>;
	cancel(intentId): Promise<PaymentResult>;
	refund(intentId, amountCents): Promise<PaymentResult>;
}
```

Setting `isLive: true` makes `order.allowSimulatedOutcomes` false, which hides
the checkout's yellow test-mode box automatically.

**The one line to change**, at the bottom of `payments.ts`:

```ts
export const paymentProvider: PaymentProvider = stripePaymentProvider;
```

Nothing in `orders.ts` (cart checks, pricing, stock, idempotency, statuses)
needs to change.

## Secrets

Declare them in `src/env.ts` (like the existing variables), put them in
`.env` locally and in the Vercel project settings for production:

| Variable                 | Notes                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`      | Server only. Import from `$app/env/private`. Never send to pages. |
| `STRIPE_WEBHOOK_SECRET`  | Verifies the `Stripe-Signature` header on webhooks.               |
| `STRIPE_PUBLISHABLE_KEY` | Safe for the browser (`public: true` in `env.ts`).                |

Never log the secret key or card data. The mock already behaves correctly:
it looks at a card number only to pick a test outcome, then forgets it.

## Page changes

- **Card fields** (`src/routes/checkout/+page.svelte`, step 2): today they're
  plain inputs posted to the server, which is only acceptable because the
  mock ignores them. With Stripe they must become Stripe's Payment Element so
  raw card numbers **never reach this server**. The `pay` action then
  receives a Stripe payment-method id instead of card fields.
- **Test-mode box**: disappears by itself once `isLive` is true.
- **Errors**: a decline reason returned as `failureReason` already shows
  under the pay button, same as mock failures.

## Webhooks

Gateways often report the final status later (3-D Secure, bank debits), so
add an endpoint such as `src/routes/api/stripe-webhook/+server.ts`:

1. Read the raw body and verify the `Stripe-Signature` header with
   `STRIPE_WEBHOOK_SECRET`. Reject anything that fails.
2. On `payment_intent.succeeded`: find the payment row by
   `providerPaymentIntentId` and run the same "take stock, empty cart, mark
   paid" step `confirmPayment` uses. Move that block of `orders.ts` into its
   own exported function first, so both callers share it.
3. On `payment_intent.payment_failed` / `canceled`: update the payment row
   and the order's `paymentStatus`, as the failure branch does today.
4. Make it safe to receive the same event twice (check the current status
   before acting).

Exclude the webhook URL from SvelteKit's CSRF origin check (Stripe posts from
its own servers).

## Tests

`src/lib/server/orders.test.ts` covers success, failure + retry, stock
running out mid-payment, two buyers racing for the last unit, price
tampering and replayed requests. Run them against the real provider's test
mode before going live: `npm test`.
