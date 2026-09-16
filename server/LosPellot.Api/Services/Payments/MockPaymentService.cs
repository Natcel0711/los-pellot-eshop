using LosPellot.Api.DTOs;
using LosPellot.Api.Models;

namespace LosPellot.Api.Services.Payments;

// ============================================================================
// DEVELOPMENT/TESTING ONLY. Never wire this up in a real deployment that
// takes real money.
//
// No network calls, no real card processing, no card data is ever logged or
// persisted here (or anywhere else in this codebase — see OrdersController).
// Confirm honors an explicit SimulatedOutcome (from the frontend's dev-mode
// controls) when given; otherwise it inspects the card number against
// Stripe's own published test-card numbers so the flow feels realistic even
// without those controls; otherwise it defaults to success.
// ============================================================================
public class MockPaymentService : IPaymentService
{
    private const string DeclineTestCard = "4000000000000002";
    private const string InsufficientFundsTestCard = "4000000000009995";

    public bool IsLiveProvider => false;

    public Task<PaymentIntentResult> CreateIntentAsync(
        string orderNumber, decimal amount, string currency, CancellationToken ct = default)
    {
        var id = "mock_pi_" + Guid.NewGuid().ToString("N")[..16];
        return Task.FromResult(new PaymentIntentResult(id, PaymentStatus.Pending, null));
    }

    public Task<PaymentIntentResult> ConfirmAsync(
        string providerPaymentIntentId, PaymentInfo? cardDetails,
        SimulatedOutcome? simulateOutcome, string? idempotencyKey, CancellationToken ct = default)
    {
        switch (simulateOutcome)
        {
            case SimulatedOutcome.Fail:
                return Task.FromResult(Failed(providerPaymentIntentId, "Simulación: pago rechazado (modo de prueba)."));
            case SimulatedOutcome.Cancel:
                return Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Cancelled, null));
            case SimulatedOutcome.Succeed:
                return Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Paid, null));
        }

        var digits = new string((cardDetails?.CardNumber ?? "").Where(char.IsDigit).ToArray());
        if (digits == DeclineTestCard)
            return Task.FromResult(Failed(providerPaymentIntentId, "Simulación: tarjeta declinada (número de prueba de Stripe)."));
        if (digits == InsufficientFundsTestCard)
            return Task.FromResult(Failed(providerPaymentIntentId, "Simulación: fondos insuficientes (número de prueba de Stripe)."));

        return Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Paid, null));
    }

    public Task<PaymentIntentResult> CancelAsync(string providerPaymentIntentId, CancellationToken ct = default) =>
        Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Cancelled, null));

    public Task<PaymentIntentResult> RefundAsync(string providerPaymentIntentId, decimal? amount, CancellationToken ct = default) =>
        Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Refunded, null));

    // Stateless mock has nothing to poll; kept for interface parity with a real provider.
    public Task<PaymentIntentResult> GetStatusAsync(string providerPaymentIntentId, CancellationToken ct = default) =>
        Task.FromResult(Result(providerPaymentIntentId, PaymentStatus.Pending, null));

    private static PaymentIntentResult Failed(string id, string reason) => Result(id, PaymentStatus.Failed, reason);

    private static PaymentIntentResult Result(string id, PaymentStatus status, string? reason) => new(id, status, reason);
}
