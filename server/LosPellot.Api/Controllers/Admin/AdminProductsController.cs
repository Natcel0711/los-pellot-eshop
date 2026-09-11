using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/products")]
public class AdminProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminProductDto>>> GetAll()
    {
        var products = await db.Products.OrderBy(p => p.Id).ToListAsync();
        return Ok(products.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AdminProductDto>> Create(UpsertProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Id y nombre son requeridos." });

        if (await db.Products.AnyAsync(p => p.Id == request.Id))
            return BadRequest(new { error = "Ya existe un producto con ese Id." });

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { error = "Categoría inválida." });

        var product = new Product
        {
            Id = request.Id.Trim(),
            Name = request.Name.Trim(),
            CategoryId = request.CategoryId,
            Price = request.Price,
            SalePrice = request.SalePrice,
            Lumens = request.Lumens,
            Warranty = request.Warranty,
            Badge = string.IsNullOrWhiteSpace(request.Badge) ? null : request.Badge,
            IsUniversal = request.IsUniversal,
            StockQuantity = request.StockQuantity,
        };
        db.Products.Add(product);

        if (product.IsUniversal)
        {
            db.ProductFitments.Add(new ProductFitment { ProductId = product.Id });
        }

        await db.SaveChangesAsync();
        return Ok(ToDto(product));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminProductDto>> Update(string id, UpsertProductRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { error = "Categoría inválida." });

        product.Name = request.Name.Trim();
        product.CategoryId = request.CategoryId;
        product.Price = request.Price;
        product.SalePrice = request.SalePrice;
        product.Lumens = request.Lumens;
        product.Warranty = request.Warranty;
        product.Badge = string.IsNullOrWhiteSpace(request.Badge) ? null : request.Badge;
        product.IsUniversal = request.IsUniversal;
        product.StockQuantity = request.StockQuantity;

        await db.SaveChangesAsync();
        return Ok(ToDto(product));
    }

    [HttpPatch("{id}/stock")]
    public async Task<ActionResult<AdminProductDto>> UpdateStock(string id, UpdateStockRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();
        if (request.StockQuantity < 0) return BadRequest(new { error = "El inventario no puede ser negativo." });

        product.StockQuantity = request.StockQuantity;
        await db.SaveChangesAsync();
        return Ok(ToDto(product));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AdminProductDto ToDto(Product p) => new(
        p.Id, p.Name, p.CategoryId, p.Price, p.SalePrice, p.Lumens, p.Warranty, p.Badge, p.IsUniversal, p.StockQuantity
    );
}
