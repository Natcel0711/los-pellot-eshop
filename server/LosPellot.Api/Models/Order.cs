namespace LosPellot.Api.Models;

// Stored as a raw int column (no HasConversion) — NEVER reorder or insert a
// member in the middle, only append, or existing rows silently become the
// wrong status.
public enum OrderStatus
{
    Received,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    PendingPayment,
}

// Deliberately separate from OrderStatus: an order can sit at PendingPayment
// while its payment cycles through Failed -> retried -> Paid. Also stored as
// a raw int — append-only, same rule as OrderStatus.
public enum PaymentStatus
{
    Pending,
    Processing,
    Paid,
    Failed,
    Cancelled,
    Refunded,
}

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? GuestEmail { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

    public string ShippingName { get; set; } = string.Empty;
    public string ShippingEmail { get; set; } = string.Empty;
    public string ShippingPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string? ShippingApt { get; set; }
    public string ShippingCity { get; set; } = string.Empty;
    public string ShippingState { get; set; } = string.Empty;
    public string ShippingZip { get; set; } = string.Empty;
    public string ShippingCountry { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public string Currency { get; set; } = "usd";

    // Cached from the latest Payment row — same snapshot convention as
    // OrderItem's ProductNameSnapshot/UnitPriceSnapshot, avoids a join for
    // every admin/order-history render.
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? ProviderReference { get; set; }

    // Dedups a replayed "create order" request (Idempotency-Key header).
    public string? IdempotencyKey { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = [];
    public List<Payment> Payments { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPriceSnapshot { get; set; }
    public int Qty { get; set; }
    public string? VehicleLabel { get; set; }
}

// One row per payment attempt (not per order) — a retry after Failed/
// Cancelled creates a new row rather than reusing the dead one, giving a
// real audit trail. Provider is "mock" today; a future real gateway swap
// changes what Provider/ProviderPaymentIntentId contain, not this shape.
public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public string Provider { get; set; } = "mock";
    public string ProviderPaymentIntentId { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public string? IdempotencyKey { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
