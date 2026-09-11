using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/bookings")]
public class AdminBookingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminBookingDto>>> GetAll()
    {
        var bookings = await db.Bookings.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(bookings.Select(ToDto).ToList());
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<AdminBookingDto>> UpdateStatus(int id, UpdateBookingStatusRequest request)
    {
        if (!Enum.TryParse<BookingStatus>(request.Status, ignoreCase: true, out var status))
            return BadRequest(new { error = "Estado inválido." });

        var booking = await db.Bookings.FindAsync(id);
        if (booking is null) return NotFound();

        booking.Status = status;
        await db.SaveChangesAsync();
        return Ok(ToDto(booking));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking is null) return NotFound();

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AdminBookingDto ToDto(Booking b) => new(
        b.Id, b.Name, b.Phone, b.Email, b.VehicleDescription, b.ServiceType,
        b.PreferredDate, b.Notes, b.Status.ToString(), b.CreatedAt
    );
}
