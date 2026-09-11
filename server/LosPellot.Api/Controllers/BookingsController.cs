using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone) ||
            string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.ServiceType))
        {
            return BadRequest(new { error = "Completa todos los campos requeridos." });
        }

        var booking = new Booking
        {
            Name = request.Name.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            VehicleDescription = request.VehicleDescription?.Trim() ?? "",
            ServiceType = request.ServiceType,
            PreferredDate = request.PreferredDate,
            Notes = request.Notes,
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Status = BookingStatus.Pending,
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        return Ok(new BookingDto(booking.Id, booking.Status.ToString()));
    }
}
