using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers;

// Checkout is two phases, mirroring how a real payment gateway actually
// works (an intent is created server-side, then confirmed — possibly with a
// redirect/3DS step — against the gateway):
//   Phase A: POST /api/orders               -> creates a PendingPayment order
//   Phase B: POST /api/orders/{no}/payment  -> confirms payment, decrements
//                                               stock only once the provider
//                                               actually reports success.
// The cart is never cleared and stock is never touched until Phase B
// succeeds, so an abandoned or failed checkout doesn't cost the shopper
// their cart or hold inventory hostage.
[ApiController]
[Route("api/orders")]
public class OrdersController(AppDbContext db, CartResolver cartResolver, IPaymentService paymentService) : ControllerBase
{
    private const decimal FreeShippingMin = 75m;
    private const decimal FlatShipping = 9.99m;
    private const string Currency = "usd";

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Checkout(CreateOrderRequest request)
    {
        var idemKey = Request.Headers["Idempotency-Key"].FirstOrDefault();

        if (idemKey is not null)
        {
            var existing = await db.Orders.Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.IdempotencyKey == idemKey);
            if (existing is not null) return Ok(ToDto(existing));
        }

        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        if (header is null || header.Items.Count == 0)
            return BadRequest(new { error = "Tu carrito está vacío." });

        // Soft check only — no reservation/hold. Two shoppers can both pass
        // this for the last unit; only one wins at Phase B, where the real
        // atomic enforcement happens (see ApplyPaymentSucceededAsync).
        var shortItems = header.Items.Where(i => i.Product!.StockQuantity < i.Qty).ToList();
        if (shortItems.Count > 0)
        {
            var names = string.Join(", ", shortItems.Select(i => i.Product!.Name));
            return BadRequest(new { error = $"Stock insuficiente para: {names}." });
        }

        var subtotal = header.Items.Sum(i => (i.Product!.SalePrice ?? i.Product.Price) * i.Qty);
        var shippingCost = subtotal >= FreeShippingMin ? 0 : FlatShipping;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var total = subtotal + shippingCost;

        var order = new Order
        {
            OrderNumber = await GenerateOrderNumberAsync(),
            UserId = userId,
            GuestEmail = userId is null ? request.Shipping.Email : null,
            Status = OrderStatus.PendingPayment,
            PaymentStatus = PaymentStatus.Pending,
            Currency = Currency,
            IdempotencyKey = idemKey,
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

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) when (idemKey is not null)
        {
            // A concurrent request with the same key won the race to insert.
            var winner = await db.Orders.Include(o => o.Items).FirstAsync(o => o.IdempotencyKey == idemKey);
            return Ok(ToDto(winner));
        }

        var intent = await paymentService.CreateIntentAsync(order.OrderNumber, total, Currency);
        db.Payments.Add(new Payment
        {
            OrderId = order.Id,
            Provider = "mock",
            ProviderPaymentIntentId = intent.ProviderPaymentIntentId,
            Status = PaymentStatus.Pending,
            Amount = total,
            Currency = Currency,
        });
        order.ProviderReference = intent.ProviderPaymentIntentId;
        await db.SaveChangesAsync();

