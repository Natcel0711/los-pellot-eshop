using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Services;

// Shared guest-token/user cart lookup used by CartController and
// OrdersController (checkout resolves the same cart the drawer shows).
public class CartResolver(AppDbContext db)
{
    public const string GuestTokenHeader = "X-Guest-Cart-Token";

    public async Task<CartHeader?> ResolveAsync(
        ClaimsPrincipal principal, HttpRequest request, HttpResponse? response, bool createIfMissing)
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is not null)
        {
            var header = await LoadByUserAsync(userId);
            if (header is not null) return header;
            return createIfMissing ? await CreateAsync(userId: userId, guestToken: null) : null;
        }

        var guestToken = request.Headers[GuestTokenHeader].FirstOrDefault();
        if (!string.IsNullOrEmpty(guestToken))
        {
            var header = await LoadByGuestTokenAsync(guestToken);
            if (header is not null) return header;
        }

        if (!createIfMissing) return null;

        var newToken = Guid.NewGuid().ToString("N");
        var created = await CreateAsync(userId: null, guestToken: newToken);
        if (response is not null) response.Headers[GuestTokenHeader] = newToken;
        return created;
    }

    public Task<CartHeader?> LoadByUserAsync(string userId) =>
        db.CartHeaders.Include(h => h.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Category)
            .FirstOrDefaultAsync(h => h.UserId == userId);

    public Task<CartHeader?> LoadByGuestTokenAsync(string guestToken) =>
        db.CartHeaders.Include(h => h.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Category)
            .FirstOrDefaultAsync(h => h.GuestToken == guestToken);

    public Task<CartHeader?> LoadByIdAsync(int id) =>
        db.CartHeaders.Include(h => h.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Category)
            .FirstOrDefaultAsync(h => h.Id == id);

    public async Task<CartHeader> CreateAsync(string? userId, string? guestToken)
    {
        var header = new CartHeader { UserId = userId, GuestToken = guestToken };
        db.CartHeaders.Add(header);
        await db.SaveChangesAsync();
        header.Items = [];
        return header;
    }

    public static string ComputeKey(CartItem item) =>
        item.ProductId + (string.IsNullOrEmpty(item.VehicleLabel) ? "" : "::" + item.VehicleLabel);
}
