using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/cart")]
public class CartController(AppDbContext db, CartResolver cartResolver) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CartDto>> Get()
    {
        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        return Ok(header is null ? EmptyCart() : ToDto(header));
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemRequest request)
    {
        if (request.Qty <= 0) return BadRequest(new { error = "La cantidad debe ser mayor a cero." });

        var product = await db.Products.FindAsync(request.ProductId);
        if (product is null) return NotFound(new { error = "Producto no encontrado." });

        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: true);
        var existing = header!.Items.FirstOrDefault(i =>
            i.ProductId == request.ProductId && i.VehicleLabel == request.VehicleLabel);

        if (existing is not null)
        {
            existing.Qty += request.Qty;
        }
        else
        {
            db.CartItems.Add(new CartItem
            {
                CartHeaderId = header.Id,
                ProductId = request.ProductId,
                Qty = request.Qty,
                VehicleLabel = request.VehicleLabel,
            });
        }

        await db.SaveChangesAsync();
        var refreshed = await cartResolver.LoadByIdAsync(header.Id);
        return Ok(ToDto(refreshed!));
    }

    [HttpPatch("items/{key}")]
    public async Task<ActionResult<CartDto>> UpdateItem(string key, UpdateCartItemRequest request)
    {
        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        if (header is null) return NotFound();

        var item = header.Items.FirstOrDefault(i => CartResolver.ComputeKey(i) == key);
        if (item is null) return NotFound();

        if (request.Qty <= 0)
        {
            db.CartItems.Remove(item);
        }
        else
        {
            item.Qty = request.Qty;
        }

        await db.SaveChangesAsync();
        var refreshed = await cartResolver.LoadByIdAsync(header.Id);
        return Ok(ToDto(refreshed!));
    }

    [HttpDelete("items/{key}")]
    public async Task<ActionResult<CartDto>> RemoveItem(string key)
    {
        var header = await cartResolver.ResolveAsync(User, Request, Response, createIfMissing: false);
        if (header is null) return NotFound();

        var item = header.Items.FirstOrDefault(i => CartResolver.ComputeKey(i) == key);
        if (item is not null)
        {
            db.CartItems.Remove(item);
            await db.SaveChangesAsync();
        }

        var refreshed = await cartResolver.LoadByIdAsync(header.Id);
        return Ok(refreshed is null ? EmptyCart() : ToDto(refreshed));
    }

    [Authorize]
    [HttpPost("merge")]
    public async Task<ActionResult<CartDto>> Merge()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var guestToken = Request.Headers[CartResolver.GuestTokenHeader].FirstOrDefault();

        var userHeader = await cartResolver.LoadByUserAsync(userId);

        if (!string.IsNullOrEmpty(guestToken))
        {
            var guestHeader = await cartResolver.LoadByGuestTokenAsync(guestToken);

            if (guestHeader is not null)
            {
                userHeader ??= await cartResolver.CreateAsync(userId: userId, guestToken: null);

                foreach (var guestItem in guestHeader.Items)
                {
                    var existing = userHeader.Items.FirstOrDefault(i =>
                        i.ProductId == guestItem.ProductId && i.VehicleLabel == guestItem.VehicleLabel);
                    if (existing is not null)
                    {
                        existing.Qty += guestItem.Qty;
                    }
                    else
                    {
                        db.CartItems.Add(new CartItem
                        {
                            CartHeaderId = userHeader.Id,
                            ProductId = guestItem.ProductId,
                            Qty = guestItem.Qty,
                            VehicleLabel = guestItem.VehicleLabel,
                        });
                    }
                }

                db.CartHeaders.Remove(guestHeader);
                await db.SaveChangesAsync();
            }
        }

        var finalHeader = await cartResolver.LoadByUserAsync(userId);
        return Ok(finalHeader is null ? EmptyCart() : ToDto(finalHeader));
    }

    internal static CartDto EmptyCart() => new([], 0);

    internal static CartDto ToDto(CartHeader header)
    {
        var lines = header.Items.Select(item =>
        {
            var product = item.Product!;
            var unit = product.SalePrice ?? product.Price;
            var lineTotal = unit * item.Qty;
            return new CartLineDto(
                CartResolver.ComputeKey(item),
                item.ProductId,
                item.Qty,
                item.VehicleLabel,
                new ProductDto(product.Id, product.Name, product.CategoryId, product.Price, product.SalePrice,
                    product.Lumens, product.Warranty, product.Badge, product.IsUniversal, null, product.ImageUrl),
                unit,
                lineTotal
            );
        }).ToList();

        return new CartDto(lines, lines.Sum(l => l.LineTotal));
    }
}
