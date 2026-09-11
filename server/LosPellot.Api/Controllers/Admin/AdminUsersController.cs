using System.Security.Claims;
using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/users")]
public class AdminUsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminUserDto>>> GetAll()
    {
        var users = await db.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        return Ok(users.Select(ToDto).ToList());
    }

    [HttpPatch("{id}/admin")]
    public async Task<ActionResult<AdminUserDto>> SetAdmin(string id, UpdateUserAdminRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (user.Id == currentUserId && !request.IsAdmin)
            return BadRequest(new { error = "No puedes quitarte tus propios permisos de administrador." });

        user.IsAdmin = request.IsAdmin;
        await db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == currentUserId) return BadRequest(new { error = "No puedes eliminar tu propia cuenta." });

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AdminUserDto ToDto(ApplicationUser u) => new(u.Id, u.FullName, u.Email ?? "", u.CreatedAt, u.IsAdmin);
}
