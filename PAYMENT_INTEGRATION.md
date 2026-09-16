# Payment integration guide

The checkout/order/inventory flow is real: server-side cart resolution,
authoritative pricing, atomic stock decrement, idempotent requests, and a
proper `Order`/`Payment` model with separate order-status and payment-status
tracking. The **only** unbuilt piece is an actual external payment gateway —
today `MockPaymentService` stands in for one. This document is the checklist
for replacing it with a real provider (Stripe is used as the running example;
the same shape applies to any gateway built around create-intent/confirm +
webhooks).

## How checkout works today (read this first)

Checkout is two backend phases, matching how a real gateway actually behaves
(an intent is created server-side, then confirmed — possibly with a redirect
or 3-D Secure step — against the gateway itself):

- **Phase A** — `POST /api/orders`: resolves the shopper's server-side cart,
  re-validates stock (soft check), computes the authoritative total from the
  database, creates an `Order` (`Status = PendingPayment`), and calls
  `IPaymentService.CreateIntentAsync`.
- **Phase B** — `POST /api/orders/{orderNumber}/payment`: calls
  `IPaymentService.ConfirmAsync`. Only once the *provider* reports success
  does the backend atomically decrement stock (a transaction with a
  conditional `ExecuteUpdateAsync` per line, guarded by
  `StockQuantity >= qty`) and mark the order `Received`/`Paid`. If stock ran
  out between the two phases, the payment is cancelled/refunded and the order
  stays `PendingPayment` — the customer is never charged for something that
  isn't there.

The frontend (`client/src/app/features/checkout/`) mirrors this as two
visible steps: "Continue to Payment" (Phase A) then "Pay Now" (Phase B).

**The backend never trusts the frontend's claim that payment succeeded** —
only `IPaymentService`'s own return value moves an order forward. This is
exactly the assumption a real webhook-driven integration needs.

## Where the real service goes

Create `server/LosPellot.Api/Services/Payments/StripePaymentService.cs`
implementing the same `IPaymentService` interface `MockPaymentService`
implements (`server/LosPellot.Api/Services/Payments/IPaymentService.cs`):

```csharp
public interface IPaymentService
{
    bool IsLiveProvider { get; }
    Task<PaymentIntentResult> CreateIntentAsync(string orderNumber, decimal amount, string currency, CancellationToken ct = default);
    Task<PaymentIntentResult> ConfirmAsync(string providerPaymentIntentId, PaymentInfo? cardDetails, SimulatedOutcome? simulateOutcome, string? idempotencyKey, CancellationToken ct = default);
    Task<PaymentIntentResult> CancelAsync(string providerPaymentIntentId, CancellationToken ct = default);
    Task<PaymentIntentResult> RefundAsync(string providerPaymentIntentId, decimal? amount, CancellationToken ct = default);
    Task<PaymentIntentResult> GetStatusAsync(string providerPaymentIntentId, CancellationToken ct = default);
}
```

`StripePaymentService.IsLiveProvider => true` — this single flag is what
makes `OrderDto.AllowSimulatedOutcomes` turn `false` automatically, which
makes the frontend's test-mode banner and Succeed/Decline/Cancel selector
disappear with no other frontend change required.

**The one line to change** — in `Program.cs`:

```csharp
// Before:
builder.Services.AddScoped<IPaymentService, MockPaymentService>();
// After:
builder.Services.AddScoped<IPaymentService, StripePaymentService>();
```

Everything in `OrdersController` (cart validation, pricing, the atomic stock
decrement, idempotency, order/payment state machine) is provider-agnostic and
needs no changes.

## Config / secrets

Add under a new `Stripe` section (`appsettings.json` for local dev defaults,
environment variables for anything real — same pattern already used for
`Jwt:SigningKey` in `Program.cs`):

| Setting | Env var | Notes |
|---|---|---|
| `Stripe:SecretKey` | `Stripe__SecretKey` | Server-side only. **Never** send to the frontend. |
| `Stripe:WebhookSigningSecret` | `Stripe__WebhookSigningSecret` | Used to verify the `Stripe-Signature` header on incoming webhooks. |
| `Stripe:PublishableKey` | `Stripe__PublishableKey` | The only one of these three safe to expose to the frontend (needed by Stripe.js/Elements). |

Never hardcode any of these. Never log `SecretKey` or raw card data anywhere
— `MockPaymentService` already models this correctly (it inspects a card
number only to pick a deterministic test outcome, then discards it; nothing
is persisted or logged).

## Frontend pieces that need reconnecting

