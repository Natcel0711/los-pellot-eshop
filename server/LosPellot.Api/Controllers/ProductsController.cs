using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll(
        [FromQuery(Name = "category")] List<string>? categories,
        [FromQuery] int? year,
        [FromQuery] string? make,
        [FromQuery] string? model,
        [FromQuery] string? q,
        [FromQuery] bool saleOnly = false,
        [FromQuery] string sort = "relevance")
    {
        var query = db.Products.Include(p => p.Category).AsQueryable();

        if (categories is { Count: > 0 })
        {
            query = query.Where(p => categories.Contains(p.CategoryId));
        }

        if (saleOnly)
        {
            query = query.Where(p => p.SalePrice != null);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var needle = q.Trim();
            query = query.Where(p =>
                EF.Functions.Like(p.Name, $"%{needle}%") ||
                EF.Functions.Like(p.Category!.Name, $"%{needle}%"));
        }

        var hasVehicleFilter = year.HasValue || !string.IsNullOrWhiteSpace(make) || !string.IsNullOrWhiteSpace(model);
        if (hasVehicleFilter)
        {
            query = query.Where(p => p.Fitments.Any(f =>
                (f.Year == null || f.Year == year) &&
                (f.Make == null || f.Make == make) &&
                (f.Model == null || f.Model == model)));
        }

        query = sort switch
        {
            "price-asc" => query.OrderBy(p => p.SalePrice ?? p.Price),
            "price-desc" => query.OrderByDescending(p => p.SalePrice ?? p.Price),
            "name-asc" => query.OrderBy(p => p.Name),
            _ => query.OrderBy(p => p.Id),
        };

        var products = await query.ToListAsync();

        var dtos = products.Select(p => ToDto(p, hasVehicleFilter)).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();
        return Ok(ToDto(product, false));
    }

    private static ProductDto ToDto(Product p, bool hasVehicleFilter) => new(
        p.Id,
        p.Name,
        p.CategoryId,
        p.Price,
        p.SalePrice,
        p.Lumens,
        p.Warranty,
        p.Badge,
        p.IsUniversal,
        hasVehicleFilter ? true : null,
        p.ImageUrl
    );
}
