namespace LosPellot.Api.DTOs;

public record ShippingInfo(
    string Name, string Email, string Phone, string Address, string? Apt,
    string City, string State, string Zip, string Country
);

// Accepted for shape validation only — no real payment gateway is wired up,
// and none of this is persisted (see OrdersController.Checkout).
public record PaymentInfo(string CardName, string CardNumber, string Expiry, string Cvc);

public record CreateOrderRequest(ShippingInfo Shipping, PaymentInfo Payment);

public record OrderItemDto(string ProductId, string ProductName, decimal UnitPrice, int Qty, string? VehicleLabel);

public record OrderDto(
    string OrderNumber,
    string Status,
    ShippingInfo Shipping,
    List<OrderItemDto> Items,
    decimal Subtotal,
    decimal ShippingCost,
    decimal Total,
    DateTime CreatedAt
);
