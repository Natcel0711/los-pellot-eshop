using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController(AppDbContext db) : ControllerBase
{
    [HttpGet("tree")]
    public async Task<ActionResult<List<VehicleYearTreeDto>>> GetTree()
    {
        var years = await db.VehicleYears
            .Include(y => y.Models).ThenInclude(m => m.Make)
            .Include(y => y.Models).ThenInclude(m => m.Trims)
            .OrderByDescending(y => y.Year)
            .ToListAsync();

        var tree = years.Select(y => new VehicleYearTreeDto(
            y.Year,
            y.Models
                .GroupBy(m => m.Make!.Name)
                .OrderBy(g => g.Key)
                .Select(g => new VehicleMakeTreeDto(
                    g.Key,
                    g.Select(m => new VehicleModelTreeDto(
                        m.Name,
                        m.Trims.Select(t => t.Name).ToList()
                    )).ToList()
                )).ToList()
        )).ToList();

        return Ok(tree);
    }
}
