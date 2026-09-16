namespace LosPellot.Api.DTOs;

public record ShippingInfo(
    string Name, string Email, string Phone, string Address, string? Apt,
    string City, string State, string Zip, string Country
);

// Never persisted directly — MockPaymentService inspects CardNumber only to
// pick a deterministic simulated outcome, then discards it. See
// PAYMENT_INTEGRATION.md for what a real provider requires instead (this
// backend should never see a real card number at all).
public record PaymentInfo(string CardName, string CardNumber, string Expiry, string Cvc);

// Phase A — creates a PendingPayment order from the server-resolved cart.
public record CreateOrderRequest(ShippingInfo Shipping);

// Phase B — confirms payment against IPaymentService. SimulateOutcome
// ("Succeed"/"Fail"/"Cancel") is only honored while the active provider is
// non-live (see OrderDto.AllowSimulatedOutcomes).
public record ConfirmPaymentRequest(PaymentInfo? Payment, string? SimulateOutcome);

public record OrderItemDto(string ProductId, string ProductName, decimal UnitPrice, int Qty, string? VehicleLabel);

public record OrderDto(
    string OrderNumber,
    string Status,
    string PaymentStatus,
    ShippingInfo Shipping,
    List<OrderItemDto> Items,
    decimal Subtotal,
    decimal ShippingCost,
    decimal Discount,
    decimal Tax,
    string Currency,
    decimal Total,
    DateTime CreatedAt,
    bool AllowSimulatedOutcomes,
    string? PaymentReference
);
