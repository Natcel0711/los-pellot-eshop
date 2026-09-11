namespace LosPellot.Api.Models;

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
}

public class Booking
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string VehicleDescription { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public DateOnly PreferredDate { get; set; }
    public string? Notes { get; set; }
    public string? UserId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
