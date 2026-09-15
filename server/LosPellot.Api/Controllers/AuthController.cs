using System.Security.Claims;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    JwtTokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var fullName = (request.FullName ?? "").Trim();
        var email = (request.Email ?? "").Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { error = "Escribe tu nombre." });
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "Correo electrónico inválido." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { error = "La contraseña debe tener al menos 6 caracteres." });

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
            return BadRequest(new { error = "Ya existe una cuenta con ese correo." });

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var error = result.Errors.FirstOrDefault()?.Description ?? "No se pudo crear la cuenta.";
            return BadRequest(new { error });
        }

        var tokens = await tokenService.IssueTokensAsync(user);
        return Ok(new AuthResponse(tokens.AccessToken, tokens.RefreshToken, ToDto(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password ?? ""))
            return BadRequest(new { error = "Correo o contraseña incorrectos." });

        var tokens = await tokenService.IssueTokensAsync(user);
        return Ok(new AuthResponse(tokens.AccessToken, tokens.RefreshToken, ToDto(user)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var validated = await tokenService.ValidateRefreshTokenAsync(request.RefreshToken);
        if (validated is null) return Unauthorized(new { error = "Sesión expirada, inicia sesión de nuevo." });

        var (oldToken, user) = validated.Value;
        tokenService.RevokeToken(oldToken);
        var tokens = await tokenService.IssueTokensAsync(user);
        return Ok(new AuthResponse(tokens.AccessToken, tokens.RefreshToken, ToDto(user)));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is not null) await tokenService.RevokeAllForUserAsync(userId);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        return Ok(ToDto(user));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe(UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var fullName = (request.FullName ?? "").Trim();
        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { error = "Escribe tu nombre." });

        user.FullName = fullName;
        await userManager.UpdateAsync(user);

        return Ok(ToDto(user));
    }

    private static UserDto ToDto(ApplicationUser user) =>
        new(user.Id, user.FullName, user.Email ?? "", user.CreatedAt, user.IsAdmin);
}