- **Card inputs** (`checkout.html`, Phase-2 form): today these are plain
  `<input>` fields whose values are sent straight to the backend in
  `ConfirmPaymentRequest.Payment` — acceptable only because
  `MockPaymentService` never does anything with them beyond picking a test
  outcome. For a real provider, these must become Stripe Elements/the Payment
  Element (Stripe's hosted, tokenizing UI) so raw card data **never reaches
  this backend at all**. `OrdersApi.confirmPayment` will need to send a
  Stripe-generated payment-method token/id instead of raw card fields.
- **Test-mode banner + Succeed/Decline/Cancel selector** (`checkout.html`,
  gated by `order.allowSimulatedOutcomes`): no change needed — it already
  disappears automatically once `IsLiveProvider` is `true`.
- **Error surfacing**: `checkout.ts`'s `error` signal already reads
  `err.error?.error` from the backend response — a Stripe decline reason
  returned through `IPaymentService.ConfirmAsync`'s `FailureReason` will show
  up the same way real mock failures do today; no change needed there either.

## Webhooks

Stripe (and most real gateways) can report a payment's final status
asynchronously — a redirect/3-D Secure flow completes after the initial HTTP
response, or a delayed payment method (bank debit) settles hours later. The
backend must handle that via a webhook, not just the synchronous Phase-B
response.

**Where it goes**: `server/LosPellot.Api/Controllers/Payments/PaymentWebhooksController.cs`
(not built — this documents the shape it should take):

```csharp
[ApiController]
[Route("api/payments/webhooks/stripe")]
public class PaymentWebhooksController(AppDbContext db, IPaymentService paymentService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        // 1. Read the raw request body and the `Stripe-Signature` header.
        // 2. Verify the signature against Stripe:WebhookSigningSecret
        //    (Stripe.net's EventUtility.ConstructEvent does this).
        // 3. Switch on event.Type and update the matching Order/Payment —
        //    see "Events to handle" below.
    }
}
```

This route needs `[AllowAnonymous]` (Stripe calls it directly, with no JWT)
but must verify the signature itself — signature verification *is* the
authentication for this endpoint.

### Events to handle

| Stripe event | What it means | What to do |
|---|---|---|
| `payment_intent.succeeded` | Payment cleared | Look up the `Payment` by `ProviderPaymentIntentId`, then run the **same** stock-decrement/cart-clear/mark-`Received`+`Paid` logic `OrdersController.ApplyPaymentSucceededAsync` already contains. Extract that method to be callable from both places rather than duplicating it. |
| `payment_intent.payment_failed` | Payment declined/failed | Set the matching `Payment.Status = Failed` (+`FailureReason`), `Order.PaymentStatus = Failed`. Order stays `PendingPayment` — the customer can retry, exactly like a synchronous mock failure today. |
| `payment_intent.canceled` | Intent cancelled (by us or Stripe) | Mirror `IPaymentService.CancelAsync`'s effect: `Payment.Status = Cancelled`. |
| `charge.refunded` | A refund was issued (e.g. from the Stripe dashboard, or our own `RefundAsync` call) | Set `Payment.Status = Refunded`, `Order.PaymentStatus = Refunded`. Decide separately whether a refund should also restock the items (`Product.StockQuantity` increment) — not automatic today. |

**Never assume the frontend's "payment succeeded" message is truth.** The
synchronous Phase-B response is a convenience for the common case (most mock
and even most real card payments resolve immediately), but the webhook (or a
`GetStatusAsync` poll) is the actual source of truth once a real provider is
live — a dropped connection, a closed tab mid-redirect, or a delayed payment
method must still resolve correctly via the webhook alone.

## Refunds

`IPaymentService.RefundAsync(providerPaymentIntentId, amount)` is already
called once today, inside `ApplyPaymentSucceededAsync`'s stock-conflict path
(if stock runs out after the provider reports success, the payment is
reversed rather than kept). A real admin-initiated refund flow (e.g. a button
in the admin Orders page) would call the same method and then set
`Order.PaymentStatus = Refunded` — not built today since there's no refund UI
yet, only the automatic stock-conflict case.

## Known, accepted limitation

An order that reaches Phase A (`PendingPayment`) but is never paid (the
shopper closes the tab) sits there indefinitely — no stock is held for it, so
this is harmless clutter rather than a correctness issue, but a scheduled
cleanup job (e.g. cancel anything `PendingPayment` older than 24h) is a
reasonable future addition, not built here.

## Pre-production checklist

- [ ] Rotate/remove the seeded default admin account (`SeedData.cs` — see
      the README's "Admin panel" section); it's a public, well-known default.
- [ ] Confirm webhook signature verification actually rejects tampered/unsigned requests (test with an invalid signature).
- [ ] Confirm the `Idempotency-Key` header this app already generates
      client-side (`checkout.ts`) is forwarded to Stripe's own API calls in
      `StripePaymentService` — Stripe's own idempotency guarantee depends on
      the *same* key reaching Stripe on a retried request, not just this
      app's own DB-level dedup.
- [ ] Load-test the stock-decrement transaction under real concurrency (the
      `ConcurrentPurchaseTests` suite exercises this against SQLite in
      isolation; re-verify against whatever production database is used).
- [ ] Exercise a full refund end-to-end against Stripe's test mode before
      enabling it against real cards.
- [ ] Confirm `Stripe:SecretKey`/`Stripe:WebhookSigningSecret` are only ever
      read from environment variables in the deployed environment, never
      committed to `appsettings.json`.
