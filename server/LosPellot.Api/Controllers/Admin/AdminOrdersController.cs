using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/orders")]
public class AdminOrdersController(AppDbContext db) : ControllerBase
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

    [HttpPatch("{orderNumber}/status")]
    public async Task<ActionResult<AdminOrderDto>> UpdateStatus(string orderNumber, UpdateOrderStatusRequest request)
    {
        if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var status))
            return BadRequest(new { error = "Estado inválido." });

        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return NotFound();

        order.Status = status;
        await db.SaveChangesAsync();

        var userNames = await db.Users.ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(ToDto(order, userNames));
    }

    private static AdminOrderDto ToDto(Order o, Dictionary<string, string> userNames)
    {
        var isGuest = o.UserId is null;
        var customerName = isGuest ? o.ShippingName : userNames.GetValueOrDefault(o.UserId!, o.ShippingName);
        var customerEmail = isGuest ? (o.GuestEmail ?? o.ShippingEmail) : o.ShippingEmail;

        return new AdminOrderDto(
            o.OrderNumber, o.Status.ToString(), customerName, customerEmail, isGuest,
            o.Subtotal, o.ShippingCost, o.Subtotal + o.ShippingCost, o.Items.Sum(i => i.Qty), o.CreatedAt
        );
    }
}
