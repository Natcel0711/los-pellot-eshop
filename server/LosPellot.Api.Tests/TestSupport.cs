using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Tests;

// A real SQLite connection (not EF's InMemory provider) so ExecuteUpdateAsync
// behaves exactly as it does against the real dev DB — InMemory doesn't
// support it. Shared-cache mode lets multiple connections/DbContexts see the
// same in-memory database, which the concurrency tests need (two separate
// DbContexts racing against one logical database).
public static class TestDb
{
    public static SqliteConnection OpenSharedConnection(string dbName)
    {
        var connection = new SqliteConnection($"DataSource=file:{dbName};mode=memory;cache=shared");
        connection.Open();
        return connection;
    }

    public static AppDbContext CreateContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        return new AppDbContext(options);
    }
}

public static class TestFactory
{
    public static Category MakeCategory(string id = "cat1") => new()
    {
        Id = id,
        Name = "Test Category",
        IconName = "bolt",
        DefaultBulbType = "Universal",
        SortOrder = 0,
    };

    public static Product MakeProduct(string id, string categoryId, decimal price, int stock) => new()
    {
        Id = id,
        Name = "Test Product " + id,
        CategoryId = categoryId,
        Price = price,
        Lumens = "1000",
        Warranty = "1 year",
        StockQuantity = stock,
        IsUniversal = true,
    };

    public static ShippingInfo MakeShipping(string email = "guest@example.com") => new(
        "Test Buyer", email, "555-0100", "123 Main St", null, "City", "ST", "00000", "Puerto Rico");

    public static PaymentInfo MakeCard(string number = "4242424242424242") => new(
        "Test Buyer", number, "12/30", "123");

    public static ClaimsPrincipal GuestPrincipal() => new(new ClaimsIdentity());

    public static ClaimsPrincipal UserPrincipal(string userId) => new(
        new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "TestAuth"));

    public static async Task<CartHeader> SeedCartAsync(
        AppDbContext db, string? userId, string? guestToken, params (string productId, int qty)[] items)
    {
        var header = new CartHeader { UserId = userId, GuestToken = guestToken };
        db.CartHeaders.Add(header);
        await db.SaveChangesAsync();

        foreach (var (productId, qty) in items)
        {
            db.CartItems.Add(new CartItem { CartHeaderId = header.Id, ProductId = productId, Qty = qty });
        }
        await db.SaveChangesAsync();
        return header;
    }

    public static ControllerContext MakeControllerContext(
        ClaimsPrincipal user, string? guestToken = null, string? idempotencyKey = null)
    {
        var httpContext = new DefaultHttpContext { User = user };
        if (guestToken is not null) httpContext.Request.Headers[CartResolver.GuestTokenHeader] = guestToken;
        if (idempotencyKey is not null) httpContext.Request.Headers["Idempotency-Key"] = idempotencyKey;
        return new ControllerContext { HttpContext = httpContext };
    }
}
