namespace LosPellot.Api.DTOs;

public record RegisterRequest(string FullName, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record UserDto(string Id, string FullName, string Email, DateTime CreatedAt, bool IsAdmin);

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

public record UpdateProfileRequest(string FullName, string Email);
