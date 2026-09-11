using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LosPellot.Api.Data;
using LosPellot.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace LosPellot.Api.Services;

public record IssuedTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt);

public class JwtTokenService(IConfiguration configuration, AppDbContext db)
{
    private readonly IConfigurationSection _jwt = configuration.GetSection("Jwt");

    public async Task<IssuedTokens> IssueTokensAsync(ApplicationUser user)
    {
        var accessMinutes = _jwt.GetValue<int>("AccessTokenMinutes", 60);
        var refreshDays = _jwt.GetValue<int>("RefreshTokenDays", 30);

        var expiresAt = DateTime.UtcNow.AddMinutes(accessMinutes);
        var accessToken = CreateAccessToken(user, expiresAt);
        var refreshToken = CreateRefreshTokenValue();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = Hash(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
        });
        await db.SaveChangesAsync();

        return new IssuedTokens(accessToken, refreshToken, expiresAt);
    }

    public async Task<(RefreshToken token, ApplicationUser user)?> ValidateRefreshTokenAsync(string refreshToken)
    {
        var hash = Hash(refreshToken);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is null || !token.IsActive) return null;

        var user = await db.Users.FindAsync(token.UserId);
        if (user is null) return null;

        return (token, user);
    }

    public void RevokeToken(RefreshToken token) => token.RevokedAt = DateTime.UtcNow;

    public async Task RevokeAllForUserAsync(string userId)
    {
        var tokens = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    private string CreateAccessToken(ApplicationUser user, DateTime expiresAt)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt["SigningKey"]!));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("full_name", user.FullName),
            new("is_admin", user.IsAdmin ? "true" : "false"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _jwt["Issuer"],
            audience: _jwt["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string CreateRefreshTokenValue()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
