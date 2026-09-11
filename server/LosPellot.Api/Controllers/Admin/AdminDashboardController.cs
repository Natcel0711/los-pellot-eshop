using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/dashboard")]
public class AdminDashboardController(AppDbContext db) : ControllerBase
{
    private const int LowStockThreshold = 10;

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get()
    {
        var dto = new AdminDashboardDto(
            ProductCount: await db.Products.CountAsync(),
            LowStockCount: await db.Products.CountAsync(p => p.StockQuantity < LowStockThreshold),
            CategoryCount: await db.Categories.CountAsync(),
            UserCount: await db.Users.CountAsync(),
            OrderCount: await db.Orders.CountAsync(),
            PendingBookingCount: await db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending),
            UnhandledContactCount: await db.ContactMessages.CountAsync(m => m.HandledAt == null)
        );
        return Ok(dto);
    }
}