        return Ok(ToDto(order));
    }

    [HttpPost("{orderNumber}/payment")]
    public async Task<ActionResult<OrderDto>> ConfirmPayment(
        string orderNumber, [FromQuery] string? email, ConfirmPaymentRequest request)
    {
        var idemKey = Request.Headers["Idempotency-Key"].FirstOrDefault();

        var order = await db.Orders.Include(o => o.Items).Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ownedByUser = order.UserId is not null && order.UserId == userId;
        var matchesGuestEmail = order.UserId is null && order.GuestEmail is not null &&
            string.Equals(order.GuestEmail, email, StringComparison.OrdinalIgnoreCase);
        if (!ownedByUser && !matchesGuestEmail) return Forbid();

        if (order.Status == OrderStatus.Received && order.PaymentStatus == PaymentStatus.Paid)
            return Ok(ToDto(order)); // already paid — double-click / refresh-safe no-op

        if (order.Status != OrderStatus.PendingPayment)
            return BadRequest(new { error = "Esta orden ya no admite pagos." });

        if (idemKey is not null && order.Payments.Any(p => p.IdempotencyKey == idemKey && p.Status != PaymentStatus.Pending))
            return Ok(ToDto(order)); // a prior request with this exact key already resolved

        var total = order.Subtotal - order.Discount + order.ShippingCost + order.Tax;
        var latest = order.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();

        Payment attempt;
        if (latest is null || latest.Status is PaymentStatus.Failed or PaymentStatus.Cancelled)
        {
            // Fresh attempt — a dead intent generally can't be re-confirmed
            // against a real provider, so retries mint a new one.
            var intent = await paymentService.CreateIntentAsync(order.OrderNumber, total, order.Currency);
            attempt = new Payment
            {
                OrderId = order.Id,
                Provider = "mock",
                ProviderPaymentIntentId = intent.ProviderPaymentIntentId,
                Status = PaymentStatus.Processing,
                Amount = total,
                Currency = order.Currency,
                IdempotencyKey = idemKey,
            };
            db.Payments.Add(attempt);
            await db.SaveChangesAsync();
        }
        else
        {
            // Atomically claim the attempt so a concurrent duplicate request
            // cannot also call the provider (double-charge guard, distinct
            // from the stock race guarded below).
            var claimed = await db.Payments
                .Where(p => p.Id == latest.Id && p.Status == PaymentStatus.Pending)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PaymentStatus.Processing)
                    .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));
            if (claimed == 0)
            {
                var fresh = await db.Orders.Include(o => o.Items).FirstAsync(o => o.Id == order.Id);
                return Ok(ToDto(fresh)); // a concurrent identical request is already handling this
            }
            latest.Status = PaymentStatus.Processing;
            latest.IdempotencyKey ??= idemKey;
            attempt = latest;
        }

        var simulateOutcome = paymentService.IsLiveProvider ? null : ParseSimulatedOutcome(request.SimulateOutcome);
        var result = await paymentService.ConfirmAsync(attempt.ProviderPaymentIntentId, request.Payment, simulateOutcome, idemKey);

        attempt.Status = result.Status;
        attempt.FailureReason = result.FailureReason;
        attempt.UpdatedAt = DateTime.UtcNow;

        if (result.Status != PaymentStatus.Paid)
        {
            order.PaymentStatus = result.Status;
            await db.SaveChangesAsync();
            return BadRequest(new { error = result.FailureReason ?? "No pudimos procesar tu pago. Puedes intentarlo de nuevo." });
        }

        return await ApplyPaymentSucceededAsync(order, attempt);
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

    // Shared by ConfirmPayment today; a future Stripe webhook handler
    // (see PAYMENT_INTEGRATION.md) should call this same method once it has
    // verified a payment_intent.succeeded event, rather than duplicating the
    // stock-decrement/cart-clear logic.
    private async Task<ActionResult<OrderDto>> ApplyPaymentSucceededAsync(Order order, Payment attempt)
    {
        await using var tx = await db.Database.BeginTransactionAsync();

        foreach (var item in order.Items)
        {
            var rows = await db.Products
                .Where(p => p.Id == item.ProductId && p.StockQuantity >= item.Qty)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.StockQuantity, p => p.StockQuantity - item.Qty));

            if (rows == 0)
            {
                // Stock ran out between Phase A and Phase B. The provider
                // already reported success — we must not keep money for
                // stock we don't have, so cancel/refund and roll back.
                await tx.RollbackAsync();
                await paymentService.CancelAsync(attempt.ProviderPaymentIntentId);
                attempt.Status = PaymentStatus.Cancelled;
                attempt.FailureReason = "Stock agotado después de procesar el pago.";
                attempt.UpdatedAt = DateTime.UtcNow;
                order.PaymentStatus = PaymentStatus.Cancelled;
                await db.SaveChangesAsync();
                return new ObjectResult(new { error = "Uno de los productos se agotó mientras procesábamos tu pago. No se realizó ningún cargo permanente. Por favor revisa tu carrito." })
                {
                    StatusCode = StatusCodes.Status409Conflict,
                };
            }
        }

        var cart = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        if (cart is not null) db.CartItems.RemoveRange(cart.Items);

        order.Status = OrderStatus.Received;
        order.PaymentStatus = PaymentStatus.Paid;
        order.ProviderReference = attempt.ProviderPaymentIntentId;
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDto(order));
    }

    private static SimulatedOutcome? ParseSimulatedOutcome(string? value) =>
        Enum.TryParse<SimulatedOutcome>(value, ignoreCase: true, out var outcome) ? outcome : null;

    private async Task<string> GenerateOrderNumberAsync()
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = "LP-" + Random.Shared.Next(100000, 999999);
            if (!await db.Orders.AnyAsync(o => o.OrderNumber == candidate)) return candidate;
        }
        return "LP-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    }

    private OrderDto ToDto(Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        order.PaymentStatus.ToString(),
        new ShippingInfo(order.ShippingName, order.ShippingEmail, order.ShippingPhone, order.ShippingAddress,
            order.ShippingApt, order.ShippingCity, order.ShippingState, order.ShippingZip, order.ShippingCountry),
        order.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductNameSnapshot, i.UnitPriceSnapshot, i.Qty, i.VehicleLabel)).ToList(),
        order.Subtotal,
        order.ShippingCost,
        order.Discount,
        order.Tax,
        order.Currency,
        order.Subtotal - order.Discount + order.ShippingCost + order.Tax,
        order.CreatedAt,
        !paymentService.IsLiveProvider,
        order.ProviderReference
    );
}
