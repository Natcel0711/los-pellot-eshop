namespace LosPellot.Api.Models;

public class CartHeader
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string? GuestToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<CartItem> Items { get; set; } = [];
}

public class CartItem
{
    public int Id { get; set; }
    public int CartHeaderId { get; set; }
    public CartHeader? CartHeader { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }
    public int Qty { get; set; }
    public string? VehicleLabel { get; set; }
}
