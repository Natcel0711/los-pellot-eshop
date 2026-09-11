namespace LosPellot.Api.Models;

public enum OrderStatus
{
    Received,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? GuestEmail { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Received;

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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = [];
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
