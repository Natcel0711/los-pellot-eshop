using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services.Shipping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/orders")]
public class AdminOrdersController(AppDbContext db, IShippingLabelService shippingLabelService, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminOrderDto>>> GetAll()
    {
        var orders = await db.Orders.Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var userNames = await db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);

        return Ok(orders.Select(o => ToDto(o, userNames)).ToList());
    }

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<AdminOrderDetailDto>> GetByNumber(string orderNumber)
    {
        var order = await db.Orders.Include(o => o.Items).Include(o => o.ShippingLabels)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        var userNames = await db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(ToDetailDto(order, userNames));
    }

    [HttpPatch("{orderNumber}/status")]
    public async Task<ActionResult<AdminOrderDto>> UpdateStatus(string orderNumber, UpdateOrderStatusRequest request)
    {
        if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var status))
            return BadRequest(new { error = "Estado inválido." });
        if (status == OrderStatus.PendingPayment)
            return BadRequest(new { error = "No se puede establecer manualmente este estado." });

        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        order.Status = status;
        await db.SaveChangesAsync();

        var userNames = await db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(ToDto(order, userNames));
    }

    // Quotes real carrier rates for this order's shipping address via
    // IShippingLabelService — nothing is purchased/charged yet.
    [HttpPost("{orderNumber}/shipping/rates")]
    public async Task<ActionResult<List<ShippingRateDto>>> GetShippingRates(string orderNumber, GetShippingRatesRequest request)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        if (request.Package.WeightLb <= 0 || request.Package.LengthIn <= 0 || request.Package.WidthIn <= 0 || request.Package.HeightIn <= 0)
            return BadRequest(new { error = "Ingresa un peso y dimensiones válidas." });

        var from = ShipFromAddress();
        var to = new ShippingAddress(
            order.ShippingName, order.ShippingAddress, order.ShippingApt, order.ShippingCity, order.ShippingState,
            order.ShippingZip, order.ShippingCountry, order.ShippingPhone, order.ShippingEmail);
        var parcel = new Parcel(request.Package.WeightLb, request.Package.LengthIn, request.Package.WidthIn, request.Package.HeightIn);

        try
        {
            var rates = await shippingLabelService.GetRatesAsync(from, to, parcel);
            return Ok(rates.Select(r => new ShippingRateDto(r.RateId, r.Carrier, r.ServiceLevel, r.Amount, r.Currency, r.EstimatedDays)).ToList());
        }
        catch (ShippingProviderException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Purchases the selected rate (real postage) and stores the resulting
    // label/tracking info against the order.
    [HttpPost("{orderNumber}/shipping/purchase")]
    public async Task<ActionResult<ShippingLabelDto>> PurchaseShippingLabel(string orderNumber, PurchaseShippingLabelRequest request)
    {
        var order = await db.Orders.Include(o => o.ShippingLabels).FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        var rate = new ShippingRate(request.Rate.RateId, request.Rate.Carrier, request.Rate.ServiceLevel, request.Rate.Amount, request.Rate.Currency, request.Rate.EstimatedDays);

        PurchasedLabel purchased;
        try
        {
            purchased = await shippingLabelService.PurchaseLabelAsync(rate);
        }
        catch (ShippingProviderException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var label = new ShippingLabel
        {
            OrderId = order.Id,
            Provider = "shippo",
            ProviderTransactionId = purchased.ProviderTransactionId,
            LabelUrl = purchased.LabelUrl,
            TrackingNumber = purchased.TrackingNumber,
            TrackingUrlProvider = purchased.TrackingUrlProvider,
            Carrier = purchased.Carrier,
            ServiceLevel = purchased.ServiceLevel,
            Amount = purchased.Amount,
            Currency = purchased.Currency,
            WeightLb = request.Package.WeightLb,
            LengthIn = request.Package.LengthIn,
            WidthIn = request.Package.WidthIn,
            HeightIn = request.Package.HeightIn,
        };
        db.ShippingLabels.Add(label);
        await db.SaveChangesAsync();

        return Ok(ToLabelDto(label));
    }

    // Store's own return address — configurable since it needs a real
    // street address Shippo can validate, which no code default should
    // invent. Fill in Shippo:ApiToken and ShipFrom:* in appsettings/env vars.
    private ShippingAddress ShipFromAddress()
    {
        var section = configuration.GetSection("ShipFrom");
        return new ShippingAddress(
            section["Name"] ?? "Los Pellot LED and Accessories Distributors",
            section["Street1"] ?? "",
            section["Street2"],
            section["City"] ?? "",
            section["State"] ?? "MA",
            section["Zip"] ?? "",
            section["Country"] ?? "US",
            section["Phone"],
            section["Email"]);
    }

    private static AdminOrderDto ToDto(Order o, Dictionary<string, string> userNames)
    {
        var isGuest = o.UserId is null;
        var customerName = isGuest ? o.ShippingName : userNames.GetValueOrDefault(o.UserId!, o.ShippingName);
        var customerEmail = isGuest ? (o.GuestEmail ?? o.ShippingEmail) : o.ShippingEmail;

        return new AdminOrderDto(
            o.OrderNumber, o.Status.ToString(), o.PaymentStatus.ToString(), customerName, customerEmail, isGuest,
            o.Subtotal, o.ShippingCost, o.Discount, o.Tax, o.Subtotal - o.Discount + o.ShippingCost + o.Tax,
            o.Items.Sum(i => i.Qty), o.CreatedAt
        );
    }

    private static AdminOrderDetailDto ToDetailDto(Order o, Dictionary<string, string> userNames)
    {
        var isGuest = o.UserId is null;
        var customerName = isGuest ? o.ShippingName : userNames.GetValueOrDefault(o.UserId!, o.ShippingName);
        var customerEmail = isGuest ? (o.GuestEmail ?? o.ShippingEmail) : o.ShippingEmail;

        return new AdminOrderDetailDto(
            o.OrderNumber, o.Status.ToString(), o.PaymentStatus.ToString(), customerName, customerEmail, isGuest,
            new ShippingInfo(o.ShippingName, o.ShippingEmail, o.ShippingPhone, o.ShippingAddress,
                o.ShippingApt, o.ShippingCity, o.ShippingState, o.ShippingZip, o.ShippingCountry),
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductNameSnapshot, i.UnitPriceSnapshot, i.Qty, i.VehicleLabel)).ToList(),
            o.Subtotal, o.ShippingCost, o.Discount, o.Tax, o.Subtotal - o.Discount + o.ShippingCost + o.Tax, o.CreatedAt,
            o.ShippingLabels.OrderByDescending(l => l.CreatedAt).Select(ToLabelDto).ToList()
        );
    }

    private static ShippingLabelDto ToLabelDto(ShippingLabel l) => new(
        l.Provider, l.LabelUrl, l.TrackingNumber, l.TrackingUrlProvider,
        l.Carrier, l.ServiceLevel, l.Amount, l.Currency, l.CreatedAt
    );
}
