using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/categories")]
public class AdminCategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminCategoryDto>>> GetAll()
    {
        var categories = await db.Categories.OrderBy(c => c.SortOrder).ToListAsync();
        return Ok(categories.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> Create(UpsertCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Id y nombre son requeridos." });

        if (await db.Categories.AnyAsync(c => c.Id == request.Id))
            return BadRequest(new { error = "Ya existe una categoría con ese Id." });

        var category = new Category
        {
            Id = request.Id.Trim(),
            Name = request.Name.Trim(),
            IconName = request.IconName,
            DefaultBulbType = request.DefaultBulbType,
            SortOrder = request.SortOrder,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return Ok(ToDto(category));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(string id, UpsertCategoryRequest request)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        category.Name = request.Name.Trim();
        category.IconName = request.IconName;
        category.DefaultBulbType = request.DefaultBulbType;
        category.SortOrder = request.SortOrder;

        await db.SaveChangesAsync();
        return Ok(ToDto(category));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        if (await db.Products.AnyAsync(p => p.CategoryId == id))
            return Conflict(new { error = "No se puede eliminar una categoría con productos asignados." });

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AdminCategoryDto ToDto(Category c) => new(c.Id, c.Name, c.IconName, c.DefaultBulbType, c.SortOrder);
}
