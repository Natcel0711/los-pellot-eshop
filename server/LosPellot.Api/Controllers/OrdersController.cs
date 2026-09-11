using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(AppDbContext db, CartResolver cartResolver) : ControllerBase
{
    private const decimal FreeShippingMin = 75m;
    private const decimal FlatShipping = 9.99m;

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Checkout(CreateOrderRequest request)
    {
        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        if (header is null || header.Items.Count == 0)
            return BadRequest(new { error = "Tu carrito está vacío." });

        if (string.IsNullOrWhiteSpace(request.Payment.CardNumber) || string.IsNullOrWhiteSpace(request.Payment.Cvc))
            return BadRequest(new { error = "Información de pago incompleta." });

        var subtotal = header.Items.Sum(i => (i.Product!.SalePrice ?? i.Product.Price) * i.Qty);
        var shippingCost = subtotal >= FreeShippingMin ? 0 : FlatShipping;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var order = new Order
        {
            OrderNumber = await GenerateOrderNumberAsync(),
            UserId = userId,
            GuestEmail = userId is null ? request.Shipping.Email : null,
            Status = OrderStatus.Received,
            ShippingName = request.Shipping.Name,
            ShippingEmail = request.Shipping.Email,
            ShippingPhone = request.Shipping.Phone,
            ShippingAddress = request.Shipping.Address,
            ShippingApt = request.Shipping.Apt,
            ShippingCity = request.Shipping.City,
            ShippingState = request.Shipping.State,
            ShippingZip = request.Shipping.Zip,
            ShippingCountry = request.Shipping.Country,
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Items = header.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                ProductNameSnapshot = i.Product!.Name,
                UnitPriceSnapshot = i.Product.SalePrice ?? i.Product.Price,
                Qty = i.Qty,
                VehicleLabel = i.VehicleLabel,
            }).ToList(),
        };

        db.Orders.Add(order);
        db.CartItems.RemoveRange(header.Items);
        await db.SaveChangesAsync();

        return Ok(ToDto(order));
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> Mine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var orders = await db.Orders.Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToDto).ToList());
    }

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderDto>> GetByNumber(string orderNumber, [FromQuery] string? email)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ownedByUser = order.UserId is not null && order.UserId == userId;
        var matchesGuestEmail = order.UserId is null && order.GuestEmail is not null &&
            string.Equals(order.GuestEmail, email, StringComparison.OrdinalIgnoreCase);

        if (!ownedByUser && !matchesGuestEmail) return Forbid();

        return Ok(ToDto(order));
    }

    private async Task<string> GenerateOrderNumberAsync()
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = "LP-" + Random.Shared.Next(100000, 999999);
            if (!await db.Orders.AnyAsync(o => o.OrderNumber == candidate)) return candidate;
        }
        return "LP-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    }

    private static OrderDto ToDto(Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        new ShippingInfo(order.ShippingName, order.ShippingEmail, order.ShippingPhone, order.ShippingAddress,
            order.ShippingApt, order.ShippingCity, order.ShippingState, order.ShippingZip, order.ShippingCountry),
        order.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductNameSnapshot, i.UnitPriceSnapshot, i.Qty, i.VehicleLabel)).ToList(),
        order.Subtotal,
        order.ShippingCost,
        order.Subtotal + order.ShippingCost,
        order.CreatedAt
    );
}
