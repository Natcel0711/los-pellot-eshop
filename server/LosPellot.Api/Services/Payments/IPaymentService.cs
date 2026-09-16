using LosPellot.Api.DTOs;
using LosPellot.Api.Models;

namespace LosPellot.Api.Services.Payments;

// Lets an explicit dev/test control force a Confirm outcome instead of
// relying on magic card numbers. Ignored by a real (IsLiveProvider) provider.
public enum SimulatedOutcome { Succeed, Fail, Cancel }

public record PaymentIntentResult(string ProviderPaymentIntentId, PaymentStatus Status, string? FailureReason);

// The one seam a future real gateway (Stripe, etc.) implements — see
// PAYMENT_INTEGRATION.md for exactly what changes when that happens.
public interface IPaymentService
{
    // False for MockPaymentService; a real provider returns true. Drives
    // OrderDto.AllowSimulatedOutcomes so the frontend's test-mode controls
    // disappear automatically once a real provider is wired up.
    bool IsLiveProvider { get; }

    Task<PaymentIntentResult> CreateIntentAsync(
        string orderNumber, decimal amount, string currency, CancellationToken ct = default);

    Task<PaymentIntentResult> ConfirmAsync(
        string providerPaymentIntentId, PaymentInfo? cardDetails,
        SimulatedOutcome? simulateOutcome, string? idempotencyKey, CancellationToken ct = default);

    Task<PaymentIntentResult> CancelAsync(string providerPaymentIntentId, CancellationToken ct = default);

    Task<PaymentIntentResult> RefundAsync(
        string providerPaymentIntentId, decimal? amount, CancellationToken ct = default);

    Task<PaymentIntentResult> GetStatusAsync(string providerPaymentIntentId, CancellationToken ct = default);
}
