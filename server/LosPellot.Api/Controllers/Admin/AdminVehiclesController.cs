using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/vehicles")]
public class AdminVehiclesController(AppDbContext db) : ControllerBase
{
    [HttpGet("years")]
    public async Task<ActionResult<List<AdminYearDto>>> GetYears()
    {
        var years = await db.VehicleYears.OrderByDescending(y => y.Year).ToListAsync();
        return Ok(years.Select(y => new AdminYearDto(y.Id, y.Year)).ToList());
    }

    [HttpPost("years")]
    public async Task<ActionResult<AdminYearDto>> CreateYear(CreateYearRequest request)
    {
        if (await db.VehicleYears.AnyAsync(y => y.Year == request.Year))
            return BadRequest(new { error = "Ese año ya existe." });

        var year = new VehicleYear { Year = request.Year };
        db.VehicleYears.Add(year);
        await db.SaveChangesAsync();
        return Ok(new AdminYearDto(year.Id, year.Year));
    }

    [HttpDelete("years/{id:int}")]
    public async Task<IActionResult> DeleteYear(int id)
    {
        var year = await db.VehicleYears.FindAsync(id);
        if (year is null) return NotFound();
        db.VehicleYears.Remove(year);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("makes")]
    public async Task<ActionResult<List<AdminMakeDto>>> GetMakes()
    {
        var makes = await db.VehicleMakes.OrderBy(m => m.Name).ToListAsync();
        return Ok(makes.Select(m => new AdminMakeDto(m.Id, m.Name)).ToList());
    }

    [HttpPost("makes")]
    public async Task<ActionResult<AdminMakeDto>> CreateMake(CreateMakeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { error = "El nombre es requerido." });
        if (await db.VehicleMakes.AnyAsync(m => m.Name == request.Name))
            return BadRequest(new { error = "Esa marca ya existe." });

        var make = new VehicleMake { Name = request.Name.Trim() };
        db.VehicleMakes.Add(make);
        await db.SaveChangesAsync();
        return Ok(new AdminMakeDto(make.Id, make.Name));
    }

    [HttpDelete("makes/{id:int}")]
    public async Task<IActionResult> DeleteMake(int id)
    {
        var make = await db.VehicleMakes.FindAsync(id);
        if (make is null) return NotFound();
        if (await db.VehicleModels.AnyAsync(m => m.MakeId == id))
            return Conflict(new { error = "No se puede eliminar una marca con modelos asignados." });

        db.VehicleMakes.Remove(make);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("models")]
    public async Task<ActionResult<List<AdminModelDto>>> GetModels()
    {
        var models = await db.VehicleModels
            .Include(m => m.Year).Include(m => m.Make)
            .OrderByDescending(m => m.Year!.Year).ThenBy(m => m.Make!.Name).ThenBy(m => m.Name)
            .ToListAsync();

        return Ok(models.Select(m => new AdminModelDto(m.Id, m.YearId, m.Year!.Year, m.MakeId, m.Make!.Name, m.Name)).ToList());
    }

    [HttpPost("models")]
    public async Task<ActionResult<AdminModelDto>> CreateModel(CreateModelRequest request)
    {
        var year = await db.VehicleYears.FindAsync(request.YearId);
        var make = await db.VehicleMakes.FindAsync(request.MakeId);
        if (year is null || make is null) return BadRequest(new { error = "Año o marca inválidos." });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { error = "El nombre es requerido." });

        var exists = await db.VehicleModels.AnyAsync(m =>
            m.YearId == request.YearId && m.MakeId == request.MakeId && m.Name == request.Name);
        if (exists) return BadRequest(new { error = "Ese modelo ya existe para ese año/marca." });

        var model = new VehicleModel { YearId = request.YearId, MakeId = request.MakeId, Name = request.Name.Trim() };
        db.VehicleModels.Add(model);
        await db.SaveChangesAsync();
        return Ok(new AdminModelDto(model.Id, year.Id, year.Year, make.Id, make.Name, model.Name));
    }

    [HttpDelete("models/{id:int}")]
    public async Task<IActionResult> DeleteModel(int id)
    {
        var model = await db.VehicleModels.FindAsync(id);
        if (model is null) return NotFound();
        db.VehicleModels.Remove(model); // cascades to its trims
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("models/{modelId:int}/trims")]
    public async Task<ActionResult<List<AdminTrimDto>>> GetTrims(int modelId)
    {
        var trims = await db.VehicleTrims.Where(t => t.ModelId == modelId).OrderBy(t => t.Name).ToListAsync();
        return Ok(trims.Select(t => new AdminTrimDto(t.Id, t.ModelId, t.Name)).ToList());
    }

    [HttpPost("trims")]
    public async Task<ActionResult<AdminTrimDto>> CreateTrim(CreateTrimRequest request)
    {
        if (!await db.VehicleModels.AnyAsync(m => m.Id == request.ModelId))
            return BadRequest(new { error = "Modelo inválido." });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { error = "El nombre es requerido." });

        var trim = new VehicleTrim { ModelId = request.ModelId, Name = request.Name.Trim() };
        db.VehicleTrims.Add(trim);
        await db.SaveChangesAsync();
        return Ok(new AdminTrimDto(trim.Id, trim.ModelId, trim.Name));
    }

    [HttpDelete("trims/{id:int}")]
    public async Task<IActionResult> DeleteTrim(int id)
    {
        var trim = await db.VehicleTrims.FindAsync(id);
        if (trim is null) return NotFound();
        db.VehicleTrims.Remove(trim);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
