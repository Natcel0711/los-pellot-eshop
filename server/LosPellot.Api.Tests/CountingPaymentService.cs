using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services.Payments;

namespace LosPellot.Api.Tests;

// Wraps MockPaymentService but counts ConfirmAsync calls, so idempotency
// tests can assert a replayed request never reaches the "provider" twice.
public class CountingPaymentService : IPaymentService
{
    private readonly MockPaymentService inner = new();

    public int ConfirmCallCount { get; private set; }

    public bool IsLiveProvider => inner.IsLiveProvider;

    public Task<PaymentIntentResult> CreateIntentAsync(string orderNumber, decimal amount, string currency, CancellationToken ct = default) =>
        inner.CreateIntentAsync(orderNumber, amount, currency, ct);

    public Task<PaymentIntentResult> ConfirmAsync(
        string providerPaymentIntentId, PaymentInfo? cardDetails,
        SimulatedOutcome? simulateOutcome, string? idempotencyKey, CancellationToken ct = default)
    {
        ConfirmCallCount++;
        return inner.ConfirmAsync(providerPaymentIntentId, cardDetails, simulateOutcome, idempotencyKey, ct);
    }

    public Task<PaymentIntentResult> CancelAsync(string providerPaymentIntentId, CancellationToken ct = default) =>
        inner.CancelAsync(providerPaymentIntentId, ct);

    public Task<PaymentIntentResult> RefundAsync(string providerPaymentIntentId, decimal? amount, CancellationToken ct = default) =>
        inner.RefundAsync(providerPaymentIntentId, amount, ct);

    public Task<PaymentIntentResult> GetStatusAsync(string providerPaymentIntentId, CancellationToken ct = default) =>
        inner.GetStatusAsync(providerPaymentIntentId, ct);
}
