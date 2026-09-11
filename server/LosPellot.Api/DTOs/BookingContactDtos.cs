namespace LosPellot.Api.DTOs;

public record CreateBookingRequest(
    string Name, string Phone, string Email, string VehicleDescription,
    string ServiceType, DateOnly PreferredDate, string? Notes
);

public record BookingDto(int Id, string Status);

public record CreateContactMessageRequest(string Name, string Email, string? Phone, string Subject, string Message);

public record ContactMessageDto(int Id);
