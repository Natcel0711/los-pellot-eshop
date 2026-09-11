namespace LosPellot.Api.DTOs;

public record AddCartItemRequest(string ProductId, int Qty, string? VehicleLabel);

public record UpdateCartItemRequest(int Qty);

public record CartLineDto(
    string Key,
    string ProductId,
    int Qty,
    string? VehicleLabel,
    ProductDto Product,
    decimal UnitPrice,
    decimal LineTotal
);

public record CartDto(List<CartLineDto> Lines, decimal Subtotal);
